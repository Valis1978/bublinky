import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFamilyContext, getCustodyInfo, getDogNickname } from '@/lib/custody-calendar';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/**
 * Generates a proactive message from the pet.
 * Called when Viki opens the pet page or at intervals.
 */
export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const { petId, petName, species, stage, level, mood, hunger, happiness, energy, cleanliness, foodBravery } = await req.json();

    const supabase = getSupabaseAdmin();
    const now = new Date();
    const hour = now.getHours();
    const custody = getCustodyInfo();
    const dogName = getDogNickname();

    // Load recent memories for context
    let memoriesText = '';
    if (petId) {
      const { data: memories } = await supabase
        .from('bub_pet_memories')
        .select('content')
        .eq('pet_id', petId)
        .order('importance', { ascending: false })
        .limit(10);

      if (memories && memories.length > 0) {
        memoriesText = memories.map((m: { content: string }) => m.content).join('; ');
      }
    }

    // Load active quests
    let questInfo = '';
    if (petId) {
      const { data: quests } = await supabase
        .from('bub_pet_quests')
        .select('title, progress')
        .eq('pet_id', petId)
        .eq('status', 'active')
        .limit(3);

      if (quests && quests.length > 0) {
        questInfo = quests.map((q: { title: string; progress: number }) => `${q.title} (${Math.round(q.progress * 100)}%)`).join(', ');
      }
    }

    // Determine message type based on context
    let messageType = 'greeting';
    if (hunger < 25) messageType = 'hungry';
    else if (energy < 20) messageType = 'tired';
    else if (cleanliness < 25) messageType = 'dirty';
    else if (hour >= 6 && hour < 9) messageType = 'morning_routine';
    else if (hour >= 19 && hour < 21) messageType = 'evening_routine';
    else if (hour >= 12 && hour < 14) messageType = 'afternoon';
    else if (questInfo) messageType = 'quest_reminder';
    else if (Math.random() < 0.3) messageType = 'food_curiosity';
    else if (Math.random() < 0.3) messageType = 'fun_fact';

    const prompt = `Jsi ${petName} (${species}), mazlíček 10leté Viki. Vygeneruj JEDNU krátkou proaktivní zprávu.

Kontext:
- Je ${hour}:00, ${['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'][now.getDay()]}
- ${getFamilyContext()}
- Staty: hlad ${hunger}%, štěstí ${happiness}%, energie ${energy}%, čistota ${cleanliness}%
- Level: ${level}, fáze: ${stage}
- Food bravery: ${foodBravery || 0}/100
${memoriesText ? `- Vzpomínky: ${memoriesText}` : ''}
${questInfo ? `- Aktivní úkoly: ${questInfo}` : ''}

Typ zprávy: ${messageType}

Pravidla:
- Max 1-2 KRÁTKÉ věty + emotikon
- Zvuky druhu (mňau/haf/hop/frrr/yip)
- ${messageType === 'morning_routine' ? `Ranní rutina: "Pojď si čistit zoubky! 🦷" nebo "Převlékneme se!" nebo "Pojď venčit ${dogName}! 🐕"` : ''}
- ${messageType === 'evening_routine' ? `Večerní rutina: "Zuby a do postýlky! 🌙" nebo "Sprcha! 🚿" nebo "Pojď venčit ${dogName}! 🐕"` : ''}
- ${messageType === 'food_curiosity' ? 'Jemně se zeptej jestli Viki zkoušela něco nového k jídlu — BEZ tlaku!' : ''}
- ${messageType === 'fun_fact' ? 'Řekni zajímavost o přírodě/zvířatech/vesmíru vhodnou pro 10letou' : ''}
- NIKDY nemoralizuj, NIKDY nerozkazuj

Odpověz POUZE validním JSON:
{
  "message": "Zpráva od mazlíčka",
  "emotion": "happy|excited|sleepy|hungry|playful|curious|grateful",
  "type": "${messageType}"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.1, maxOutputTokens: 256, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Gemini error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty response' }, { status: 502 });
    }

    return NextResponse.json({ success: true, ...JSON.parse(text) });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
