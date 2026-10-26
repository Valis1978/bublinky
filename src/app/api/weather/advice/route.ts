import { NextRequest, NextResponse } from 'next/server';
import { safeParseJSON } from '@/lib/safe-json';
import { leastThinking, sampling, THINKING_HEADROOM } from '@/lib/gemini-thinking';
import { geminiConfigured, generateContent } from '@/lib/server/gemini';

const MODEL = 'gemini-3-flash-preview';

export async function POST(req: NextRequest) {
  if (!geminiConfigured()) {
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

    const res = await generateContent(MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Thoughts count into maxOutputTokens — default thinking cut the advice to invalid JSON
      generationConfig: {
        ...sampling(MODEL, { temperature: 0.9 }),
        maxOutputTokens: 1024 + THINKING_HEADROOM,
        thinkingConfig: leastThinking(MODEL),
        responseMimeType: 'application/json',
      },
    });

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
