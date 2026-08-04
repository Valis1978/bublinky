// Daily pet polls ("anketky") — playful either/or questions the pet asks.
// Answers are stored as pet memories (bub_pet_memories via /api/pet/poll),
// which the AI soul already loads into every chat — so the pet genuinely
// gets to know Viki over time.

export interface PetPoll {
  id: string;
  question: string;   // spoken by the pet, czech, playful
  a: string;          // option A (short, with emoji)
  b: string;          // option B
  /** memory template — {answer} replaced by the picked option text */
  memory: string;
}

export const POLLS: PetPoll[] = [
  { id: 'p01', question: 'Kdybys mohla být jeden den kouzelná bytost, byla bys...', a: '🧜‍♀️ mořská víla', b: '🐉 dračice', memory: 'Viki by chtěla být {answer}' },
  { id: 'p02', question: 'Co je lepší na sobotní ráno?', a: '🥞 palačinky', b: '🍞 toasty', memory: 'Viki má na sobotní snídani raději {answer}' },
  { id: 'p03', question: 'Kdybychom jeli na výlet, radši...', a: '🏔️ hory', b: '🌊 moře', memory: 'Viki má radši {answer}' },
  { id: 'p04', question: 'Jaké počasí je nejlepší na hraní?', a: '☀️ sluníčko', b: '❄️ sníh', memory: 'Viki má radši {answer}' },
  { id: 'p05', question: 'Co bys radši uměla?', a: '🕶️ být neviditelná', b: '🕊️ létat', memory: 'Viki by chtěla umět {answer}' },
  { id: 'p06', question: 'Lepší večer je...', a: '🎬 film s dekou', b: '🎲 deskovky', memory: 'Viki má radši večer {answer}' },
  { id: 'p07', question: 'Kdyby sis mohla vybrat superdům...', a: '🏰 hrad', b: '🌳 dům na stromě', memory: 'Viki by chtěla bydlet v {answer}' },
  { id: 'p08', question: 'Co je hezčí barva?', a: '💜 fialová', b: '🩵 tyrkysová', memory: 'Viki se víc líbí {answer}' },
  { id: 'p09', question: 'Kdybys měla kouzelnou hůlku, co bys přičarovala jako první?', a: '🦄 jednorožce', b: '🏰 vlastní hrad', memory: 'Viki by si kouzelnou hůlkou nejdřív přičarovala {answer}' },
  { id: 'p10', question: 'Jaký kouzelný předmět by sis vybrala?', a: '🧥 neviditelný plášť', b: '🔮 kouzelnou křišťálovou kouli', memory: 'Viki by si vybrala {answer}' },
  { id: 'p11', question: 'Co bys jako kouzelnice chtěla umět?', a: '🌈 měnit počasí', b: '⏳ zastavit čas', memory: 'Viki by jako kouzelnice chtěla umět {answer}' },
  { id: 'p12', question: 'Jaké kouzelné zvíře by sis přála za kamaráda?', a: '🐉 malého dráčka', b: '🦅 mluvícího papouška', memory: 'Viki by chtěla za kamaráda {answer}' },
  { id: 'p13', question: 'Jaké zvířátko by sis vybrala domů?', a: '🐶 pejska', b: '🐱 kočičku', memory: 'Viki by si domů vybrala {answer}' },
  { id: 'p14', question: 'Které zvíře je podle tebe nejroztomilejší?', a: '🐰 králíček', b: '🐼 pandí medvídek', memory: 'Viki si myslí, že nejroztomilejší je {answer}' },
  { id: 'p15', question: 'Kam by ses radši podívala?', a: '🦁 na safari mezi lvy', b: '🐬 na moře za delfíny', memory: 'Viki by se radši podívala {answer}' },
  { id: 'p16', question: 'Jakým zvířetem by ses chtěla na den stát?', a: '🦋 motýlem', b: '🐦 ptáčkem', memory: 'Viki by se chtěla na den stát {answer}' },
  { id: 'p17', question: 'Které roční období máš nejradši?', a: '🌸 jaro', b: '☀️ léto', memory: 'Viki má nejradši {answer}' },
  { id: 'p18', question: 'Které období roku máš radši?', a: '🍂 podzim', b: '❄️ zima', memory: 'Viki má radši období, kdy je {answer}' },
  { id: 'p19', question: 'Na co se víc těšíš?', a: '🏖️ prázdniny u vody', b: '⛄ Vánoce se sněhem', memory: 'Viki se víc těší na {answer}' },
  { id: 'p20', question: 'Jaké ráno máš radši?', a: '🌤️ slunečné a teplé', b: '🌧️ deštivé pod dekou', memory: 'Viki má radši ráno {answer}' },
  { id: 'p21', question: 'Co děláš radši o víkendu?', a: '🚴 kolo venku', b: '🎨 malování doma', memory: 'Viki má o víkendu radši {answer}' },
  { id: 'p22', question: 'Jaká hra tě baví víc?', a: '🏃 honička venku', b: '🧩 puzzle nebo deskovka', memory: 'Viki víc baví {answer}' },
  { id: 'p23', question: 'Co by sis vybrala na odpoledne?', a: '📚 čtení na gauči', b: '🌳 dobrodružství v lese', memory: 'Viki by si na odpoledne vybrala {answer}' },
  { id: 'p24', question: 'Jaká svačina je lepší?', a: '🍓 jahody se šlehačkou', b: '🥐 čokoládový croissant', memory: 'Viki má na svačinu radši {answer}' },
  { id: 'p25', question: 'Jaká barva se ti líbí víc na oblečení?', a: '💗 růžová', b: '💛 žlutá', memory: 'Vikina oblíbená barva na oblečení je {answer}' },
  { id: 'p26', question: 'Která barva duhy je tvoje nejoblíbenější?', a: '💚 zelená', b: '❤️ červená', memory: 'Vikina nejoblíbenější barva duhy je {answer}' },
  { id: 'p27', question: 'Jakou barvu bys chtěla mít v pokoji?', a: '🩵 světle modrá', b: '💜 fialová', memory: 'Vikina vysněná barva pokoje je {answer}' },
  { id: 'p28', question: 'Co je větší zábava?', a: '🎤 zpívat nahlas', b: '💃 tancovat na písničku', memory: 'Viki má radši {answer}' },
  { id: 'p29', question: 'Jaká hudba se ti líbí víc?', a: '🎶 veselé popové písničky', b: '🎻 klidné melodie', memory: 'Viki má radši {answer}' },
  { id: 'p30', question: 'Co by sis vybrala na oslavu?', a: '🕺 tancovačku s kamarádkami', b: '🎧 poslouchání oblíbených písniček', memory: 'Viki by si na oslavu vybrala {answer}' },
  { id: 'p31', question: 'Který předmět tě víc baví?', a: '🎨 výtvarka', b: '🧮 matika', memory: 'Viki víc baví {answer}' },
  { id: 'p32', question: 'Co máš ve škole radši?', a: '📖 čtení příběhů', b: '🔬 pokusy a bádání', memory: 'Viki má ve škole radši {answer}' },
  { id: 'p33', question: 'Jaká přestávka je lepší?', a: '🌤️ venku na hřišti', b: '🎲 s hrami ve třídě', memory: 'Viki má radši přestávky {answer}' },
  { id: 'p34', question: 'Co je s kamarádkami nejlepší?', a: '🛝 hraní venku', b: '🎬 filmový večer', memory: 'Viki má s kamarádkami nejradši {answer}' },
  { id: 'p35', question: 'Jaké odpoledne s kamarádkou by sis vybrala?', a: '📿 tvoření náramků', b: '🏊 koupání', memory: 'Viki by si s kamarádkou vybrala {answer}' },
  { id: 'p36', question: 'Co je na spaní u kamarádky nejlepší?', a: '🍿 pyžamová párty s filmem', b: '🌟 povídání dlouho do noci', memory: 'Viki má na spaní u kamarádky nejradši {answer}' },
  { id: 'p37', question: 'Jaké počasí máš nejradši na procházku?', a: '☀️ slunečno', b: '🌦️ mírně zataženo', memory: 'Viki má na procházku nejradši, když je {answer}' },
  { id: 'p38', question: 'Jaká zmrzlina je lepší?', a: '🍦 vanilková', b: '🍫 čokoládová', memory: 'Vikina oblíbená zmrzlina je {answer}' },
  { id: 'p39', question: 'Který svátek máš nejradši?', a: '🎄 Vánoce', b: '🎂 svoje narozeniny', memory: 'Viki má nejradši {answer}' },
  { id: 'p40', question: 'Co je na Velikonocích lepší?', a: '🐰 hledání vajíček', b: '🎨 malování kraslic', memory: 'Viki má na Velikonocích radši {answer}' },
];

const ANSWERED_KEY = 'bub_polls_answered';

export function getAnsweredPollIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ANSWERED_KEY) || '[]'); } catch { return []; }
}

export function markPollAnswered(id: string): void {
  try {
    const ids = getAnsweredPollIds();
    if (!ids.includes(id)) localStorage.setItem(ANSWERED_KEY, JSON.stringify([...ids, id]));
  } catch { /* full */ }
}

/** Deterministic daily poll — skips ones already answered; null when exhausted. */
export function getTodaysPoll(date: Date = new Date()): PetPoll | null {
  const answered = getAnsweredPollIds();
  const remaining = POLLS.filter(p => !answered.includes(p.id));
  if (remaining.length === 0) return null;
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return remaining[day % remaining.length];
}
