# Introduction

This RAG-artifact was created as part of a scientific study (bachelor's thesis) that follows a Design Science Research Methodology approach (DSRM).

## Authors

- Sabrina Prichard-Lybeck
- Bea Sanssi

# The RAG Artifact

The RAG Artifact is a Retrieval-Augmented Generation (RAG) system designed to generate Infrastructure as Code (IaC) aimed at assisting junior developers. The system retrieves relevant information from a Vector DB that has been ingested with documentation and best practices related to IaC. The retrieved information is then used to generate IaC and has a built-in self-evaluation mechanism, to improve the quality of the generated code and add pedagogical comments aimed at junior developers, intended to increase the learning potential of the generated code. The self-evaluation step also includes evaluation against best practices, clean code, and security guidelines. The RAG Artifact was developed to address the challenges faced by junior developers in learning and applying IaC, and to provide a tool that can assist them in generating IaC code while also enhancing their learning experience. It uses a sentence-based chunking strategy, abstract summarization to reduce noise and category filtering and metadata to improve the retrieval process.
It follows a mediator design pattern, where the RAGOrchestrator acts as the mediator that coordinates the interactions between the different components of the system and is responsible for managing the flow of data and control between the components. It has been developed with a focus on modularity and maintainability by following the principals of SOLID, Clean Code and DRY, to ensure that the system is easy to understand, modify and extend in the future.

# Technologies

The RAG Artifact is built using TypeScript and uses Vitest for testing. It has a CI/CD pipeline set up, to ensure that the code is built, tested and run through lint and formatting checks before being merged into the main branch. It uses a MongoDB vector database for storing the ingested documentation and best practices, and the RAG pipelines can be run using OpenAI or Anthropic models (defined as environment variables) for the generation and evaluation steps. It uses the LangChain dependency for the RAG pipeline.

## Artifact Design

![Artifact Design](./design/Artifact%20design.png)
