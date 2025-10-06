import type { EmbeddingOptions, EmbeddingResult, EmbeddingExtractor } from '@interfaces/index'
import { pipeline } from '@xenova/transformers'

/**
 * Default model identifier for feature extraction.
 * @description Lightweight all-MiniLM-L6-v2 model for sentence embeddings.
 */
const defaultModel: string = 'Xenova/all-MiniLM-L6-v2'

/**
 * Default configuration options for embedding extraction.
 * @description Standard settings for optimal performance.
 */
const defaultOptions: Required<EmbeddingOptions> = {
  pooling: 'mean',
  normalize: true,
  batchSize: 32
}

/**
 * Encoder class for feature extraction using transformers.
 * @description Implements sentence embedding extraction with batch processing support.
 */
export class Encoder implements EmbeddingExtractor {
  /** Transformer pipeline instance for feature extraction */
  private pipeline: unknown = null
  /** Flag to track if the encoder has been initialized */
  private initialized: boolean = false

  /**
   * Initialize the embedding pipeline with the specified model.
   * @description Loads and prepares the transformer model.
   * @param model - Model identifier for the pipeline (defaults to all-MiniLM-L6-v2)
   * @returns Promise resolving when initialization is done
   * @throws {Error} When model loading fails or initialization encounters an error
   */
  async initialize(model: string = defaultModel): Promise<void> {
    try {
      if (this.isInitialized()) {
        return
      }
      this.pipeline = await pipeline('feature-extraction', model)
      this.initialized = true
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Failed to initialize embedding pipeline with model ${model}: ${errorMessage}`
      )
    }
  }

  /**
   * Check if the extractor is initialized and ready for operations.
   * @description Verifies pipeline is loaded and ready.
   * @returns True if initialized and ready, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized && this.pipeline !== null
  }

  /**
   * Extract embeddings from input sentences.
   * @description Processes sentences and returns their vector representations.
   * @param sentences - Array of sentences to process (must not be empty)
   * @param options - Configuration options for extraction
   * @returns Promise resolving to embedding results containing data, dimensions, and count
   * @throws {Error} When encoder is not initialized or sentences array is empty
   */
  async extract(sentences: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    if (!this.isInitialized()) {
      throw new Error('Encoder not initialized. Call initialize() first.')
    }
    if (sentences.length === 0) {
      throw new Error('Input sentences array cannot be empty')
    }
    const mergedOptions: Required<EmbeddingOptions> = { ...defaultOptions, ...options }
    try {
      const results: number[][] = await this.processBatches(sentences, mergedOptions)
      return {
        data: results,
        dimensions: results[0]?.length ?? 0,
        count: sentences.length
      }
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to extract embeddings: ${errorMessage}`)
    }
  }

  /**
   * Process sentences in batches for memory efficiency.
   * @description Splits large arrays into smaller batches to prevent memory overflow.
   * @param sentences - Array of sentences to process
   * @param options - Configuration options including batch size
   * @returns Promise resolving to array of embedding vectors
   */
  private async processBatches(
    sentences: string[],
    options: Required<EmbeddingOptions>
  ): Promise<number[][]> {
    const batches: string[][] = []
    for (let i: number = 0; i < sentences.length; i += options.batchSize) {
      batches.push(sentences.slice(i, i + options.batchSize))
    }
    const allResults: number[][] = []
    for (const batch of batches) {
      const batchResult: number[][] = await this.processBatch(batch, options)
      allResults.push(...batchResult)
    }
    return allResults
  }

  /**
   * Process a single batch of sentences through the transformer pipeline.
   * @description Executes embedding extraction for a batch using the loaded model.
   * @param batch - Batch of sentences to process
   * @param options - Configuration options for pooling and normalization
   * @returns Promise resolving to embedding arrays for the batch
   * @throws {Error} When pipeline is not initialized
   */
  private async processBatch(
    batch: string[],
    options: Required<EmbeddingOptions>
  ): Promise<number[][]> {
    if (this.pipeline === null) {
      throw new Error('Pipeline not initialized, call initialize() first.')
    }
    const pipelineCall: (
      input: string[],
      config: { pooling: string; normalize: boolean }
    ) => Promise<unknown> = this.pipeline as (
      input: string[],
      config: { pooling: string; normalize: boolean }
    ) => Promise<unknown>
    const output: unknown = await pipelineCall(batch, {
      pooling: options.pooling,
      normalize: options.normalize
    })
    const outputData: { data: Float32Array; dims: number[] } = output as {
      data: Float32Array
      dims: number[]
    }
    const numSentences: number = outputData.dims[0] ?? batch.length
    const dimensions: number = outputData.dims[1] ?? 0
    const results: number[][] = []
    for (let i: number = 0; i < numSentences; i++) {
      const start: number = i * dimensions
      const end: number = start + dimensions
      const embedding: number[] = Array.from(outputData.data.slice(start, end))
      results.push(embedding)
    }
    return results
  }

  /**
   * Dispose of the pipeline and reset state.
   * @description Cleans up resources and resets initialization state.
   */
  dispose(): void {
    this.pipeline = null
    this.initialized = false
  }
}
