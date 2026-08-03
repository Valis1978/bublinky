// Sticker collection — the long-term collecting loop.
// SVG art lives in /public/stickers/<id>.svg (Recraft, brandified to the Viki palette).

export type StickerRarity = 'common' | 'rare' | 'legendary';
export type StickerSource = 'gift' | 'streak' | 'games' | 'learning' | 'food' | 'chat' | 'secret';

export interface StickerDef {
  id: string;
  name: string;
  /** playful hint about how to earn it (shown for uncollected) */
  hint: string;
  rarity: StickerRarity;
  source: StickerSource;
}

export const STICKERS: Record<string, StickerDef> = {
  // gift pool — from the daily gift box
  st_duha:      { id: 'st_duha', name: 'Duha', hint: 'Otvírej dárečky každý den!', rarity: 'common', source: 'gift' },
  st_hvezdicka: { id: 'st_hvezdicka', name: 'Hvězdička', hint: 'Schovává se v dárečku', rarity: 'common', source: 'gift' },
  st_kytka:     { id: 'st_kytka', name: 'Kytička', hint: 'Schovává se v dárečku', rarity: 'common', source: 'gift' },
  st_srdicko:   { id: 'st_srdicko', name: 'Srdíčko', hint: 'Schovává se v dárečku', rarity: 'common', source: 'gift' },
  st_zmrzlina:  { id: 'st_zmrzlina', name: 'Zmrzlinka', hint: 'Schovává se v dárečku', rarity: 'common', source: 'gift' },
  st_motyl:     { id: 'st_motyl', name: 'Motýlek', hint: 'Schovává se v dárečku', rarity: 'common', source: 'gift' },
  st_jednorozec:{ id: 'st_jednorozec', name: 'Jednorožčí přání', hint: 'Vzácný! Otvírej dárečky a měj štěstí', rarity: 'rare', source: 'gift' },

  // streaks
  st_ohnostroj: { id: 'st_ohnostroj', name: 'Ohňostroj', hint: '7 dní v řadě s dárečkem', rarity: 'rare', source: 'streak' },
  st_koruna:    { id: 'st_koruna', name: 'Zlatá koruna', hint: '30 dní v řadě! To dokáže jen král/ovna', rarity: 'legendary', source: 'streak' },

  // learning
  st_knizka:    { id: 'st_knizka', name: 'Knížka', hint: 'Dokonči 3 kvízy v Učení', rarity: 'common', source: 'learning' },
  st_mozek:     { id: 'st_mozek', name: 'Chytrá hlavička', hint: 'Dokonči 10 kvízů v Učení', rarity: 'rare', source: 'learning' },

  // games
  st_puzzle:    { id: 'st_puzzle', name: 'Hráčka', hint: 'Zahraj si 5 her', rarity: 'common', source: 'games' },
  st_medaile:   { id: 'st_medaile', name: 'Šampiónka', hint: 'Zahraj si 20 her', rarity: 'rare', source: 'games' },

  // food journey
  st_lizatko:   { id: 'st_lizatko', name: 'Odvážný jazýček', hint: 'Ochutnej 5 nových jídel', rarity: 'rare', source: 'food' },
  st_dort:      { id: 'st_dort', name: 'Mistr ochutnávač', hint: 'Ochutnej 15 nových jídel', rarity: 'legendary', source: 'food' },

  // secret
  st_bublina:   { id: 'st_bublina', name: 'Zlatá bublina', hint: '??? Tajemství… tvůj mazlíček ví víc', rarity: 'legendary', source: 'secret' },
};

export const STICKER_LIST: StickerDef[] = Object.values(STICKERS);

export function stickerFile(id: string): string {
  return `/stickers/${id}.svg`;
}

export function getUncollected(collected: string[], source?: StickerSource): StickerDef[] {
  return STICKER_LIST.filter(s => !collected.includes(s.id) && (!source || s.source === source));
}

export const STICKER_RARITY_LABEL: Record<StickerRarity, string> = {
  common: 'Obyčejná',
  rare: 'Vzácná',
  legendary: 'Legendární',
};

export const STICKER_RARITY_COLORS: Record<StickerRarity, string> = {
  common: '#9CA3AF',
  rare: '#8B5CF6',
  legendary: '#F59E0B',
};
