/** Human-friendly copy — no jargon in user-facing strings. */

export const PRODUCT_TAGLINE = 'Ask your family memories anything — and see where every answer came from.';

export const PRODUCT_SUBLINE =
  'Photos, letters, and notes become conversations, connections, and stories you can share. Private AI runs on your machine.';

export const LOADING_APP = 'Opening your memories…';

export const LOADING_SIGN_IN = 'Taking you to sign in…';

export const SEED_BUTTON = 'Load sample archive';

export const SEED_BUSY = 'Organizing sample memories';

export const SEED_SUCCESS =
  'Sample family loaded — grandfather, father, Mumbai, and more. Add your own files anytime.';

export const AUTO_SEED_HINT = 'We loaded a sample family so you can explore right away.';

export const ASK_PLACEHOLDER = 'What do we know about grandfather?';

export const ASK_TITLE = 'Every answer shows its sources';

export const ASK_BODY =
  'Ask in plain English. You will see the exact memories behind each answer — not guesses from the internet.';

export const ASK_SUBMIT = 'Ask';

export const SOURCES_TITLE = 'Where this answer came from';

export const CHAPTER_TITLE = 'Build a life chapter';

export const CHAPTER_BODY =
  'Describe a person and a time of life (for example, father in his twenties). We turn matching memories into a story.';

export const BIRTH_YEAR_LABEL = 'Birth year (helps with age ranges)';

export const CHAPTER_BUILD = 'Create chapter';

export const CHAPTER_BUSY = 'Creating your chapter';

export const ASK_BUSY = 'Reading your memories';

export const GRAPH_TITLE = 'How your family connects';

export const GRAPH_BODY =
  'Tap a person to see their memories. Lines show relationships discovered from your files.';

export const GRAPH_EMPTY = 'Load the sample family to see people and places connect.';

export const GRAPH_NODES_HINT = (people: number, links: number) =>
  `${people} people & places · ${links} connections`;

export const ONBOARDING_STEPS = [
  {
    title: 'See a sample family',
    body: 'We will load a few stories so you can try Ask and Stories without uploading anything.',
    actionLabel: 'Load sample family',
  },
  {
    title: 'Ask a question',
    body: 'Try asking about grandfather — you will see which memories the answer came from.',
    actionLabel: 'Ask about grandfather',
  },
  {
    title: 'Create a life chapter',
    body: 'Turn memories into a story for a person and time of life, like father in his twenties.',
    actionLabel: "Create father's twenties chapter",
  },
] as const;

export const JOURNEY_STAGES = [
  'Reading your files',
  'Finding people and places',
  'Understanding moments',
  'Connecting relationships',
  'Building your timeline',
  'Ready to explore',
];

export const SUGGESTED_PROMPTS = [
  'What do we know about grandfather?',
  "Tell me about father's life between age 20 and 30",
  'Which places shaped our family story?',
  'What moments feel most meaningful?',
];

export const COLLECTION_STRENGTH = 'Collection strength';
