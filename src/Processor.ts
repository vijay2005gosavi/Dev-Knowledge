import type {
  EmbeddingResult,
  EmbeddingStored,
  ScrapeResult,
  ScrapeSchema
} from '@interfaces/index'
import TurndownService from 'turndown'
import { JSDOM } from 'jsdom'
import { Database, EmbedEncoder } from '@core/index'
import { GeneratorUtils, LoggerUtils } from '@utils/index'

/** Turndown service instance for converting HTML to Markdown */
const turndownService: TurndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

/** Scraper schema for scraping a website */
export const scraperSchema: ScrapeSchema[] = [
  {
    url: ['https://nodejs.org/docs/latest-v24.x/api/'],
    parse: (content: string): string | null => {
      const dom: JSDOM = new JSDOM(content)
      const contentDiv: Element | null = dom.window.document.querySelector('#apicontent')
      if (contentDiv === null) {
        return null
      }
      return turndownService.turndown(contentDiv.innerHTML)
    }
  },

  {
    url: ['https://www.typescriptlang.org/docs/handbook/intro.html'],
    parse: (content: string): string | null => {
      const dom: JSDOM = new JSDOM(content)
      const contentDiv: Element | null = dom.window.document.querySelector('div#handbook-content')
      if (contentDiv === null) {
        return null
      }
      return turndownService.turndown(contentDiv.innerHTML)
    }
  },
  {
    url: ['https://www.javascripttutorial.net/'],
    parse: (content: string): string | null => {
      const dom: JSDOM = new JSDOM(content)
      const contentDiv: Element | null = dom.window.document.querySelector('main.site-main')
      if (contentDiv === null) {
        return null
      }
      return turndownService.turndown(contentDiv.innerHTML)
    }
  },
  {
    url: ['https://docs.python.org/3/contents.html'],
    parse: (content: string): string | null => {
      const dom: JSDOM = new JSDOM(content)
      const contentDiv: Element | null = dom.window.document.querySelector(
        'div.documentwrapper > div.bodywrapper'
      )
      if (contentDiv === null) {
        return null
      }
      return turndownService.turndown(contentDiv.innerHTML)
    }
  }
]

/**
 * Process a single scraped result and store it in the database.
 * @description Converts the scraped content to Markdown and stores it in the database.
 * @param result - The scraped result to process
 * @param schema - The schema to use for parsing the content
 * @param encoder - The encoder to use for embedding the content
 */
export async function processScrapedResult(
  result: ScrapeResult,
  schema: ScrapeSchema,
  encoder: EmbedEncoder
): Promise<void> {
  const markdown: string | null = schema.parse(result.content)
  if (markdown === null || markdown.length === 0) {
    return
  }
  const embeddingResult: EmbeddingResult = await encoder.extract([markdown])
  const embeddingVector: number[] = embeddingResult.data[0] ?? []
  const embeddingStored: EmbeddingStored = {
    id: GeneratorUtils.generateId(),
    source: result.url,
    content: markdown,
    vector: embeddingVector,
    timestamp: Date.now()
  }
  Database.insertVector(
    embeddingStored.id,
    embeddingVector,
    result.url,
    markdown,
    embeddingStored.timestamp
  )
  LoggerUtils.getInstance().info(`${embeddingStored.source} Stored successfully.`)
}
