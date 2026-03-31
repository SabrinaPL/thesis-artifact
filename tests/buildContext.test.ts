import { describe, it, expect } from 'vitest'
import { buildContextFromDocuments } from '../src/utils/buildContext.js'

describe('buildContextFromDocuments', () => {
  it('should build readable context from documents', () => {
    const result = buildContextFromDocuments([
      {
        text: 'Example content',
        embedding: [0.1, 0.2],
        source: 'https://example.com',
        documentHash: 'hash-1',
        chunkIndex: 0,
        title: 'Example',
        category: 'terraform_docs',
        description: 'Terraform documentation',
        keywords: ['terraform', 'openstack'],
        metadata: { title: 'Example' },
      },
    ])

    expect(result).toContain('Document 1')
    expect(result).toContain('Title: Example')
    expect(result).toContain('Source: https://example.com')
    expect(result).toContain('Chunk Index: 0')
    expect(result).toContain('Content: Example content')
    expect(result).toContain('Category: terraform_docs')
    expect(result).toContain('Description: Terraform documentation')
    expect(result).toContain('Keywords: terraform, openstack')
  })

  it('should use N/A when category and description are empty strings', () => {
    const result = buildContextFromDocuments([
      {
        text: 'Example content',
        embedding: [0.1, 0.2],
        source: 'https://example.com',
        documentHash: 'hash-1',
        chunkIndex: 0,
        title: 'Example',
        category: '',
        description: '',
        keywords: [],
        metadata: { title: 'Example' },
      },
    ])

    expect(result).toContain('Category: N/A')
    expect(result).toContain('Description: N/A')
    expect(result).toContain('Keywords: N/A')
  })

  it('should use Untitled document if metadata.title is missing', () => {
    const result = buildContextFromDocuments([
      {
        text: 'Example content',
        embedding: [0.1, 0.2],
        source: 'https://example.com',
        documentHash: 'hash-1',
        chunkIndex: 0,
        title: '',
        category: '',
        description: '',
        keywords: [],
        metadata: {},
      },
    ])

    expect(result).toContain('Title: Untitled document')
  })
})