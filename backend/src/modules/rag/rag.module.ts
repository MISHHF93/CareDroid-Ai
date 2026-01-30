import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RAGService } from './rag.service';
import { OpenAIEmbeddingsService } from './embeddings/openai-embeddings.service';
import { PineconeService } from './vector-db/pinecone.service';

/**
 * RAG Module
 * 
 * Provides Retrieval-Augmented Generation capabilities using:
 * - OpenAI embeddings for semantic encoding
 * - Pinecone vector database for similarity search
 * - Document chunking for optimal retrieval
 */

@Module({
  imports: [ConfigModule],
  providers: [
    RAGService,
    OpenAIEmbeddingsService,
    PineconeService,
  ],
  exports: [
    RAGService,
  ],
})
export class RAGModule {}
