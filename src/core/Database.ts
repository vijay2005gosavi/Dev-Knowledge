import type { EmbeddingQuery } from '@interfaces/index'
import sqliteDatabase from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

/**
 * Singleton database manager for vector storage and retrieval.
 * @description Manages SQLite database with sqlite-vec extension for efficient vector similarity search.
 */
export class Database {
  /** Singleton instance of the database */
  private static instance: Database | undefined
  /** SQLite database connection instance */
  private readonly db: sqliteDatabase.Database

  /**
   * Private constructor for singleton pattern.
   * @description Initializes SQLite database with sqlite-vec extension and creates required tables.
   */
  private constructor() {
    this.db = new sqliteDatabase('database.sqlite')
    sqliteVec.load(this.db)
    this.initializeTables()
  }

  /**
   * Gets the singleton instance of Database.
   * @description Creates and returns the single database instance using lazy initialization.
   * @returns The singleton Database instance
   */
  public static getInstance(): Database {
    Database.instance ??= new Database()
    return Database.instance
  }

  /**
   * Initializes the database tables for vector storage.
   * @description Creates the embedding table with required columns for vector data storage.
   */
  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embedding (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        content TEXT NOT NULL,
        vector BLOB NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `)
  }

  /**
   * Inserts a vector embedding into the database.
   * @description Stores embedding vector with metadata in the SQLite database for later retrieval.
   * @param id - Unique identifier for the embedding
   * @param embedding - The vector embedding as an array of numbers
   * @param source - Source URL where the content was scraped from
   * @param content - Original text content that was embedded
   * @param timestamp - Unix timestamp when the embedding was created
   */
  public insertVector(
    id: string,
    embedding: number[],
    source: string,
    content: string,
    timestamp: number
  ): void {
    const embeddingBuffer: Buffer = Buffer.from(new Float32Array(embedding).buffer)
    const statement: sqliteDatabase.Statement = this.db.prepare(`
      INSERT INTO embedding (id, source, content, vector, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `)
    statement.run(id, source, content, embeddingBuffer, timestamp)
  }

  /**
   * Searches for similar vectors using cosine similarity.
   * @description Performs vector similarity search using sqlite-vec's cosine distance function.
   * @param queryEmbedding - The query vector to find similar embeddings for
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Array of similar embeddings with similarity scores
   */
  public searchVectors(queryEmbedding: number[], limit: number = 10): EmbeddingQuery[] {
    const queryBuffer: Buffer = Buffer.from(new Float32Array(queryEmbedding).buffer)
    const statement: sqliteDatabase.Statement = this.db.prepare(`
      SELECT
        id,
        source,
        content,
        vector,
        timestamp,
        vec_distance_cosine(vector, ?) as distance
      FROM embedding
      ORDER BY vec_distance_cosine(vector, ?)
      LIMIT ?
    `)
    const results: unknown[] = statement.all(queryBuffer, queryBuffer, limit)
    return (results as Array<EmbeddingQuery>).map((result: EmbeddingQuery) => ({
      id: result.id,
      source: result.source,
      content: result.content,
      vector: Array.from(
        new Float32Array(
          Buffer.isBuffer(result.vector)
            ? result.vector.buffer
            : new Float32Array(result.vector).buffer
        )
      ),
      timestamp: result.timestamp,
      similarity: Math.round((1 - (result.distance ?? 0)) * 100)
    }))
  }

  /**
   * Closes the database connection.
   * @description Properly closes the SQLite database connection to free resources.
   */
  public close(): void {
    this.db.close()
  }
}

/**
 * Export the singleton instance of the database.
 * @description Exports the singleton instance of the database for use in other modules.
 * @returns The singleton Database instance
 */
export default Database.getInstance()
