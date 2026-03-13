/**
 * RAGOrchestrator class is responsible for orchestrating the Retrieval-Augmented Generation (RAG) process. 
 * It manages the flow of data through the different stages of retrieval, augmentation, generation and self-evaluation.
 * The class maintains the internal state of the generated IaC and its self-evaluation results.
 * 
 * @author Sabrina Prichard-Lybeck
 * @author Bea Sanssi
 * 
 * @version 1.0 
 */
class RAGOrchestrator {
    constructor() {
        #generatedIaC = null;
        #generatedIaCSelfEvaluated = null;
    }

    ingest(rawDocument, metaData) {
        
    }

    retrieve(query) {

    }

    generate(context, query) {

    }

    retrieveSelfEvaluate(query, generatedIaC) {

    }

    generateSelfEvaluate(context, query, generatedIaC) {
        
    }
}
