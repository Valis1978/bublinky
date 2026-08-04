import type { StorySceneComponent } from './types';
import { KouzlaScene } from './kouzla';
import { DobrodruzstviScene } from './dobrodruzstvi';
import { DetektivkaScene } from './detektivka';
import { ZviratkaScene } from './zviratka';
import { VesmirScene } from './vesmir';
import { HumorScene } from './humor';

export { variantForStep } from './types';

/** genre id (src/types/story.ts GENRES) → scene banner */
export const SCENES: Record<string, StorySceneComponent> = {
  kouzla: KouzlaScene,
  dobrodruzstvi: DobrodruzstviScene,
  detektivka: DetektivkaScene,
  zviratka: ZviratkaScene,
  vesmir: VesmirScene,
  humor: HumorScene,
};
