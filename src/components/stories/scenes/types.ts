// Story scene banners — an illustrated backdrop for every chapter screen
// (research principle: never a text-only page).
//
// CONTRACT
// - One component per genre (GENRES in src/types/story.ts), registered in
//   ./index.ts as SCENES[genreId].
// - <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice"> filling
//   its container (width/height 100%). Decorative only — the StoryReader
//   overlays the MiniPet at bottom-center and the cameo bubble itself, so
//   keep the bottom-center area (x 120–240, y 150–200) visually calm.
// - `variant` tells the journey stage — the art should progress:
//     0 = setkání   (intro: open, inviting, morning light)
//     1 = hloubka   (mid-story: denser, more mysterious, deeper colors)
//     2 = finále    (finale: celebratory, warm glow, sparkles)
// - Brand palette + soft darker outlines, never black (see brand/BRAND.md and
//   src/components/pet/room/parts.tsx for the drawing style).
// - Gentle idle CSS animations inside a <style> tag (clouds drift, stars
//   twinkle) with `@media (prefers-reduced-motion: reduce)` disabling them.
//   Namespace ids/classes with the genre (e.g. `bubsc-kouzla-…`) — several
//   scenes can be mounted during one session.

export interface StorySceneProps {
  /** journey stage 0 | 1 | 2 — see contract above */
  variant: number;
}

export type StorySceneComponent = (props: StorySceneProps) => React.ReactElement;

/** Map a 0-based segment index within a planned total onto a journey stage. */
export function variantForStep(step: number, plannedSteps: number): number {
  if (plannedSteps <= 1) return 2;
  const t = step / (plannedSteps - 1);
  if (t < 0.34) return 0;
  if (t < 0.75) return 1;
  return 2;
}
