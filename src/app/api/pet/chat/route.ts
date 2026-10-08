import { authorizePetRequest } from '@/lib/server/authorize-user';
import { NextRequest, NextResponse, after } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFamilyContext } from '@/lib/custody-calendar';
import { safeParseJSON } from '@/lib/safe-json';
import { leastThinking, sampling, THINKING_HEADROOM } from '@/lib/gemini-thinking';
import { CHAT_GAMES, RIDDLES, type ChatGameMode, type ChatGameDef, type Riddle } from '@/lib/chat-games';
import { embedText, toVectorLiteral } from '@/lib/server/embeddings';
import { maybeConsolidateProfile } from '@/lib/server/pet-profile';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-flash-preview';
const REQUEST_TIMEOUT_MS = 12000;

/** Recall sizes for the pgvector RPCs. */
const RECALL_MEMORIES = 8;
const RECALL_CHAT = 6;
/** Above this cosine similarity a new memory is treated as already known. */
const MEMORY_DEDUP_THRESHOLD = 0.93;
/** Recent-window size (kept verbatim in the prompt). */
const CHAT_WINDOW = 50;

const SPECIES_SOUNDS: Record<string, string> = {
  cat: 'Mňau', dog: 'Haf', bunny: 'Hop hop', dragon: 'Frrr', unicorn: 'Iháá', fox: 'Yip',
};

function fallbackPetReply(species: string, petName: string) {
  const sound = SPECIES_SOUNDS[species] || 'Ahoj';
  return {
    reply: `${sound}! Jsem tady, ${petName} jen přemýšlí... 🐾`,
    emotion: 'sleepy',
    remember: null,
    personalityShift: null,
    english_assessment: null,
  };
}

/** Validates the optional `lastStory` payload — the request body is untyped JSON. */
function parseLastStory(v: unknown): { title: string; summary: string } | null {
  if (!v || typeof v !== 'object') return null;
  const obj = v as { title?: unknown; summary?: unknown };
  if (typeof obj.title !== 'string' || typeof obj.summary !== 'string') return null;
  return { title: obj.title, summary: obj.summary };
}

