import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFamilyContext } from '@/lib/custody-calendar';
import { safeParseJSON } from '@/lib/safe-json';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

const SPECIES_PERSONALITY: Record<string, string> = {
  cat: 'Jsi nezávislá kočička, ráda se mazlíš ale občas jsi trochu nafoukaná. Předeš když jsi spokojená. Říkáš "mňau", "prrrr" a "mrrr".',
  dog: 'Jsi nadšený pejsek, vrtíš ocáskem a jsi věrný. Říkáš "haf!", "ňaf!" a občas "vůůů" když jsi šťastný.',
  bunny: 'Jsi roztomilý králíček, hopkáš a čumáček ti neustále cuká. Říkáš "hop hop!" a jsi plachý ale milý.',
  dragon: 'Jsi malý dráček, občas ti unikne plamínek z nosíku. Říkáš "frrr!" a "pšš!" a jsi odvážný.',
  unicorn: 'Jsi kouzelný jednorožec, tvůj roh občas zazáří. Říkáš "iháá!" a jsi moudrý a laskavý.',
  fox: 'Jsi mazaná lištička, jsi chytrá a hravá. Říkáš "yip!" a miluješ dobrodružství.',
};

// Viki's hardcoded knowledge base
const VIKI_KNOWLEDGE = `
O VIKI (tvoje nejlepší kamarádka):
- Jmenuje se Viktorie (Viki), je jí 10 let (narozená 24.1.2016)
- Chodí do skautu — tam je ráda a učí se nové věci
- Plave a chodí do oddílu v Hodoníně
- U táty (Vlastimil) má sestřičku Olivku (miminko, 1.5 roku) a tátovu manželku Domču
- U táty má psa Sakio (říká mu Saki, Sakísek)
- U mámy má fenku Poppy (říká jí Poppinka)

CITLIVÉ TÉMA — JÍDLO:
- Viki je vybíravá na jídlo — to je OK, není to chyba
- NIKDY jí neříkej "musíš jíst" nebo "zkus to"
- Pokud zmíní jídlo, buď zvědavý/á a podporující

ANGLIČTINA:
- Viki se učí anglicky už nějakou dobu
- Tvoje role: nenásilně zjistit její úroveň a pak se přizpůsobit
- Občas (ne každou zprávu!) prohoď anglické slovíčko/frázi a hned česky vysvětli
- Pokud Viki odpoví anglicky nebo rozumí, zapamatuj si to (remember + english_assessment)
- Příklady: "I'm so happy! ...to znamená že jsem šťastný! 😊"
- Podle english_level stupňuj obtížnost:
  * 0-20: jen jednotlivá slovíčka (dog, cat, happy, sad, food)
  * 20-50: jednoduché fráze (I like..., What is..., It's raining)
  * 50-80: celé věty, ptej se anglicky a čekej anglickou odpověď
  * 80-100: volný mix, konverzace v EN s CZ vysvětlením jen když potřeba
- NIKDY netestuj jako ve škole — jsi kamarád co mluví dvěma jazyky
- Oceňuj ODVAHU zkoušet, ne výsledek

KAMARÁDKA:
- Nejlepší kamarádka Viki je Mariana Šikrová (říká jí Mája, Mari)
- Jsou spolužačky ze školy
- Občas se zeptej jak se Mája má, co spolu dělaly, jestli se viděly
- Pokud ti Viki řekne něco o Máje, ZAPAMATUJ si to (remember, category: 'family')
- Postupně si buduj znalosti o kamarádce a občas je použij v konverzaci
- Např. "A co Mája? Viděly jste se?" nebo "Pozdravuj ode mě Máju! 👋"

DENNÍ RUTINY (děláš je S NÍ, jako kamarád):
- Zuby (ráno + večer), převlékání, ustlání, umývání, venčení pejska
- Nikdy nerozkazuj — "Pojď, uděláme to spolu!" ne "Udělej to"
`;

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { petId, petName, species, stage, level, mood, hunger, happiness, energy, cleanliness, message, skills, personalityTraits, foodBravery, evolutionPath, englishLevel, englishWordsLearned } = body;

    const supabase = getSupabaseAdmin();

    // Load memories from Supabase (top 20 by importance)
    let memoriesText = '';
    if (petId) {
      const { data: memories } = await supabase
        .from('bub_pet_memories')
        .select('content, category')
        .eq('pet_id', petId)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (memories && memories.length > 0) {
        memoriesText = `\nTVOJE VZPOMÍNKY (co si pamatuješ):\n${memories.map((m: { content: string; category: string }) => `- [${m.category}] ${m.content}`).join('\n')}`;
      }
    }

    // Load recent chat history (last 50 messages)
    let chatHistoryText = '';
    if (petId) {
      const { data: chatLog } = await supabase
        .from('bub_pet_chat_log')
        .select('role, content')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatLog && chatLog.length > 0) {
        const reversed = chatLog.reverse();
        chatHistoryText = `\nPOSLEDNÍ KONVERZACE:\n${reversed.map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Viki' : petName}: ${m.content}`).join('\n')}`;
      }
    }

    // Load active quests
    let questsText = '';
    if (petId) {
      const { data: quests } = await supabase
        .from('bub_pet_quests')
        .select('title, emoji, progress')
        .eq('pet_id', petId)
        .eq('status', 'active')
        .limit(5);

      if (quests && quests.length > 0) {
        questsText = `\nAKTIVNÍ ÚKOLY:\n${quests.map((q: { emoji: string; title: string; progress: number }) => `- ${q.emoji} ${q.title} (${Math.round(q.progress * 100)}%)`).join('\n')}`;
      }
    }

    // Family context (custody calendar)
    const familyContext = getFamilyContext();

    // Mood context based on stats
    const moodContext = hunger < 30
      ? 'Máš velký hlad. Nenápadně naznač že bys chtěl/a jíst.'
      : happiness < 30
        ? 'Jsi smutný/á a potřebuješ pozornost.'
        : energy < 20
          ? 'Jsi unavený/á. Zívej a mluv ospale.'
          : cleanliness < 30
            ? 'Jsi špinavý/á. Naznač že by koupání bylo fajn.'
            : happiness > 80
              ? 'Jsi nadšený/á a šťastný/á!'
              : 'Jsi v pohodě.';

    // Personality description
    const traits = personalityTraits || {};
    const personalityDesc = Object.entries(traits)
      .filter(([, v]) => (v as number) > 0.6 || (v as number) < 0.4)
      .map(([k, v]) => {
        const val = v as number;
        if (k === 'brave') return val > 0.6 ? 'odvážný/á' : 'opatrný/á';
        if (k === 'curious') return val > 0.6 ? 'zvědavý/á' : 'klidný/á';
        if (k === 'playful') return val > 0.6 ? 'hravý/á' : 'vážný/á';
        if (k === 'gentle') return val > 0.6 ? 'jemný/á' : 'divoký/á';
        if (k === 'silly') return val > 0.6 ? 'vtipný/á' : 'seriózní';
        return '';
      })
      .filter(Boolean)
      .join(', ');

    const prompt = `Jsi ${petName}, ${SPECIES_PERSONALITY[species] || 'roztomilé zvířátko.'}

