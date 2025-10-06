# Dev Knowledge

Build knowledge base that scrapes developer documentation and makes it searchable using AI embeddings.

## 🚀 What it does

Turns documentation websites into a searchable database:
- **Scrapes** Node.js, TypeScript, Python, and JavaScript docs
- **Converts** HTML to clean Markdown
- **Creates** vector embeddings for semantic understanding
- **Stores** everything in a local SQLite database
- **Searches** using natural language queries

## 📦 Installation

```bash
npm install
npm run build
```

## 🎯 Usage

### Scraping and Indexing

```bash
npx tsx src/index.ts
# or
node dist/index.js      # after building
```

This will:
1. Initialize the embedding encoder
2. Scrape configured documentation sources
3. Convert HTML to Markdown
4. Generate vector embeddings
5. Store in SQLite database

## ⚙️ Configuration

Edit `src/Processor.ts` to modify scraping sources:

```typescript
export const scraperSchema: ScrapeSchema[] = [
  {
    url: ['https://nodejs.org/docs/latest-v24.x/api/'],
    parse: (content: string): string | null => {
      // Custom parsing logic
    }
  }
  // Add more sources...
]
```

---

## 🏗️ Project Structure

```
src/
├── core/                    # Core functionality
│   ├── Database.ts          # SQLite + sqlite-vec vector storage
│   └── embedding/           # Vector operations
│       ├── Encoder.ts       # Text to vector conversion
│       └── Decoder.ts       # Vector similarity search
├── interfaces/              # TypeScript type definitions
├── utils/                   # Utility classes
│   ├── Scraper.ts           # Web scraping with memory management
│   ├── Logger.ts            # Logging utilities
│   └── Generator.ts         # ID generation
├── index.ts                 # Main entry point
└── Processor.ts             # HTML to Markdown + embedding pipeline
```

## 📚 Dependencies

- `@neabyte/fetch` - HTTP client with retry logic
- `@xenova/transformers` - Vector embeddings
- `better-sqlite3` - SQLite database
- `sqlite-vec` - Vector similarity search
- `turndown` - HTML to Markdown conversion
- `jsdom` - DOM parsing

## 🗄️ Database Schema

```sql
CREATE TABLE embedding (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  vector BLOB NOT NULL,
  timestamp INTEGER NOT NULL
)
```

---

## 📄 License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.