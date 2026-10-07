// The least thinking a Gemini model actually honours.
//
// Gemini 3 counts its thought tokens into maxOutputTokens and bills them as
// output. Measured 24. 9. 2026 on the live API (median thought tokens):
//
//   model                    thinkingBudget: 0   thinkingLevel low   minimal
//   gemini-3-flash-preview   0                   610                 0
//   gemini-3.5-flash         0                   570                 0
//   gemini-3.7-flash         550 (ignored)       460                 HTTP 400
//   gemini-3.8-flash         0 (not always)      0                   HTTP 400
//
// So thinkingBudget: 0 stops working the moment the model is swapped for
// 3.7/3.8, and `low` is not the floor everywhere — on models that accept
// `minimal` it adds ~600 thought tokens. With no thinking config at all,
// gemini-3-flash-preview thought 240–980 tokens: the 256-token proactive
// message came back empty and the 1024-token weather advice was cut to
// invalid JSON on 3 of 3 calls.
//
// thinkingBudget is only sent to gemini-2* models: Google's notice of
// 7. 10. 2026 says upcoming models reject it with 400, so every other model
// (3.x and unknown future ids such as gemini-4-flash) gets a thinkingLevel.

export type ThinkingConfig =
  | { thinkingBudget: 0 }
  | { thinkingLevel: 'minimal' | 'low' };

const MINIMAL_LEVEL_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
]);

export function leastThinking(model: string): ThinkingConfig {
  const id = model.replace(/^models\//, '');
  // thinkingBudget is only for 2.x; Google rejects it on upcoming models (notice 7. 10. 2026).
  if (id.startsWith('gemini-2')) return { thinkingBudget: 0 };
  return MINIMAL_LEVEL_MODELS.has(id) ? { thinkingLevel: 'minimal' } : { thinkingLevel: 'low' };
}

/**
 * Sampling knobs only reach models that still use them. Google pinned temperature/topP/topK to defaults from
 * gemini-3.6-flash on and upcoming models reject them with 400 (notice 7. 10. 2026); older models still honour
 * them, so they keep today's behaviour.
 */
const SAMPLING_MODELS = /^gemini-(2\.|3-|3\.1-|3\.5-)/;

export function sampling<T extends { temperature?: number; topP?: number; topK?: number }>(
  model: string,
  params: T,
): Partial<T> {
  return SAMPLING_MODELS.test(model.replace(/^models\//, '')) ? params : {};
}

/** Room for what `low` still thinks on 3.7/3.8 Flash (up to ~740 tokens measured). */
export const THINKING_HEADROOM = 1200;
