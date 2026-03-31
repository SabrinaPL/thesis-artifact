export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '')
    .trim()
}

export function extractQueryTerms(query: string): string[] {
  return query
    .split(/\s+/)
    .map(normalizeTerm)
    .filter((term) => term.length >= 3)
}

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

export function categoryMatchScore(query: string, category: string): number {
  const q = query.toLowerCase()
  const c = category.toLowerCase()

  if (!c) return 0

  if (q.includes('terraform') && c.includes('terraform')) return 1
  if (q.includes('ansible') && c.includes('ansible')) return 1
  if (q.includes('openstack') && c.includes('openstack')) return 1
  if ((q.includes('security') || q.includes('misconfigurations') || q.includes('vulnerabilities')) && c.includes('security')) return 1
  if ((q.includes('clean code') || q.includes('code quality') || q.includes('maintainable')) && c.includes('clean_code')) return 1

  return 0
}
