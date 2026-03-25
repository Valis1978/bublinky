import type { SkillBranch } from './pet-engine';

export interface Destination {
  id: string;
  name: string;
  emoji: string;
  description: string;
  durationHours: number; // real-time hours
  primarySkill: keyof SkillBranch;
  skillXpReward: number;
  possibleSouvenirs: string[]; // item_ids from item-catalog
  storyPrompt: string; // AI prompt hint for story generation
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'enchanted_forest',
    name: 'Začarovaný les',
    emoji: '🌲✨',
    description: 'Tajemný les plný kouzelných tvorů a svítících hub',
    durationHours: 1,
    primarySkill: 'nature',
    skillXpReward: 5,
    possibleSouvenirs: ['souv_feather', 'food_apple'],
    storyPrompt: 'les plný kouzelných zvířat, svítících hub a starých stromů. Pet potká mluvícího sovu.',
  },
  {
    id: 'crystal_cave',
    name: 'Krystalová jeskyně',
    emoji: '💎🕯️',
    description: 'Třpytivá jeskyně plná drahokamů a tajemných odlesků',
    durationHours: 2,
    primarySkill: 'wisdom',
    skillXpReward: 8,
    possibleSouvenirs: ['souv_crystal', 'deco_lamp'],
    storyPrompt: 'jeskyně plná krystalů, odrazů světla a starých záhad. Pet řeší hádanku aby prošel dál.',
  },
  {
    id: 'cloud_kingdom',
    name: 'Oblačné království',
    emoji: '☁️👑',
    description: 'Království vysoko v oblacích kde žijí oblačná zvířátka',
    durationHours: 2,
    primarySkill: 'creativity',
    skillXpReward: 8,
    possibleSouvenirs: ['souv_cloud', 'acc_crown'],
    storyPrompt: 'království na oblacích, duhové mosty, měkké paláce. Pet se naučí létat a potká oblačného krále.',
  },
  {
    id: 'underwater_world',
    name: 'Podmořský svět',
    emoji: '🌊🐠',
    description: 'Nádherný korálový útes plný barevných rybek',
    durationHours: 3,
    primarySkill: 'strength',
    skillXpReward: 10,
    possibleSouvenirs: ['souv_shell', 'food_fish'],
    storyPrompt: 'podmořský svět s korálovým útesem, delfíny a podmořským pokladem. Pet se naučí plavat.',
  },
  {
    id: 'mountain_valley',
    name: 'Horské údolí',
    emoji: '🏔️🌿',
    description: 'Zelené údolí mezi vysokými horami s vodopády',
    durationHours: 3,
    primarySkill: 'strength',
    skillXpReward: 10,
    possibleSouvenirs: ['souv_stone', 'food_carrot'],
    storyPrompt: 'horské údolí s vodopády, kozami na skalách a bylinkovou loukou. Pet zdolá malý vrchol.',
  },
  {
    id: 'star_tower',
    name: 'Hvězdná věž',
    emoji: '🌟🏰',
    description: 'Tajemná věž sahající až ke hvězdám',
    durationHours: 4,
    primarySkill: 'wisdom',
    skillXpReward: 15,
    possibleSouvenirs: ['souv_starpiece', 'food_star'],
    storyPrompt: 'věž sahající ke hvězdám, v každém patře jiná výzva. Na vrcholu hvězdný mudrc prozradí tajemství.',
  },
];

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}

/** Get destinations unlocked based on pet level */
export function getAvailableDestinations(level: number): Destination[] {
  if (level >= 10) return DESTINATIONS;
  if (level >= 6) return DESTINATIONS.filter(d => d.durationHours <= 3);
  if (level >= 3) return DESTINATIONS.filter(d => d.durationHours <= 2);
  return DESTINATIONS.filter(d => d.durationHours <= 1);
}