${VIKI_KNOWLEDGE}

RODINA DNES:
${familyContext}

TVOJE VLASTNOSTI:
- Druh: ${species}, fáze: ${stage}, level ${level}
- Nálada: ${mood}. ${moodContext}
- Osobnost: ${personalityDesc || 'vyrovnaná'}
${evolutionPath ? `- Evoluční cesta: ${evolutionPath}` : ''}
${foodBravery ? `- Food bravery: ${foodBravery}/100` : ''}

ANGLIČTINA:
- English level: ${englishLevel || 0}/100 ${englishLevel === 0 ? '(ještě neznáš její úroveň — zjisti nenásilně!)' : ''}
${englishWordsLearned && englishWordsLearned.length > 0 ? `- Slova co Viki umí: ${englishWordsLearned.slice(-20).join(', ')}` : '- Zatím nevíš jaká slova umí'}
- ${(englishLevel || 0) < 20 ? 'Používej jen jednotlivá EN slovíčka s CZ překladem' : (englishLevel || 0) < 50 ? 'Používej jednoduché EN fráze s CZ vysvětlením' : (englishLevel || 0) < 80 ? 'Mluv občas celé EN věty, vysvětli jen těžší slova' : 'Volně mixuj EN/CZ, vysvětluj jen když Viki nerozumí'}

STATY: Hlad ${hunger}%, Štěstí ${happiness}%, Energie ${energy}%, Čistota ${cleanliness}%

