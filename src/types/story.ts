// Interactive story engine — shared API + client types.
// One story = a session of AI-generated segments, each ending with choices.
// A book character may cameo mid-story (see src/lib/story-cameos.ts).

export interface StoryChoice {
  id: string;      // 'a' | 'b' | 'c'
  label: string;   // short, action-first, czech (max ~8 words)
}

export interface StorySegment {
  text: string;              // 2-4 short paragraphs, czech
  choices: StoryChoice[];    // empty on the final segment
  chosen?: string;           // choice id the reader picked (filled client-side)
  cameoId?: string;          // set when a book character enters in this segment
}

export interface StorySetup {
  heroName: string;          // Viki
  petName: string;           // her pet joins as sidekick
  petSpecies: string;
  genre: string;             // from GENRES
  setting?: string;
  /** wish from the reader, free text (optional) */
  extras?: string;
}

/** POST /api/story/interactive request */
export interface StoryStepRequest {
  setup: StorySetup;
  /** segments so far (text + chosen); empty array = start a new story */
  history: { text: string; chosen?: string; cameoId?: string }[];
  /** which segment index we are asking for (0-based) */
  step: number;
  /** total planned segments for this story */
  plannedSteps: number;
  /** cameo to introduce in THIS segment (client rolls the dice — server obeys) */
  introduceCameoId?: string;
}

/** POST /api/story/interactive response */
export interface StoryStepResponse {
  success: boolean;
  segment?: StorySegment;
  /** present only on the final step */
  title?: string;
  moral?: string;
  error?: string;
}

export interface SavedStory {
  id: string;
  title: string;
  genre: string;
  segments: StorySegment[];
  cameoId: string | null;
  createdAt: string;
}

// Reading log ("Čtenářský deníček")
export type ReadingStatus = 'wishlist' | 'reading' | 'done';

export interface ReadingLogEntry {
  id: string;
  bookTitle: string;
  author: string | null;
  cameoId: string | null;
  status: ReadingStatus;
  createdAt: string;
  finishedAt: string | null;
}

export const GENRES: { id: string; label: string; emoji: string }[] = [
  { id: 'dobrodruzstvi', label: 'Dobrodružství', emoji: '🗺️' },
  { id: 'kouzla', label: 'Kouzla a magie', emoji: '✨' },
  { id: 'detektivka', label: 'Detektivka', emoji: '🔍' },
  { id: 'zviratka', label: 'Zvířátka', emoji: '🐾' },
  { id: 'vesmir', label: 'Vesmír', emoji: '🚀' },
  { id: 'humor', label: 'Legrace', emoji: '😜' },
];
