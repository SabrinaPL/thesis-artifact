import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DocumentIngestion } from '../src/modules/DocumentIngestion.js'
import { getParser } from '../src/utils/parserSelector.js'
import { retrieveDocuments } from '../src/utils/urlRetriever.js'
import { chunkText } from '../src/utils/textChunker.js'
import { createEmbedding } from '../src/utils/embedder.js'
import { closeBrowser } from '../src/utils/parser.js'
import { createDocumentHash } from '../src/utils/hashDocument.js'

vi.mock('../src/utils/parserSelector.js', () => ({
  getParser: vi.fn(),
}))

vi.mock('../src/utils/urlRetriever.js', () => ({
  retrieveDocuments: vi.fn(),
}))

vi.mock('../src/utils/textChunker.js', () => ({
  chunkText: vi.fn(),
}))

vi.mock('../src/utils/embedder.js', () => ({
  createEmbedding: vi.fn(),
}))

vi.mock('../src/utils/parser.js', () => ({
  closeBrowser: vi.fn(),
}))

vi.mock('../src/utils/hashDocument.js', () => ({
  createDocumentHash: vi.fn(),
}))

describe('DocumentIngestion', () => {
  const mockInsertToDB = vi.fn()
  const mockFindDocumentBySource = vi.fn()
  const mockDeleteDocumentsBySource = vi.fn()
  const mockUpsertSourceDocument = vi.fn()

  const mockGetAllDocuments = vi.fn()
  const mockGetDocumentsBySource = vi.fn()

  const mockVectorDBStore = {
    insertToDB: mockInsertToDB,
    findDocumentBySource: mockFindDocumentBySource,
    deleteDocumentsBySource: mockDeleteDocumentsBySource,
    upsertSourceDocument: mockUpsertSourceDocument,
    getAllDocuments: mockGetAllDocuments,
    getDocumentsBySource: mockGetDocumentsBySource,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    mockGetAllDocuments.mockResolvedValue([])
    mockGetDocumentsBySource.mockResolvedValue([])
    mockFindDocumentBySource.mockResolvedValue(null)
    mockDeleteDocumentsBySource.mockResolvedValue(undefined)
    mockUpsertSourceDocument.mockResolvedValue(undefined)
    mockInsertToDB.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call ingestDocument for each retrieved document', async () => {
    const docs = [
      {
        url: 'https://example.com/doc1',
        category: 'test',
        description: 'Document 1',
      },
      {
        url: 'https://example.com/doc2',
        category: 'test',
        description: 'Document 2',
      },
    ]

    vi.mocked(retrieveDocuments).mockReturnValue(docs)

    const ingestion = new DocumentIngestion(mockVectorDBStore)
    const ingestDocumentSpy = vi
      .spyOn(ingestion, 'ingestDocument')
      .mockResolvedValue(undefined)

    await ingestion.ingestDocuments()

    expect(ingestDocumentSpy).toHaveBeenCalledTimes(2)
    expect(ingestDocumentSpy).toHaveBeenNthCalledWith(1, docs[0])
    expect(ingestDocumentSpy).toHaveBeenNthCalledWith(2, docs[1])
    expect(closeBrowser).toHaveBeenCalledTimes(1)
  })

  it('should skip ingestion if parsed document text is empty', async () => {
    const document = {
      url: 'https://example.com/empty-doc',
      category: 'test',
      description: 'Empty document',
    }

    const mockParser = vi.fn().mockResolvedValue({
      text: '   ',
      title: 'Empty doc',
      metadata: { title: 'Empty doc', source: document.url },
    })

    vi.mocked(getParser).mockResolvedValue(mockParser)

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument(document)

    expect(mockParser).toHaveBeenCalledWith(document.url)
    expect(chunkText).not.toHaveBeenCalled()
    expect(createEmbedding).not.toHaveBeenCalled()
    expect(mockFindDocumentBySource).not.toHaveBeenCalled()
    expect(mockUpsertSourceDocument).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
  })

  it('should chunk text, generate embeddings, and store chunks for a parsed document', async () => {
    const document = {
      url: 'https://example.com/new-doc',
      category: 'test_category',
      description: 'New document description',
    }

    const mockParser = vi.fn().mockResolvedValue({
      text: 'This is a new document. It has multiple parts.',
      title: 'New doc',
      metadata: { title: 'New doc', source: document.url },
    })

    vi.mocked(getParser).mockResolvedValue(mockParser)
    vi.mocked(createDocumentHash).mockReturnValue('fake-hash-123')

    vi.mocked(chunkText).mockReturnValue([
      'This is chunk 1.',
      'This is chunk 2.',
    ])

    vi.mocked(createEmbedding)
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6])

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument(document)

    expect(mockParser).toHaveBeenCalledWith(document.url)

    expect(chunkText).toHaveBeenCalledWith(
      'This is a new document. It has multiple parts.',
    )

    expect(mockFindDocumentBySource).toHaveBeenCalledWith(document.url)

    expect(mockUpsertSourceDocument).toHaveBeenCalledWith({
      source: document.url,
      documentHash: 'fake-hash-123',
      title: 'New doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'New doc',
        source: document.url,
      },
    })

    expect(createEmbedding).toHaveBeenCalledTimes(2)
    expect(createEmbedding).toHaveBeenNthCalledWith(1, 'This is chunk 1.')
    expect(createEmbedding).toHaveBeenNthCalledWith(2, 'This is chunk 2.')

    expect(mockInsertToDB).toHaveBeenCalledTimes(2)

    expect(mockInsertToDB).toHaveBeenNthCalledWith(
      1,
      'This is chunk 1.',
      [0.1, 0.2, 0.3],
      {
        title: 'New doc',
        source: document.url,
        category: document.category,
        description: document.description,
        documentHash: 'fake-hash-123',
        chunkIndex: 0,
      },
    )

    expect(mockInsertToDB).toHaveBeenNthCalledWith(
      2,
      'This is chunk 2.',
      [0.4, 0.5, 0.6],
      {
        title: 'New doc',
        source: document.url,
        category: document.category,
        description: document.description,
        documentHash: 'fake-hash-123',
        chunkIndex: 1,
      },
    )
  })

  it('should skip ingestion if document already exists and hash is unchanged', async () => {
    const document = {
      url: 'https://example.com/existing-doc',
      category: 'test_category',
      description: 'Existing document description',
    }

    const mockParser = vi.fn().mockResolvedValue({
      text: 'This document already exists.',
      title: 'Existing doc',
      metadata: { title: 'Existing doc', source: document.url },
    })

    vi.mocked(getParser).mockResolvedValue(mockParser)
    vi.mocked(createDocumentHash).mockReturnValue('same-hash-123')

    mockFindDocumentBySource.mockResolvedValue({
      source: document.url,
      documentHash: 'same-hash-123',
      title: 'Existing doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc',
        source: document.url,
      },
    })

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument(document)

    expect(mockParser).toHaveBeenCalledWith(document.url)
    expect(createDocumentHash).toHaveBeenCalledWith(
      'This document already exists.',
    )
    expect(mockFindDocumentBySource).toHaveBeenCalledWith(document.url)

    expect(chunkText).not.toHaveBeenCalled()
    expect(createEmbedding).not.toHaveBeenCalled()
    expect(mockDeleteDocumentsBySource).not.toHaveBeenCalled()
    expect(mockUpsertSourceDocument).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
  })

  it('should replace old chunks and re-ingest if document already exists and hash has changed', async () => {
    const document = {
      url: 'https://example.com/existing-doc',
      category: 'test_category',
      description: 'Existing document description',
    }

    const mockParser = vi.fn().mockResolvedValue({
      text: 'This document has changed.',
      title: 'Existing doc updated',
      metadata: { title: 'Existing doc updated', source: document.url },
    })

    vi.mocked(getParser).mockResolvedValue(mockParser)
    vi.mocked(createDocumentHash).mockReturnValue('new-hash-456')

    mockFindDocumentBySource.mockResolvedValue({
      source: document.url,
      documentHash: 'old-hash-123',
      title: 'Existing doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc',
        source: document.url,
      },
    })

    vi.mocked(chunkText).mockReturnValue([
      'Updated chunk 1.',
      'Updated chunk 2.',
    ])

    vi.mocked(createEmbedding)
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6])

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument(document)

    expect(mockFindDocumentBySource).toHaveBeenCalledWith(document.url)
    expect(mockDeleteDocumentsBySource).toHaveBeenCalledWith(document.url)

    expect(mockUpsertSourceDocument).toHaveBeenCalledWith({
      source: document.url,
      documentHash: 'new-hash-456',
      title: 'Existing doc updated',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc updated',
        source: document.url,
      },
    })

    expect(chunkText).toHaveBeenCalledWith('This document has changed.')
    expect(createEmbedding).toHaveBeenCalledTimes(2)
    expect(mockInsertToDB).toHaveBeenCalledTimes(2)
  })
})
