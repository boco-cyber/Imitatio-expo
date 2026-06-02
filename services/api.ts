const BASE = 'https://imitation.copticfaith.org/api/imitation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Book {
  id: number;
  title: string;
  chapterCount: number;
}

export interface Article {
  id: number;
  source: string;
  book_number: number;
}

export interface Quote {
  id: number;
  day: number;
  calendar_date: string;
  title: string;
  source: string;
  body: string;
  prayer: string;
}

export interface ParsedSource {
  bookNumber: number;
  chapterNumber: number | null;
  chapterTitle: string;
  raw: string;
}

// ─── Module-level cache ────────────────────────────────────────────────────────

let booksCache: Book[] | null = null;
let articlesCache: Article[] | null = null;
const quoteByDayCache = new Map<number, Quote | null>();
const quoteByIdCache = new Map<number, Quote | null>();
let allQuotesCache: Quote[] | null = null;
let allQuotesPromise: Promise<Quote[]> | null = null;

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function fetchBooks(): Promise<Book[]> {
  if (booksCache) return booksCache;
  const data = await get<{ items: Book[] }>('/books');
  booksCache = data.items;
  return booksCache;
}

// ─── Articles (chapters) ──────────────────────────────────────────────────────

export async function fetchArticles(): Promise<Article[]> {
  if (articlesCache) return articlesCache;
  const data = await get<{ items: Article[] }>('/articles');
  articlesCache = data.items;
  return articlesCache;
}

// ─── Quotes: single by day ────────────────────────────────────────────────────

export async function fetchQuoteByDay(day: number): Promise<Quote | null> {
  if (quoteByDayCache.has(day)) return quoteByDayCache.get(day) ?? null;
  const data = await get<{ items: Quote[] }>(`/quotes?day=${day}`);
  const quote = data.items?.[0] ?? null;
  quoteByDayCache.set(day, quote);
  if (quote) quoteByIdCache.set(quote.id, quote);
  return quote;
}

// ─── Quotes: single by ID ─────────────────────────────────────────────────────

export async function fetchQuoteById(id: number): Promise<Quote | null> {
  if (quoteByIdCache.has(id)) return quoteByIdCache.get(id) ?? null;
  const data = await get<{ item: Quote }>(`/quotes/${id}`);
  const quote = data.item ?? null;
  if (quote) {
    quoteByIdCache.set(id, quote);
    quoteByDayCache.set(quote.day, quote);
  }
  return quote;
}

// ─── Quotes: search ───────────────────────────────────────────────────────────

export async function searchQuotes(
  q: string,
  limit = 50,
  offset = 0,
): Promise<{ items: Quote[]; total: number }> {
  const data = await get<{ items: Quote[]; total: number }>(
    `/quotes?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
  );
  return data;
}

// ─── Quotes: all (lazy, cached) ───────────────────────────────────────────────

export async function fetchAllQuotes(
  onProgress?: (loaded: number, total: number) => void,
): Promise<Quote[]> {
  if (allQuotesCache) return allQuotesCache;
  if (allQuotesPromise) return allQuotesPromise;

  allQuotesPromise = (async () => {
    const first = await get<{ items: Quote[]; total: number }>(
      '/quotes?limit=100&offset=0',
    );
    const total = first.total;
    const all: Quote[] = [...first.items];
    onProgress?.(all.length, total);

    const remaining = Math.ceil((total - 100) / 100);
    const pages = await Promise.all(
      Array.from({ length: remaining }, (_, i) =>
        get<{ items: Quote[] }>(`/quotes?limit=100&offset=${(i + 1) * 100}`),
      ),
    );
    for (const p of pages) {
      all.push(...p.items);
      onProgress?.(all.length, total);
    }

    const sorted = all.sort((a, b) => a.day - b.day);
    // Populate day and id caches
    for (const q of sorted) {
      quoteByDayCache.set(q.day, q);
      quoteByIdCache.set(q.id, q);
    }
    allQuotesCache = sorted;
    allQuotesPromise = null;
    return sorted;
  })();

  return allQuotesPromise;
}

export function getCachedAllQuotes(): Quote[] | null {
  return allQuotesCache;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

const BOOK_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4,
};

export function parseSource(source: string): ParsedSource {
  const bookMatch = source.match(/Book\s+(One|Two|Three|Four)/i);
  const bookNumber = bookMatch ? (BOOK_WORDS[bookMatch[1].toLowerCase()] ?? 0) : 0;

  const chapterMatch = source.match(/Chapter\s+(\d+)/i);
  const chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : null;

  const dashIdx = source.indexOf('—');
  const chapterTitle =
    dashIdx !== -1 ? source.slice(dashIdx + 1).trim() : source;

  return { bookNumber, chapterNumber, chapterTitle, raw: source };
}
