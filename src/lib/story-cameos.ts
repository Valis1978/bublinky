// Book-character cameos for interactive stories.
//
// A beloved character can unexpectedly step into Viki's story, play along for
// a scene and radiate the joy of their own world — the reading nudge stays
// implicit (curiosity), the factual book card lives outside the fiction.
//
// RULES (content safety + copyright + research guardrails):
// - Characters speak ORIGINAL dialogue written for this app, in their voice.
//   NEVER quote or paraphrase passages from the actual books.
// - The pitch is shared enthusiasm about THEIR WORLD and adventures — the
//   character NEVER names their book title, never says "přečti si" and never
//   recommends buying/reading anything (kids can't spot native ads — we don't
//   make them). The app shows a factual book card OUTSIDE the fiction instead.
// - The cameo may ask "už jsi o mně četla?" out of curiosity and reacts warmly
//   to either answer (yes → excitement + detail question; no → "to máš teprve
//   před sebou, závidím ti první čtení!"). No rewards talk, ever.

export interface CameoDef {
  id: string;
  name: string;
  /** czech book title as commonly published */
  book: string;
  author: string;
  emoji: string;
  /** who they are + how they talk — feeds the story prompt (original voice) */
  voice: string;
  /** how they typically burst into a scene (prompt hint, not verbatim text) */
  entrance: string;
  /** what they might say about their book — enthusiasm source for the prompt */
  pitch: string;
}

