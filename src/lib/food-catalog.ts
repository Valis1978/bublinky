/**
 * Food Catalog for Taste Adventures (therapeutic food journey)
 *
 * DESIGN PRINCIPLES:
 * - Start with SAFE foods (fruit, dry snacks) that most kids eat
 * - Progress gradually to harder categories
 * - Spreads, butter, sauces = LEGENDARY difficulty (Viki's specific challenges)
 * - NEVER force, NEVER shame — celebrate BRAVERY of trying
 * - Pet tries food FIRST and models the behavior
 */

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  difficulty: FoodDifficulty;
  petReaction: string; // what pet says when trying it
  sensoryHint: string; // non-judgmental sensory description
}

export type FoodCategory = 'fruit' | 'vegetable' | 'grain' | 'protein' | 'dairy' | 'snack' | 'sauce' | 'spread';
export type FoodDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export const FOOD_CATALOG: FoodItem[] = [
  // ═══════ EASY (fruit + safe snacks) ═══════
  { id: 'f_apple', name: 'Jablko', emoji: '🍎', category: 'fruit', difficulty: 'easy',
    petReaction: 'Křup! Šťavnaté! 😋', sensoryHint: 'Křupavé, sladké, šťavnaté' },
  { id: 'f_banana', name: 'Banán', emoji: '🍌', category: 'fruit', difficulty: 'easy',
    petReaction: 'Mňam, měkkounké! 🥰', sensoryHint: 'Měkký, sladký, krémový' },
  { id: 'f_strawberry', name: 'Jahoda', emoji: '🍓', category: 'fruit', difficulty: 'easy',
    petReaction: 'Voní to krásně! 🌸', sensoryHint: 'Voňavá, sladká, šťavnatá' },
  { id: 'f_grape', name: 'Hroznové víno', emoji: '🍇', category: 'fruit', difficulty: 'easy',
    petReaction: 'Malé kuličky! Pop! 😄', sensoryHint: 'Malé, sladké, praskne v puse' },
  { id: 'f_watermelon', name: 'Meloun', emoji: '🍉', category: 'fruit', difficulty: 'easy',
    petReaction: 'Jako voda! Osvěžující! 💦', sensoryHint: 'Vodnatý, osvěžující, sladký' },
  { id: 'f_cookie', name: 'Sušenka', emoji: '🍪', category: 'snack', difficulty: 'easy',
    petReaction: 'Křupy křup! Parádička! 🤩', sensoryHint: 'Křupavá, sladká, suchá' },
  { id: 'f_bread', name: 'Chleba', emoji: '🍞', category: 'grain', difficulty: 'easy',
    petReaction: 'Voní jako u pekaře! 🥖', sensoryHint: 'Měkký uvnitř, kůrka křupavá' },
  { id: 'f_rice', name: 'Rýže', emoji: '🍚', category: 'grain', difficulty: 'easy',
    petReaction: 'Zrnko po zrnku! 😊', sensoryHint: 'Měkká, jemná, neutrální chuť' },

  // ═══════ MEDIUM (vegetables + proteins) ═══════
  { id: 'f_carrot', name: 'Mrkev', emoji: '🥕', category: 'vegetable', difficulty: 'medium',
    petReaction: 'Křup! Jako králíček! 🐰', sensoryHint: 'Křupavá, lehce sladká, oranžová' },
  { id: 'f_cucumber', name: 'Okurka', emoji: '🥒', category: 'vegetable', difficulty: 'medium',
    petReaction: 'Svěží! Chladivá! 💚', sensoryHint: 'Vodnatá, svěží, křupavá' },
  { id: 'f_corn', name: 'Kukuřice', emoji: '🌽', category: 'vegetable', difficulty: 'medium',
    petReaction: 'Zlatá zrnka! Sladký! 🌟', sensoryHint: 'Sladká, šťavnatá, žluté zrnka' },
  { id: 'f_potato', name: 'Brambora', emoji: '🥔', category: 'vegetable', difficulty: 'medium',
    petReaction: 'Měkkounká a teplá! 🤗', sensoryHint: 'Měkká, teplá, jemná chuť' },
  { id: 'f_chicken', name: 'Kuřátko', emoji: '🍗', category: 'protein', difficulty: 'medium',
    petReaction: 'Protein! Síla! 💪', sensoryHint: 'Měkké, šťavnaté, slané' },
  { id: 'f_egg', name: 'Vajíčko', emoji: '🥚', category: 'protein', difficulty: 'medium',
    petReaction: 'Žloutek je zlatý! ☀️', sensoryHint: 'Měkké, jemné, lehce slané' },
  { id: 'f_cheese', name: 'Sýr', emoji: '🧀', category: 'dairy', difficulty: 'medium',
    petReaction: 'Jako myška! Squeak! 🐭', sensoryHint: 'Tuhý, slaný, různé druhy' },
  { id: 'f_pasta', name: 'Těstoviny', emoji: '🍝', category: 'grain', difficulty: 'medium',
    petReaction: 'Dlouhé špagetky! Slurp! 😄', sensoryHint: 'Měkké, neutrální, různé tvary' },

  // ═══════ HARD (mixed textures, stronger flavors) ═══════
  { id: 'f_broccoli', name: 'Brokolice', emoji: '🥦', category: 'vegetable', difficulty: 'hard',
    petReaction: 'Malé stromečky! 🌳 Zajímavý!', sensoryHint: 'Vypadá jako mini stromeček, křupavá' },
  { id: 'f_tomato', name: 'Rajče', emoji: '🍅', category: 'vegetable', difficulty: 'hard',
    petReaction: 'Červené a kulaté! 🔴', sensoryHint: 'Šťavnaté, lehce kyselé, měkké' },
  { id: 'f_fish', name: 'Ryba', emoji: '🐟', category: 'protein', difficulty: 'hard',
    petReaction: 'Z moře! Mňam! 🌊', sensoryHint: 'Měkká, jemná, specifická vůně' },
  { id: 'f_soup', name: 'Polévka', emoji: '🍲', category: 'snack', difficulty: 'hard',
    petReaction: 'Teplá a příjemná! 🤗', sensoryHint: 'Tekutá, teplá, různé ingredience' },
  { id: 'f_yogurt', name: 'Jogurt', emoji: '🥛', category: 'dairy', difficulty: 'hard',
    petReaction: 'Krémový! Lehký! 😊', sensoryHint: 'Krémový, lehce kyselý, studený' },
  { id: 'f_sandwich', name: 'Sendvič', emoji: '🥪', category: 'grain', difficulty: 'hard',
    petReaction: 'Vrstvy! Jako stavebnice! 🏗️', sensoryHint: 'Kombinace textur, chléb + náplň' },

  // ═══════ LEGENDARY (Viki's specific challenges) ═══════
  { id: 'f_butter', name: 'Chleba s máslem', emoji: '🧈', category: 'spread', difficulty: 'legendary',
    petReaction: 'Hmm... kluzké... ale zajímavé! 🤔', sensoryHint: 'Krémové, kluzké, jemně slané' },
  { id: 'f_spread', name: 'Pomazánka', emoji: '🫕', category: 'spread', difficulty: 'legendary',
    petReaction: 'Wow, to se maže! Nový zážitek! 😮', sensoryHint: 'Krémová, mazlavá, různé příchutě' },
  { id: 'f_gervais', name: 'Tvarohový krém', emoji: '🥄', category: 'dairy', difficulty: 'legendary',
    petReaction: 'Měkké jako obláček! ☁️', sensoryHint: 'Velmi jemný, krémový, lehký' },
  { id: 'f_sauce', name: 'Omáčka', emoji: '🫗', category: 'sauce', difficulty: 'legendary',
    petReaction: 'Tekutá příchuť! Trochu jiné! 🌊', sensoryHint: 'Tekutá, pokrývá jídlo, silnější chuť' },
  { id: 'f_ketchup', name: 'Kečup', emoji: '🍅', category: 'sauce', difficulty: 'legendary',
    petReaction: 'Rajčatový! Sladko-kyselý! 🎯', sensoryHint: 'Hustý, sladko-kyselý, rajčatový' },
];

