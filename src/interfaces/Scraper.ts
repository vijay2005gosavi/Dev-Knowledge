/**
 * Represents a single item in the scraping queue.
 * @description Contains URL and depth level for recursive web scraping.
 */
export interface ScrapeItem {
  /** The URL to be scraped */
  url: string
  /** The current depth level of the URL in the scraping hierarchy */
  depth: number
}

/**
 * Represents the result of a single scrape operation.
 * @description Contains URL and scraped content for a single page.
 */
export interface ScrapeResult {
  /** The URL of the scraped page */
  url: string
  /** The scraped content of the page */
  content: string
}

/**
 * Represents a schema for scraping a website.
 * @description Contains URL and parse function for scraping a website.
 */
export interface ScrapeSchema {
  /** The URL of the website to scrape */
  url: string[]
  /** The function to parse the scraped content */
  parse: (content: string) => string | null
}
