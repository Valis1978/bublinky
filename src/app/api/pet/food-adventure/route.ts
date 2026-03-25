import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextFoodToTry } from '@/lib/food-catalog';
import { safeParseJSON } from '@/lib/safe-json';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/**
 * POST: Generate a new food adventure quest
 * Body: { petId, petName, species, foodBravery, foodsTried[] }
 */
export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const { petId, petName, species, foodBravery, foodsTried } = await req.json();

    // Pick next food to try
    const food = getNextFoodToTry(foodsTried || [], foodBravery || 0);
    if (!food) {
      return NextResponse.json({
        success: true,
        allTried: true,
        message: `${petName} už ochutnal/a všechno! Jsi šampion! 🏆`,
      });
    }

    const prompt = `Vygeneruj krátký "Taste Adventure" příběh pro mazlíčka ${petName} (${species}).

Mazlíček nachází jídlo: ${food.name} ${food.emoji}
Kategorie: ${food.category}
Obtížnost: ${food.difficulty}
Senzorický popis: ${food.sensoryHint}
Mazlíčkova aktuální food bravery: ${foodBravery || 0}/100
Počet už vyzkoušených jídel: ${(foodsTried || []).length}

PRAVIDLA:
- Příběh má 3 fáze: NALEZENÍ → STRACH/VÁHÁNÍ → ODVÁŽNÉ OCHUTNÁNÍ
- Mazlíček najde jídlo na své cestě (les, louka, trh...)
- Nejdřív se bojí nebo váhá (roztomile, ne dramaticky)
- Pak to zkusí a reaguje (pozitivně nebo neutrálně — nikdy negativně)
- Je OK říct "hmm, to není moje oblíbené" ale vždy oslavit ODVAHU
- Fokus na senzorický zážitek: barva, vůně, textura, zvuk
- NIKDY neříkej Viki aby jedla — příběh je o MAZLÍČKOVI
- Maximálně 3 krátké odstavce

Odpověz POUZE validním JSON:
{
  "story_intro": "1 věta — jak mazlíček jídlo našel",
  "pet_reaction": "1 věta — první reakce (váhání/zvědavost)",
  "encouragement_hint": "1 věta — co by Viki mohla říct mazlíčkovi na povzbuzení",
  "try_story": "2-3 věty — mazlíček ochutnává, popis senzorického zážitku, reakce",
  "bravery_points": ${food.difficulty === 'easy' ? 3 : food.difficulty === 'medium' ? 5 : food.difficulty === 'hard' ? 8 : 12},
  "badge": ${(foodsTried || []).length + 1 === 5 ? '{"name": "Odvážný jedlík 🦁", "emoji": "🦁"}' : (foodsTried || []).length + 1 === 15 ? '{"name": "Gurmán 👨‍🍳", "emoji": "👨‍🍳"}' : 'null'}
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1024, responseMimeType: 'application/json' },
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

    const story = safeParseJSON<Record<string, unknown>>(text);
    if (!story) {
      return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 502 });
    }

    // Save to DB if petId provided
    if (petId) {
      const supabase = getSupabaseAdmin();

      // Update pet's food journey
      supabase.from('bub_pets').update({
        food_bravery: Math.min(100, (foodBravery || 0) + (story.bravery_points || 3)),
        foods_tried: [...(foodsTried || []), food.id],
      }).eq('id', petId).then(() => {});

      // Save memory
      supabase.from('bub_pet_memories').insert({
        pet_id: petId,
        category: 'food',
        content: `Ochutnal/a jsem ${food.name} ${food.emoji}! ${food.petReaction}`,
        importance: 6,
      }).then(() => {});

      // Save badge if earned
      if (story.badge) {
        supabase.from('bub_pet_inventory').upsert({
          pet_id: petId,
          item_id: `badge_food_brave_${(foodsTried || []).length + 1}`,
          item_type: 'badge',
          quantity: 1,
          source: 'food_adventure',
        }, { onConflict: 'pet_id,item_id' }).then(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      food: { id: food.id, name: food.name, emoji: food.emoji, category: food.category, difficulty: food.difficulty, sensoryHint: food.sensoryHint },
      ...story,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
