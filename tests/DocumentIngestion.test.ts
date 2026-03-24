import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentIngestion } from '../src/modules/DocumentIngestion.js'
import { getParser } from '../src/utils/parserSelector.js'
import { retrieveDocumentURLs } from '../src/utils/urlRetriever.js'
import { chunkText } from '../src/utils/textChunker.js'
import { createEmbedding } from '../src/utils/embedder.js'

vi.mock('../src/utils/parserSelector.js', () => ({
  getParser: vi.fn(),
}))

vi.mock('../src/utils/urlRetriever.js', () => ({
  retrieveDocumentURLs: vi.fn(),
}))

vi.mock('../src/utils/textChunker.js', () => ({
  chunkText: vi.fn(),
}))

vi.mock('../src/utils/embedder.js', () => ({
  createEmbedding: vi.fn(),
}))

describe('DocumentIngestion', () => {
  const mockInsertToDB = vi.fn()

  const mockVectorDBStore = {
    insertToDB: mockInsertToDB,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should call ingestDocument for each retrieved document URL', async () => {
    vi.mocked(retrieveDocumentURLs).mockReturnValue([
      'https://example.com/doc1',
      'https://example.com/doc2',
    ])

    const ingestion = new DocumentIngestion(mockVectorDBStore)
    const ingestDocumentSpy = vi
      .spyOn(ingestion, 'ingestDocument')
      .mockResolvedValue(undefined)

    await ingestion.ingestDocuments()

    expect(ingestDocumentSpy).toHaveBeenCalledTimes(2)
    expect(ingestDocumentSpy).toHaveBeenCalledWith('https://example.com/doc1')
    expect(ingestDocumentSpy).toHaveBeenCalledWith('https://example.com/doc2')
  })

  it('should skip ingestion if parsed document text is empty', async () => {
    const mockParser = vi.fn().mockResolvedValue({
      text: '   ',
      metadata: { title: 'Empty doc' },
    })

    vi.mocked(getParser).mockReturnValue(mockParser)

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument('https://example.com/empty-doc')

    expect(mockParser).toHaveBeenCalledWith('https://example.com/empty-doc')
    expect(chunkText).not.toHaveBeenCalled()
    expect(createEmbedding).not.toHaveBeenCalled()
    expect(mockInsertToDB).not.toHaveBeenCalled()
  })

  it('should chunk text, generate embeddings, and store chunks for a parsed document', async () => {
    const mockParser = vi.fn().mockResolvedValue({
      text: 'This is a new document. It has multiple parts.',
      metadata: { title: 'New doc' },
    })

    vi.mocked(getParser).mockReturnValue(mockParser)

    vi.mocked(chunkText).mockReturnValue([
      'This is chunk 1.',
      'This is chunk 2.',
    ])

    vi.mocked(createEmbedding)
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6])

    const ingestion = new DocumentIngestion(mockVectorDBStore)

    await ingestion.ingestDocument('https://example.com/new-doc')

    expect(chunkText).toHaveBeenCalledWith(
      'This is a new document. It has multiple parts.'
    )

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
        source: 'https://example.com/new-doc',
        chunkIndex: 0,
      }
    )

    expect(mockInsertToDB).toHaveBeenNthCalledWith(
      2,
      'This is chunk 2.',
      [0.4, 0.5, 0.6],
      {
        title: 'New doc',
        source: 'https://example.com/new-doc',
        chunkIndex: 1,
      }
    )
  })
})