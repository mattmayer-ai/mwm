import type { TonePreset } from './prompts';

const PERSONAL_KEYWORDS = [
  'personal story',
  'therapy',
  'mental health',
  'rage piece',
  'very personal',
  'healing',
  'trauma',
  'personal journey',
  'your story',
];

/**
 * Pick appropriate tone based on user input and context
 */
export function pickTone(
  input: string,
  routeScope?: string,
  allowPersonal = false
): TonePreset {
  const q = (input || '').toLowerCase();

  // If the user is on a project/case page or asks "how did you decide…", use narrative
  const narrativeHint =
    /how did (you|y'all|your team) decide|tell me the story|what happened|journey|why did you|walk me through/i.test(q) ||
    (routeScope?.startsWith('project-') ?? false);

  if (narrativeHint) return 'narrative';

  // Only allow personal tone if explicit request + flag
  const explicitlyPersonal = PERSONAL_KEYWORDS.some((k) => q.includes(k));
  if (explicitlyPersonal && allowPersonal) return 'personal';

  return 'professional';
}

