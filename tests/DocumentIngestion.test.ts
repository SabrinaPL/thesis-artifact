import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DocumentIngestion } from '../src/modules/DocumentIngestion.js'
import { getParser } from '../src/utils/parserSelector.js'
import { retrieveDocuments } from '../src/utils/urlRetriever.js'
import { retrievePdfDocuments } from '../src/utils/pdfRetriever.js'
import { chunkText } from '../src/utils/textChunker.js'
import { closeBrowser } from '../src/utils/parser.js'
import { createDocumentHash } from '../src/utils/hashDocument.js'
import { extractKeywords } from '../src/utils/keywordExtractor.js'
import type { VectorDBStoreInterface } from '../src/types/VectorDBStoreInterface.js'

vi.mock('../src/utils/parserSelector.js', () => ({
  getParser: vi.fn(),
}))

vi.mock('../src/utils/urlRetriever.js', () => ({
  retrieveDocuments: vi.fn(),
}))

vi.mock('../src/utils/pdfRetriever.js', () => ({
  retrievePdfDocuments: vi.fn(),
}))

vi.mock('../src/utils/textChunker.js', () => ({
  chunkText: vi.fn(),
}))

vi.mock('../src/utils/parser.js', () => ({
  closeBrowser: vi.fn(),
}))

vi.mock('../src/utils/hashDocument.js', () => ({
  createDocumentHash: vi.fn(),
}))

vi.mock('../src/utils/keywordExtractor.js', () => ({
  extractKeywords: vi.fn(),
}))

