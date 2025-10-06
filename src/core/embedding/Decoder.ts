import type { EmbeddingQuery, EmbeddingResult } from '@interfaces/index'
import { EmbedEncoder } from '@core/index'
import { Database } from '@core/Database'

/**
 * Vector Database-powered EmbedDecoder for semantic search.
 * @description Provides fast vector similarity search using SQLite + sqlite-vec.
 */
export class Decoder {
  /** Encoder instance for text to vector conversion */
  private static readonly encoder: EmbedEncoder = new EmbedEncoder()
  /** Vector database instance for fast vector search */
  private static readonly database: Database = Database.getInstance()
  /** Flag to track if the encoder has been initialized */
  private static initialized: boolean = false

  /**
   * Initialize the decoder for embedding operations.
   * @description Ensures the underlying encoder is ready for processing.
   * @returns Promise resolving when initialization is done
   */
  static async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.encoder.initialize()
      this.initialized = true
    }
  }

  /**
   * Query for similar content using fast vector search.
   * @description Finds the most similar stored content using SQLite + sqlite-vec for optimal performance.
   * @param query - Query text to find similar content for
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Promise resolving to array of similar content with similarity scores
   * @throws {Error} When encoder is not initialized or query is empty
   */
  static async query(query: string, limit: number = 10): Promise<EmbeddingQuery[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty')
    }
    await this.initialize()
    const queryResult: EmbeddingResult = await this.encoder.extract([query])
    const queryVector: number[] = queryResult.data[0] ?? []
    if (queryVector.length === 0) {
      throw new Error('Failed to generate query vector')
    }
    const results: EmbeddingQuery[] = this.database.searchVectors(queryVector, limit)
    return results.map((result: EmbeddingQuery) => ({
      id: result.id,
      source: result.source,
      content: result.content,
      vector: result.vector,
      similarity: result.similarity,
      timestamp: result.timestamp
    }))
  }
}
