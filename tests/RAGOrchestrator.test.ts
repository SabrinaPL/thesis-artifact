import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RAGOrchestrator } from '../src/orchestrator/RAGOrchestrator.js'
import type { DocumentIngestionInterface } from '../src/types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../src/types/DocumentRetrievalInterface.js'
import type { GenerationInterface } from '../src/types/GenerationInterface.js'
import type { StoredDocument } from '../src/types/StoredDocument.js'
import type { GeneratedIaC } from '../src/types/GeneratedIaC.js'

describe('RAGOrchestrator', () => {
  let mockIngestion: DocumentIngestionInterface
  let mockRetrieval: DocumentRetrievalInterface
  let mockGeneration: GenerationInterface

  const mockDocuments: StoredDocument[] = [
    {
      text: 'Terraform docs chunk',
      embedding: [0.1, 0.2, 0.3],
      source: 'https://example.com/doc1',
      documentHash: 'hash-1',
      chunkIndex: 0,
      title: 'Doc 1',
      category: 'terraform_docs',
      description: 'Terraform documentation',
      keywords: ['terraform'],
      metadata: {
        title: 'Doc 1',
        source: 'https://example.com/doc1',
      },
    },
  ]

  beforeEach(() => {
    mockIngestion = {
      ingestDocuments: vi.fn(),
      ingestDocument: vi.fn(),
    }

    mockRetrieval = {
      retrieveDocuments: vi.fn(),
      retrieveDocumentsSelfEval: vi.fn(),
    }

    mockGeneration = {
      generate: vi.fn(),
    }
  })

  it('should run ingestion pipeline through ingestionInstance.ingestDocuments', async () => {
    vi.mocked(mockIngestion.ingestDocuments).mockResolvedValue(undefined)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockGeneration,
    )

    await orchestrator.runIngestionPipeline()

    expect(mockIngestion.ingestDocuments).toHaveBeenCalledOnce()
  })

  it('should delegate runRetrievalPipeline to retrievalInstance.retrieveDocuments', async () => {
    vi.mocked(mockRetrieval.retrieveDocuments).mockResolvedValue(mockDocuments)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockGeneration,
    )

    const result = await orchestrator.runRetrievalPipeline(
      'Generate OpenStack Terraform',
      'Use nginx',
    )

    expect(mockRetrieval.retrieveDocuments).toHaveBeenCalledWith(
      'Generate OpenStack Terraform',
      'Use nginx',
    )
    expect(result).toEqual(mockDocuments)
  })

  it('should delegate runGenerationPipeline to retrieval and generation modules', async () => {
    const generatedIaC: GeneratedIaC = {
      content: 'generated config',
    }

    vi.mocked(mockRetrieval.retrieveDocuments).mockResolvedValue(mockDocuments)
    vi.mocked(mockGeneration.generate).mockResolvedValue(generatedIaC)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockGeneration,
    )

    const result = await orchestrator.runGenerationPipeline(
      'Generate an OpenStack web server',
    )

    expect(mockRetrieval.retrieveDocuments).toHaveBeenCalledWith(
      'Generate an OpenStack web server',
    )
    expect(mockGeneration.generate).toHaveBeenCalledWith(
      'Generate an OpenStack web server',
      mockDocuments,
    )
    expect(result).toEqual(generatedIaC)
  })

  it('should delegate runRetrievalPipelineSelfEval to retrievalInstance.retrieveDocumentsSelfEval', async () => {
    const generatedIaC: GeneratedIaC = {
      content: 'resource "openstack_compute_instance_v2" "web" {}',
    }

    vi.mocked(mockRetrieval.retrieveDocumentsSelfEval).mockResolvedValue(
      mockDocuments,
    )

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockGeneration,
    )

    const result = await orchestrator.runRetrievalPipelineSelfEval(
      generatedIaC,
      'Generate an OpenStack server',
    )

    expect(mockRetrieval.retrieveDocumentsSelfEval).toHaveBeenCalledWith(
      generatedIaC,
      'Generate an OpenStack server',
    )
    expect(result).toEqual(mockDocuments)
  })
})