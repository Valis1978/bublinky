import { NextRequest, NextResponse } from 'next/server';
import { safeParseJSON } from '@/lib/safe-json';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const { temp, feelsLike, description, humidity, wind, city, forecast } = await req.json();

    const prompt = `Jsi přátelský meteorolog pro 10letou holčičku Viki. Mluv česky, jednoduše a zábavně.

Aktuální počasí v ${city}:
- Teplota: ${temp}°C (pocitová: ${feelsLike}°C)
- Popis: ${description}
- Vlhkost: ${humidity}%
- Vítr: ${wind} km/h
${forecast ? `- Předpověď dalších dní: ${forecast}` : ''}

Na základě VŠECH údajů (včetně pocitové teploty, větru, vlhkosti) odpověz ve formátu JSON:
{
  "outfit": "Co si obléct - konkrétní doporučení oblečení (bundu/mikinu/tričko/čepici/rukavice/šálu/deštník/sluneční brýle/krém atd.) - buď konkrétní, zábavná a přátelská",
  "tip": "Jeden zábavný tip na aktivitu vhodnou pro dnešní počasí (venkovní/vnitřní podle situace)",
  "mood": "Jedna emotikon postavička vyjadřující náladu počasí (např. 🌞😎🥶🌧️☃️)",
  "funFact": "Jeden krátký zajímavý fakt o počasí, přírodě nebo ročním období, který by 10letou holčičku zaujal"
}

Odpověz POUZE validním JSON, nic jiného.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: `Gemini error: ${res.status} ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty AI response' }, { status: 502 });
    }

    const advice = safeParseJSON<{ outfit: string; tip: string; mood: string; funFact: string }>(text);
    if (!advice || !advice.outfit) {
      return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 502 });
    }
    return NextResponse.json({ success: true, advice });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
