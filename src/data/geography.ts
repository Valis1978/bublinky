/**
 * Czech geography data for 4th grade (Vlastivěda)
 * Interactive quizzes about Czech Republic
 */

export interface GeoQuestion {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

// Kraje ČR
export const KRAJE_QUIZ: GeoQuestion[] = [
  { question: 'Hlavní město České republiky je...', options: ['Brno', 'Praha', 'Ostrava', 'Plzeň'], correct: 1, category: 'kraje' },
  { question: 'Kolik krajů má Česká republika?', options: ['10', '12', '14', '16'], correct: 2, category: 'kraje' },
  { question: 'Krajské město Moravskoslezského kraje je...', options: ['Brno', 'Olomouc', 'Ostrava', 'Opava'], correct: 2, category: 'kraje' },
  { question: 'Plzeňský kraj leží na...', options: ['východě', 'jihu', 'západě', 'severu'], correct: 2, category: 'kraje' },
  { question: 'Které město je krajské město Jihomoravského kraje?', options: ['Znojmo', 'Brno', 'Hodonín', 'Vyškov'], correct: 1, category: 'kraje' },
  { question: 'Liberecký kraj sousedí s...', options: ['Rakouskem', 'Slovenskem', 'Polskem', 'Bavorskem'], correct: 2, category: 'kraje' },
  { question: 'Kraj Vysočina má krajské město...', options: ['Jihlava', 'Třebíč', 'Havlíčkův Brod', 'Žďár nad Sázavou'], correct: 0, category: 'kraje' },
  { question: 'Který kraj je nejmenší?', options: ['Karlovarský', 'Liberecký', 'Praha', 'Zlínský'], correct: 2, category: 'kraje' },
  { question: 'Olomoucký kraj leží na...', options: ['Čechách', 'Moravě', 'Slezsku', 'Slovensku'], correct: 1, category: 'kraje' },
  { question: 'Krajské město Ústeckého kraje je...', options: ['Most', 'Teplice', 'Ústí nad Labem', 'Děčín'], correct: 2, category: 'kraje' },
];

// Řeky ČR
export const REKY_QUIZ: GeoQuestion[] = [
  { question: 'Nejdelší řeka v ČR je...', options: ['Labe', 'Vltava', 'Morava', 'Odra'], correct: 1, category: 'reky' },
  { question: 'Vltava se vlévá do...', options: ['Moravy', 'Dunaje', 'Labe', 'Odry'], correct: 2, category: 'reky' },
  { question: 'Kterým městem protéká Labe?', options: ['Brno', 'Plzeň', 'Hradec Králové', 'Jihlava'], correct: 2, category: 'reky' },
  { question: 'Řeka Morava teče do...', options: ['Labe', 'Vltavy', 'Dunaje', 'Odry'], correct: 2, category: 'reky' },
  { question: 'Praha leží na řece...', options: ['Labe', 'Vltava', 'Berounka', 'Sázava'], correct: 1, category: 'reky' },
  { question: 'Odra teče do moře...', options: ['Severního', 'Středozemního', 'Baltského', 'Černého'], correct: 2, category: 'reky' },
  { question: 'Řeka Dyje protéká krajem...', options: ['Plzeňským', 'Jihomoravským', 'Olomouckým', 'Zlínským'], correct: 1, category: 'reky' },
  { question: 'Berounka se vlévá do...', options: ['Labe', 'Moravy', 'Vltavy', 'Sázavy'], correct: 2, category: 'reky' },
  { question: 'Které moře patří k úmoří Labe?', options: ['Baltské', 'Černé', 'Severní', 'Středozemní'], correct: 2, category: 'reky' },
  { question: 'Brno leží na řece...', options: ['Morava', 'Svratka', 'Dyje', 'Svitava'], correct: 1, category: 'reky' },
];

// Pohoří a příroda
export const POHORI_QUIZ: GeoQuestion[] = [
  { question: 'Nejvyšší hora ČR je...', options: ['Praděd', 'Sněžka', 'Lysá hora', 'Ještěd'], correct: 1, category: 'pohori' },
  { question: 'Sněžka leží v pohoří...', options: ['Beskydy', 'Šumava', 'Krkonoše', 'Jeseníky'], correct: 2, category: 'pohori' },
  { question: 'Kolik metrů měří Sněžka?', options: ['1 402 m', '1 602 m', '1 012 m', '1 235 m'], correct: 1, category: 'pohori' },
  { question: 'Šumava leží na hranici s...', options: ['Polskem', 'Slovenskem', 'Německem a Rakouskem', 'Maďarskem'], correct: 2, category: 'pohori' },
  { question: 'Praděd je nejvyšší hora...', options: ['Krkonoš', 'Beskyd', 'Jeseníků', 'Šumavy'], correct: 2, category: 'pohori' },
  { question: 'Lysá hora leží v...', options: ['Krkonoších', 'Beskydech', 'Jeseníkách', 'Brdech'], correct: 1, category: 'pohori' },
  { question: 'České Švýcarsko je známé...', options: ['jeskyněmi', 'skalními městy', 'jezery', 'vodopády'], correct: 1, category: 'pohori' },
  { question: 'Moravský kras je známý díky...', options: ['horám', 'řekám', 'jeskyním', 'lesům'], correct: 2, category: 'pohori' },
  { question: 'Největší české jezero je...', options: ['Máchovo', 'Lipno', 'Černé jezero', 'Rozkoš'], correct: 2, category: 'pohori' },
  { question: 'Který národní park je nejstarší v ČR?', options: ['Šumava', 'Krkonoše', 'Podyjí', 'České Švýcarsko'], correct: 1, category: 'pohori' },
];

// Vlajky a státy Evropy
export const VLAJKY_QUIZ: GeoQuestion[] = [
  { question: 'Barvy české vlajky jsou...', options: ['červená, modrá, žlutá', 'bílá, červená, modrá', 'bílá, zelená, červená', 'modrá, žlutá, červená'], correct: 1, category: 'vlajky' },
  { question: 'Hlavní město Slovenska je...', options: ['Košice', 'Bratislava', 'Žilina', 'Banská Bystrica'], correct: 1, category: 'vlajky' },
  { question: 'Vlajka Polska je...', options: ['bílá a červená', 'modrá a žlutá', 'zelená a bílá', 'červená a žlutá'], correct: 0, category: 'vlajky' },
  { question: 'Hlavní město Německa je...', options: ['Mnichov', 'Hamburk', 'Berlín', 'Frankfurt'], correct: 2, category: 'vlajky' },
  { question: 'Rakousko má hlavní město...', options: ['Salzburg', 'Vídeň', 'Graz', 'Linz'], correct: 1, category: 'vlajky' },
  { question: 'Itálie má vlajku...', options: ['modro-bílo-červenou', 'zeleno-bílo-červenou', 'červeno-žluto-zelenou', 'bílo-červenou'], correct: 1, category: 'vlajky' },
  { question: 'Hlavní město Francie je...', options: ['Lyon', 'Marseille', 'Paříž', 'Nice'], correct: 2, category: 'vlajky' },
  { question: 'Španělsko leží na...', options: ['severu Evropy', 'východě Evropy', 'jihu Evropy', 'středu Evropy'], correct: 2, category: 'vlajky' },
  { question: 'Velká Británie má hlavní město...', options: ['Manchester', 'Liverpool', 'Londýn', 'Edinburgh'], correct: 2, category: 'vlajky' },
  { question: 'Se kterým státem ČR nesousedí?', options: ['Polsko', 'Rakousko', 'Maďarsko', 'Německo'], correct: 2, category: 'vlajky' },
];

export const ALL_GEO_CATEGORIES = [
  { id: 'kraje', name: 'Kraje ČR', emoji: '🗺️', questions: KRAJE_QUIZ, color: '#34D399' },
  { id: 'reky', name: 'Řeky ČR', emoji: '🌊', questions: REKY_QUIZ, color: '#60A5FA' },
  { id: 'pohori', name: 'Pohoří a příroda', emoji: '⛰️', questions: POHORI_QUIZ, color: '#A78BFA' },
  { id: 'vlajky', name: 'Státy Evropy', emoji: '🇪🇺', questions: VLAJKY_QUIZ, color: '#F472B6' },
];