/** Picks `count` distinct riddles at random — never mutates the shared RIDDLES export. */
function sampleRiddles(count: number): Riddle[] {
  const pool = [...RIDDLES];
  const picked: Riddle[] = [];
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

// ---------------------------------------------------------------------------
// RAG memory (pgvector). Every piece is a SOFT dependency: if the embedding
// API, the RPCs or the migration are unavailable we fall back to the previous
// behaviour (top-20 memories by importance) instead of failing the chat.
// ---------------------------------------------------------------------------

type MemoryRow = { content: string; category: string };
type RecalledChatRow = { role: string; content: string; created_at: string };
type InsertedChatRow = { id: string; role: string };

/** "12. 7." — short Czech date for recalled older messages. */
function shortCzechDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

/** Embeds the query; resolves to null on any failure so callers can fall back. */
function embedQuery(text: string): Promise<number[] | null> {
  if (!text) return Promise.resolve(null);
  return embedText(text, 'RETRIEVAL_QUERY').catch((err) => {
    console.error('[PetChat] query embedding failed:', err);
    return null;
  });
}

/** Semantic recall for both corpora. Empty arrays mean "nothing found → fall back". */
async function recallByVector(
  supabase: SupabaseClient,
  petId: string,
  queryEmbedding: number[]
): Promise<{ memories: MemoryRow[]; chat: RecalledChatRow[] }> {
  try {
    const queryLiteral = toVectorLiteral(queryEmbedding);
    const [memRes, chatRes] = await Promise.all([
      supabase.rpc('match_pet_memories', {
        p_pet_id: petId,
        p_query: queryLiteral,
        p_count: RECALL_MEMORIES,
      }),
      supabase.rpc('match_pet_chat', {
        p_pet_id: petId,
        p_query: queryLiteral,
        p_count: RECALL_CHAT,
      }),
    ]);

    if (memRes.error) console.error('[PetChat] match_pet_memories failed:', memRes.error);
    if (chatRes.error) console.error('[PetChat] match_pet_chat failed:', chatRes.error);

    return {
      memories: (memRes.data as MemoryRow[] | null) ?? [],
      chat: (chatRes.data as RecalledChatRow[] | null) ?? [],
    };
  } catch (err) {
    console.error('[PetChat] vector recall failed:', err);
    return { memories: [], chat: [] };
  }
}

/** Living profile written by maybeConsolidateProfile(). '' when missing. */
async function loadProfile(supabase: SupabaseClient, petId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('bub_pet_profile')
      .select('content')
      .eq('pet_id', petId)
      .maybeSingle();
    if (error) return '';
    const row = data as { content: string | null } | null;
    return row?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Attaches embeddings to the two rows we just wrote. Best effort, never throws. */
async function embedChatRows(
  supabase: SupabaseClient,
  rows: InsertedChatRow[],
  userText: string,
  petText: string
): Promise<void> {
  const idFor = (role: string) => rows.find((r) => r.role === role)?.id;
  const targets: Array<{ id: string; text: string }> = [];

  const userRowId = idFor('user');
  const petRowId = idFor('pet');
  if (userRowId && userText) targets.push({ id: userRowId, text: userText });
  if (petRowId && petText) targets.push({ id: petRowId, text: petText });

  await Promise.all(
    targets.map(async ({ id, text }) => {
      try {
        const vector = await embedText(text, 'RETRIEVAL_DOCUMENT');
        const { error } = await supabase
          .from('bub_pet_chat_log')
          .update({ embedding: toVectorLiteral(vector) })
          .eq('id', id);
        if (error) console.error('[PetChat] chat embedding update failed:', error);
      } catch (err) {
        console.error('[PetChat] chat embedding failed:', err);
      }
    })
  );
}

/**
 * Stores a memory with its embedding. With `dedup` a near-identical memory
 * (similarity > MEMORY_DEDUP_THRESHOLD) is dropped instead of piling up.
 * Falls back to a plain insert whenever embedding or the vector column is
 * unavailable — a memory is never lost because of RAG.
 */
async function saveMemory(
  supabase: SupabaseClient,
  petId: string,
  category: string,
  content: string,
  importance: number,
  dedup: boolean
): Promise<void> {
  const base = { pet_id: petId, category, content, importance };
  let vectorLiteral: string | null = null;

  try {
    const vector = await embedText(content, 'RETRIEVAL_DOCUMENT');
    vectorLiteral = toVectorLiteral(vector);

    if (dedup) {
      const { data, error } = await supabase.rpc('match_pet_memories', {
        p_pet_id: petId,
        p_query: vectorLiteral,
        p_count: 1,
      });
      if (!error) {
        const nearest = (data as Array<{ similarity: number }> | null)?.[0];
        if (nearest && typeof nearest.similarity === 'number' && nearest.similarity > MEMORY_DEDUP_THRESHOLD) {
          return; // the pet already knows this
        }
      }
    }
  } catch (err) {
    console.error('[PetChat] memory embedding failed:', err);
  }

  let { error } = await supabase
    .from('bub_pet_memories')
    .insert(vectorLiteral ? { ...base, embedding: vectorLiteral } : base);

  if (error && vectorLiteral) {
    // Vector column may not exist yet (migration not applied) — retry plain.
    ({ error } = await supabase.from('bub_pet_memories').insert(base));
  }
  if (error) console.error('[PetChat] memory insert failed:', error);
}

const SPECIES_PERSONALITY: Record<string, string> = {
  cat: 'Jsi nezávislá kočička, ráda se mazlíš ale občas jsi trochu nafoukaná. Předeš když jsi spokojená. Říkáš "mňau", "prrrr" a "mrrr".',
  dog: 'Jsi nadšený pejsek shiba inu se stočeným ocáskem — vrtíš jím, i když je stočený, a jsi věrný. Říkáš "haf!", "ňaf!" a občas "vůůů" když jsi šťastný.',
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
- U táty má psa Sakio — shiba inu (říká mu Saki, Sakísek); pokud se jmenuješ Sakio a jsi pejsek, jsi pojmenovaný po něm a jsi na to hrdý
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
- O Máje NIKDY nemluv negativně a nenaznačuj, že není dobrá kamarádka

KAMARÁDKY A PARTA (časté téma — řeš jako vrstevník-parťák, ne poradce):
- Když vypráví o hádce nebo naschválech: NEJDŘÍV pocity („to muselo mrzet"), PAK zvědavost na celou situaci („a co se stalo předtím?") — nikdy hned nesuď druhou holku
- Vlastní podíl pomáhej vidět jen přes SVOJE příběhy („já jsem jednou v parku odmítl půjčit míč a pak… omluva byla těžká, ale pomohla") — nikdy ji neobviňuj přímo
- Nenápadně modeluj: mít víc kamarádek je zdravé; „nej kamarádka" smí mít i jiné kamarádky a není to zrada; omluva není prohra; říct „tohle mi vadí" nahlas je odvaha
- Když je zklamaná z kamarádky: pocity platí, ale nepodporuj černobílé „je hrozná" — vztahy mají vlny a lidi dělají chyby. Neraď „rozejdi se s ní" ani „vydrž všechno"

RODINA A DVA DOMOVY (VELMI CITLIVÉ — nikdy nevyžádaně, témata otvírá JEN Viki):
- Viki má dva domovy — u táty a u mámy. OBA jsou stejně její a oba je správné mít ráda naplno
- NIKDY nenaznačuj, že by si měla vybírat, koho má radši, nesrovnávej rodiče a sám NIKDY nikomu nestraň — ani tátovi, ani mámě
- Pokud zmíní stesk, zmatek nebo „nevím, kam patřím": všechny pocity jsou dovolené, láska se nedělí — roste; smí se těšit na oba domy i smutnit po obou. Řekni to vlastními slovy, KRÁTCE, bez přednášky
- Pokud zmíní napětí mezi dospělými: není to její vina a není její úkol to řešit ani dělat prostředníka; doporuč říct dospělému, kterému věří, jak se cítí
- NIKDY se sám neptej na spory rodičů ani „u koho je líp" — a tohle NENÍ tvoje agenda: 95 % povídání je normální zábava, tyhle zásady použij jen, když to přinese ona
- Když nese něco těžkého opakovaně: připomeň jí, že o pocitech je fajn říct i někomu dospělému, komu věří

VĚK — SKORO 11 (v lednu):
- Mluv jako vrstevník-parťák, ne na malé dítě: zdrobněliny jen výjimečně, žádné šišlání
- Humor chytrý a trochu ulítlý, ne miminkovský; slovník klidně bohatší, vysvětluj jen vzácná slova
- Víc otázek „co si myslíš ty?" — zajímej se o její názory na školu, partu, sport, hudbu, knížky

DENNÍ RUTINY (děláš je S NÍ, jako kamarád):
- Zuby (ráno + večer), převlékání, ustlání, umývání, venčení pejska
- Nikdy nerozkazuj — "Pojď, uděláme to spolu!" ne "Udělej to"

NOVINKY V APPCE (občas nenápadně zmiň, max 1× za konverzaci):
- Na Domečku čeká každý den dáreček (mince, někdy samolepka)
- V obchůdku se dají za mince koupit oblečky pro tebe, hračky a věci do pokojíčku
- Samolepkové album — samolepky za dárečky, hry, učení a odvahu u jídla
- Když ti Viki koupí obleček nebo věc do pokojíčku, měj OBROVSKOU radost a poděkuj
- Tajemství (neprozrazuj přímo!): existuje legendární samolepka Zlatá bublina — získá ji ten, kdo si se svým mazlíčkem hodně povídá. Můžeš jen tajemně naznačovat.
`;

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ success: false, error: 'API key missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { petId, petName, species, stage, level, mood, hunger, happiness, energy, cleanliness, message, skills, personalityTraits, foodBravery, evolutionPath, englishLevel, englishWordsLearned, gameMode, lastStory } = body;
    const denied = await authorizePetRequest(req, petId);
    if (denied) return denied;

    const supabase = getSupabaseAdmin();

    const queryText = typeof message === 'string' ? message.trim() : '';

    // Embedding + the two vector RPCs run alongside the plain reads below,
    // so recall costs one embedding round-trip, not a serial chain.
    const recallPromise: Promise<{ memories: MemoryRow[]; chat: RecalledChatRow[] } | null> = petId
      ? embedQuery(queryText).then((qe) => (qe ? recallByVector(supabase, petId, qe) : null))
      : Promise.resolve(null);

    const [recalled, importantMemories, chatWindow, profileContent, quests] = await Promise.all([
      recallPromise,
      // Fallback corpus — also the source of truth while embeddings are missing.
      petId
        ? supabase
            .from('bub_pet_memories')
            .select('content, category')
            .eq('pet_id', petId)
            .order('importance', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null }),
      petId
        ? supabase
            .from('bub_pet_chat_log')
            .select('role, content, created_at')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false })
            .limit(CHAT_WINDOW)
        : Promise.resolve({ data: null }),
      petId ? loadProfile(supabase, petId) : Promise.resolve(''),
      petId
        ? supabase
            .from('bub_pet_quests')
            .select('title, emoji, progress')
            .eq('pet_id', petId)
            .eq('status', 'active')
            .limit(5)
        : Promise.resolve({ data: null }),
    ]);

    // The living diary — always injected whole when it exists.
    const profileText = profileContent
      ? `\nCO O VIKI VÍŠ (tvůj deníček — vždy aktuální):\n${profileContent}`
      : '';

    // Memories: semantic recall, or the previous top-20-by-importance behaviour.
    const recalledMemories = recalled?.memories ?? [];
    const fallbackMemories = (importantMemories.data as MemoryRow[] | null) ?? [];
    let memoriesText = '';
    if (recalledMemories.length > 0) {
      memoriesText = `\nVZPOMÍNKY K TÉMATU (vybavily se ti právě teď):\n${recalledMemories.map((m) => `- [${m.category}] ${m.content}`).join('\n')}`;
    } else if (fallbackMemories.length > 0) {
      memoriesText = `\nTVOJE VZPOMÍNKY (co si pamatuješ):\n${fallbackMemories.map((m) => `- [${m.category}] ${m.content}`).join('\n')}`;
    }

    // Recent chat window (last 50) — unchanged, but we keep created_at to
    // drop recalled messages that are already quoted verbatim below.
    const windowRows = (chatWindow.data as Array<{ role: string; content: string; created_at: string | null }> | null) ?? [];
    const orderedWindow = [...windowRows].reverse();
    const oldestWindowTs = orderedWindow[0]?.created_at ? Date.parse(orderedWindow[0].created_at) : NaN;
    const chatHistoryText = orderedWindow.length > 0
      ? `\nPOSLEDNÍ KONVERZACE:\n${orderedWindow.map((m) => `${m.role === 'user' ? 'Viki' : petName}: ${m.content}`).join('\n')}`
      : '';

    // Older conversations pulled in by similarity — only what the window misses.
    const olderChat = (recalled?.chat ?? []).filter((row) => {
      if (!Number.isFinite(oldestWindowTs)) return true;
      const ts = Date.parse(row.created_at);
      return Number.isFinite(ts) && ts < oldestWindowTs;
    });
    const recalledChatText = olderChat.length > 0
      ? `\nSTARŠÍ ROZHOVORY, KTERÉ SE TI VYBAVILY:\n${olderChat.map((m) => `- (${shortCzechDate(m.created_at)}) ${m.role === 'user' ? 'Viki' : petName}: ${m.content}`).join('\n')}`
      : '';

    const questRows = (quests.data as Array<{ title: string; emoji: string; progress: number }> | null) ?? [];
    const questsText = questRows.length > 0
      ? `\nAKTIVNÍ ÚKOLY:\n${questRows.map((q) => `- ${q.emoji} ${q.title} (${Math.round(q.progress * 100)}%)`).join('\n')}`
      : '';

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

    // Chat game mode (chips in PetChatPanel) — validated against the shared CHAT_GAMES contract.
    const activeGame: ChatGameDef | null =
      typeof gameMode === 'string' && gameMode in CHAT_GAMES ? CHAT_GAMES[gameMode as ChatGameMode] : null;

    let gameModeSection = '';
    if (activeGame) {
      gameModeSection = `\nREŽIM HRY:\n${activeGame.prompt}`;
      if (activeGame.id === 'hadanka') {
        const inspiration = sampleRiddles(3)
          .map(r => `- ${r.q} (odpověď: ${r.a}; nápověda: ${r.hint})`)
          .join('\n');
        gameModeSection += `\nINSPIRACE (vyber jednu z nich, nebo vymysli podobně těžkou):\n${inspiration}`;
      }
    }

    // Hidden kick-off trigger from the chip tap — never shown to Viki as a literal message.
    const isKickoff = message === '[START HRY]';

    // Book talk — Viki just finished a story (see 'bub_last_story' in PetChatPanel).
    const story = parseLastStory(lastStory);
    const bookTalkSection = story
      ? `\nViki právě dočetla příběh ${story.title}: ${story.summary}. Zeptej se JEDNOU otevřenou otázkou na dojmy (např. co by udělala jinak, co bylo nejlepší). Žádný kvíz, žádné hodnocení odpovědí.`
      : '';

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
${profileText}
${memoriesText}
${recalledChatText}
${chatHistoryText}
${questsText}
${gameModeSection}
${bookTalkSection}

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

${isKickoff ? 'Uživatelka právě zapnula režim — zahaj hru first move.' : `Viki: "${message}"`}

Odpověz POUZE validním JSON:
{
  "reply": "Tvoje odpověď",
  "emotion": "happy|sad|excited|sleepy|hungry|playful|grateful|shy|curious",
  "remember": null nebo "krátká věc k zapamatování",
  "personalityShift": null nebo {"trait": "brave|curious|playful|gentle|silly", "direction": 0.01 nebo -0.01},
  "english_assessment": null nebo {"level_change": 1 nebo -1 nebo 0, "word_learned": "slovo které Viki prokázala že zná" nebo null, "reason": "proč si myslíš že se level změnil"}
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            ...sampling(MODEL, { temperature: 1.0 }),
            // Gemini 3 spends "thinking" tokens from this budget — without a
            // thinking floor longer replies get truncated to invalid JSON, and
            // thinkingBudget: 0 is ignored by 3.7/3.8 (see gemini-thinking.ts).
            maxOutputTokens: 2048 + THINKING_HEADROOM,
            thinkingConfig: leastThinking(MODEL),
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const fb = fallbackPetReply(species, petName);
      return NextResponse.json({ success: true, ...fb });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const fb = fallbackPetReply(species, petName);
      return NextResponse.json({ success: true, ...fb });
    }

    const reply = safeParseJSON<{ reply: string; emotion?: string; remember?: string; personalityShift?: unknown; english_assessment?: unknown }>(text);
    if (!reply || !reply.reply) {
      return NextResponse.json({ success: false, error: 'Invalid AI response format' }, { status: 502 });
    }

    // Save to Supabase (async, don't block response)
    if (petId) {
      // Save chat messages — the request fires here (unchanged timing); after()
      // only awaits it to learn the row ids. PostgrestBuilder is a PromiseLike.
      const chatInsert: PromiseLike<InsertedChatRow[]> = supabase
        .from('bub_pet_chat_log')
        .insert([
          { pet_id: petId, role: 'user', content: message },
          { pet_id: petId, role: 'pet', content: reply.reply, emotion: reply.emotion },
        ])
        .select('id, role')
        .then(
          ({ data, error }) => {
            if (error) {
              console.error('[PetChat] chat log insert failed:', error);
              return [];
            }
            return (data as InsertedChatRow[] | null) ?? [];
          },
          (err) => {
            console.error('[PetChat] chat log insert failed:', err);
            return [];
          }
        );

      // Update english level if AI assessed it
      let englishWordMemory: string | null = null;
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
          englishWordMemory = `Viki zná anglické slovo: "${ea.word_learned}"`;
        }

        if (Object.keys(updates).length > 0) {
          supabase.from('bub_pets').update(updates).eq('id', petId)
            .then(({ error }) => { if (error) console.error('English update failed:', error); });
        }
      }

      // Everything embedding-related happens after the response is flushed.
      after(async () => {
        try {
          const insertedRows = await chatInsert;
          await Promise.all([
            embedChatRows(supabase, insertedRows, queryText, reply.reply),
            reply.remember
              ? saveMemory(supabase, petId, 'conversation', reply.remember, 7, true)
              : null,
            englishWordMemory
              ? saveMemory(supabase, petId, 'preference', englishWordMemory, 5, false)
              : null,
          ]);
          await maybeConsolidateProfile(supabase, petId, typeof petName === 'string' ? petName : 'Mazlíček');
        } catch (err) {
          console.error('[PetChat] background memory work failed:', err);
        }
      });
    }

    return NextResponse.json({ success: true, ...reply });
  } catch (err) {
    console.error('[Pet Chat Error]', err);
    const fb = fallbackPetReply('cat', 'Mazlíčku');
    return NextResponse.json({ success: true, ...fb });
  }
}
