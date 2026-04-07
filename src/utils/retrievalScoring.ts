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

/**
 * Function to calculate a combined relevance score for a document based on both keyword overlap and category match, by weighting the keyword overlap score and category match score and summing them. This allows for a more nuanced relevance scoring that takes into account both the presence of relevant keywords and the alignment of the document's category with the query's intent.
 * @param query - The original query string.
 * @param queryTerms - An array of normalized query terms extracted from the query.
 * @param keywords - An array of normalized document keywords.
 * @param category - The category of the document.
 * @returns A number representing the combined relevance score, which can be used to rank retrieved documents.
 */
export function categoryMatchScore(query: string, category: string): number {
  const q = query.toLowerCase()
  const c = category.toLowerCase()

  if (!c) return 0

  if (q.includes('terraform') && c.includes('terraform')) return 1
  if (q.includes('ansible') && c.includes('ansible')) return 1
  if (q.includes('openstack') && c.includes('openstack')) return 1
  if (
    (q.includes('security') ||
      q.includes('misconfigurations') ||
      q.includes('vulnerabilities')) &&
    c.includes('security')
  )
    return 1
  if (
    (q.includes('clean code') ||
      q.includes('code quality') ||
      q.includes('maintainable')) &&
    c.includes('clean_code')
  )
    return 1

  return 0
}
