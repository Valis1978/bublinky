// Daily content — a fresh reason to open the app every day.
// Deterministic pick per calendar day so the whole day shows the same entry.
//
// Tone rules (BRAND.md): friendly, never bossy; food is a sensitive topic —
// challenges may INVITE, never push. English entries follow the "explain right
// away" pattern from the pet chat.

export type DailyKind = 'joke' | 'fact' | 'challenge' | 'english';

export interface DailyEntry {
  id: string;
  kind: DailyKind;
  /** main text, spoken by the pet */
  text: string;
  /** english entries: the word/phrase being taught */
  english?: { word: string; meaning: string };
}

export const DAILY_ENTRIES: DailyEntry[] = [
  { id: 'f01', kind: 'fact', text: 'Kočky spí až 16 hodin denně. To je víc než půl dne! 😴' },
  { id: 'c01', kind: 'challenge', text: 'Dnešní mise: nauč mě jedno nové slovo, které jsi dnes slyšela ve škole! 📚' },
  { id: 'e01', kind: 'english', text: 'Dneska jsem se naučil slovíčko: rainbow! To znamená duha. Umíš ho vyslovit? 🌈', english: { word: 'rainbow', meaning: 'duha' } },
  { id: 'f02', kind: 'fact', text: 'Psi poznají, jak se cítíš, podle vůně. Fakt! Mají nos jako superhrdina. 🐶' },
  { id: 'c02', kind: 'challenge', text: 'Dnešní mise: zkus nakreslit, jak vypadám, když mám radost! Ukaž mi to! 🎨' },
  { id: 'f03', kind: 'fact', text: 'Lišky umí slyšet myš pod sněhem až na 40 metrů. Mají uši jako radar! 🦊' },
  { id: 'e02', kind: 'english', text: 'Slovíčko dne: brave — odvážná. You are brave! Ty jsi odvážná! 💪', english: { word: 'brave', meaning: 'odvážný/á' } },
  { id: 'c03', kind: 'challenge', text: 'Dnešní mise: vymysli mi přezdívku, kterou mi budeš říkat, jen když uděláme streak! 🔥' },
  { id: 'f04', kind: 'fact', text: 'Králíci dělají radostné výskoky, kterým se říká binky. Když hopsnu, mám binky den! 🐰' },

  // --- extended pool (v2.0 — Domeček) ---

  // Jokes — zvířata, bubliny, škola

  // Facts — zvířata, vesmír, tělo, příroda (ověřitelné, čísla jen skutečná)
  { id: 'f05', kind: 'fact', text: 'Chobotnice mají tři srdce! Dvě jim pumpují krev do žaber a jedno do zbytku těla. 🐙' },
  { id: 'f06', kind: 'fact', text: 'Mořské vydry se za spaní chytají za pracičky, aby je proud neodnesl jinam. 🦦' },
  { id: 'f07', kind: 'fact', text: 'Motýli ochutnávají jídlo nožičkami, ne pusinkou! 🦋' },
  { id: 'f08', kind: 'fact', text: 'Žraloci plavou v oceánech déle, než na Zemi rostou stromy – existují už přes 400 milionů let! 🦈' },
  { id: 'f09', kind: 'fact', text: 'Sloni jsou jediní savci, kteří neumí skákat. Mají na to moc rovné nohy. 🐘' },
  { id: 'f10', kind: 'fact', text: 'Vombat má hranaté bobečky! Díky hranatému tvaru se mu nekutálejí z kopečka, když si značí svoje území. 😄' },
  { id: 'f11', kind: 'fact', text: 'Ve vesmíru je úplné ticho – není tam vzduch, který by přenášel zvuk. 🌌' },
  { id: 'f12', kind: 'fact', text: 'Den na Venuši trvá déle než celý její rok! Otočí se kolem své osy pomaleji, než oběhne Slunce. 🪐' },
  { id: 'f13', kind: 'fact', text: 'Saturn je tak lehký, že by plaval na vodě – kdyby ovšem existovala vana dost velká! 🪐' },
  { id: 'f14', kind: 'fact', text: 'Stopy astronautů na Měsíci tam zůstanou miliony let – bez větru se totiž nemají jak setřít. 👣🌙' },
  { id: 'f15', kind: 'fact', text: 'Blesk na obloze je horčí než povrch Slunce! ⚡' },
  { id: 'f16', kind: 'fact', text: 'Sluneční paprsek letí k Zemi asi 8 minut. Ten, co tě teď hřeje na kůži, vyrazil dřív, než jsi začala číst tuhle větu! ☀️' },
  { id: 'f17', kind: 'fact', text: 'Srdce ti za jeden den tikne asi 100 000krát! 💓' },
  { id: 'f18', kind: 'fact', text: 'Otisk tvého jazyka je jedinečný, stejně jako otisk prstu. Nikdo na světě nemá úplně stejný! 👅' },
  { id: 'f19', kind: 'fact', text: 'Miminka se rodí s asi 300 kůstkami, dospělý jich má jen 206 – některé se totiž postupně srostou. 🦴' },
  { id: 'f20', kind: 'fact', text: 'Med se nikdy nezkazí! Archeologové našli v egyptských hrobkách med starý 3000 let – a pořád se dal jíst. 🍯' },
  { id: 'f21', kind: 'fact', text: 'Duha je vlastně celý kruh! Ze země vidíme jen její horní část, ale z letadla je vidět celá. 🌈' },
  { id: 'f22', kind: 'fact', text: 'Banán je botanicky bobule, ale jahoda ne! Příroda má někdy divný smysl pro humor. 🍌' },

  // Challenges — malé mise s mazlíčkem; jídlo jen jako pozvání, nikdy nátlak
  { id: 'c04', kind: 'challenge', text: 'Dnešní mise: vymysli mi novou barvu srsti a dej jí smyšlené jméno! Jak by se jmenovala? 🎨' },
  { id: 'c05', kind: 'challenge', text: 'Dnešní mise: udělejme spolu 10 dřepů, jako bychom přeskakovali kaluže! Kdo jich zvládne víc? 🐸' },
  { id: 'c06', kind: 'challenge', text: 'Dnešní mise: řekni mi, jaký je tvůj nejoblíbenější zvuk na světě. Já mám moc rád/a bublání vody! 🔊' },
  { id: 'c07', kind: 'challenge', text: 'Dnešní mise: postav z polštářů nejvyšší věž, jakou dokážeš! Ukážeš mi ji potom? 🏰' },
  { id: 'c08', kind: 'challenge', text: 'Dnešní mise: zatancuj si na svoji oblíbenou písničku, jako bys byla úplně bez kostí! 💃' },
  { id: 'c09', kind: 'challenge', text: 'Dnešní mise: pověz mi o něčem, co tě dneska rozesmálo. Rád/a se směju spolu s tebou! 😄' },
  { id: 'c10', kind: 'challenge', text: 'Dnešní mise: vymysli nám tajné gesto na pozdrav, které bude jenom naše! 🤝' },
  { id: 'c11', kind: 'challenge', text: 'Dnešní mise: zkus udělat 5 kliků na kolenou, jako pravá bublinková hrdinka! 💪' },
  { id: 'c12', kind: 'challenge', text: 'Dnešní mise: jestli chceš, můžeš mi vyprávět, co ti dnes chutnalo. Rád/a si to poslechnu! 🍓' },
  { id: 'c13', kind: 'challenge', text: 'Dnešní mise: nakresli mi mapu k pokladu, který někde doma schováš! 🗺️' },
  { id: 'c14', kind: 'challenge', text: 'Dnešní mise: zkus stát na jedné noze a počítej, jak dlouho to vydržíš! 🦩' },
  { id: 'c15', kind: 'challenge', text: 'Dnešní mise: řekni mi tři věci, za které jsi dneska vděčná. Jsem vděčný/á za tebe! 🌟' },

  // Feelings & friendships — gentle skills for an almost-11-year-old (never preachy)
  { id: 'c16', kind: 'challenge', text: 'Dnešní mise: vzpomeň si na jednu věc, co tě dnes potěšila, a jednu, co tě štvala. Obojí je úplně fér cítit — schválně, povíš mi je? 💜' },
  { id: 'c17', kind: 'challenge', text: 'Dnešní mise: až se příště s někým nepohodneš, zkus místo mlčení říct „tohle mi vadilo". Já to zkusím taky — je to těžší, než to zní! 💪' },
  { id: 'c18', kind: 'challenge', text: 'Dnešní mise: napiš nebo řekni jedné kamarádce, co se ti na ní líbí. Uvidíš, co to udělá. ✨' },
  { id: 'f23', kind: 'fact', text: 'Vědci zjistili, že kamarádství nejvíc rostou ze společných zážitků — i z úplně obyčejných, jako je cesta ze školy. 🚶‍♀️' },
  { id: 'f24', kind: 'fact', text: 'Když pocit pojmenuješ nahlas („jsem naštvaná", „je mi smutno"), mozek se doopravdy trochu uklidní. Funguje to i šeptem. 🧠' },
  { id: 'f25', kind: 'fact', text: 'Hádka kamarádství nemusí zbořit — páry kamarádek, které se umí usmířit, bývají nakonec nejpevnější. 🤝' },
  { id: 'c19', kind: 'challenge', text: 'Dnešní mise: zkus si dnes všimnout, co asi cítí někdo jiný — třeba spolužačka, co je potichu. Nemusíš nic dělat, jen si všimnout. 👀' },

  // English words — barvy, zvířata, pocity, počasí, jednoduché fráze
  { id: 'e03', kind: 'english', text: 'Modrá anglicky se řekne blue! To znamená modrá – stejná barva jako obloha. 🎈', english: { word: 'blue', meaning: 'modrá' } },
  { id: 'e04', kind: 'english', text: 'Zelená anglicky se řekne green! To znamená zelená – stejná barva jako tráva. 🎈', english: { word: 'green', meaning: 'zelená' } },
  { id: 'e05', kind: 'english', text: 'Žlutá anglicky se řekne yellow! To znamená žlutá – stejná barva jako sluníčko. 🎈', english: { word: 'yellow', meaning: 'žlutá' } },
  { id: 'e06', kind: 'english', text: 'Pták anglicky se řekne bird! To znamená pták. Slyšíš, jak si dneska zpívají? 🎈', english: { word: 'bird', meaning: 'pták' } },
  { id: 'e07', kind: 'english', text: 'Rybka anglicky se řekne fish! To znamená rybka. Umíš to vyslovit – fiš? 🎈', english: { word: 'fish', meaning: 'rybka' } },
  { id: 'e08', kind: 'english', text: 'Motýl anglicky se řekne butterfly! To znamená motýl. 🎈', english: { word: 'butterfly', meaning: 'motýl' } },
  { id: 'e09', kind: 'english', text: 'Šťastná anglicky se řekne happy! To znamená šťastná. 🎈', english: { word: 'happy', meaning: 'šťastná' } },
  { id: 'e10', kind: 'english', text: 'Unavená anglicky se řekne tired! To znamená unavená. Někdy je fajn si odpočinout. 🎈', english: { word: 'tired', meaning: 'unavená' } },
  { id: 'e11', kind: 'english', text: 'Nadšená anglicky se řekne excited! To znamená nadšená. Na co se dneska nejvíc těšíš? 🎈', english: { word: 'excited', meaning: 'nadšená' } },
  { id: 'e12', kind: 'english', text: 'Slunečno anglicky se řekne sunny! To znamená slunečno. 🎈', english: { word: 'sunny', meaning: 'slunečno' } },
  { id: 'e13', kind: 'english', text: 'Deštivo anglicky se řekne rainy! To znamená deštivo. Slyšíš, jak kapky ťukají na okno? 🎈', english: { word: 'rainy', meaning: 'deštivo' } },
  { id: 'e14', kind: 'english', text: 'Sníh anglicky se řekne snow! To znamená sníh. ❄️🎈', english: { word: 'snow', meaning: 'sníh' } },
  { id: 'e15', kind: 'english', text: 'Děkuji anglicky se řekne thank you! To znamená děkuji. Thank you, že si se mnou povídáš! 🎈', english: { word: 'thank you', meaning: 'děkuji' } },
];

/** day-of-year based deterministic pick — same entry all day, changes at midnight */
export function getDailyEntry(date: Date = new Date()): DailyEntry {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_ENTRIES[(day * 7 + date.getFullYear()) % DAILY_ENTRIES.length];
}

export const DAILY_KIND_LABEL: Record<DailyKind, string> = {
  joke: 'Vtípek dne',
  fact: 'Zajímavost dne',
  challenge: 'Dnešní mise',
  english: 'Slovíčko dne',
};
