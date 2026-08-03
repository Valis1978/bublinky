// Bublinky pet avatar rig — shared contract for all species.
//
// Geometry contract (viewBox 0 0 200 200):
//   - body: superellipse centered at (100, 116), roughly 112w × 104h
//   - ground line: y = 170 (feet touch here; stage scaling anchors to (100, 170))
//   - face layer: eyes at y ≈ 104 (centers x = 78 / 122), mouth at y ≈ 126
//   - anchors: head-top (100, 62) hats · face (100, 112) glasses ·
//     neck (100, 158) scarves/bows · back (150, 118) capes/wings
// Species NEVER redraw the body or face — they contribute layers around them.

import type { ComponentType } from 'react';
import type { PetMood, PetSpecies, PetStage, EvolutionPath } from '@/lib/pet-engine';
import type { AccessorySlot } from '@/lib/item-catalog';

export interface SpeciesPalette {
  /** main body fill */
  base: string;
  /** stroke / outline tone (darkened base — never black) */
  dark: string;
  /** belly patch fill */
  belly: string;
  /** accent (inner ears, spikes, tail tip…) */
  accent: string;
  /** optional extra tone (mane, wings…) */
  extra?: string;
}

/** Props passed to every species layer component. */
export interface LayerProps {
  p: SpeciesPalette;
  stage: PetStage;
}

/**
 * A species contributes feature layers stacked around the shared body:
 *   EarsBack → (body) → Tail → EarsFront → Extras → (face) → Snout
 * Tail must wrap its shapes in <g className="bub-tail" style={{ transformOrigin: 'Xpx Ypx' }}>
 * so the rig's wag animation picks it up. Ears likewise may use "bub-ear".
 */
export interface SpeciesDef {
  id: PetSpecies;
  /** czech display name, e.g. "Kočička" */
  name: string;
  palette: SpeciesPalette;
  /** behind the body (outer ears, wings, mane back) */
  EarsBack?: ComponentType<LayerProps>;
  /** in front of the body, behind the face (inner ear detail) */
  EarsFront?: ComponentType<LayerProps>;
  /** tail — rendered behind body for most, set `tailInFront` to flip */
  Tail?: ComponentType<LayerProps>;
  tailInFront?: boolean;
  /** horn, wings, mane, spikes… rendered above body, below face */
  Extras?: ComponentType<LayerProps>;
  /** muzzle / nose overlay rendered above the face baseline */
  Snout?: ComponentType<LayerProps>;
  /** egg decoration pattern (dots, zigzag…) drawn on the shared egg */
  EggPattern?: ComponentType<LayerProps>;
  /** shift the whole face by a few px if the species head sits differently */
  faceOffsetY?: number;
}

/** What the rig needs to draw one pet. */
export interface PetAvatarProps {
  species: PetSpecies;
  stage: PetStage;
  mood: PetMood;
  /** worn accessories per slot (item ids from item-catalog) */
  outfit?: Partial<Record<AccessorySlot, string>>;
  evolutionPath?: EvolutionPath | null;
  /** px size of the square svg (default 160) */
  size?: number;
  /** disable idle animations (lists, nav) */
  still?: boolean;
  /** bump to trigger a happy bounce */
  bounceKey?: number;
  className?: string;
}

// Single source of truth for slots is the item catalog (`slot` field on ItemDef).
export type { AccessorySlot } from '@/lib/item-catalog';

/** Stage → uniform scale of the whole pet (anchored at ground center 100,170). */
export const STAGE_SCALE: Record<PetStage, number> = {
  egg: 1,
  baby: 0.62,
  child: 0.76,
  teen: 0.9,
  adult: 1,
  legendary: 1.04,
};

export const EYE_DARK = '#3F3244';
export const BLUSH = '#FB7185';
