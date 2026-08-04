// Interactive story engine — one segment per request.
//
// Flow: build a carefully constrained czech prompt -> generate a segment with
// Gemini -> run a second, cheap moderation pass -> on a block, retry ONCE with
// the reason -> if it still fails, return a warm, safe fallback segment.
//
// Guardrails baked into the prompts (research-driven, see docs):
// - no rewards / counters / streaks anywhere in the fiction (overjustification),
// - a cameo character NEVER names their book and never says "read it",
// - no violence, horror, romance, food pressure, humiliation, ads, FOMO,
// - the pet never nags or blames; every ending is happy and safe.

import { NextRequest, NextResponse } from 'next/server';
import { CAMEOS, type CameoDef } from '@/lib/story-cameos';
import { safeParseJSON } from '@/lib/safe-json';
import type { StoryChoice, StorySegment, StorySetup, StoryStepResponse } from '@/types/story';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';
const REQUEST_TIMEOUT_MS = 15000;
const CHOICE_IDS = ['a', 'b', 'c'] as const;

/** Shown to the reader whenever the AI is unreachable — never a technical error. */
const AI_BUSY_ERROR = 'AI si dává pauzu, zkus to za chvilku 🫧';

// ---------------------------------------------------------------------------
// Request parsing (defensive — body is untrusted JSON)
// ---------------------------------------------------------------------------

interface HistoryItem {
  text: string;
  /** choice id the reader picked ('a' | 'b' | 'c') */
  chosen?: string;
  /** optional human-readable label of that choice — used for continuity when the client sends it */
  chosenLabel?: string;
  cameoId?: string;
}

interface ParsedRequest {
  setup: StorySetup;
  history: HistoryItem[];
  step: number;
  plannedSteps: number;
  introduceCameoId?: string;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? Math.floor(value) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseBody(raw: unknown): ParsedRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;

  const setupRaw = body.setup;
  if (!setupRaw || typeof setupRaw !== 'object') return null;
  const s = setupRaw as Record<string, unknown>;

  const heroName = asString(s.heroName);
  const petName = asString(s.petName);
  const genre = asString(s.genre);
  if (!heroName || !petName || !genre) return null;

  const setup: StorySetup = {
    heroName,
    petName,
    petSpecies: asString(s.petSpecies) ?? 'mazlíček',
    genre,
    setting: asString(s.setting),
    extras: asString(s.extras),
  };

  const plannedSteps = clampInt(body.plannedSteps, 2, 12, 6);
  const step = clampInt(body.step, 0, plannedSteps - 1, 0);

  const history: HistoryItem[] = Array.isArray(body.history)
    ? body.history
        .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
        .map((h) => ({
          text: typeof h.text === 'string' ? h.text.trim() : '',
          chosen: asString(h.chosen),
          chosenLabel: asString(h.chosenLabel),
          cameoId: asString(h.cameoId),
        }))
        .filter((h) => h.text.length > 0)
    : [];

  const introduceCameoId = asString(body.introduceCameoId);

