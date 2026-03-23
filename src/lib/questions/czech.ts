// Vyjmenovaná slova — kompletní databáze pro 4. třídu ZŠ
// Každá rodina: kořenové slovo + odvozená + cvičení s kontextovými větami

export interface VyjmenovaneWord {
  word: string;
  family: 'B' | 'L' | 'M' | 'P' | 'S' | 'V' | 'Z';
  derived: string[];
}

export interface IYExercise {
  id: string;
  sentence: string; // "B_dlet v novém dom_" (_ = blank)
  blanks: Array<{
    position: number; // index of _ in sentence
    correct: 'i' | 'y' | 'í' | 'ý';
  }>;
  explanation: string;
  family: 'B' | 'L' | 'M' | 'P' | 'S' | 'V' | 'Z';
  difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
}

export const VYJMENOVANA_SLOVA: VyjmenovaneWord[] = [
  // B
  { word: 'být', family: 'B', derived: ['bytí', 'příbytek', 'byt'] },
  { word: 'bydlet', family: 'B', derived: ['bydliště', 'bydlení', 'obyvatel'] },
  { word: 'bylina', family: 'B', derived: ['bylinný', 'bylinkový'] },
  { word: 'bystrý', family: 'B', derived: ['bystřina', 'bystrost'] },
  { word: 'býk', family: 'B', derived: ['býčí', 'býček'] },
  { word: 'bývat', family: 'B', derived: ['bývalý'] },
  { word: 'obyčej', family: 'B', derived: ['obyčejný', 'neobyčejný'] },
  { word: 'dobytek', family: 'B', derived: ['dobytčí'] },
  { word: 'nábytek', family: 'B', derived: ['nábytkový'] },
  { word: 'kobyla', family: 'B', derived: ['kobylka'] },
  // L
  { word: 'slyšet', family: 'L', derived: ['slyšitelný', 'slýchat'] },
  { word: 'mlýn', family: 'L', derived: ['mlynář', 'mlýnský'] },
  { word: 'blýskat', family: 'L', derived: ['blýskavý', 'blýskání'] },
  { word: 'polykat', family: 'L', derived: ['polykač', 'spolknout'] },
  { word: 'plynout', family: 'L', derived: ['plynný', 'plynulý', 'plyn'] },
  { word: 'plýtvat', family: 'L', derived: ['plýtvání'] },
  { word: 'vzlykat', family: 'L', derived: ['vzlykot'] },
  { word: 'lysý', family: 'L', derived: ['lysina', 'plešatý'] },
  { word: 'lýtko', family: 'L', derived: ['lýtkový'] },
  { word: 'lýko', family: 'L', derived: ['lýkový'] },
  { word: 'plyš', family: 'L', derived: ['plyšový', 'plyšák'] },
  // M
  { word: 'my', family: 'M', derived: [] },
  { word: 'mýt', family: 'M', derived: ['mýdlo', 'umýt', 'umývat'] },
  { word: 'myslet', family: 'M', derived: ['myšlenka', 'přemýšlet'] },
  { word: 'mýlit se', family: 'M', derived: ['mýlka', 'omyl'] },
  { word: 'hmyz', family: 'M', derived: ['hmyzí'] },
  { word: 'myš', family: 'M', derived: ['myší', 'myšák'] },
  { word: 'hlemýžď', family: 'M', derived: ['hlemýždí'] },
  { word: 'mýtit', family: 'M', derived: ['mýtina', 'vymýtit'] },
  { word: 'zamykat', family: 'M', derived: ['odmykat', 'zámyčka'] },
  { word: 'smýkat', family: 'M', derived: ['smyk', 'smýčit'] },
  { word: 'chmýří', family: 'M', derived: ['chmýřitý'] },
  // P
  { word: 'pýcha', family: 'P', derived: ['pyšný', 'pyšnit se'] },
  { word: 'pytel', family: 'P', derived: ['pytlík', 'pytlovina'] },
  { word: 'pysk', family: 'P', derived: ['pysky'] },
  { word: 'netopýr', family: 'P', derived: ['netopýří'] },
  { word: 'slepýš', family: 'P', derived: ['slepýší'] },
  { word: 'pyl', family: 'P', derived: ['pylový'] },
  { word: 'kopyto', family: 'P', derived: ['kopýtko'] },
  { word: 'klopýtat', family: 'P', derived: ['klopýtnutí'] },
  { word: 'třpytit', family: 'P', derived: ['třpytivý', 'třpyt'] },
  { word: 'pykat', family: 'P', derived: ['odpykat'] },
  // S
  { word: 'syn', family: 'S', derived: ['synovec', 'synáček'] },
  { word: 'sytý', family: 'S', derived: ['nasytit', 'sytost'] },
  { word: 'sýr', family: 'S', derived: ['sýrový', 'syreček'] },
  { word: 'syrový', family: 'S', derived: ['syrovost'] },
  { word: 'sychravý', family: 'S', derived: ['sychravě'] },
  { word: 'usychat', family: 'S', derived: ['vysychat'] },
  { word: 'sýkora', family: 'S', derived: ['sýkorka'] },
  { word: 'sýček', family: 'S', derived: ['sýčkovat'] },
  { word: 'sysel', family: 'S', derived: ['syslí'] },
  { word: 'sypat', family: 'S', derived: ['sypký', 'nasypat'] },
  // V
  { word: 'vy', family: 'V', derived: ['vykat'] },
  { word: 'vysoký', family: 'V', derived: ['výška', 'vysočina'] },
  { word: 'výt', family: 'V', derived: ['vytí', 'zavýt'] },
  { word: 'výskat', family: 'V', derived: ['výskot'] },
  { word: 'zvykat', family: 'V', derived: ['zvyk', 'zvyklost', 'obvyklý'] },
  { word: 'žvýkat', family: 'V', derived: ['žvýkačka', 'žvýkání'] },
  { word: 'vydra', family: 'V', derived: ['vydří'] },
  { word: 'výr', family: 'V', derived: ['výří'] },
  { word: 'vyžle', family: 'V', derived: [] },
  { word: 'povyk', family: 'V', derived: ['povykovat'] },
  { word: 'výheň', family: 'V', derived: [] },
  // Z
  { word: 'brzy', family: 'Z', derived: ['brzký', 'brziký'] },
  { word: 'jazyk', family: 'Z', derived: ['jazykový', 'jazykovědec'] },
  { word: 'nazývat', family: 'Z', derived: ['nazývaný', 'název'] },
];