export const CAMEOS: Record<string, CameoDef> = {
  harry: {
    id: 'harry', name: 'Harry Potter', book: 'Harry Potter a Kámen mudrců', author: 'J. K. Rowlingová', emoji: '⚡',
    voice: 'Skromný, statečný kluk s brýlemi a jizvou ve tvaru blesku. Mluví přátelsky, trochu anglicky zdvořile, o kouzlech mluví jako o normální věci. Bojí se o kamarády víc než o sebe.',
    entrance: 'přiletí trochu neohrabaně na koštěti / vypadne z krbu se zeleným plamenem',
    pitch: 'Chodím do školy, kde se místo matiky učí kouzla, létání a lektvary — a mám tam nejlepší kamarády, jaké si umíš představit.',
  },
  hermiona: {
    id: 'hermiona', name: 'Hermiona Grangerová', book: 'Harry Potter a Kámen mudrců', author: 'J. K. Rowlingová', emoji: '📚',
    voice: 'Nejchytřejší holka široko daleko, mluví rychle a přesně, všechno ví z knížek a je na to hrdá. Pod přísností má obrovské srdce a za kamarády by skočila do ohně.',
    entrance: 'objeví se s hromadou knih v náručí / přesně ví, kudy z problému, protože o něm četla',
    pitch: 'Knížky mi už mockrát zachránily život — vážně! Skoro každý zapeklitý problém má řešení schované v nějaké knihovně.',
  },
  greg: {
    id: 'greg', name: 'Greg Heffley', book: 'Deník malého poseroutky', author: 'Jeff Kinney', emoji: '📓',
    voice: 'Věčný smolař s deníkem, komentuje svět suše a vtipně, všechno se mu sesype na hlavu a on to stejně nevzdá. Trochu líný, hodně upřímný, srandovní i když nechce.',
    entrance: 'zakopne a přistane přímo uprostřed scény / schovává se tu před bráchou Rodrickem',
    pitch: 'Já si všechny svoje průšvihy kreslím a zapisuju do deníku — a věř mi, je jich TOLIK, že bys se u toho válela smíchy.',
  },
  pipi: {
    id: 'pipi', name: 'Pipi Dlouhá punčocha', book: 'Pipi Dlouhá punčocha', author: 'Astrid Lindgrenová', emoji: '🥕',
    voice: 'Nejsilnější holka na světě s rezavými copy, bydlí sama s koněm a opičkou a dělá si všechno po svém. Mluví divoce, vymýšlí nesmysly, ničeho se nebojí a dospělé přechytračí.',
    entrance: 'přijde po rukou / přinese koně rovnou pod paží',
    pitch: 'Já zvednu koně jednou rukou, našla jsem poklad a do školy chodím, jen když sama chci. Nikdo mi neporoučí!',
  },
  matylda: {
    id: 'matylda', name: 'Matylda', book: 'Matylda', author: 'Roald Dahl', emoji: '🔮',
    voice: 'Geniální tichá holčička, která přečetla celou knihovnu, a když se hodně soustředí, pohne věcmi jen očima. Mluví klidně, chytře a laskavě, nespravedlnost ji umí pořádně rozzlobit.',
    entrance: 'sedí v koutku s knížkou, jako by tam byla odjakživa / posune překážku pouhým pohledem',
    pitch: 'Já jsem se všechno naučila z knížek — a nakonec mi daly i moje kouzlo. Čtení je ta nejsilnější superschopnost, co znám.',
  },
  malyprinc: {
    id: 'malyprinc', name: 'Malý princ', book: 'Malý princ', author: 'Antoine de Saint-Exupéry', emoji: '🌹',
    voice: 'Zvídavý chlapec z malinké planety, ptá se jednoduché otázky, které jsou najednou hluboké. Mluví jemně a vážně, má rád svou růži a západy slunce.',
    entrance: 'snese se odněkud shora a zdvořile pozdraví / zeptá se na něco nečekaného',
    pitch: 'Procestoval jsem spoustu planet a poznal moc zvláštních dospělých. Víš, správně vidíme jen srdcem.',
  },
  fifinka: {
    id: 'fifinka', name: 'Fifinka', book: 'Čtyřlístek', author: 'Jaroslav Němeček', emoji: '🍀',
    voice: 'Šikovná a praktická fenka ze čtyřky kamarádů z Třeskoprsk. Mluví mile a rázně, večeři uvaří i uprostřed dobrodružství a kluky (Myšpulína, Pindu a Bobíka) drží pohromadě.',
    entrance: 'přiběhne s košíkem — zrovna sháněla suroviny na koláč / hledá, kam se jí zatoulali kluci',
    pitch: 'S klukama zažíváme jedno bláznivé dobrodružství za druhým — vynálezy, cesty, strašidla… u nás v Třeskoprskách není nikdy nuda!',
  },
  hihlik: {
    id: 'hihlik', name: 'Hihlík', book: 'Lichožrouti', author: 'Pavel Šrut', emoji: '🧦',
    voice: 'Malý lichožrout — tvoreček, co žere ponožky, ale jen jednu z páru! Je zvědavý, dobrosrdečný a trochu nešika. Mluví hravě, občas mu zakručí v břiše po fusekli.',
    entrance: 'vyleze z ponožky, co se někde válí / přičmuchá si to k nejbližší botě',
    pitch: 'Víš, kam mizí všechny liché ponožky? To my! Teda hlavně já. Existuje celý tajný svět lichožroutů — a je hned vedle toho tvého.',
  },
  mikes: {
    id: 'mikes', name: 'Mikeš', book: 'Mikeš', author: 'Josef Lada', emoji: '🐈',
    voice: 'Kocour z Hrusic, který umí mluvit, chodí v botičkách a je nejslušnější kocour v Čechách. Mluví starosvětsky mile, říká „lidičky" a všem vyká, dokud se neskamarádí.',
    entrance: 'přijde po dvou v botičkách a smekne čepičku / pozdraví „Dobrý den, lidičky!"',
    pitch: 'Já jsem obyčejný kocour z Hrusic, ale zažil jsem toho — utekl jsem do světa, dělal jsem u cirkusu… to bylo panečku dobrodružství!',
  },
  ferda: {
    id: 'ferda', name: 'Ferda Mravenec', book: 'Ferda Mravenec', author: 'Ondřej Sekora', emoji: '🐜',
    voice: 'Mravenec s puntíkovaným šátkem, práce všeho druhu. Věčný optimista a vynálezce, mluví svižně, hned se pouští do díla a každému rád pomůže.',
    entrance: 'připochoduje s nářadím — zrovna něco opravoval / sjede po stéblu trávy jako po skluzavce',
    pitch: 'Já umím postavit, spravit a vymyslet úplně všechno — na naší louce je celý svět broučích kamarádů. A taky protivný Pytlík, ten mi dává zabrat!',
  },
  ronja: {
    id: 'ronja', name: 'Ronja', book: 'Ronja, dcera loupežníka', author: 'Astrid Lindgrenová', emoji: '🌲',
    voice: 'Divoká a odvážná holka z lesa, dcera loupežnického náčelníka. Mluví přímo a beze strachu, les zná jako své boty a víc než pokladů si cení svobody a kamarádství.',
    entrance: 'seskočí z větve / přeskočí rokli, jako by to nic nebylo',
    pitch: 'Vyrostla jsem na hradě uprostřed hlubokého lesa plného divoženek a skřítků. Les je můj domov a ničeho se v něm nebojím.',
  },
  karlik: {
    id: 'karlik', name: 'Karlík Bucket', book: 'Karlík a továrna na čokoládu', author: 'Roald Dahl', emoji: '🍫',
    voice: 'Hodný a skromný kluk z chudé rodiny, který vyhrál zlatou vstupenku do nejkouzelnější továrny na světě. Mluví nadšeně a vděčně, o čokoládě dokáže básnit.',
    entrance: 'vběhne dovnitř a mává zlatou vstupenkou / voní kolem něj čokoláda',
    pitch: 'Byl jsem v továrně, kde teče čokoládová řeka a bonbóny rostou na stromech. A víš, co je nejlepší? Že to celé začalo obyčejnou tabulkou čokolády.',
  },
  kvak: {
    id: 'kvak', name: 'Kvak', book: 'Kvak a Žbluňk jsou kamarádi', author: 'Arnold Lobel', emoji: '🐸',
    voice: 'Rozvážný zelený žabák, nejlepší kamarád Žbluňka. Mluví pomalu, laskavě a trpělivě, má rád čaj, dopisy a klidná odpoledne. O kamarádství ví úplně všechno.',
    entrance: 'sedí na listu leknínu, jako by tu čekal / nese dopis pro kamaráda',
    pitch: 'My se Žbluňkem zažíváme malá tichá dobrodružství — a právě ta jsou někdy ta největší. Jako teplý čaj s nejlepším kamarádem.',
  },
};

export const CAMEO_LIST: CameoDef[] = Object.values(CAMEOS);

/** Roll a cameo for a new story: ~30 % chance, prefer characters not seen recently. */
export function rollCameo(recentCameoIds: string[]): CameoDef | null {
  if (Math.random() > 0.3) return null;
  const fresh = CAMEO_LIST.filter(c => !recentCameoIds.includes(c.id));
  const pool = fresh.length > 0 ? fresh : CAMEO_LIST;
  return pool[Math.floor(Math.random() * pool.length)];
}
