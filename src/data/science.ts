/**
 * Czech science data for 4th grade (Přírodověda)
 * Interactive quizzes about nature, animals, plants
 */

export interface ScienceQuestion {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

// Zvířata
export const ZVIRATA_QUIZ: ScienceQuestion[] = [
  { question: 'Který savec umí létat?', options: ['Veverka', 'Netopýr', 'Ježek', 'Kuna'], correct: 1, category: 'zvirata' },
  { question: 'Kolik nohou má pavouk?', options: ['6', '8', '10', '4'], correct: 1, category: 'zvirata' },
  { question: 'Které zvíře přezimuje v hibernaci?', options: ['Liška', 'Jelen', 'Ježek', 'Vrana'], correct: 2, category: 'zvirata' },
  { question: 'Housenka se mění v...', options: ['mouchu', 'včelu', 'motýla', 'brouka'], correct: 2, category: 'zvirata' },
  { question: 'Který pták je symbolem ČR?', options: ['Orel', 'Sokol', 'Ledňáček', 'Čáp'], correct: 0, category: 'zvirata' },
  { question: 'Delfín je...', options: ['ryba', 'savec', 'obojživelník', 'plaz'], correct: 1, category: 'zvirata' },
  { question: 'Kolik nohou má hmyz?', options: ['4', '8', '6', '10'], correct: 2, category: 'zvirata' },
  { question: 'Který z těchto živočichů je obojživelník?', options: ['Had', 'Žába', 'Ještěrka', 'Želva'], correct: 1, category: 'zvirata' },
  { question: 'Krtko se živí hlavně...', options: ['semeny', 'trávou', 'žížalami a hmyzem', 'ovocem'], correct: 2, category: 'zvirata' },
  { question: 'Které zvíře má nejdelší krk?', options: ['Slon', 'Žirafa', 'Velbloud', 'Pštros'], correct: 1, category: 'zvirata' },
  { question: 'Včely žijí v...', options: ['norách', 'hnízdech', 'úlech', 'děrách stromů'], correct: 2, category: 'zvirata' },
  { question: 'Ledňáček loví...', options: ['hmyz', 'ryby', 'myši', 'žáby'], correct: 1, category: 'zvirata' },
];

// Rostliny
export const ROSTLINY_QUIZ: ScienceQuestion[] = [
  { question: 'Rostliny dýchají pomocí...', options: ['kořenů', 'listů', 'květů', 'stonku'], correct: 1, category: 'rostliny' },
  { question: 'Co potřebuje rostlina k fotosyntéze?', options: ['vítr a déšť', 'světlo a vodu', 'tmu a teplo', 'písek a hlínu'], correct: 1, category: 'rostliny' },
  { question: 'Muchomůrka červená je...', options: ['jedlá', 'jedovatá', 'léčivá', 'neexistuje'], correct: 1, category: 'rostliny' },
  { question: 'Který strom shazuje listy na zimu?', options: ['Smrk', 'Borovice', 'Dub', 'Jedle'], correct: 2, category: 'rostliny' },
  { question: 'Jehličnatý strom je...', options: ['Buk', 'Javor', 'Smrk', 'Lípa'], correct: 2, category: 'rostliny' },
  { question: 'Jahoda roste na...', options: ['stromě', 'keři', 'při zemi', 'v zemi'], correct: 2, category: 'rostliny' },
  { question: 'Koření se sklízí z...', options: ['listů, semen, kořenů', 'pouze listů', 'pouze semen', 'pouze květů'], correct: 0, category: 'rostliny' },
  { question: 'Dub má plody zvané...', options: ['kaštany', 'žaludy', 'bukvice', 'šišky'], correct: 1, category: 'rostliny' },
  { question: 'Která rostlina je masožravá?', options: ['Kopřiva', 'Pampeliška', 'Rosnatka', 'Sedmikráska'], correct: 2, category: 'rostliny' },
  { question: 'Cibule je vlastně...', options: ['kořen', 'stonek', 'list', 'cibulka (zásobní orgán)'], correct: 3, category: 'rostliny' },
];

// Lidské tělo
export const TELO_QUIZ: ScienceQuestion[] = [
  { question: 'Kolik kostí má dospělý člověk?', options: ['106', '156', '206', '256'], correct: 2, category: 'telo' },
  { question: 'Největší orgán lidského těla je...', options: ['srdce', 'mozek', 'kůže', 'játra'], correct: 2, category: 'telo' },
  { question: 'Srdce pumpuje...', options: ['vzduch', 'krev', 'vodu', 'kyslík'], correct: 1, category: 'telo' },
  { question: 'Kolik zubů má dospělý člověk?', options: ['20', '28', '32', '36'], correct: 2, category: 'telo' },
  { question: 'Plíce slouží k...', options: ['trávení', 'dýchání', 'pohybu', 'myšlení'], correct: 1, category: 'telo' },
  { question: 'Kolik smyslů má člověk?', options: ['3', '4', '5', '6'], correct: 2, category: 'telo' },
  { question: 'Žaludek slouží k...', options: ['dýchání', 'trávení jídla', 'pohybu', 'čištění krve'], correct: 1, category: 'telo' },
  { question: 'Mozek je uložen v...', options: ['hrudníku', 'břiše', 'lebce', 'páteři'], correct: 2, category: 'telo' },
  { question: 'Červené krvinky přenáší...', options: ['živiny', 'kyslík', 'hormony', 'vodu'], correct: 1, category: 'telo' },
  { question: 'Kolik litrů krve má člověk přibližně?', options: ['2 litry', '5 litrů', '10 litrů', '15 litrů'], correct: 1, category: 'telo' },
];

// Ekosystémy a počasí
export const EKOSYSTEM_QUIZ: ScienceQuestion[] = [
  { question: 'Voda se odpařuje a tvoří...', options: ['déšť', 'mraky', 'sníh', 'led'], correct: 1, category: 'ekosystem' },
  { question: 'Koloběh vody zahrnuje...', options: ['odpařování, srážky, odtok', 'jen déšť a sníh', 'jen odpařování', 'jen moře'], correct: 0, category: 'ekosystem' },
  { question: 'Skleníkový efekt způsobuje...', options: ['ochlazování', 'oteplování', 'vítr', 'bouřky'], correct: 1, category: 'ekosystem' },
  { question: 'V lese žijí producenti. To jsou...', options: ['zvířata', 'houby', 'rostliny', 'bakterie'], correct: 2, category: 'ekosystem' },
  { question: 'Recyklace pomáhá...', options: ['znečišťovat', 'chránit přírodu', 'ničit lesy', 'plýtvat vodou'], correct: 1, category: 'ekosystem' },
  { question: 'Který plyn potřebují rostliny?', options: ['kyslík', 'dusík', 'oxid uhličitý', 'helium'], correct: 2, category: 'ekosystem' },
  { question: 'Fotosyntéza produkuje...', options: ['oxid uhličitý', 'kyslík', 'dusík', 'vodík'], correct: 1, category: 'ekosystem' },
  { question: 'Potravní řetězec začíná...', options: ['predátorem', 'rostlinou', 'houbou', 'člověkem'], correct: 1, category: 'ekosystem' },
  { question: 'Největší deštné pralesy jsou v...', options: ['Africe', 'Asii', 'Jižní Americe', 'Austrálii'], correct: 2, category: 'ekosystem' },
  { question: 'Ozonová vrstva nás chrání před...', options: ['deštěm', 'UV zářením', 'větrem', 'chladem'], correct: 1, category: 'ekosystem' },
];

export const ALL_SCIENCE_CATEGORIES = [
  { id: 'zvirata', name: 'Zvířata', emoji: '🦊', questions: ZVIRATA_QUIZ, color: '#FB923C' },
  { id: 'rostliny', name: 'Rostliny', emoji: '🌿', questions: ROSTLINY_QUIZ, color: '#34D399' },
  { id: 'telo', name: 'Lidské tělo', emoji: '🫀', questions: TELO_QUIZ, color: '#F472B6' },
  { id: 'ekosystem', name: 'Příroda a ekologie', emoji: '🌍', questions: EKOSYSTEM_QUIZ, color: '#60A5FA' },
];
