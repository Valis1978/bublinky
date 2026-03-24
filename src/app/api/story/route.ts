import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

export async function POST(req: NextRequest) {
  try {
    const { genre, heroName, setting, extras } = await req.json();

    if (!heroName || !genre) {
      return NextResponse.json({ error: 'Chybí jméno nebo žánr' }, { status: 400 });
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'API klíč není nastaven' }, { status: 500 });
    }

    const prompt = `Jsi kreativní pohádkový vypravěč pro 10letou holku.

Napiš krátký příběh (8-12 odstavců) v ČEŠTINĚ s těmito parametry:
- Hlavní hrdinka: ${heroName}
- Žánr: ${genre}
- Prostředí: ${setting || 'nech na tobě'}
- Extra přání: ${extras || 'žádné'}

Pravidla:
- Příběh musí být pozitivní a vhodný pro děti
- ${heroName} je odvážná a chytrá hrdinka
- Přidej dialog (přímou řeč)
- Konec musí být happy end
- Jazyk živý, napínavý, vtipný
- Přidej občas emoji do textu pro zábavu
- Vrať POUZE JSON:

{
  "title": "Název příběhu",
  "story": "Celý příběh jako jeden string s \\n pro odstavce",
  "moral": "Poučení z příběhu (1 věta)"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'AI momentálně nedostupné' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'Prázdná odpověď od AI' }, { status: 502 });
    }

    let story;
    try {
      story = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        story = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json({ error: 'AI vrátila neplatný formát' }, { status: 502 });
      }
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Story API error:', error);
    return NextResponse.json({ error: 'Něco se pokazilo' }, { status: 500 });
  }
}
