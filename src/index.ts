import { EmbedEncoder } from '@core/index'
import { LoggerUtils, ScraperUtils } from '@utils/index'
import { scraperSchema } from '@root/Processor'

/**
 * Main function to run the application.
 * @description Scrapes the website and stores the data in the database with memory management.
 */
async function main(): Promise<void> {
  const encoder: EmbedEncoder = new EmbedEncoder()
  await encoder.initialize()
  for (const schema of scraperSchema) {
    const scraper: ScraperUtils = new ScraperUtils()
    for (const url of schema.url) {
      await scraper.scrapeAll(url, 3, 20, 100, encoder, schema)
    }
  }
  process.exit(0)
}

/**
 * Main function to run the application.
 * @description Scrapes the website and stores the data in the database.
 */
main().catch((error: unknown) => {
  LoggerUtils.getInstance().error(error instanceof Error ? error.message : 'Unknown error')
})
