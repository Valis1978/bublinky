// Chat games with the pet — conversational play modes for PetChatPanel.
// A mode changes the system-prompt instructions sent to /api/pet/chat and may
// carry local state (e.g. the current riddle). Datasets live here so the games
// work even when the AI has a bad day (fallbacks).

export type ChatGameMode = 'hadanka' | 'hadej-zvire' | 'stridacka' | 'co-bys-radsi';

export interface ChatGameDef {
  id: ChatGameMode;
  label: string;
  emoji: string;
  /** short pitch shown on the chip */
  hint: string;
  /** instructions injected into the pet system prompt while the mode is on */
  prompt: string;
}

export const CHAT_GAMES: Record<ChatGameMode, ChatGameDef> = {
  'hadanka': {
    id: 'hadanka', label: 'Hádanky', emoji: '🧩', hint: 'Dám ti hádanku!',
    prompt: `REŽIM HÁDANKY: Dej Viki hádanku ze svého seznamu (nebo vymysli podobně jednoduchou). Čekej na odpověď. Špatný tip → povzbuď a dej nápovědu (max 2). Správně → velká radost + nabídni další. Nikdy neprozrazuj odpověď hned.`,
  },
  'hadej-zvire': {
    id: 'hadej-zvire', label: 'Hádej zvíře', emoji: '🦁', hint: 'Mysli na zvíře, já hádám!',
    prompt: `REŽIM HÁDEJ ZVÍŘE: Viki si myslí zvíře. Ty se ptáš otázkami na ANO/NE (max 10), pak zkus tipnout. Počítej otázky nahlas („Otázka 3:"). Když uhodneš, raduj se; když ne, uznej porážku a chtěj vědět, co to bylo. Pak nabídni výměnu rolí — ty si myslíš, ona hádá.`,
  },
  'stridacka': {
    id: 'stridacka', label: 'Příběh na střídačku', emoji: '📖', hint: 'Vymýšlíme spolu příběh!',
    prompt: `REŽIM PŘÍBĚH NA STŘÍDAČKU: Tvoříte příběh spolu — ty řekneš JEDNU větu, Viki přidá další, ty pokračuješ zase JEDNOU větou. Drž její nápady (nikdy je neruš), přidávej zvraty a humor. Po ~10 výměnách nabídni velké finále.`,
  },
  'co-bys-radsi': {
    id: 'co-bys-radsi', label: 'Co bys radši?', emoji: '🤔', hint: 'Bláznivé otázky!',
    prompt: `REŽIM CO BYS RADŠI: Pokládej zábavné dětské „co bys radši" otázky (dvě možnosti, občas bláznivé). Na odpověď reaguj zvědavě („A proč?"), řekni i svou volbu. Žádné strašidelné ani nechutné varianty. Jídlo jen lehce a nikdy jako nátlak.`,
  },
};

export interface Riddle {
  q: string;
  a: string;      // canonical answer (lowercase)
  hint: string;
}

