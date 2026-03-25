import type { SkillBranch } from './pet-engine';

export interface Skill {
  id: string;
  branch: keyof SkillBranch;
  name: string;
  description: string;
  emoji: string;
  threshold: number; // skill points needed to unlock
  effect: SkillEffect;
}

export type SkillEffect =
  | { type: 'stat_boost'; stat: string; amount: number }
  | { type: 'unlock_action'; action: string }
  | { type: 'decay_reduction'; stat: string; percent: number }
  | { type: 'xp_multiplier'; amount: number }
  | { type: 'coin_bonus'; amount: number }
  | { type: 'food_bravery_bonus'; amount: number }
  | { type: 'passive'; description: string };

// 5 branches × 5 skills = 25 total
export const SKILL_TREE: Skill[] = [
  // ⚡ STRENGTH (Síla)
  { id: 'str_1', branch: 'strength', name: 'Běžec', description: 'Energie klesá pomaleji', emoji: '🏃',
    threshold: 10, effect: { type: 'decay_reduction', stat: 'energy', percent: 15 } },
  { id: 'str_2', branch: 'strength', name: 'Gymnasta', description: '+5 štěstí z hraní', emoji: '🤸',
    threshold: 25, effect: { type: 'stat_boost', stat: 'happiness', amount: 5 } },
  { id: 'str_3', branch: 'strength', name: 'Plavec', description: 'Odemkni vodní dobrodružství', emoji: '🏊',
    threshold: 45, effect: { type: 'unlock_action', action: 'swim_adventure' } },
  { id: 'str_4', branch: 'strength', name: 'Horolezec', description: '+20% XP z her', emoji: '🧗',
    threshold: 70, effect: { type: 'xp_multiplier', amount: 1.2 } },
  { id: 'str_5', branch: 'strength', name: 'Šampion', description: 'Speciální atletická evoluce', emoji: '🏆',
    threshold: 100, effect: { type: 'passive', description: 'Odemkni atletickou evoluční formu' } },

  // 📚 WISDOM (Moudrost)
  { id: 'wis_1', branch: 'wisdom', name: 'Zvědavec', description: 'Víc XP z kvízů', emoji: '🔍',
    threshold: 10, effect: { type: 'xp_multiplier', amount: 1.15 } },
  { id: 'wis_2', branch: 'wisdom', name: 'Knihomol', description: 'Mazlíček ti čte příběhy', emoji: '📖',
    threshold: 25, effect: { type: 'unlock_action', action: 'pet_reads_story' } },
  { id: 'wis_3', branch: 'wisdom', name: 'Výzkumník', description: 'Lepší rady od mazlíčka', emoji: '🔬',
    threshold: 45, effect: { type: 'passive', description: 'AI mazlíček dává zajímavější fun facty' } },
  { id: 'wis_4', branch: 'wisdom', name: 'Profesor', description: '+3 coins za správné odpovědi', emoji: '🎓',
    threshold: 70, effect: { type: 'coin_bonus', amount: 3 } },
  { id: 'wis_5', branch: 'wisdom', name: 'Mudrc', description: 'Speciální učenecká evoluce', emoji: '🧙',
    threshold: 100, effect: { type: 'passive', description: 'Odemkni učeneckou evoluční formu' } },

  // 😜 CHARISMA
  { id: 'cha_1', branch: 'charisma', name: 'Kamarád', description: 'Mazlíček mluví víc', emoji: '💬',
    threshold: 10, effect: { type: 'passive', description: 'Častější proaktivní zprávy' } },
  { id: 'cha_2', branch: 'charisma', name: 'Bavič', description: 'Mazlíček umí vtipy', emoji: '😂',
    threshold: 25, effect: { type: 'unlock_action', action: 'tell_joke' } },
  { id: 'cha_3', branch: 'charisma', name: 'Utěšitel', description: '+10 štěstí z chatu', emoji: '🤗',
    threshold: 45, effect: { type: 'stat_boost', stat: 'happiness', amount: 10 } },
  { id: 'cha_4', branch: 'charisma', name: 'Influencer', description: 'Dvojité mince z kvízů', emoji: '⭐',
    threshold: 70, effect: { type: 'coin_bonus', amount: 5 } },
  { id: 'cha_5', branch: 'charisma', name: 'Šprýmař', description: 'Speciální šprýmařská evoluce', emoji: '🃏',
    threshold: 100, effect: { type: 'passive', description: 'Odemkni šprýmařskou evoluční formu' } },

  // 🎨 CREATIVITY (Kreativita)
  { id: 'cre_1', branch: 'creativity', name: 'Malíř', description: 'Odemkni kreslící pad', emoji: '🖌️',
    threshold: 10, effect: { type: 'unlock_action', action: 'drawing_pad' } },
  { id: 'cre_2', branch: 'creativity', name: 'Designér', description: 'Nové outfity pro mazlíčka', emoji: '👗',
    threshold: 25, effect: { type: 'passive', description: 'Odemkni 5 speciálních outfitů' } },
  { id: 'cre_3', branch: 'creativity', name: 'Muzikant', description: 'Mazlíček zpívá', emoji: '🎵',
    threshold: 45, effect: { type: 'unlock_action', action: 'pet_sings' } },
  { id: 'cre_4', branch: 'creativity', name: 'Architekt', description: 'Dekorace pokojíčku', emoji: '🏠',
    threshold: 70, effect: { type: 'unlock_action', action: 'room_decorations' } },
  { id: 'cre_5', branch: 'creativity', name: 'Umělec', description: 'Speciální umělecká evoluce', emoji: '🌟',
    threshold: 100, effect: { type: 'passive', description: 'Odemkni uměleckou evoluční formu' } },

  // 🌿 NATURE (Příroda)
  { id: 'nat_1', branch: 'nature', name: 'Zahradník', description: 'Odemkni zahrádku', emoji: '🌱',
    threshold: 10, effect: { type: 'unlock_action', action: 'garden' } },
  { id: 'nat_2', branch: 'nature', name: 'Kuchař', description: '+2 food bravery za ochutnání', emoji: '👨‍🍳',
    threshold: 25, effect: { type: 'food_bravery_bonus', amount: 2 } },
  { id: 'nat_3', branch: 'nature', name: 'Stopař', description: 'Delší dobrodružství = lepší suvenýry', emoji: '🌲',
    threshold: 45, effect: { type: 'passive', description: 'Vzácnější suvenýry z dobrodružství' } },
  { id: 'nat_4', branch: 'nature', name: 'Zvířecí šeptač', description: 'Hlad klesá pomaleji', emoji: '🐾',
    threshold: 70, effect: { type: 'decay_reduction', stat: 'hunger', percent: 20 } },
  { id: 'nat_5', branch: 'nature', name: 'Léčitel', description: 'Speciální léčitelská evoluce', emoji: '🌸',
    threshold: 100, effect: { type: 'passive', description: 'Odemkni léčitelskou evoluční formu' } },
];

/** Get unlocked skills for a pet */
export function getUnlockedSkills(skills: SkillBranch): Skill[] {
  return SKILL_TREE.filter(s => skills[s.branch] >= s.threshold);
}

/** Get skills for a specific branch with unlock status */
export function getBranchSkills(branch: keyof SkillBranch, currentValue: number): (Skill & { unlocked: boolean })[] {
  return SKILL_TREE
    .filter(s => s.branch === branch)
    .sort((a, b) => a.threshold - b.threshold)
    .map(s => ({ ...s, unlocked: currentValue >= s.threshold }));
}

/** Branch display info */
export const BRANCH_INFO: Record<keyof SkillBranch, { name: string; emoji: string; color: string }> = {
  strength:   { name: 'Síla', emoji: '⚡', color: '#EF4444' },
  wisdom:     { name: 'Moudrost', emoji: '📚', color: '#3B82F6' },
  charisma:   { name: 'Charisma', emoji: '💬', color: '#F59E0B' },
  creativity: { name: 'Kreativita', emoji: '🎨', color: '#A855F7' },
  nature:     { name: 'Příroda', emoji: '🌿', color: '#22C55E' },
};
