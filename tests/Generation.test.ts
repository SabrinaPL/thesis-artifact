import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Generation } from '../src/modules/Generation.js'
import type { LLMInterface } from '../src/types/LLMInterface.js'
import type { StoredDocument } from '../src/types/StoredDocument.js'

describe('Generation', () => {
  let mockLLM: LLMInterface

  const docs: StoredDocument[] = [
    {
      text: 'Terraform OpenStack documentation chunk',
      embedding: [0.1, 0.2],
      source: 'https://example.com/doc1',
      documentHash: 'hash-1',
      chunkIndex: 0,
      title: 'Terraform docs',
      category: 'terraform_docs',
      description: 'Terraform documentation',
      keywords: ['terraform', 'openstack'],
      metadata: { title: 'Terraform docs' },
    },
  ]

  beforeEach(() => {
    mockLLM = {
      generate: vi.fn().mockResolvedValue('generated iac content'),
    }
  })

  it('should build context and call llm.generate', async () => {
    const generation = new Generation(mockLLM)

    const result = await generation.generate('Generate Terraform config', docs)

    expect(mockLLM.generate).toHaveBeenCalledTimes(1)
    expect(mockLLM.generate).toHaveBeenCalledWith(
      expect.stringContaining('Document 1'),
      'Generate Terraform config',
    )

    expect(result).toEqual({
      content: 'generated iac content',
    })
  })
})
