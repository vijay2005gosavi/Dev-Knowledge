/**
 * Interface for embedding extraction options.
 * @description Configuration options for feature extraction pipeline.
 */
export interface EmbeddingOptions {
  /** Batch size for processing multiple sentences */
  batchSize?: number
  /** Pooling strategy for sentence embeddings */
  pooling?: 'mean' | 'cls' | 'max'
  /** Whether to normalize the embeddings */
  normalize?: boolean
}

/**
 * Interface for embedding extraction result.
 * @description Result structure returned by the embedding extractor.
 */
export interface EmbeddingResult {
  /** Number of input sentences processed */
  count: number
  /** The computed embeddings as a tensor */
  data: number[][]
  /** Dimensions of the embeddings */
  dimensions: number
}

/**
 * Interface for embedding extractor.
 * @description Main interface for the embedding extraction functionality.
 */
export interface EmbeddingExtractor {
  /**
   * Extract embeddings from input sentences.
   * @param sentences - Array of sentences to process
   * @param options - Configuration options for extraction
   * @returns Promise resolving to embedding results
   */
  extract(sentences: string[], options?: EmbeddingOptions): Promise<EmbeddingResult>

  /**
   * Initialize the embedding pipeline.
   * @param model - Model identifier for the pipeline
   * @returns Promise resolving when initialization is done
   */
  initialize(model?: string): Promise<void>

  /**
   * Check if the extractor is initialized and ready.
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean
}

/**
 * Interface for query result.
 * @description Result of a similarity query.
 */
export interface EmbeddingQuery extends EmbeddingStored {
  /** Distance between the query and the embedding */
  distance?: number
  /** Similarity score (0-1, higher is more similar) */
  similarity: number
}

/**
 * Interface for stored embedding item.
 * @description Represents a stored embedding with metadata.
 */
export interface EmbeddingStored {
  /** Identifier for the embedding */
  id: string
  /** Source URL */
  source: string
  /** Original text content */
  content: string
  /** The embedding vector */
  vector: number[] | Buffer
  /** Timestamp when last updated */
  timestamp: number
}
