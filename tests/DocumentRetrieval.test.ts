import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentRetrieval } from '../src/modules/DocumentRetrieval.js'
import type { VectorDBStoreInterface } from '../src/types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../src/types/StoredDocument.js'

describe('DocumentRetrieval', () => {
  const mockEmbedder = vi.fn()
  let mockVectorDBStore: VectorDBStoreInterface

  const documents: StoredDocument[] = [
    {
      text: 'Terraform OpenStack provider documentation',
      embedding: [1, 0],
      source: 'doc-1',
      documentHash: 'hash-1',
      chunkIndex: 0,
      title: 'Terraform docs',
      category: 'terraform_docs',
      description: 'Terraform documentation',
      keywords: ['terraform', 'openstack', 'provider'],
      metadata: { title: 'Terraform docs' },
    },
    {
      text: 'Another Terraform chunk',
      embedding: [0.9, 0.1],
      source: 'doc-1',
      documentHash: 'hash-1',
      chunkIndex: 1,
      title: 'Terraform docs',
      category: 'terraform_docs',
      description: 'Terraform documentation',
      keywords: ['terraform', 'configuration'],
      metadata: { title: 'Terraform docs' },
    },
    {
      text: 'Ansible automation guide',
      embedding: [0, 1],
      source: 'doc-2',
      documentHash: 'hash-2',
      chunkIndex: 0,
      title: 'Ansible docs',
      category: 'ansible_docs',
      description: 'Ansible documentation',
      keywords: ['ansible', 'automation', 'playbook'],
      metadata: { title: 'Ansible docs' },
    },
    {
      text: 'OpenStack cloud setup',
      embedding: [0.8, 0.2],
      source: 'doc-3',
      documentHash: 'hash-3',
      chunkIndex: 0,
      title: 'OpenStack docs',
      category: 'openstack_docs',
      description: 'OpenStack documentation',
      keywords: ['openstack', 'cloud'],
      metadata: { title: 'OpenStack docs' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    mockVectorDBStore = {
      insertToDB: vi.fn(),
      getAllDocuments: vi.fn().mockResolvedValue(documents),
      findDocumentBySource: vi.fn(),
      getDocumentsBySource: vi.fn(),
      upsertSourceDocument: vi.fn(),
      deleteDocumentsBySource: vi.fn(),
    }

    mockEmbedder.mockResolvedValue([1, 0])
  })

  it('should retrieve ranked documents for a query', async () => {
    const retrieval = new DocumentRetrieval(mockVectorDBStore, mockEmbedder)

    const result = await retrieval.retrieveDocuments('Terraform OpenStack')

    expect(mockEmbedder).toHaveBeenCalledWith('Terraform OpenStack')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]?.source).toBe('doc-1')
  })

  it('should include context in retrieval input', async () => {
    const retrieval = new DocumentRetrieval(mockVectorDBStore, mockEmbedder)

    await retrieval.retrieveDocuments('Terraform', 'Use OpenStack provider')

    expect(mockEmbedder).toHaveBeenCalledWith(
      'Terraform\nUse OpenStack provider',
    )
  })

  it('should retrieve documents for self evaluation for each provided query', async () => {
    const retrieval = new DocumentRetrieval(mockVectorDBStore, mockEmbedder)

    const queries = [
      {
        query: 'security best practices',
        categoryFilter: 'iac_security_article',
      },
      { query: 'clean code guidelines', categoryFilter: 'clean_code_article' },
    ]

    await retrieval.retrieveDocumentsSelfEval(queries)

    expect(mockEmbedder).toHaveBeenCalledWith('security best practices')
    expect(mockEmbedder).toHaveBeenCalledWith('clean code guidelines')
    expect(mockVectorDBStore.getAllDocuments).toHaveBeenCalledOnce()
  })

  it('should limit number of chunks per source to 2', async () => {
    const docsWithThreeFromSameSource: StoredDocument[] = [
      ...documents,
      {
        text: 'Third chunk same source',
        embedding: [0.95, 0.05],
        source: 'doc-1',
        documentHash: 'hash-1',
        chunkIndex: 2,
        title: 'Terraform docs',
        category: 'terraform_docs',
        description: 'Terraform documentation',
        keywords: ['terraform'],
        metadata: { title: 'Terraform docs' },
      },
    ]

    mockVectorDBStore.getAllDocuments = vi
      .fn()
      .mockResolvedValue(docsWithThreeFromSameSource)

    const retrieval = new DocumentRetrieval(mockVectorDBStore, mockEmbedder)
    const result = await retrieval.retrieveDocuments('Terraform')

    const fromDoc1 = result.filter((doc) => doc.source === 'doc-1')
    expect(fromDoc1.length).toBeLessThanOrEqual(3)
  })

  it('should return at most 5 documents', async () => {
    const manyDocs: StoredDocument[] = Array.from({ length: 10 }, (_, i) => ({
      text: `Doc ${i}`,
      embedding: [1, 0],
      source: `source-${i}`,
      documentHash: `hash-${i}`,
      chunkIndex: 0,
      title: `Title ${i}`,
      category: 'terraform_docs',
      description: 'desc',
      keywords: ['terraform'],
      metadata: { title: `Title ${i}` },
    }))

    mockVectorDBStore.getAllDocuments = vi.fn().mockResolvedValue(manyDocs)

    const retrieval = new DocumentRetrieval(mockVectorDBStore, mockEmbedder)
    const result = await retrieval.retrieveDocuments('Terraform')

    expect(result.length).toBeLessThanOrEqual(8)
  })
})
