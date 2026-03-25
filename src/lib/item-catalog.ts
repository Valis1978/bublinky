import type { SkillBranch } from './pet-engine';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'food' | 'toy' | 'accessory' | 'decoration' | 'souvenir' | 'badge';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  price?: number;
  effects?: { stat: string; amount: number }[];
  skillBranch?: keyof SkillBranch;
}

export const ITEMS: Record<string, ItemDef> = {
  // ═══════════════ FOOD ═══════════════
  food_kibble:    { id: 'food_kibble', name: 'Granule', description: 'Základní jídlo', emoji: '🥣', type: 'food', rarity: 'common', price: 5, effects: [{ stat: 'hunger', amount: 15 }] },
  food_apple:     { id: 'food_apple', name: 'Jablíčko', description: 'Šťavnaté a zdravé', emoji: '🍎', type: 'food', rarity: 'common', price: 8, effects: [{ stat: 'hunger', amount: 20 }, { stat: 'happiness', amount: 5 }], skillBranch: 'nature' },
  food_cookie:    { id: 'food_cookie', name: 'Sušenka', description: 'Sladký pamlsek', emoji: '🍪', type: 'food', rarity: 'common', price: 10, effects: [{ stat: 'hunger', amount: 10 }, { stat: 'happiness', amount: 15 }] },
  food_cake:      { id: 'food_cake', name: 'Dortík', description: 'Speciální pochoutka!', emoji: '🎂', type: 'food', rarity: 'uncommon', price: 25, effects: [{ stat: 'hunger', amount: 30 }, { stat: 'happiness', amount: 20 }] },
  food_fish:      { id: 'food_fish', name: 'Rybička', description: 'Kočky to milují', emoji: '🐟', type: 'food', rarity: 'common', price: 12, effects: [{ stat: 'hunger', amount: 25 }], skillBranch: 'nature' },
  food_bone:      { id: 'food_bone', name: 'Kostička', description: 'Pejsek bude šťastný', emoji: '🦴', type: 'food', rarity: 'common', price: 8, effects: [{ stat: 'hunger', amount: 20 }] },
  food_carrot:    { id: 'food_carrot', name: 'Mrkvička', description: 'Zdravá a křupavá', emoji: '🥕', type: 'food', rarity: 'common', price: 6, effects: [{ stat: 'hunger', amount: 15 }, { stat: 'cleanliness', amount: 5 }], skillBranch: 'nature' },
  food_pizza:     { id: 'food_pizza', name: 'Pizza', description: 'Kdo by nechtěl pizzu?', emoji: '🍕', type: 'food', rarity: 'uncommon', price: 20, effects: [{ stat: 'hunger', amount: 35 }, { stat: 'happiness', amount: 10 }] },
  food_icecream:  { id: 'food_icecream', name: 'Zmrzlina', description: 'Osvěžující!', emoji: '🍦', type: 'food', rarity: 'uncommon', price: 15, effects: [{ stat: 'happiness', amount: 25 }] },
  food_star:      { id: 'food_star', name: 'Hvězdný prášek', description: 'Magické jídlo z dobrodružství', emoji: '✨', type: 'food', rarity: 'epic', effects: [{ stat: 'hunger', amount: 50 }, { stat: 'happiness', amount: 30 }, { stat: 'energy', amount: 20 }] },

  // ═══════════════ TOYS ═══════════════
  toy_ball:       { id: 'toy_ball', name: 'Míček', description: 'Hopsá a skáče!', emoji: '⚽', type: 'toy', rarity: 'common', price: 15, skillBranch: 'strength' },
  toy_puzzle:     { id: 'toy_puzzle', name: 'Puzzle', description: 'Hlavolam pro chytré mazlíčky', emoji: '🧩', type: 'toy', rarity: 'common', price: 20, skillBranch: 'wisdom' },
  toy_plush:      { id: 'toy_plush', name: 'Plyšák', description: 'Měkoučký kamarád', emoji: '🧸', type: 'toy', rarity: 'common', price: 18, skillBranch: 'charisma' },
  toy_crayons:    { id: 'toy_crayons', name: 'Pastelky', description: 'Na kreslení!', emoji: '🖍️', type: 'toy', rarity: 'common', price: 12, skillBranch: 'creativity' },
  toy_seeds:      { id: 'toy_seeds', name: 'Semínka', description: 'Na sázení do zahrádky', emoji: '🌱', type: 'toy', rarity: 'common', price: 10, skillBranch: 'nature' },
  toy_skateboard: { id: 'toy_skateboard', name: 'Skateboard', description: 'Mazlíček umí trikovat!', emoji: '🛹', type: 'toy', rarity: 'uncommon', price: 40, skillBranch: 'strength' },
  toy_telescope:  { id: 'toy_telescope', name: 'Dalekohled', description: 'Co je tam v dálce?', emoji: '🔭', type: 'toy', rarity: 'rare', price: 60, skillBranch: 'wisdom' },
  toy_guitar:     { id: 'toy_guitar', name: 'Kytara', description: 'Brnk brnk! 🎶', emoji: '🎸', type: 'toy', rarity: 'rare', price: 55, skillBranch: 'creativity' },

  // ═══════════════ ACCESSORIES ═══════════════
  acc_hat:        { id: 'acc_hat', name: 'Čepička', description: 'Stylová pokrývka hlavy', emoji: '🧢', type: 'accessory', rarity: 'common', price: 25 },
  acc_bow:        { id: 'acc_bow', name: 'Mašlička', description: 'Roztomilá mašle', emoji: '🎀', type: 'accessory', rarity: 'common', price: 20 },
  acc_glasses:    { id: 'acc_glasses', name: 'Brýle', description: 'Učený mazlíček!', emoji: '👓', type: 'accessory', rarity: 'uncommon', price: 35 },
  acc_crown:      { id: 'acc_crown', name: 'Korunka', description: 'Pro královnu/krále!', emoji: '👑', type: 'accessory', rarity: 'rare', price: 80 },
  acc_cape:       { id: 'acc_cape', name: 'Plášť', description: 'Superhrdina!', emoji: '🦸', type: 'accessory', rarity: 'rare', price: 70 },
  acc_scarf:      { id: 'acc_scarf', name: 'Šálek', description: 'Na zimu!', emoji: '🧣', type: 'accessory', rarity: 'common', price: 15 },

  // ═══════════════ DECORATIONS ═══════════════
  deco_plant:     { id: 'deco_plant', name: 'Květinka', description: 'Útulný pokojíček', emoji: '🌸', type: 'decoration', rarity: 'common', price: 15 },
  deco_lamp:      { id: 'deco_lamp', name: 'Lampička', description: 'Příjemné světlo', emoji: '🔮', type: 'decoration', rarity: 'uncommon', price: 30 },
  deco_poster:    { id: 'deco_poster', name: 'Plakát', description: 'Na zeď!', emoji: '🖼️', type: 'decoration', rarity: 'common', price: 20 },
  deco_rug:       { id: 'deco_rug', name: 'Koberec', description: 'Měkký a teplý', emoji: '🟫', type: 'decoration', rarity: 'uncommon', price: 35 },
  deco_stars:     { id: 'deco_stars', name: 'Svítící hvězdy', description: 'Na strop!', emoji: '⭐', type: 'decoration', rarity: 'rare', price: 50 },

  // ═══════════════ SOUVENIRS (from adventures) ═══════════════
  souv_crystal:   { id: 'souv_crystal', name: 'Krystal', description: 'Z Krystalové jeskyně', emoji: '💎', type: 'souvenir', rarity: 'rare' },
  souv_feather:   { id: 'souv_feather', name: 'Kouzelné pírko', description: 'Ze Začarovaného lesa', emoji: '🪶', type: 'souvenir', rarity: 'uncommon' },
  souv_shell:     { id: 'souv_shell', name: 'Mušle', description: 'Z Podmořského světa', emoji: '🐚', type: 'souvenir', rarity: 'uncommon' },
  souv_cloud:     { id: 'souv_cloud', name: 'Kousek mráčku', description: 'Z Oblačného království', emoji: '☁️', type: 'souvenir', rarity: 'rare' },
  souv_stone:     { id: 'souv_stone', name: 'Horský kámen', description: 'Z Horského údolí', emoji: '🪨', type: 'souvenir', rarity: 'common' },
  souv_starpiece: { id: 'souv_starpiece', name: 'Hvězdný úlomek', description: 'Z Hvězdné věže', emoji: '🌟', type: 'souvenir', rarity: 'epic' },

  // ═══════════════ BADGES (from achievements) ═══════════════
  badge_first_feed:   { id: 'badge_first_feed', name: 'První krmení', description: 'Poprvé jsi nakrmil/a mazlíčka', emoji: '🍼', type: 'badge', rarity: 'common' },
  badge_7day_streak:  { id: 'badge_7day_streak', name: '7 dní kamarád', description: '7 dní v řadě!', emoji: '🔥', type: 'badge', rarity: 'uncommon' },
  badge_food_brave_5: { id: 'badge_food_brave_5', name: 'Odvážný jedlík', description: '5 nových jídel!', emoji: '🦁', type: 'badge', rarity: 'uncommon' },
  badge_food_brave_15:{ id: 'badge_food_brave_15', name: 'Gurmán', description: '15 nových jídel!', emoji: '👨‍🍳', type: 'badge', rarity: 'rare' },
  badge_level_5:      { id: 'badge_level_5', name: 'Level 5', description: 'Dosáhl/a jsi levelu 5!', emoji: '⭐', type: 'badge', rarity: 'common' },
  badge_level_10:     { id: 'badge_level_10', name: 'Level 10', description: 'Evoluce!', emoji: '🌟', type: 'badge', rarity: 'rare' },
  badge_explorer:     { id: 'badge_explorer', name: 'Průzkumník', description: 'Navštívil/a 3 místa', emoji: '🗺️', type: 'badge', rarity: 'uncommon' },
};

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

export function getItemsByType(type: ItemDef['type']): ItemDef[] {
  return Object.values(ITEMS).filter(i => i.type === type);
}

export function getShopItems(): ItemDef[] {
  return Object.values(ITEMS).filter(i => i.price && i.price > 0);
}

export const RARITY_COLORS: Record<ItemDef['rarity'], string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};
