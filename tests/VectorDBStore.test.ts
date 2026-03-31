import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VectorDocumentModelType } from '../src/models/VectorDocumentModel.js'
import type { IngestedSourceDocumentModelType } from '../src/models/IngestedSourceDocumentModel.js'
import { VectorDBStore } from '../src/repositories/VectorDBStore.js'

describe('VectorDBStore', () => {
  let vectorDocumentModel: VectorDocumentModelType
  let ingestedSourceDocumentModel: IngestedSourceDocumentModelType

  beforeEach(() => {
    vectorDocumentModel = {
      create: vi.fn(),
      find: vi.fn(),
      deleteMany: vi.fn(),
    } as unknown as VectorDocumentModelType

    ingestedSourceDocumentModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    } as unknown as IngestedSourceDocumentModelType
  })

    it('should insert chunk into db', async () => {
    vi.mocked(vectorDocumentModel.create).mockResolvedValue({ _id: 'abc123' } as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    await store.insertToDB('chunk text', [0.1, 0.2], {
      source: 'https://example.com',
      documentHash: 'hash-1',
      chunkIndex: 0,
      title: 'Doc',
      category: 'terraform_docs',
      description: 'desc',
      keywords: ['terraform'],
    })

    expect(vectorDocumentModel.create).toHaveBeenCalledWith({
      text: 'chunk text',
      embedding: [0.1, 0.2],
      source: 'https://example.com',
      documentHash: 'hash-1',
      chunkIndex: 0,
      title: 'Doc',
      category: 'terraform_docs',
      description: 'desc',
      keywords: ['terraform'],
      metadata: {
        source: 'https://example.com',
        documentHash: 'hash-1',
        chunkIndex: 0,
        title: 'Doc',
        category: 'terraform_docs',
        description: 'desc',
        keywords: ['terraform'],
      },
    })
  })

  it('should return all documents with fallback values', async () => {
    vi.mocked(vectorDocumentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          text: 'chunk',
          embedding: [0.1, 0.2],
          source: 'https://example.com',
          documentHash: 'hash-1',
          chunkIndex: 0,
          metadata: {},
        },
      ]),
    } as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    const result = await store.getAllDocuments()

    expect(result).toEqual([
      {
        text: 'chunk',
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
  })

  it('should return source document when found', async () => {
    vi.mocked(ingestedSourceDocumentModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        source: 'https://example.com',
        documentHash: 'hash-1',
        title: 'Doc',
        category: 'terraform_docs',
        description: 'desc',
        metadata: {},
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      }),
    } as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    const result = await store.findDocumentBySource('https://example.com')

    expect(result?.source).toBe('https://example.com')
    expect(result?.documentHash).toBe('hash-1')
  })

  it('should return null if source document is not found', async () => {
    vi.mocked(ingestedSourceDocumentModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    const result = await store.findDocumentBySource('https://example.com')
    expect(result).toBeNull()
  })

  it('should return documents by source', async () => {
    vi.mocked(vectorDocumentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          text: 'chunk',
          embedding: [0.1, 0.2],
          source: 'https://example.com',
          documentHash: 'hash-1',
          chunkIndex: 0,
          title: 'Doc',
          category: 'terraform_docs',
          description: 'desc',
          keywords: ['terraform'],
          metadata: {},
        },
      ]),
    } as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    const result = await store.getDocumentsBySource('https://example.com')

    expect(vectorDocumentModel.find).toHaveBeenCalledWith({
      source: 'https://example.com',
    })
    expect(result).toHaveLength(1)
  })

  it('should upsert source document', async () => {
    vi.mocked(ingestedSourceDocumentModel.findOneAndUpdate).mockResolvedValue(
      undefined as never,
    )

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    await store.upsertSourceDocument({
      source: 'https://example.com',
      documentHash: 'hash-1',
      title: 'Doc',
      category: 'terraform_docs',
      description: 'desc',
      metadata: {},
    })

    expect(ingestedSourceDocumentModel.findOneAndUpdate).toHaveBeenCalledWith(
      { source: 'https://example.com' },
      {
        source: 'https://example.com',
        documentHash: 'hash-1',
        title: 'Doc',
        category: 'terraform_docs',
        description: 'desc',
        metadata: {},
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    )
  })

  it('should delete documents by source', async () => {
    vi.mocked(vectorDocumentModel.deleteMany).mockResolvedValue(undefined as never)

    const store = new VectorDBStore(
      vectorDocumentModel,
      ingestedSourceDocumentModel,
    )

    await store.deleteDocumentsBySource('https://example.com')

    expect(vectorDocumentModel.deleteMany).toHaveBeenCalledWith({
      source: 'https://example.com',
    })
  })
})