describe('DocumentIngestion', () => {
  const mockInsertToDB = vi.fn()
  const mockFindDocumentBySource = vi.fn()
  const mockGetDocumentsBySource = vi.fn()
  const mockUpsertSourceDocument = vi.fn()
  const mockDeleteDocumentsBySource = vi.fn()
  const mockGetAllDocuments = vi.fn()

  const mockVectorDBStore: VectorDBStoreInterface = {
    insertToDB: mockInsertToDB,
    getAllDocuments: mockGetAllDocuments,
    findDocumentBySource: mockFindDocumentBySource,
    getDocumentsBySource: mockGetDocumentsBySource,
    upsertSourceDocument: mockUpsertSourceDocument,
    deleteDocumentsBySource: mockDeleteDocumentsBySource,
  }

  const mockEmbedder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFindDocumentBySource.mockResolvedValue(null)
    mockGetDocumentsBySource.mockResolvedValue([])
    mockDeleteDocumentsBySource.mockResolvedValue(undefined)
    mockUpsertSourceDocument.mockResolvedValue(undefined)
    mockInsertToDB.mockResolvedValue(undefined)
    mockGetAllDocuments.mockResolvedValue([])
    mockEmbedder.mockResolvedValue([0.1, 0.2, 0.3])

    delete process.env.DOCUMENT_MIN_LENGTH
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call ingestDocument for both regular documents and local PDF documents', async () => {
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

    const pdfDocs = [
      {
        url: './fixtures/test.pdf',
        category: 'pdf_test',
        description: 'Local PDF document',
      },
    ]

    vi.mocked(retrieveDocuments).mockReturnValue(docs)
    vi.mocked(retrievePdfDocuments).mockReturnValue(pdfDocs)

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)
    const ingestSpy = vi
      .spyOn(ingestion, 'ingestDocument')
      .mockResolvedValue(undefined)

    await ingestion.ingestDocuments()

    expect(ingestSpy).toHaveBeenCalledTimes(3)
    expect(ingestSpy).toHaveBeenNthCalledWith(1, docs[0])
    expect(ingestSpy).toHaveBeenNthCalledWith(2, docs[1])
    expect(ingestSpy).toHaveBeenNthCalledWith(3, pdfDocs[0])
    expect(closeBrowser).toHaveBeenCalledOnce()
  })

  it('should continue ingestion when PDF documents are unavailable', async () => {
    const docs = [
      {
        url: 'https://example.com/doc1',
        category: 'test',
        description: 'Document 1',
      },
    ]

    vi.mocked(retrieveDocuments).mockReturnValue(docs)
    vi.mocked(retrievePdfDocuments).mockImplementation(() => {
      throw new Error('PDF_DOCUMENTS is not set')
    })

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)
    const ingestSpy = vi
      .spyOn(ingestion, 'ingestDocument')
      .mockResolvedValue(undefined)

    await ingestion.ingestDocuments()

    expect(ingestSpy).toHaveBeenCalledTimes(1)
    expect(ingestSpy).toHaveBeenCalledWith(docs[0])
    expect(closeBrowser).toHaveBeenCalledOnce()
  })

  it('should skip ingestion if parsed document text is empty', async () => {
    const document = {
      url: 'https://example.com/empty-doc',
      category: 'test',
      description: 'Empty document',
    }

    const parser = vi.fn().mockResolvedValue({
      text: '   ',
      title: 'Empty doc',
      metadata: { title: 'Empty doc', source: 'https://example.com/empty-doc' },
    })

    vi.mocked(getParser).mockResolvedValue(parser)

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(getParser).toHaveBeenCalledWith('https://example.com/empty-doc')
    expect(parser).toHaveBeenCalledWith('https://example.com/empty-doc')

    expect(chunkText).not.toHaveBeenCalled()
    expect(mockEmbedder).not.toHaveBeenCalled()
    expect(mockFindDocumentBySource).not.toHaveBeenCalled()
    expect(mockGetDocumentsBySource).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
    expect(mockUpsertSourceDocument).not.toHaveBeenCalled()
  })

  it('should skip ingestion if document is blocked by title', async () => {
    const document = {
      url: 'https://example.com/blocked-doc',
      category: 'test',
      description: 'Blocked document',
    }

    const longBlockedText =
      'Please wait while we verify you are human. '.repeat(30)

    const parser = vi.fn().mockResolvedValue({
      text: longBlockedText,
      title: 'Just a moment...',
      metadata: {
        title: 'Just a moment...',
        source: 'https://example.com/blocked-doc',
      },
    })

    vi.mocked(getParser).mockResolvedValue(parser)

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(mockFindDocumentBySource).not.toHaveBeenCalled()
    expect(mockGetDocumentsBySource).not.toHaveBeenCalled()
    expect(chunkText).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
  })

  it('should skip ingestion if text is too short according to current implementation', async () => {
    const document = {
      url: 'https://example.com/short-doc',
      category: 'test',
      description: 'Short document',
    }

    const parser = vi.fn().mockResolvedValue({
      text: 'Too short text',
      title: 'Short doc',
      metadata: { title: 'Short doc', source: 'https://example.com/short-doc' },
    })

    vi.mocked(getParser).mockResolvedValue(parser)

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(chunkText).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
    expect(mockUpsertSourceDocument).not.toHaveBeenCalled()
  })

  it('should chunk text, generate embeddings, and store chunks for a parsed document', async () => {
    const document = {
      url: 'https://example.com/new-doc',
      category: 'test_category',
      description: 'New document description',
    }

    const longText = 'Terraform OpenStack nginx documentation. '.repeat(40)

    const parser = vi.fn().mockResolvedValue({
      text: longText,
      title: 'New doc',
      metadata: { title: 'New doc', source: 'https://example.com/new-doc' },
    })

    vi.mocked(getParser).mockResolvedValue(parser)
    vi.mocked(createDocumentHash).mockReturnValue('fake-hash-123')
    vi.mocked(chunkText).mockReturnValue([
      'This is chunk 1.',
      'This is chunk 2.',
    ])

    vi.mocked(extractKeywords)
      .mockReturnValueOnce(['keyword1', 'keyword2'])
      .mockReturnValueOnce(['keyword3', 'keyword4'])

    mockEmbedder
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6])

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(getParser).toHaveBeenCalledWith('https://example.com/new-doc')
    expect(parser).toHaveBeenCalledWith('https://example.com/new-doc')
    expect(createDocumentHash).toHaveBeenCalledWith(longText.trim())

    expect(mockFindDocumentBySource).toHaveBeenCalledWith(
      'https://example.com/new-doc',
    )
    expect(mockGetDocumentsBySource).toHaveBeenCalledWith(
      'https://example.com/new-doc',
    )

    expect(chunkText).toHaveBeenCalledWith(longText.trim())
    expect(mockEmbedder).toHaveBeenCalledTimes(2)
    expect(extractKeywords).toHaveBeenCalledTimes(2)
    expect(mockInsertToDB).toHaveBeenCalledTimes(2)

    expect(mockInsertToDB).toHaveBeenNthCalledWith(
      1,
      'This is chunk 1.',
      [0.1, 0.2, 0.3],
      {
        title: 'New doc',
        source: 'https://example.com/new-doc',
        category: document.category,
        description: document.description,
        documentHash: 'fake-hash-123',
        chunkIndex: 0,
        keywords: ['keyword1', 'keyword2'],
      },
    )

    expect(mockInsertToDB).toHaveBeenNthCalledWith(
      2,
      'This is chunk 2.',
      [0.4, 0.5, 0.6],
      {
        title: 'New doc',
        source: 'https://example.com/new-doc',
        category: document.category,
        description: document.description,
        documentHash: 'fake-hash-123',
        chunkIndex: 1,
        keywords: ['keyword3', 'keyword4'],
      },
    )

    expect(mockUpsertSourceDocument).toHaveBeenCalledWith({
      source: 'https://example.com/new-doc',
      documentHash: 'fake-hash-123',
      title: 'New doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'New doc',
        source: 'https://example.com/new-doc',
      },
    })
  })

  it('should skip ingestion if document already exists and hash is unchanged', async () => {
    const document = {
      url: 'https://example.com/existing-doc',
      category: 'test_category',
      description: 'Existing document description',
    }

    const longText = 'This document already exists and is long enough. '.repeat(
      30,
    )

    const parser = vi.fn().mockResolvedValue({
      text: longText,
      title: 'Existing doc',
      metadata: {
        title: 'Existing doc',
        source: 'https://example.com/existing-doc',
      },
    })

    vi.mocked(getParser).mockResolvedValue(parser)
    vi.mocked(createDocumentHash).mockReturnValue('same-hash-123')

    mockFindDocumentBySource.mockResolvedValue({
      source: 'https://example.com/existing-doc',
      documentHash: 'same-hash-123',
      title: 'Existing doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc',
        source: 'https://example.com/existing-doc',
      },
    })

    mockGetDocumentsBySource.mockResolvedValue([
      {
        text: 'Existing chunk',
        embedding: [0.1, 0.2, 0.3],
        source: 'https://example.com/existing-doc',
        documentHash: 'same-hash-123',
        chunkIndex: 0,
        title: 'Existing doc',
        category: document.category,
        description: document.description,
        keywords: ['existing'],
        metadata: {
          title: 'Existing doc',
          source: 'https://example.com/existing-doc',
        },
      },
    ])

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(mockFindDocumentBySource).toHaveBeenCalledWith(
      'https://example.com/existing-doc',
    )
    expect(mockGetDocumentsBySource).toHaveBeenCalledWith(
      'https://example.com/existing-doc',
    )

    expect(chunkText).not.toHaveBeenCalled()
    expect(mockEmbedder).not.toHaveBeenCalled()
    expect(mockDeleteDocumentsBySource).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
    expect(mockUpsertSourceDocument).not.toHaveBeenCalled()
  })

  it('should delete old chunks and re-ingest if hash has changed', async () => {
    const document = {
      url: 'https://example.com/existing-doc',
      category: 'test_category',
      description: 'Existing document description',
    }

    const longText = 'This document has changed and is long enough. '.repeat(30)

    const parser = vi.fn().mockResolvedValue({
      text: longText,
      title: 'Existing doc updated',
      metadata: {
        title: 'Existing doc updated',
        source: 'https://example.com/existing-doc',
      },
    })

    vi.mocked(getParser).mockResolvedValue(parser)
    vi.mocked(createDocumentHash).mockReturnValue('new-hash-456')
    vi.mocked(chunkText).mockReturnValue([
      'Updated chunk 1.',
      'Updated chunk 2.',
    ])

    vi.mocked(extractKeywords)
      .mockReturnValueOnce(['updated1'])
      .mockReturnValueOnce(['updated2'])

    mockFindDocumentBySource.mockResolvedValue({
      source: 'https://example.com/existing-doc',
      documentHash: 'old-hash-123',
      title: 'Existing doc',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc',
        source: 'https://example.com/existing-doc',
      },
    })

    mockGetDocumentsBySource.mockResolvedValue([
      {
        text: 'Old chunk',
        embedding: [0.1, 0.2, 0.3],
        source: 'https://example.com/existing-doc',
        documentHash: 'old-hash-123',
        chunkIndex: 0,
        title: 'Existing doc',
        category: document.category,
        description: document.description,
        keywords: ['old'],
        metadata: {
          title: 'Existing doc',
          source: 'https://example.com/existing-doc',
        },
      },
    ])

    mockEmbedder
      .mockResolvedValueOnce([0.11, 0.22, 0.33])
      .mockResolvedValueOnce([0.44, 0.55, 0.66])

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(mockDeleteDocumentsBySource).toHaveBeenCalledWith(
      'https://example.com/existing-doc',
    )
    expect(mockInsertToDB).toHaveBeenCalledTimes(2)
    expect(mockUpsertSourceDocument).toHaveBeenCalledWith({
      source: 'https://example.com/existing-doc',
      documentHash: 'new-hash-456',
      title: 'Existing doc updated',
      category: document.category,
      description: document.description,
      metadata: {
        title: 'Existing doc updated',
        source: 'https://example.com/existing-doc',
      },
    })
  })

  it('should normalize trailing slash in source URL', async () => {
    const document = {
      url: 'https://example.com/path/',
      category: 'test_category',
      description: 'URL normalization test',
    }

    const longText = 'Normalization test document. '.repeat(40)

    const parser = vi.fn().mockResolvedValue({
      text: longText,
      title: 'Normalized doc',
      metadata: {
        title: 'Normalized doc',
        source: 'https://example.com/path',
      },
    })

    vi.mocked(getParser).mockResolvedValue(parser)
    vi.mocked(createDocumentHash).mockReturnValue('normalized-hash')
    vi.mocked(chunkText).mockReturnValue(['Normalized chunk'])
    vi.mocked(extractKeywords).mockReturnValue(['normalized'])

    const ingestion = new DocumentIngestion(mockVectorDBStore, mockEmbedder)

    await ingestion.ingestDocument(document)

    expect(getParser).toHaveBeenCalledWith('https://example.com/path')
    expect(parser).toHaveBeenCalledWith('https://example.com/path')
    expect(mockFindDocumentBySource).toHaveBeenCalledWith(
      'https://example.com/path',
    )
    expect(mockGetDocumentsBySource).toHaveBeenCalledWith(
      'https://example.com/path',
    )
  })
})