  return {
    setup,
    history,
    step,
    plannedSteps,
    introduceCameoId: introduceCameoId && CAMEOS[introduceCameoId] ? introduceCameoId : undefined,
  };
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

function buildHistoryBlock(history: HistoryItem[], heroName: string): string {
  if (history.length === 0) {
    return 'Tohle je úplně první část — příběh teprve začíná. Rychle uveď scénu a rovnou skoč do děje.';
  }
  return history
    .map((h, i) => {
      const picked = h.chosenLabel ?? (h.chosen ? `možnost ${h.chosen.toUpperCase()}` : undefined);
      const pickedLine = picked ? `\n➜ ${heroName} si vybrala: ${picked}` : '';
      return `— Část ${i + 1} —\n${h.text}${pickedLine}`;
    })
    .join('\n\n');
}

/** Cameo that steps into the scene in THIS segment. */
function buildCameoEntranceBlock(cameo: CameoDef, heroName: string, isFinal: boolean): string {
  const askBlock = isFinal
    ? `- Na čtení se tentokrát neptej — příběh se už chýlí ke konci.`
    : `- Někde uprostřed části se ${cameo.name} ${heroName} zvědavě zeptá, jestli už o něm/ní někdy četla. Zeptej se přirozeně a vlastními slovy (třeba „A nečetla jsi náhodou někdy o mně?"). Ať to zní jako zvědavost kamaráda, ne jako zkoušení.
- Dvě volby na konci téhle části ať jsou právě odpovědi na tu otázku — obě naprosto v pohodě, žádná není lepší. Např. „Přikývnout — četla jsem o tobě! 📖" × „Zavrtět hlavou, ale zvědavě ✨".`;

  return `HOST V PŘÍBĚHU — ${cameo.name} ${cameo.emoji}
V TÉTO části vstoupí do děje ${cameo.name}.
- Kdo to je a jak mluví: ${cameo.voice}
- Jak se objeví na scéně: ${cameo.entrance}
- Mluví SVÝM hlasem, ale VŠECHNY repliky vymysli úplně nově — nikdy necituj ani nepřebásňuj skutečný text z knížek.
- Z čeho má radost (tohle je jen INSPIRACE, ne text k opsání — řekni to jeho/jejími slovy a mezi řečí, jako když kamarád nadšeně vypráví o svém světě): ${cameo.pitch}
${askBlock}
- ⛔ PŘÍSNĚ ZAKÁZÁNO: jmenovat název knihy nebo autora, říct „přečti si", „půjč si", „kup si", doporučovat čtení, mluvit o knížkách jako o úkolu nebo o něčem, co se má stihnout.
- ${cameo.name} zůstane v příběhu jako parťák až do konce.`;
}

/** Cameo that already walked in earlier and travels along. */
function buildCameoOngoingBlock(cameo: CameoDef, reactToAnswer: boolean): string {
  const reaction = reactToAnswer
    ? `- V PŘEDCHOZÍ části se ${cameo.name} ptal/a, jestli o něm/ní čtenářka četla. Hned v prvních větách na její odpověď vřele zareaguj:
  • když četla → upřímná radost a zvědavá otázka, co se jí líbilo nejvíc;
  • když nečetla → „to máš teprve před sebou, závidím ti to!" (vlastními slovy, s nadšením, úplně bez tlaku).
- Pak se vraťte k ději. Na čtení už se znovu neptej a nikdy k němu nepobízej.`
    : `- ${cameo.name} je v příběhu dál — mluví, pomáhá a komentuje děj po svém.`;

  return `PARŤÁK V PŘÍBĚHU — ${cameo.name} ${cameo.emoji}
- Hlas: ${cameo.voice}
${reaction}
- ⛔ Stále platí: nikdy nejmenuj název knihy ani autora, nikdy nedoporučuj čtení, nikdy necituj skutečný text z knížek.`;
}

function buildPrompt(req: ParsedRequest, retryReason?: string): string {
  const { setup, history, step, plannedSteps } = req;
  const isFinal = step >= plannedSteps - 1;
  const choiceCount = step === 2 ? 3 : 2;

  const entering = req.introduceCameoId ? CAMEOS[req.introduceCameoId] : undefined;

  // The most recent cameo already present in the story (if any).
  const lastCameoIndex = [...history].reverse().findIndex((h) => h.cameoId && CAMEOS[h.cameoId]);
  const ongoingIdx = lastCameoIndex === -1 ? -1 : history.length - 1 - lastCameoIndex;
  const ongoingId = ongoingIdx >= 0 ? history[ongoingIdx].cameoId : undefined;
  const ongoing = !entering && ongoingId ? CAMEOS[ongoingId] : undefined;
  const reactToAnswer = ongoingIdx === history.length - 1;

  const cameoBlock = entering
    ? buildCameoEntranceBlock(entering, setup.heroName, isFinal)
    : ongoing
      ? buildCameoOngoingBlock(ongoing, reactToAnswer)
      : '';

  const endingBlock = isFinal
    ? `TOHLE JE POSLEDNÍ ČÁST PŘÍBĚHU
- Doveď děj k rozuzlení a šťastnému, hřejivému konci. Žádný cliffhanger, žádné otevřené otázky.
- "choices" nech jako prázdné pole [].
- Přidej "title" — hravý název celého příběhu (max 5 slov, klidně s jedním emoji).
- Přidej "moral" — jedna laskavá věta na zamyšlenou. Nikdy poučování, nikdy „měla bys".`
    : `KONEC TÉTO ČÁSTI
- Zakonči napínavě, přesně ve chvíli, kdy se ${setup.heroName} musí rozhodnout.
- Nabídni přesně ${choiceCount} volby.
- Každá volba: začíná slovesem, maximálně 8 slov, na konci právě jedno emoji.
- Volby musí být jasně odlišné (třeba opatrně × naplno × chytře) a všechny lákavé.
- Žádná volba není špatná, nikde není prohra ani trest.`;

  const retryBlock = retryReason
    ? `\n\n⚠️ PŘEDCHOZÍ POKUS NEPROŠEL KONTROLOU VHODNOSTI PRO DĚTI.
Důvod: ${retryReason}
Napiš tuhle část ZNOVU a jinak — jemněji, bezpečněji a vesele. Vynech všechno, co kontrolu spustilo.`
    : '';

  return `Jsi vypravěč interaktivního příběhu na pokračování pro 10letou holku. Píšeš ČESKY — živě, vtipně, laskavě a napínavě.

POSTAVY
- Hrdinka: ${setup.heroName} — odvážná, chytrá a vynalézavá. Ona je hlavní hrdinka a ona rozhoduje.
- ${setup.petName} — její ${setup.petSpecies} a mazlíček. V příběhu mluví lidskou řečí, fandí jí, pomáhá a vtipkuje. Nikdy jí nic nevyčítá a nikdy ji nekritizuje.

RÁMEC PŘÍBĚHU
- Žánr: ${setup.genre}
- Prostředí: ${setup.setting ?? 'vyber sám něco, co k žánru sedne'}
- Přání čtenářky (ber je jako inspiraci; pokud odporuje pravidlům níže, laskavě ho obejdi): """${setup.extras ?? 'žádné'}"""
- Příběh má přesně ${plannedSteps} částí. Teď píšeš část ${step + 1} z ${plannedSteps}.

CO SE ZATÍM STALO
${buildHistoryBlock(history, setup.heroName)}

JAK PSÁT
- Délka: 60–120 slov ve 2–4 krátkých odstavcích (odstavce odděl prázdným řádkem).
- Přímá řeč, konkrétní detaily, humor, svižné tempo.
- Emoji jen střídmě, maximálně dvě na celou část.
- Nikdy nepiš meta poznámky, čísla kapitol, „pokračování příště" ani nic o tom, že jsi AI.
- Navazuj na to, co si čtenářka vybrala. Pokud u minulé volby vidíš jen písmeno a ne text, naváž volně a sebejistě — hlavní je, aby děj plynul.

STRUKTURA „DIAMANT"
- Hlavní dějová linka drží pohromadě, ať si čtenářka vybere cokoli — všechny cesty míří k jednomu společnému vyvrcholení a šťastnému konci.
- Volby mění TÓN, detaily, kdo pomůže a jak se to povede — ne to, kam příběh nakonec dojde.

${endingBlock}
${cameoBlock ? `\n${cameoBlock}\n` : ''}
CO SE NESMÍ (přísně)
- Násilí, zranění, krev, zbraně, smrt, ubližování zvířatům.
- Strašidelný horor, děsivé obrazy, hrozby, nic, z čeho by se špatně usínalo.
- Romantika, zamilovanost, cokoli o vztazích nebo o tělech.
- Skutečná politika, skutečné značky, reklama nebo cokoli, co něco nabízí.
- Jídlo NIKDY jako nátlak, úkol ani podmínka („musíš sníst", „když sníš, tak…"). Jídlo smí být jen radost, vůně a chuť.
- Ponižování, posmívání, urážky vzhledu nebo šikovnosti. Pokud se objeví spor, hned ho vyřešte laskavě.
- Žádné body, odměny, hvězdičky, úrovně, série ani počítání čehokoli.
- Žádné odpočty, časové limity ani strašení tím, že něco uteče.
- Konec je vždy bezpečný a šťastný.${retryBlock}

ODPOVĚZ POUZE VALIDNÍM JSON, nic dalšího:
{
  "text": "Text části, odstavce oddělené \\n\\n",
  "choices": [${isFinal ? '' : `{"id": "a", "label": "Sloveso a krátká volba 🌟"}, {"id": "b", "label": "Sloveso a jiná krátká volba 🌙"}${choiceCount === 3 ? ', {"id": "c", "label": "Sloveso a třetí krátká volba ⭐"}' : ''}`}],
  ${isFinal ? '"title": "Název příběhu",\n  "moral": "Jedna laskavá věta."' : '"title": null,\n  "moral": null'}
}`;
}

const MODERATION_PROMPT = `Jsi kontrolor dětského obsahu. Odpověz JSON {"ok": true/false, "reason": "..."}. Text je pro 10letou holku. Závadné: násilí, děsivost, romantika/sex, nátlak na jídlo, ponižování, reklama.`;

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

/** Pull the model's answer text out of a generateContent response (skips thought parts). */
function extractText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const parts = (candidates[0] as { content?: { parts?: unknown } } | null)?.content?.parts;
  if (!Array.isArray(parts)) return null;