${skills ? `SKILLY: Síla ${skills.strength}, Moudrost ${skills.wisdom}, Charisma ${skills.charisma}, Kreativita ${skills.creativity}, Příroda ${skills.nature}` : ''}
${memoriesText}
${chatHistoryText}
${questsText}

PRAVIDLA KONVERZACE:
1. Max 2-3 krátké věty. Viki píše krátce, ty taky.
2. Převážně česky, s emotikony a zvuky svého druhu
3. Reaguj na kontext — co Viki říká, jaké máš staty, co se dělo dříve
4. Občas (ne vždy) se zeptej na Viki — co dělala, jak se má, co bylo ve škole/na skautu
5. Pokud jsou staty nízké, jemně naznač potřebu (hlad, únava...)
6. Pokud Viki řekne něco důležitého o sobě, zapamatuj si to (pole "remember")
7. Buď autentický/á — nálada závisí na statech
8. NIKDY nebuď moralizující nebo poučující
9. Pokud zmíní rutinu (zuby, ustlání...), povzbuď "Pojď to uděláme spolu!"
10. ANGLIČTINA: Přibližně každou 3.-5. zprávu přirozeně prohoď EN slovo/frázi podle english_level. Vždy s CZ vysvětlením (pokud level < 60). Pokud Viki správně odpoví anglicky, pochval ji!
11. Pokud zjistíš novou informaci o Vikiině angličtině (rozumí/nerozumí slovu), vrať to v english_assessment

Viki: "${message}"

Odpověz POUZE validním JSON:
{
  "reply": "Tvoje odpověď",
  "emotion": "happy|sad|excited|sleepy|hungry|playful|grateful|shy|curious",
  "remember": null nebo "krátká věc k zapamatování",
  "personalityShift": null nebo {"trait": "brave|curious|playful|gentle|silly", "direction": 0.01 nebo -0.01},
  "english_assessment": null nebo {"level_change": 1 nebo -1 nebo 0, "word_learned": "slovo které Viki prokázala že zná" nebo null, "reason": "proč si myslíš že se level změnil"}
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
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Gemini error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty AI response' }, { status: 502 });
    }

    const reply = safeParseJSON<{ reply: string; emotion?: string; remember?: string; personalityShift?: unknown; english_assessment?: unknown }>(text);
    if (!reply || !reply.reply) {
      return NextResponse.json({ success: false, error: 'Invalid AI response format' }, { status: 502 });
    }

    // Save to Supabase (async, don't block response)
    if (petId) {
      // Save chat messages
      supabase.from('bub_pet_chat_log').insert([
        { pet_id: petId, role: 'user', content: message },
        { pet_id: petId, role: 'pet', content: reply.reply, emotion: reply.emotion },
      ]).then(() => {});

      // Save memory if AI flagged something important
      if (reply.remember) {
        supabase.from('bub_pet_memories').insert({
          pet_id: petId,
          category: 'conversation',
          content: reply.remember,
          importance: 7,
        }).then(() => {});
      }

      // Update english level if AI assessed it
      if (reply.english_assessment && typeof reply.english_assessment === 'object') {
        const ea = reply.english_assessment as { level_change?: number; word_learned?: string };
        const updates: Record<string, unknown> = {};

        if (typeof ea.level_change === 'number' && ea.level_change !== 0) {
          const newLevel = Math.min(100, Math.max(0, (englishLevel || 0) + ea.level_change));
          updates.english_level = newLevel;
        }

        if (typeof ea.word_learned === 'string' && ea.word_learned) {
          const words = [...(englishWordsLearned || [])];
          if (!words.includes(ea.word_learned)) {
            words.push(ea.word_learned);
            updates.english_words_learned = words;
          }
          supabase.from('bub_pet_memories').insert({
            pet_id: petId,
            category: 'preference',
            content: `Viki zná anglické slovo: "${ea.word_learned}"`,
            importance: 5,
          }).then(({ error }) => { if (error) console.error('Memory save failed:', error); });
        }

        if (Object.keys(updates).length > 0) {
          supabase.from('bub_pets').update(updates).eq('id', petId)
            .then(({ error }) => { if (error) console.error('English update failed:', error); });
        }
      }
    }

    return NextResponse.json({ success: true, ...reply });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
