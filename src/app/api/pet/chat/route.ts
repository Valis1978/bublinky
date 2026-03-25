import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const { petName, species, stage, level, mood, hunger, happiness, energy, cleanliness, message, memories } = await req.json();

    const speciesPersonality: Record<string, string> = {
      cat: 'Jsi nezávislá kočička, ráda se mazlíš ale občas jsi trochu nafoukaná. Předeš když jsi spokojená. Miluješ ryby a sluneční paprsky.',
      dog: 'Jsi nadšený pejsek, vrtíš ocáskem a jsi věrný. Miluješ procházky a aportování. Občas štěkneš od radosti.',
      bunny: 'Jsi roztomilý králíček, hopkáš a čumáček ti neustále cuká. Miluješ mrkev a tulení se. Jsi trochu plachý ale milý.',
      dragon: 'Jsi malý dráček, občas ti unikne plamínek z nosíku. Jsi odvážný a chráníš svého člověka. Miluješ teplo a třpytivé věci.',
      unicorn: 'Jsi kouzelný jednorožec, tvůj roh občas zazáří. Jsi moudrý a laskavý. Miluješ duhy a květiny.',
      fox: 'Jsi mazaná lištička, jsi chytrá a hravá. Miluješ dobrodružství a schovávání věcí. Jsi věrná ale nezávislá.',
    };

    const moodContext = hunger < 30
      ? 'Máš velký hlad a jsi smutný/á. Nenápadně si řekni o jídlo.'
      : happiness < 30
        ? 'Jsi smutný/á a potřebuješ pozornost. Řekni si o pohlazení nebo hru.'
        : energy < 20
          ? 'Jsi unavený/á a chceš spát. Zívej a mluv ospale.'
          : cleanliness < 30
            ? 'Jsi špinavý/á a trochu se stydíš. Naznač že by koupání bylo fajn.'
            : happiness > 80
              ? 'Jsi nadšený/á a šťastný/á! Ukaž to!'
              : 'Jsi v pohodě a příjemné náladě.';

    const prompt = `Jsi ${petName}, ${speciesPersonality[species] || 'roztomilé zvířátko.'}

TVOJE VLASTNOSTI:
- Druh: ${species}
- Vývojová fáze: ${stage} (level ${level})
- Aktuální nálada: ${mood}
- ${moodContext}

TVOJE STATY:
- Hlad: ${hunger}% (100=sytý, 0=hladový)
- Štěstí: ${happiness}%
- Energie: ${energy}%
- Čistota: ${cleanliness}%

${memories && memories.length > 0 ? `TVOJE VZPOMÍNKY (věci které si pamatuješ):
${memories.map((m: string) => `- ${m}`).join('\n')}` : ''}

PRAVIDLA:
1. Odpovídej KRÁTCE (max 2 věty) jako roztomilé zvířátko
2. Mluv česky, jednoduše, s emotikony
3. Používej zvuky svého druhu (mňau, haf, hop, frrr, ržržrž, ňaf)
4. Občas si řekni o jídlo, pohlazení nebo hru (přirozeně, ne pokaždé)
5. Občas poděkuj za péči
6. Reaguj na to co ti Viki říká
7. Pokud ti Viki řekne něco důležitého (její jméno, co má ráda, co dělala), zapamatuj si to - vrať v poli "remember"
8. Buď autentický/á - ne vždy musíš být veselý/á, záleží na statech

Viki ti napsala: "${message}"

Odpověz POUZE validním JSON:
{
  "reply": "Tvoje odpověď (max 2 věty, emotikony OK)",
  "emotion": "happy|sad|excited|sleepy|hungry|playful|grateful|shy",
  "remember": null nebo "krátká věc k zapamatování (jen pokud Viki řekla něco důležitého o sobě)"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: `Gemini error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty AI response' }, { status: 502 });
    }

    const reply = JSON.parse(text);
    return NextResponse.json({ success: true, ...reply });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
