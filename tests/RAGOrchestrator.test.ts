import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RAGOrchestrator } from '../src/orchestrator/RAGOrchestrator.js'
import type { DocumentIngestionInterface } from '../src/types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../src/types/DocumentRetrievalInterface.js'
import type { LLMInterface } from '../src/types/LLMInterface.js'
import type { StoredDocument } from '../src/types/StoredDocument.js'

describe('RAGOrchestrator', () => {
  let mockIngestion: DocumentIngestionInterface
  let mockRetrieval: DocumentRetrievalInterface
  let mockLLM: LLMInterface

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

    mockLLM = {
      generateIaC: vi.fn(),
      generateIaCSelfEval: vi.fn(),
      generateAbstractiveSummary: vi.fn(),
    }
  })

  it('should run ingestion pipeline through ingestionInstance.ingestDocuments', async () => {
    vi.mocked(mockIngestion.ingestDocuments).mockResolvedValue(undefined)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockLLM,
    )

    await orchestrator.runIngestionPipeline()

    expect(mockIngestion.ingestDocuments).toHaveBeenCalledOnce()
  })

  it('should run RAG pipeline by retrieving documents, summarizing, and generating IaC', async () => {
    const mockSummary = 'Abstractive summary of retrieved docs'
    const mockGeneratedIaC = 'resource "openstack_compute_instance_v2" "web" {}'

    vi.mocked(mockRetrieval.retrieveDocuments).mockResolvedValue(mockDocuments)
    vi.mocked(mockLLM.generateAbstractiveSummary).mockResolvedValue(mockSummary)
    vi.mocked(mockLLM.generateIaC).mockResolvedValue(mockGeneratedIaC)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockLLM,
    )

    const result = await orchestrator.runRAGPipeline(
      'Generate OpenStack Terraform',
      'Use nginx',
    )

    expect(mockRetrieval.retrieveDocuments).toHaveBeenCalledWith(
      'Generate OpenStack Terraform',
      'Use nginx',
    )
    expect(mockLLM.generateAbstractiveSummary).toHaveBeenCalledOnce()
    expect(mockLLM.generateIaC).toHaveBeenCalledWith(
      mockSummary,
      'Generate OpenStack Terraform',
    )
    expect(result).toBe(mockGeneratedIaC)
  })

  it('should run RAG self-eval pipeline by retrieving, summarizing, and generating self-evaluated IaC', async () => {
    const mockSummary = 'Abstractive summary for self-eval'
    const mockSelfEvalResult = '# Improved IaC with inline comments'
    const mockGeneratedIaC = 'resource "openstack_compute_instance_v2" "web" {}'

    vi.mocked(mockRetrieval.retrieveDocumentsSelfEval).mockResolvedValue(
      mockDocuments,
    )
    vi.mocked(mockLLM.generateAbstractiveSummary).mockResolvedValue(mockSummary)
    vi.mocked(mockLLM.generateIaCSelfEval).mockResolvedValue(mockSelfEvalResult)

    const orchestrator = new RAGOrchestrator(
      mockIngestion,
      mockRetrieval,
      mockLLM,
    )

    const result = await orchestrator.runRAGPipelineSelfEval(
      'Generate an OpenStack web server',
      mockGeneratedIaC,
    )

    expect(mockRetrieval.retrieveDocumentsSelfEval).toHaveBeenCalledOnce()
    expect(mockLLM.generateAbstractiveSummary).toHaveBeenCalledOnce()
    expect(mockLLM.generateIaCSelfEval).toHaveBeenCalledOnce()
    expect(result).toBe(mockSelfEvalResult)
  })
})