/** Fallback riddle set — the pet may also use these verbatim. */
export const RIDDLES: Riddle[] = [
  { q: 'Ráno chodí po čtyřech, v poledne po dvou a večer po třech. Co je to?', a: 'člověk', hint: 'Ráno = když je maličký…' },
  { q: 'Čím víc z ní ubíráš, tím je větší. Co je to?', a: 'díra', hint: 'Najdeš ji třeba v ponožce 🧦' },
  { q: 'Má zuby, ale nekouše. Co je to?', a: 'hřeben', hint: 'Nosíš ho ve vlasech' },
  { q: 'Celý den běhá, a přesto je pořád v koutě. Co je to?', a: 'koště', hint: 'Pomáhá při úklidu' },
  { q: 'Když ho potřebuješ, zahodíš ho. Když ho nepotřebuješ, vezmeš ho zpátky. Co je to?', a: 'kotva', hint: 'Používají ho lodě ⚓' },
  { q: 'Co ti patří, ale ostatní to používají víc než ty?', a: 'jméno', hint: 'Slyšíš to, když tě někdo volá' },
  { q: 'V dešti ho otevřeš, za sucha ho zase složíš. Co je to?', a: 'deštník', hint: 'Pomůže ti nezmoknout ☔' },
  { q: 'Ráno tě probudí hlasitým zvukem, i když nemá pusu. Co je to?', a: 'budík', hint: 'Stojí u postele a hlídá čas' },
  { q: 'Ukáže ti tvůj obličej, ale samo nikdy nepromluví. Co je to?', a: 'zrcadlo', hint: 'Podíváš se do něj, než vyrazíš ven' },
  { q: 'Otvírá dveře, ale sám žádné nemá. Co je to?', a: 'klíč', hint: 'Nosíš ho na klíčence 🔑' },
  { q: 'Má sklo, ale není to zrcadlo — skrz něj vidíš ven. Co je to?', a: 'okno', hint: 'Otevřeš ho, když je v pokoji horko' },
  { q: 'Čím déle svítí, tím je menší. Co je to?', a: 'svíčka', hint: 'Hoří na dortu k narozeninám 🕯️' },
  { q: 'Umaže, cos napsal tužkou, ale sama nic nenapíše. Co je to?', a: 'guma', hint: 'Pomůže, když se ti nepovede písmenko' },
  { q: 'Má spoustu stránek a chodí s tebou každý den do školy. Co je to?', a: 'sešit', hint: 'Píšeš do něj domácí úkoly' },
  { q: 'Nosí na zádech všechny tvoje věci do školy. Co je to?', a: 'batoh', hint: 'Máš ho na ramenou' },
  { q: 'Paní učitelka na ni píše křídou nebo fixem. Co je to?', a: 'tabule', hint: 'Visí vepředu ve třídě' },
  { q: 'Nechává za sebou čáru, ale není to had. Co je to?', a: 'tužka', hint: 'Když se zlomí, musíš ji ořezat' },
  { q: 'Když se ozve, všichni vyběhnou ze třídy ven. Co je to?', a: 'zvonek', hint: 'Ohlašuje přestávku' },
  { q: 'Má sedm barev, ale žádnou z nich neudrží v ruce. Co je to?', a: 'duha', hint: 'Objeví se na obloze po dešti 🌈' },
  { q: 'Pluje po nebi, ale není to pták. Co je to?', a: 'mrak', hint: 'Někdy je bílý jako vata, jindy šedý' },
  { q: 'Padá z nebe, je bílý a studený, a pod nohama křupe. Co je to?', a: 'sníh', hint: 'Stavíš z něj sněhuláka ⛄' },
  { q: 'Má kořeny, kmen i větve, ale nikam neuteče. Co je to?', a: 'strom', hint: 'Ptáci si na něm stavějí hnízda' },
  { q: 'Pořád teče, a přesto nikdy nezmizí. Co je to?', a: 'řeka', hint: 'Plavou v ní ryby 🐟' },
  { q: 'Nikdo ho nevidí, ale poznáš, když si pohrává s vlasy. Co je to?', a: 'vítr', hint: 'Umí hýbat vlajkou i drakem' },
  { q: 'Má bodlinky jako kaktus, ale umí i běhat. Kdo je to?', a: 'ježek', hint: 'Když se bojí, schová se do klubíčka' },
  { q: 'Nejdřív je housenka, pak si zdřímne v kukle, a probudí se s křídly. Kdo je to?', a: 'motýl', hint: 'Poletuje nad květinami 🦋' },
  { q: 'Dělá med a umí i bodnout. Kdo je to?', a: 'včela', hint: 'Bzučí a má pruhy jako tygřík' },
  { q: 'Má nejdelší krk ze všech zvířat na světě. Kdo je to?', a: 'žirafa', hint: 'Dosáhne i na nejvyšší listy na stromě' },
  { q: 'Ve dne spí, v noci houká a potmě vidí jako ve dne. Kdo je to?', a: 'sova', hint: 'Bydlí v dutém stromě 🦉' },
  { q: 'Skáče, kváká a nejradši je u rybníka. Kdo je to?', a: 'žába', hint: 'Než dorostla, byl to jen pulec' },
];

