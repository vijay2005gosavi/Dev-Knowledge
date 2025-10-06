import type { ScrapeItem, ScrapeResult, ScrapeSchema } from '@interfaces/index'
import fetchClient, { FetchError } from '@neabyte/fetch'
import { EmbedEncoder } from '@core/index'
import { LoggerUtils } from '@utils/index'
import { processScrapedResult } from '@root/Processor'

/**
 * Web scraper utility for crawling and extracting content from websites.
 * @description Recursively scrapes web pages with depth control and link extraction.
 */
export class ScraperUtils {
  /** Logger utility instance for logging operations */
  private readonly loggerUtils: LoggerUtils = LoggerUtils.getInstance()
  /** Set of visited URLs to prevent duplicate scraping */
  private readonly visited: Set<string> = new Set<string>()
  /** Queue of URLs to be scraped with their depth levels */
  private readonly queue: Set<string> = new Set<string>()
  /** Embedding encoder for processing content */
  private encoder: EmbedEncoder | null = null
  /** Schema for processing scraped content */
  private schema: ScrapeSchema | null = null
  /** Array of scraped content strings */
  private results: ScrapeResult[] = []
  /** Maximum depth level for recursive scraping */
  private maxDepth: number = 10

  /**
   * Scrapes all pages starting from the base URL with depth control and memory management.
   * @description Recursively crawls web pages with batch processing and memory cleanup.
   * @param baseUrl - The starting URL to begin scraping from
   * @param maxDepth - Maximum depth level for recursive scraping (default: 3)
   * @param concurrency - Number of parallel requests (default: 10)
   * @param batchSize - Number of results to process before cleanup (default: 100)
   * @param encoder - Embedding encoder for processing content
   * @param schema - Schema for processing scraped content
   * @returns Promise that resolves to an array of scraped content strings with their URLs
   * @throws {Error} When scraping fails or network errors occur
   */
  async scrapeAll(
    baseUrl: string,
    maxDepth: number = 3,
    concurrency: number = 10,
    batchSize: number = 100,
    encoder?: EmbedEncoder,
    schema?: ScrapeSchema
  ): Promise<ScrapeResult[]> {
    this.maxDepth = maxDepth
    this.encoder = encoder ?? null
    this.schema = schema ?? null
    this.queue.add(baseUrl)
    while (this.queue.size > 0) {
      const batch: string[] = Array.from(this.queue).slice(0, concurrency)
      batch.forEach((url: string) => this.queue.delete(url))
      const promises: Promise<void>[] = batch.map((url: string) =>
        this.processUrl({ url, depth: 0 })
      )
      await Promise.allSettled(promises)
      if (this.results.length >= batchSize && this.encoder && this.schema) {
        await this.processBatch(batchSize)
      }
    }
    if (this.results.length > 0 && this.encoder && this.schema) {
      await this.processBatch(this.results.length)
    }
    return this.results
  }

  /**
   * Process a batch of results with parallel embedding and memory cleanup.
   * @description Processes scraped results in parallel and cleans up memory.
   * @param batchSize - Number of results to process
   */
  private async processBatch(batchSize: number): Promise<void> {
    const batch: ScrapeResult[] = this.results.splice(0, batchSize)
    if (!this.encoder || !this.schema) {
      return
    }
    const promises: Promise<void>[] = batch.map(async (result: ScrapeResult) => {
      await processScrapedResult(result, this.schema as ScrapeSchema, this.encoder as EmbedEncoder)
    })
    await Promise.allSettled(promises)
    this.results = []
    if (this.queue.size > 10000) {
      const queueArray: string[] = Array.from(this.queue)
      const last10k: string[] = queueArray.slice(-10000)
      this.queue.clear()
      last10k.forEach((url: string) => this.queue.add(url))
    }
    if (global.gc) {
      global.gc()
    }
  }

  /**
   * Process a single URL item from the queue.
   * @description Handles individual URL processing with link extraction.
   * @param queueItem - The URL item to process
   */
  private async processUrl(queueItem: ScrapeItem): Promise<void> {
    const { url, depth }: ScrapeItem = queueItem
    if (this.visited.has(url)) {
      return
    }
    this.visited.add(url)
    try {
      const content: string = await this.scrapeUrl(url)
      this.results.push({ url, content })
      if (depth < this.maxDepth) {
        const newLinks: string[] = this.extractLinks(content, url)
        this.loggerUtils.debug(
          `🔗 Found ${newLinks.length} links from: ${url} (depth: ${depth + 1})`
        )
        newLinks.forEach((link: string) => {
          if (!this.visited.has(link)) {
            this.queue.add(link)
          }
        })
      }
    } catch (error) {
      this.loggerUtils.error(`💥 Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Scrapes content from a single URL.
   * @description Fetches content with timeout and retry configuration.
   * @param url - The URL to scrape content from
   * @returns Promise that resolves to the scraped content string with its URL
   * @throws {Error} When fetch fails or network errors occur
   */
  private async scrapeUrl(url: string): Promise<string> {
    try {
      const response: unknown = await fetchClient.get(url, {
        timeout: 10000,
        retries: 3,
        withCookies: true,
        headers: {
          'User-Agent': 'Dev-Knowledge-Scraper/1.0.0'
        }
      })
      return response as string
    } catch (error) {
      if (error instanceof FetchError) {
        throw new Error(`Fetch error for ${url}: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Extracts links from HTML content.
   * @description Finds href attributes and converts relative URLs to absolute.
   * @param html - The HTML content to extract links from
   * @param baseUrl - The base URL for resolving relative links
   * @returns Array of absolute URLs found in the HTML
   */
  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = []
    const base: URL = new URL(baseUrl)
    const hrefRegex: RegExp = /href=["']([^"']+)["']/gi
    let match: RegExpExecArray | null
    while ((match = hrefRegex.exec(html)) !== null) {
      const href: string | undefined = match[1]
      if (href === undefined || href === '') {
        continue
      }
      try {
        const absoluteUrl: string = new URL(href, base).href
        const isSameDomain: boolean = this.isWithinSameDomain(absoluteUrl, baseUrl)
        const isValid: boolean = this.isValidUrl(absoluteUrl)
        if (isSameDomain && isValid) {
          links.push(absoluteUrl)
        }
      } catch {
        continue
      }
    }
    return links
  }

  /**
   * Checks if URL is valid for scraping.
   * @description Only allows .html, .htm, or no extension URLs.
   * @param url - The URL to check
   * @returns True if URL should be scraped
   */
  private isValidUrl(url: string): boolean {
    if (url.includes('#')) {
      return false
    }
    try {
      const urlObj: URL = new URL(url)
      const pathname: string = urlObj.pathname.toLowerCase()
      const isValid: boolean =
        pathname.endsWith('.html') || pathname.endsWith('.htm') || !pathname.includes('.')
      return isValid
    } catch {
      return false
    }
  }

  /**
   * Checks if a URL is within the same domain as the base URL.
   * @description Validates hostname and allows all paths for the same hostname.
   * @param url - The URL to check
   * @param baseUrl - The base URL for comparison
   * @returns True if the URL is within the same domain, false otherwise
   */
  private isWithinSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlObj: URL = new URL(url)
      const baseObj: URL = new URL(baseUrl)
      const isSame: boolean = urlObj.hostname === baseObj.hostname
      return isSame
    } catch {
      return false
    }
  }
}
