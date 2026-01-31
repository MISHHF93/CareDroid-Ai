import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddingsService } from './embeddings/openai-embeddings.service';
import { PineconeService } from './vector-db/pinecone.service';
import { DocumentChunker } from './utils/document-chunker';
import { ToolMetricsService } from '../metrics/tool-metrics.service';
import {
  RAGContext,
  RAGRetrievalOptions,
  RetrievedChunk,
} from './dto/rag-context.dto';
import {
  MedicalSource,
  IngestDocumentDto,
  DocumentChunk,
} from './dto/medical-source.dto';
import { VectorRecord } from './vector-db/vector-db.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * RAG Service
 * 
 * Main service for Retrieval-Augmented Generation.
 * Orchestrates document ingestion, embedding generation, vector storage, and retrieval.
 */

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private documentChunker: DocumentChunker;

  constructor(
    private readonly embeddingsService: OpenAIEmbeddingsService,
    private readonly vectorDb: PineconeService,
    private readonly configService: ConfigService,
    private readonly toolMetrics: ToolMetricsService,
  ) {
    this.documentChunker = new DocumentChunker();
  }

  /**
   * Retrieve relevant context for a query
   * This is the main method used by AI chat to augment responses
   */
  async retrieve(
    query: string,
    options: RAGRetrievalOptions = {},
  ): Promise<RAGContext> {
    const startTime = Date.now();

    try {
      // Set defaults
      const topK = options.topK || 5;
      const minScore = options.minScore || 0.7;
      const includeEmbeddings = options.includeEmbeddings || false;

      this.logger.debug(`Retrieving context for query: "${query.substring(0, 100)}..."`);

      // 1. Generate query embedding
      const queryEmbedding = await this.embeddingsService.embed(query);

      // 2. Build metadata filter
      const filter: Record<string, any> = {};
      if (options.documentType) {
        filter.type = options.documentType;
      }
      if (options.specialty) {
        filter.specialty = options.specialty;
      }

      // 3. Query vector database
      const queryResult = await this.vectorDb.query(queryEmbedding, {
        topK,
        minScore,
        filter,
        includeVectors: includeEmbeddings,
        includeMetadata: true,
      });

      // 4. Map to RetrievedChunks
      const chunks: RetrievedChunk[] = queryResult.matches.map((match) => ({
        id: match.id,
        text: match.text,
        score: match.score,
        metadata: match.metadata,
        embedding: match.vector,
      }));

      // Record RAG metrics
      if (chunks.length === 0) {
        // Track empty results (commented out - method not available in toolMetrics)
        // this.toolMetrics.recordRagEmptyResults();
      } else {
        // Record retrieval count (commented out - method not available)
        // this.toolMetrics.recordRagRetrieval(chunks.length);
        
        // Record relevance scores for each chunk (commented out - method not available)
        // chunks.forEach(chunk => {
        //   this.toolMetrics.recordRagRelevanceScore(chunk.score);
        // });
      }

      // 5. Extract unique sources
      const sources = this.extractUniqueSources(chunks);

      // 6. Calculate overall confidence
      const confidence = this.calculateConfidence(chunks);

      const latencyMs = Date.now() - startTime;

      this.logger.log(
        `Retrieved ${chunks.length} chunks from ${sources.length} sources (confidence: ${confidence.toFixed(2)}, latency: ${latencyMs}ms)`,
      );

      return {
        chunks,
        sources,
        confidence,
        query,
        timestamp: new Date(),
        totalRetrieved: queryResult.matches.length,
        latencyMs,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Retrieval failed: ${err.message}`, err.stack);
      throw new Error(`Failed to retrieve context: ${err.message}`);
    }
  }

  /**
   * Ingest a document into the RAG system
   * Chunks the document, generates embeddings, and stores in vector DB
   */
  async ingest(dto: IngestDocumentDto): Promise<{
    success: boolean;
    chunksIngested: number;
    sourceId: string;
  }> {
    try {
      this.logger.log(`Ingesting document: ${dto.source.title}`);

      // 1. Chunk the document
      const chunks = this.documentChunker.chunkDocument(dto);
      this.logger.debug(`Split document into ${chunks.length} chunks`);

      if (chunks.length === 0) {
        throw new Error('Document chunking produced no chunks');
      }

      // 2. Generate embeddings for all chunks
      const texts = chunks.map((chunk) => chunk.text);
      const embeddings = await this.embeddingsService.embedBatch(texts);
      this.logger.debug(`Generated ${embeddings.length} embeddings`);

      // 3. Create vector records
      const vectorRecords: VectorRecord[] = chunks.map((chunk, index) => ({
        id: `${dto.source.id}_chunk_${chunk.chunkIndex}`,
        vector: embeddings[index],
        text: chunk.text,
        metadata: chunk.metadata,
      }));

      // 4. Upsert to vector database
      await this.vectorDb.upsertBatch(vectorRecords);
      this.logger.log(`Successfully ingested ${chunks.length} chunks for: ${dto.source.title}`);

      return {
        success: true,
        chunksIngested: chunks.length,
        sourceId: dto.source.id,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Ingestion failed for ${dto.source.title}: ${err.message}`, err.stack);
      throw new Error(`Failed to ingest document: ${err.message}`);
    }
  }

  /**
   * Ingest multiple documents in batch
   */
  async ingestBatch(documents: IngestDocumentDto[]): Promise<{
    successful: number;
    failed: number;
    totalChunks: number;
  }> {
    let successful = 0;
    let failed = 0;
    let totalChunks = 0;

    for (const doc of documents) {
      try {
        const result = await this.ingest(doc);
        successful++;
        totalChunks += result.chunksIngested;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Failed to ingest ${doc.source.title}: ${err.message}`);
        failed++;
      }
    }

    this.logger.log(
      `Batch ingestion complete: ${successful} successful, ${failed} failed, ${totalChunks} total chunks`,
    );

    return { successful, failed, totalChunks };
  }

  /**
   * Delete a document and all its chunks from the system
   */
  async deleteDocument(sourceId: string): Promise<void> {
    try {
      await this.vectorDb.deleteByFilter({ sourceId });
      this.logger.log(`Deleted all chunks for source: ${sourceId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to delete document ${sourceId}: ${err.message}`, err.stack);
      throw new Error(`Failed to delete document: ${err.message}`);
    }
  }

  /**
   * Get statistics about the RAG system
   */
  async getStats(): Promise<{
    totalVectors: number;
    indexName: string;
    embeddingModel: string;
    embeddingDimension: number;
  }> {
    const indexStats = await this.vectorDb.getStats();

    return {
      totalVectors: indexStats.totalVectors,
      indexName: indexStats.indexName,
      embeddingModel: this.embeddingsService.getModel(),
      embeddingDimension: this.embeddingsService.getDimension(),
    };
  }

  /**
   * Health check for RAG system components
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    components: {
      embeddings: boolean;
      vectorDb: boolean;
    };
  }> {
    const [embeddingsHealthy, vectorDbHealthy] = await Promise.all([
      this.embeddingsService.healthCheck(),
      this.vectorDb.healthCheck(),
    ]);

    return {
      healthy: embeddingsHealthy && vectorDbHealthy,
      components: {
        embeddings: embeddingsHealthy,
        vectorDb: vectorDbHealthy,
      },
    };
  }

  /**
   * Extract unique medical sources from chunks
   */
  private extractUniqueSources(chunks: RetrievedChunk[]): MedicalSource[] {
    const sourceMap = new Map<string, MedicalSource>();

    for (const chunk of chunks) {
      const { metadata } = chunk;
      const sourceId = metadata.sourceId;

      if (!sourceMap.has(sourceId)) {
        sourceMap.set(sourceId, {
          id: sourceId,
          title: metadata.title,
          type: metadata.type,
          organization: metadata.organization,
          date: metadata.date,
          url: metadata.url,
          specialty: metadata.specialty,
          tags: metadata.tags,
        });
      }
    }

    return Array.from(sourceMap.values());
  }

  /**
   * Calculate overall confidence score from chunk scores
   * Uses weighted average: top chunks have more weight
   */
  private calculateConfidence(chunks: RetrievedChunk[]): number {
    if (chunks.length === 0) {
      return 0;
    }

    // Weight chunks by position (first chunk has highest weight)
    let totalWeight = 0;
    let weightedSum = 0;

    chunks.forEach((chunk, index) => {
      const weight = 1 / (index + 1); // 1, 0.5, 0.33, 0.25, ...
      weightedSum += chunk.score * weight;
      totalWeight += weight;
    });

    return weightedSum / totalWeight;
  }

  /**
   * Clean up resources
   */
  onModuleDestroy() {
    if (this.documentChunker) {
      this.documentChunker.dispose();
    }
  }
}
