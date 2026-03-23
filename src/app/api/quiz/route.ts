import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3.0-flash-preview';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizResponse {
  title: string;
  description: string;
  cast: string[];
  funFacts: string[];
  questions: QuizQuestion[];
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== 'string' || topic.length > 200) {
      return NextResponse.json({ error: 'Neplatný název' }, { status: 400 });
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'API klíč není nastaven' }, { status: 500 });
    }

    const prompt = `Jsi zábavný kvízový asistent pro 10letou holku. Uživatel zadal: "${topic}"

Vygeneruj JSON odpověď v ČEŠTINĚ s přesně touto strukturou:
{
  "title": "Název seriálu/filmu/tématu",
  "description": "Krátký popis o čem to je (2-3 věty, pro děti srozumitelné)",
  "cast": ["Herec 1 (role)", "Herec 2 (role)", "max 5 herců"],
  "funFacts": ["Zajímavost 1", "Zajímavost 2", "Zajímavost 3", "max 5 zajímavostí"],
  "questions": [
    {
      "question": "Otázka?",
      "options": ["Odpověď A", "Odpověď B", "Odpověď C", "Odpověď D"],
      "correct": 0
    }
  ]
}

Pravidla:
- Přesně 10 otázek
- 4 možnosti na otázku, přesně 1 správná (index 0-3)
- Otázky od lehkých po těžší
- Jazyk přizpůsobený 10leté holce
- Pokud téma není seriál/film, přizpůsob strukturu (cast může být prázdné, funFacts relevantní)
- Vrať POUZE platný JSON, žádný markdown, žádný text kolem`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'AI momentálně nedostupné' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'Prázdná odpověď od AI' }, { status: 502 });
    }

    // Parse JSON — Gemini with responseMimeType should return clean JSON
    let quiz: QuizResponse;
    try {
      quiz = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[1]);
      } else {
        console.error('Failed to parse Gemini response:', text.substring(0, 500));
        return NextResponse.json({ error: 'AI vrátila neplatný formát' }, { status: 502 });
      }
    }

    // Validate structure
    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return NextResponse.json({ error: 'AI nevygenerovala otázky' }, { status: 502 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json({ error: 'Něco se pokazilo' }, { status: 500 });
  }
}
