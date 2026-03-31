const STOP_WORDS = new Set([
  'the',
  'and',
  'or',
  'for',
  'with',
  'from',
  'that',
  'this',
  'using',
  'use',
  'used',
  'are',
  'is',
  'of',
  'to',
  'a',
  'an',
  'on',
  'in',
  'by',
  'as',
  'be',
  'it',
  'at',
  'if',
  'all',
  'do',
  'not',
  'must',
  'can',
  'you',
  'your',
  'how',
  'more',
  'out',
  'any',
  'new',
  'via',
  'than',
  'only',
  'also',
  'into',
  'their',
  'there',
  'these',
  'those',
  'they',
  'them',
  'such',
  'have',
  'has',
  'had',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'shall',
  'through',
  'which',
  'what',
  'who',
  'whom',
  'whose',
  'need',
  'needs',
  'needed',
  'getting',
])

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '')
    .trim()
}

function isUsefulKeyword(word: string): boolean {
  if (word.length < 3) {
    return false
  }

  if (STOP_WORDS.has(word)) {
    return false
  }

  // filter out very long words that are unlikely to be useful keywords (e.g. long URLs, hashes, or random strings)
  if (word.length > 25) {
    return false
  }

  // filter out words that are purely numeric, as they are unlikely to be useful keywords in this context
  if (/^\d+$/.test(word)) {
    return false
  }

  return true
}

export function extractKeywords(
  chunk: string,
  options?: {
    title?: string
    category?: string
    description?: string
    maxKeywords?: number
  },
): string[] {
  const maxKeywords = options?.maxKeywords ?? 10

  const allText = [
    options?.title ?? '',
    options?.category ?? '',
    options?.description ?? '',
    chunk,
  ].join(' ')

  const tokens = allText.split(/\s+/).map(normalizeWord).filter(isUsefulKeyword)

  const frequency = new Map<string, number>()

  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1)
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