/** Get foods by difficulty for quest generation */
export function getFoodsByDifficulty(difficulty: FoodDifficulty): FoodItem[] {
  return FOOD_CATALOG.filter(f => f.difficulty === difficulty);
}

/** Get next food to try (not yet tried, appropriate difficulty) */
export function getNextFoodToTry(triedFoods: string[], bravery: number): FoodItem | null {
  let targetDifficulty: FoodDifficulty;
  if (bravery < 15) targetDifficulty = 'easy';
  else if (bravery < 40) targetDifficulty = 'medium';
  else if (bravery < 70) targetDifficulty = 'hard';
  else targetDifficulty = 'legendary';

  const candidates = FOOD_CATALOG.filter(f =>
    f.difficulty === targetDifficulty && !triedFoods.includes(f.id)
  );

  // Fallback to easier if none available at target difficulty
  if (candidates.length === 0) {
    const fallback = FOOD_CATALOG.filter(f => !triedFoods.includes(f.id));
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const DIFFICULTY_LABELS: Record<FoodDifficulty, { name: string; emoji: string; color: string }> = {
  easy:      { name: 'Snadné', emoji: '🟢', color: '#22C55E' },
  medium:    { name: 'Střední', emoji: '🟡', color: '#F59E0B' },
  hard:      { name: 'Těžké', emoji: '🟠', color: '#F97316' },
  legendary: { name: 'Legendární!', emoji: '🔴', color: '#EF4444' },
};
