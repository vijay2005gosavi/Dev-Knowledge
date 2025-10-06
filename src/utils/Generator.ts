import { randomBytes } from 'node:crypto'

/**
 * Utility class for generating unique identifiers.
 * @description Provides cryptographically secure ID generation.
 */
export class GeneratorUtils {
  /** Singleton instance of the generator utility */
  private static instance: GeneratorUtils

  /**
   * Private constructor for singleton pattern.
   * @description Prevents direct instantiation of the class.
   */
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Gets the singleton instance of GeneratorUtils.
   * @description Creates and returns the single instance using lazy initialization.
   * @returns The singleton GeneratorUtils instance
   */
  static getInstance(): GeneratorUtils {
    GeneratorUtils.instance ??= new GeneratorUtils()
    return GeneratorUtils.instance
  }

  /**
   * Generates a unique identifier using time-based entropy and cryptographic randomness.
   * @description Creates a hex-encoded ID with adaptive length based on current time.
   * @returns A unique hexadecimal string identifier
   */
  static generateId(): string {
    const timeBits: number = Math.ceil(Math.log2(Date.now()))
    const safetyBits: number = Math.min(64, Math.max(32, timeBits / 4))
    const bytes: number = Math.ceil((timeBits + safetyBits) / 8)
    const buffer: Buffer = Buffer.allocUnsafe(bytes)
    randomBytes(bytes).copy(buffer, 0, 0, bytes)
    return buffer.toString('hex')
  }
}
