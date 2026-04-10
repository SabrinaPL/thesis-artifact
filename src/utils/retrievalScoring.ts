/**
 * Function used to normalize a term by converting it to lowercase, removing non-alphanumeric characters (except for underscores and hyphens), and trimming whitespace. This helps to standardize terms for better matching and scoring in retrieval.
 * @param term - The term to normalize.
 * @returns The normalized term.
 */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '')
    .trim()
}

/**
 * Function to extract query terms from a given query string by splitting it into individual terms, normalizing each term, and filtering out short terms. This is used to prepare the query for keyword overlap scoring against document keywords.
 * @param query - The query string to extract terms from.
 * @returns An array of normalized query terms.
 */
export function extractQueryTerms(query: string): string[] {
  return query
    .split(/\s+/)
    .map(normalizeTerm)
    .filter((term) => term.length >= 3)
}

/**
 * Function to calculate a keyword overlap score between the query terms and the document keywords, by counting the number of matching terms and dividing by the total number of query terms. This provides a simple relevance score based on how many of the query terms are present in the document's keywords.
 * @param queryTerms - An array of normalized query terms.
 * @param keywords - An array of normalized document keywords.
 * @returns A number representing the keyword overlap score, ranging from 0 to 1.
 */
export function keywordOverlapScore(
  queryTerms: string[],
  keywords: string[],
): number {
  if (queryTerms.length === 0 || keywords.length === 0) {
    return 0
  }

  const keywordSet = new Set(keywords.map(normalizeTerm))
  let matches = 0

  for (const term of queryTerms) {
    if (keywordSet.has(term)) {
      matches += 1
    }
  }

  return matches / queryTerms.length
}

const DEFAULT_CATEGORY_KEYWORDS = [
  'terraform',
  'ansible',
  'openstack',
  'security',
  'clean code',
  'ci cd',
  'gitlab',
  'github actions',
  'nginx',
  'nfs',
  'yaml',
  'load balancing',
  'load balancer',
  'basics',
  'beginners',
  'iac',
]

/**
 * Function that loads category keywords from the environment variable CATEGORY_KEYWORDS.
 * If the environment variable is not set, it returns the default category keywords.
 * The result is cached at module scope after the first call to avoid repeated parsing.
 *
 * @returns An array of category keywords.
 */
let cachedCategoryKeywords: string[] | null = null

function loadCategoryKeywords(): string[] {
  if (cachedCategoryKeywords) return cachedCategoryKeywords

  const raw = process.env.CATEGORY_KEYWORDS
  cachedCategoryKeywords = raw
    ? raw
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0)
    : DEFAULT_CATEGORY_KEYWORDS

  return cachedCategoryKeywords
}

/**
 * Function to calculate a category match score between the query and the document category, by counting the number of matching keywords from a predefined list of category keywords.
 * This provides a simple relevance score based on how many of the category keywords are present in both the query and the document category.
 *
 * @param query - The original query string.
 * @param category - The category of the document.
 * @returns A number representing the category match score, which can be used to rank retrieved documents.
 */
export function categoryMatchScore(query: string, category: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, ' ')
  const q = normalize(query)
  const c = normalize(category)

  if (!c) return 0

  const keywords = loadCategoryKeywords()
  let score = 0

  for (const keyword of keywords) {
    if (q.includes(keyword) && c.includes(keyword)) {
      score += 1
    }
  }

  return score
}