export const WOULD_YOU_RATHER: string[] = [
  'Co bys radši: mluvit se zvířaty, nebo rozumět všem jazykům světa?',
  'Co bys radši: mít doma skluzavku místo schodů, nebo trampolínu místo postele?',
  'Co bys radši: umět čarovat jen v úterý, nebo létat jen metr nad zemí?',
  'Co bys radši: být neviditelná hodinu denně, nebo umět zastavit čas na minutu?',
  'Co bys radši: umět se teleportovat kamkoli na světě, nebo umět předvídat, co se stane zítra?',
  'Co bys radši: mít kouzelné boty, co tě donesou kamkoli za pár kroků, nebo kouzelný deštník, co tě umí odnést jako balón?',
  'Co bys radši: umět rozmlouvat s rostlinami, nebo rozumět tomu, co si myslí tvůj mazlíček?',
  'Co bys radši: mít sílu zvednout auto, nebo běhat rychle jako gepard?',
  'Co bys radši: umět se na hodinu proměnit v jakékoli zvíře, nebo na hodinu umět létat jako pták?',
  'Co bys radši: mít kouzelnou tužku, která nakreslí cokoli doopravdy, nebo kouzelnou knihu, do které můžeš vstoupit?',
  'Co bys radši: umět měnit počasí podle nálady, nebo rozsvítit celý pokoj jen tlesknutím?',
  'Co bys radši: mít doma dráčka, co místo ohně sype třpytky, nebo jednorožce, co umí mluvit?',
  'Co bys radši: být na jeden den kočka, co vládne celému domu, nebo pes, co jde na výlet s partou kamarádů?',
  'Co bys radši: mít mazlíčka, co plave jako delfín, nebo mazlíčka, co šplhá jako opička?',
  'Co bys radši: projet se na hřbetě obřího přátelského medvěda, nebo plout na hřbetě velryby po oceánu?',
  'Co bys radši: mít křídla jako motýl, nebo ocas jako mořská víla?',
  'Co bys radši: rozumět, o čem si povídají ptáci na zahradě, nebo o čem si povídají rybičky v akváriu?',
  'Co bys radši: bydlet v domě, kde se pokoje každý den samy přebarví podle nálady, nebo v domě s tajnou skluzavkou do zahrady?',
  'Co bys radši: mít pokoj, kde stěny svítí jako hvězdné nebe, nebo pokoj s malým vodopádem uvnitř?',
  'Co bys radši: bydlet v domečku na obláčku, nebo v domečku ukrytém v koruně obřího stromu?',
  'Co bys radši: mít výtah, co jezdí až do oblak, nebo schody, co se kdykoli promění ve skluzavku?',
  'Co bys radši: mít v pokoji dveře, co pokaždé vedou jinam, nebo skříň, ve které je celý zasněžený les?',
  'Co bys radši: bydlet na zámku s tajnou knihovnou, nebo v chaloupce s kouzelnou zahradou plnou svítících květin?',
  'Co bys radši: podívat se na Měsíc z vesmírné lodi, nebo prozkoumat dno oceánu v ponorce?',
  'Co bys radši: podívat se, jak žili lidé před sto lety, nebo jak bude svět vypadat za sto let?',
  'Co bys radši: projet Evropu vlakem s kamarádkami, nebo proletět kolem světa horkovzdušným balónem?',
  'Co bys radši: prozkoumat starý hrad plný tajných chodeb, nebo jeskyni plnou třpytivých krystalů?',
  'Co bys radši: mít doma nekonečnou zmrzlinovou fontánu, nebo bazén plný barevné limonády?',
  'Co bys radši: ochutnat zmrzlinu ve všech barvách duhy, nebo dort velký jako auto?',
  'Co bys radši: mít vlastní cukrárnu plnou kouzelných koláčků, nebo pekárnu, kde voní čerstvé rohlíky celý den?',
];

const MODE_KEY = 'bub_chat_game_mode';

export function getActiveMode(): ChatGameMode | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MODE_KEY);
  return raw && raw in CHAT_GAMES ? (raw as ChatGameMode) : null;
}

export function setActiveMode(mode: ChatGameMode | null): void {
  try {
    if (mode) localStorage.setItem(MODE_KEY, mode);
    else localStorage.removeItem(MODE_KEY);
  } catch { /* full */ }
}
