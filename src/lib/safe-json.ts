/**
 * Safe JSON parser for Gemini API responses.
 * Handles: plain JSON, markdown code blocks, partial responses.
 */
export function safeParseJSON<T = unknown>(text: string): T | null {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch { /* continue */ }
  }

  // Try finding first { ... } or [ ... ]
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    } catch { /* continue */ }
  }

  return null;
}