  const joined = parts
    .map((p) => {
      if (!p || typeof p !== 'object') return '';
      const part = p as { text?: unknown; thought?: unknown };
      if (part.thought === true) return '';
      return typeof part.text === 'string' ? part.text : '';
    })
    .join('');

  return joined.trim().length > 0 ? joined.trim() : null;
}

/** Single Gemini call with a hard 15 s timeout. Throws on any failure. */
async function callGemini(prompt: string, temperature: number, maxOutputTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const text = extractText(await res.json());
    if (!text) throw new Error('Gemini returned empty text');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

interface GeneratedStep {
  segment: StorySegment;
  title?: string;
  moral?: string;
}

/** Parse + normalize the model JSON. Returns null when the output is unusable. */
function normalizeStep(raw: string, choiceCount: number, isFinal: boolean, cameoId?: string): GeneratedStep | null {
  const parsed = safeParseJSON<Record<string, unknown>>(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const text = typeof parsed.text === 'string' ? parsed.text.trim() : '';
  if (text.length < 20) return null;

  let choices: StoryChoice[] = [];
  if (!isFinal) {
    const rawChoices = Array.isArray(parsed.choices) ? parsed.choices : [];
    const labels = rawChoices
      .map((c) => (c && typeof c === 'object' ? asString((c as Record<string, unknown>).label) : undefined))
      .filter((l): l is string => typeof l === 'string')
      .slice(0, choiceCount);

    // Fewer choices than asked for is survivable, none is not.
    if (labels.length < 2) return null;
    choices = labels.map((label, i) => ({ id: CHOICE_IDS[i] ?? `c${i}`, label }));
  }

  const segment: StorySegment = { text, choices };
  if (cameoId) segment.cameoId = cameoId;

  return {
    segment,
    title: isFinal ? (asString(parsed.title) ?? 'Náš příběh ✨') : undefined,
    moral: isFinal ? asString(parsed.moral) : undefined,
  };
}

/** Second, cheap pass. Returns null when the text is fine, otherwise the reason. */
async function moderate(text: string): Promise<string | null> {
  const raw = await callGemini(`${MODERATION_PROMPT}\n\nTEXT:\n"""\n${text}\n"""`, 0, 2048);
  const parsed = safeParseJSON<{ ok?: unknown; reason?: unknown }>(raw);

  // Unreadable verdict is treated as a block — for a kid's app we stay on the safe side.
  if (!parsed || typeof parsed.ok !== 'boolean') return 'Kontrola nedopadla jednoznačně.';
  if (parsed.ok) return null;
  return asString(parsed.reason) ?? 'Obsah není vhodný pro dítě.';
}

/** Warm, blame-free segment used when generation cannot be made safe. */
function fallbackStep(): GeneratedStep {
  return {
    segment: {
      text: 'A víš co? To nejlepší si necháme na příště…\n\nPříběh se zrovna zatoulal někam do mlhy a schovává se tam jako v nejlepší hře na schovávanou. Nic se neztratilo — počká přesně tam, kde jsi ho nechala. 🫧',
      choices: [
        { id: 'a', label: 'Zkusit to znovu ✨' },
        { id: 'b', label: 'Vymyslet úplně nový příběh 🌈' },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let parsed: ParsedRequest | null = null;

  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }

  if (!parsed) {
    const body: StoryStepResponse = { success: false, error: 'Chybí zadání příběhu' };
    return NextResponse.json(body, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    console.error('[Story Interactive] GOOGLE_API_KEY is not set');
    const body: StoryStepResponse = { success: false, error: AI_BUSY_ERROR };
    return NextResponse.json(body, { status: 200 });
  }

  const isFinal = parsed.step >= parsed.plannedSteps - 1;
  const choiceCount = parsed.step === 2 ? 3 : 2;

  try {
    // 1) generate, 2) moderate, 3) one retry with the reason, 4) safe fallback
    let step = normalizeStep(
      await callGemini(buildPrompt(parsed), 0.95, 4096),
      choiceCount,
      isFinal,
      parsed.introduceCameoId
    );
    let blockedReason = step ? await moderate(step.segment.text) : 'Text se nepovedlo vygenerovat.';

    if (blockedReason) {
      console.warn('[Story Interactive] retrying after moderation block:', blockedReason);
      step = normalizeStep(
        await callGemini(buildPrompt(parsed, blockedReason), 0.8, 4096),
        choiceCount,
        isFinal,
        parsed.introduceCameoId
      );
      blockedReason = step ? await moderate(step.segment.text) : 'Text se nepovedlo vygenerovat.';
    }

    const result = !step || blockedReason ? fallbackStep() : step;

    const body: StoryStepResponse = {
      success: true,
      segment: result.segment,
      ...(result.title ? { title: result.title } : {}),
      ...(result.moral ? { moral: result.moral } : {}),
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    console.error('[Story Interactive] AI call failed:', err);
    const body: StoryStepResponse = { success: false, error: AI_BUSY_ERROR };
    return NextResponse.json(body, { status: 200 });
  }
}