// Exercise bank — kontextové věty s i/y doplňováním
export const EXERCISES: IYExercise[] = [
  // B family — easy
  { id: 'b01', sentence: 'Maminka b_dlí v novém bytě.', blanks: [{ position: 15, correct: 'y' }], explanation: 'bydlí — od vyjmenovaného slova BYDLET', family: 'B', difficulty: 1 },
  { id: 'b02', sentence: 'Na louce rostou léčivé b_liny.', blanks: [{ position: 25, correct: 'y' }], explanation: 'byliny — vyjmenované slovo BYLINA', family: 'B', difficulty: 1 },
  { id: 'b03', sentence: 'B_k se pásl na zelené louce.', blanks: [{ position: 1, correct: 'ý' }], explanation: 'Býk — vyjmenované slovo BÝK', family: 'B', difficulty: 1 },
  { id: 'b04', sentence: 'Je to ob_čejný den.', blanks: [{ position: 9, correct: 'y' }], explanation: 'obyčejný — od vyjmenovaného slova OBYČEJ', family: 'B', difficulty: 1 },
  { id: 'b05', sentence: 'Koupili jsme nový náb_tek.', blanks: [{ position: 22, correct: 'y' }], explanation: 'nábytek — vyjmenované slovo NÁBYTEK', family: 'B', difficulty: 1 },
  { id: 'b06', sentence: 'Potok b_l č_stý a průzračný.', blanks: [{ position: 6, correct: 'y' }, { position: 10, correct: 'i' }], explanation: 'byl — od BÝT; čistý — i po č (měkká souhláska)', family: 'B', difficulty: 2 },
  { id: 'b07', sentence: 'Ob_vatelé města slavili.', blanks: [{ position: 2, correct: 'y' }], explanation: 'obyvatelé — od BYDLET', family: 'B', difficulty: 2 },
  { id: 'b08', sentence: 'B_strá holka rychle pochopila.', blanks: [{ position: 1, correct: 'y' }], explanation: 'bystrá — vyjmenované slovo BYSTRÝ', family: 'B', difficulty: 2 },

  // L family
  { id: 'l01', sentence: 'Sl_šíš ten zvuk?', blanks: [{ position: 2, correct: 'y' }], explanation: 'slyšíš — od vyjmenovaného slova SLYŠET', family: 'L', difficulty: 1 },
  { id: 'l02', sentence: 'Ve ml_ně se mele mouka.', blanks: [{ position: 5, correct: 'ý' }], explanation: 'mlýně — vyjmenované slovo MLÝN', family: 'L', difficulty: 1 },
  { id: 'l03', sentence: 'Bl_sklo se a zahřmělo.', blanks: [{ position: 2, correct: 'ý' }], explanation: 'blýsklo — vyjmenované slovo BLÝSKAT', family: 'L', difficulty: 1 },
  { id: 'l04', sentence: 'Nepl_tvej vodou!', blanks: [{ position: 4, correct: 'ý' }], explanation: 'plýtvej — vyjmenované slovo PLÝTVAT', family: 'L', difficulty: 2 },
  { id: 'l05', sentence: 'Čas pl_ne rychle.', blanks: [{ position: 5, correct: 'y' }], explanation: 'plyne — od vyjmenovaného slova PLYNOUT', family: 'L', difficulty: 2 },
  { id: 'l06', sentence: 'Dědeček má l_sinu.', blanks: [{ position: 14, correct: 'y' }], explanation: 'lysinu — od vyjmenovaného slova LYSÝ', family: 'L', difficulty: 2 },
  { id: 'l07', sentence: 'Bolelo ho l_tko.', blanks: [{ position: 11, correct: 'ý' }], explanation: 'lýtko — vyjmenované slovo LÝTKO', family: 'L', difficulty: 1 },

  // M family
  { id: 'm01', sentence: 'Um_j si ruce m_dlem.', blanks: [{ position: 2, correct: 'y' }, { position: 14, correct: 'ý' }], explanation: 'umyj — od MÝT; mýdlem — od MÝT', family: 'M', difficulty: 1 },
  { id: 'm02', sentence: 'M_slíš na to?', blanks: [{ position: 1, correct: 'y' }], explanation: 'myslíš — od vyjmenovaného slova MYSLET', family: 'M', difficulty: 1 },
  { id: 'm03', sentence: 'To je ale velký hm_z!', blanks: [{ position: 19, correct: 'y' }], explanation: 'hmyz — vyjmenované slovo HMYZ', family: 'M', difficulty: 1 },
  { id: 'm04', sentence: 'M_š utekla do díry.', blanks: [{ position: 1, correct: 'y' }], explanation: 'myš — vyjmenované slovo MYŠ', family: 'M', difficulty: 1 },
  { id: 'm05', sentence: 'Nem_l ses, to je správně.', blanks: [{ position: 3, correct: 'ý' }], explanation: 'nemýlil — od vyjmenovaného slova MÝLIT SE', family: 'M', difficulty: 2 },
  { id: 'm06', sentence: 'Zam_kej dveře na klíč.', blanks: [{ position: 3, correct: 'y' }], explanation: 'zamykej — od vyjmenovaného slova ZAMYKAT', family: 'M', difficulty: 2 },
  { id: 'm07', sentence: 'Hlem_žď leze pomalu.', blanks: [{ position: 4, correct: 'ý' }], explanation: 'hlemýžď — vyjmenované slovo HLEMÝŽĎ', family: 'M', difficulty: 2 },

  // P family
  { id: 'p01', sentence: 'P_šná dívka se usmála.', blanks: [{ position: 1, correct: 'y' }], explanation: 'pyšná — od vyjmenovaného slova PÝCHA', family: 'P', difficulty: 1 },
  { id: 'p02', sentence: 'V p_tli je mouka.', blanks: [{ position: 3, correct: 'y' }], explanation: 'pytli — od vyjmenovaného slova PYTEL', family: 'P', difficulty: 1 },
  { id: 'p03', sentence: 'Kůň má tvrdé kop_to.', blanks: [{ position: 17, correct: 'y' }], explanation: 'kopyto — vyjmenované slovo KOPYTO', family: 'P', difficulty: 1 },
  { id: 'p04', sentence: 'Netop_r létá v noci.', blanks: [{ position: 6, correct: 'ý' }], explanation: 'netopýr — vyjmenované slovo NETOPÝR', family: 'P', difficulty: 1 },
  { id: 'p05', sentence: 'Hvězdy se třp_tí na nebi.', blanks: [{ position: 14, correct: 'y' }], explanation: 'třpytí — od vyjmenovaného slova TŘPYTIT', family: 'P', difficulty: 2 },
  { id: 'p06', sentence: 'Slep_š je neškodný had.', blanks: [{ position: 4, correct: 'ý' }], explanation: 'slepýš — vyjmenované slovo SLEPÝŠ', family: 'P', difficulty: 2 },

  // S family
  { id: 's01', sentence: 'Máme dobrý s_r.', blanks: [{ position: 13, correct: 'ý' }], explanation: 'sýr — vyjmenované slovo SÝR', family: 'S', difficulty: 1 },
  { id: 's02', sentence: 'Můj s_n chodí do školy.', blanks: [{ position: 4, correct: 'y' }], explanation: 'syn — vyjmenované slovo SYN', family: 'S', difficulty: 1 },
  { id: 's03', sentence: 'Na stromě sedí s_kora.', blanks: [{ position: 17, correct: 'ý' }], explanation: 'sýkora — vyjmenované slovo SÝKORA', family: 'S', difficulty: 1 },
  { id: 's04', sentence: 'Nas_p mi cukr do čaje.', blanks: [{ position: 3, correct: 'y' }], explanation: 'nasyp — od vyjmenovaného slova SYPAT', family: 'S', difficulty: 2 },
  { id: 's05', sentence: 'Venku je s_chravé počasí.', blanks: [{ position: 10, correct: 'y' }], explanation: 'sychravé — vyjmenované slovo SYCHRAVÝ', family: 'S', difficulty: 2 },
  { id: 's06', sentence: 'S_sel vykukuje z nory.', blanks: [{ position: 1, correct: 'y' }], explanation: 'sysel — vyjmenované slovo SYSEL', family: 'S', difficulty: 2 },

  // V family
  { id: 'v01', sentence: 'V_soká věž se t_čila k nebi.', blanks: [{ position: 1, correct: 'y' }, { position: 16, correct: 'y' }], explanation: 'vysoká — od VYSOKÝ; tyčila — od tyčit (ne vyjmenované, ale y po t)', family: 'V', difficulty: 1 },
  { id: 'v02', sentence: 'Pes v_l na měsíc.', blanks: [{ position: 4, correct: 'y' }], explanation: 'vyl — od vyjmenovaného slova VÝT', family: 'V', difficulty: 1 },
  { id: 'v03', sentence: 'Žv_kačka je sladká.', blanks: [{ position: 2, correct: 'ý' }], explanation: 'žvýkačka — od vyjmenovaného slova ŽVÝKAT', family: 'V', difficulty: 1 },
  { id: 'v04', sentence: 'Zv_kej si na nové prostředí.', blanks: [{ position: 2, correct: 'y' }], explanation: 'zvykej — od vyjmenovaného slova ZVYKAT', family: 'V', difficulty: 2 },
  { id: 'v05', sentence: 'V_dra plavala v řece.', blanks: [{ position: 1, correct: 'y' }], explanation: 'vydra — vyjmenované slovo VYDRA', family: 'V', difficulty: 2 },
  { id: 'v06', sentence: 'Dělali velký pov_k.', blanks: [{ position: 17, correct: 'y' }], explanation: 'povyk — vyjmenované slovo POVYK', family: 'V', difficulty: 2 },

  // Z family
  { id: 'z01', sentence: 'Přijď brz_!', blanks: [{ position: 8, correct: 'y' }], explanation: 'brzy — vyjmenované slovo BRZY', family: 'Z', difficulty: 1 },
  { id: 'z02', sentence: 'Učíme se cizí jaz_k.', blanks: [{ position: 18, correct: 'y' }], explanation: 'jazyk — vyjmenované slovo JAZYK', family: 'Z', difficulty: 1 },
  { id: 'z03', sentence: 'Jak se to naz_vá?', blanks: [{ position: 13, correct: 'ý' }], explanation: 'nazývá — od vyjmenovaného slova NAZÝVAT', family: 'Z', difficulty: 2 },

  // Mixed — harder (i po měkkých vs y po tvrdých)
  { id: 'x01', sentence: 'B_la jednou jedna b_lá labuť.', blanks: [{ position: 1, correct: 'y' }, { position: 19, correct: 'í' }], explanation: 'byla — od BÝT; bílá — i po b (ne vyjmenované, krátké i)', family: 'B', difficulty: 3 },
  { id: 'x02', sentence: 'Zb_tečný náb_tek zab_ral místo.', blanks: [{ position: 2, correct: 'y' }, { position: 13, correct: 'y' }, { position: 22, correct: 'í' }], explanation: 'zbytečný — od BÝT; nábytek — vyjmenované; zabíral — i po b (ne vyjmenované)', family: 'B', difficulty: 3 },
  { id: 'x03', sentence: 'L_ška se skr_la v lese.', blanks: [{ position: 1, correct: 'i' }, { position: 12, correct: 'y' }], explanation: 'liška — i po l (ne vyjmenované); skryla — y po r (tvrdé)', family: 'L', difficulty: 3 },
];

// Get exercises filtered by family and/or difficulty
export function getExercises(options?: {
  family?: string;
  difficulty?: number;
  limit?: number;
}): IYExercise[] {
  let filtered = [...EXERCISES];

  if (options?.family) {
    filtered = filtered.filter((e) => e.family === options.family);
  }
  if (options?.difficulty) {
    filtered = filtered.filter((e) => e.difficulty <= options.difficulty!);
  }

  // Shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

// Get all families for subject picker
export const FAMILIES = ['B', 'L', 'M', 'P', 'S', 'V', 'Z'] as const;

export function getFamilyStats(): Array<{ family: string; wordCount: number; exerciseCount: number }> {
  return FAMILIES.map((f) => ({
    family: f,
    wordCount: VYJMENOVANA_SLOVA.filter((w) => w.family === f).length,
    exerciseCount: EXERCISES.filter((e) => e.family === f).length,
  }));
}
