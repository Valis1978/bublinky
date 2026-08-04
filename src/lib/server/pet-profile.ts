// Living profile — the pet keeps a short diary about Viki that rewrites itself
// every N messages. The chat prompt injects it whole, so the pet always has a
// compact, current picture instead of a raw dump of old memories.
// Server-only. Every failure is silent: the chat must never depend on this.

import type { SupabaseClient } from '@supabase/supabase-js';
import { safeParseJSON } from '@/lib/safe-json';

const MODEL = 'gemini-3-flash-preview';
const REQUEST_TIMEOUT_MS = 15000;

/** New messages that must pile up since the last rewrite before we spend a Gemini call. */
const CONSOLIDATE_EVERY = 20;

/** Hard cap on the transcript we send — protects the first run on a long history. */
const MAX_TRANSCRIPT_ROWS = 200;

type ChatRow = { role: string; content: string };
type ProfileRow = { content: string | null; messages_at_update: number | null };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function buildPrompt(petName: string, previousProfile: string, transcript: string): string {
  return `Jsi paměť mazlíčka jménem ${petName} — vedeš si stručný deníček o své nejlepší kamarádce Viki (skoro 11 let). Dostaneš DOSAVADNÍ DENÍČEK a NOVÉ ZPRÁVY z konverzací. Přepiš deníček tak, aby byl aktuální. Sekce: Lidé kolem Viki / Škola / Záliby a sport / Co má a nemá ráda / Naše rituály a vtípky / Co jsem slíbil(a). Max 350 slov. Trvalá fakta (jména, rodina, mazlíčci) NIKDY nemaž. Pomíjivé drobnosti vypouštěj. PŘÍSNÁ PRAVIDLA: rodinné napětí, spory dospělých nebo porovnávání rodičů do deníčku NEPATŘÍ — smíš jen neutrální fakta (např. 'má dva domovy'); o kamarádkách jen fakta, žádná hodnocení; deníček je laskavý. Odpověz JSON {"profile": "..."}.

DOSAVADNÍ DENÍČEK:
${previousProfile || '(zatím prázdný — piš ho od nuly)'}

NOVÉ ZPRÁVY:
${transcript}`;
}

/**
 * Rewrites the pet's diary when enough new messages piled up since the last run.
 * Cheap no-op otherwise (one COUNT + one row read). Never throws.
 */
export async function maybeConsolidateProfile(
  supabase: SupabaseClient,
  petId: string,
  petName: string
): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || !petId) return;

  try {
    const { count, error: countError } = await supabase
      .from('bub_pet_chat_log')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', petId);

    if (countError || typeof count !== 'number') return;

    // Missing table (migration not applied yet) surfaces as an error here — skip quietly.
    const { data: profileData, error: profileError } = await supabase
      .from('bub_pet_profile')
      .select('content, messages_at_update')
      .eq('pet_id', petId)
      .maybeSingle();

    if (profileError) return;

    const profile = profileData as ProfileRow | null;
    const previousProfile = profile?.content ?? '';
    const messagesAtUpdate = profile?.messages_at_update ?? 0;

    const freshCount = count - messagesAtUpdate;
    if (freshCount < CONSOLIDATE_EVERY) return;

    // "Newer than the last update" == the newest `freshCount` rows, read back ascending.
    const { data: rowsData, error: rowsError } = await supabase
      .from('bub_pet_chat_log')
      .select('role, content')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(Math.min(freshCount, MAX_TRANSCRIPT_ROWS));

    if (rowsError) return;

    const rows = (rowsData as ChatRow[] | null) ?? [];
    if (rows.length === 0) return;

    const transcript = [...rows]
      .reverse()
      .map((row) => `${row.role === 'user' ? 'Viki' : petName}: ${row.content}`)
      .join('\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(petName, previousProfile, transcript) }] }],
          generationConfig: {
            temperature: 0.3,
            // Gemini 3 spends "thinking" tokens from this budget — without
            // thinkingBudget: 0 the diary gets truncated to invalid JSON.
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      console.error('[PetProfile]', `Gemini HTTP ${res.status}`);
      return;
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return;

    const parsed = safeParseJSON<{ profile?: string }>(text);
    const content = typeof parsed?.profile === 'string' ? parsed.profile.trim() : '';
    if (!content) return;

    const { error: upsertError } = await supabase.from('bub_pet_profile').upsert(
      {
        pet_id: petId,
        content,
        messages_at_update: count,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pet_id' }
    );

    if (upsertError) console.error('[PetProfile]', upsertError);
  } catch (err) {
    console.error('[PetProfile]', err);
  }
}
