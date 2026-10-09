import fs from 'fs';
import path from 'path';

export const DEEPL_TARGETS = {
  as: 'AS',
  bn: 'BN',
  bho: 'BHO',
  gu: 'GU',
  hi: 'HI',
  kok: 'GOM',
  mai: 'MAI',
  ml: 'ML',
  mr: 'MR',
  ne: 'NE',
  pa: 'PA',
  sa: 'SA',
  ta: 'TA',
  te: 'TE',
  ur: 'UR',
} as const;

export type DeepLTarget = keyof typeof DEEPL_TARGETS;

const CACHE_FILE = path.resolve('data/translation-cache.json');
const DEFAULT_DEEPL_URL = 'https://api-free.deepl.com/v2/translate';
const MAX_TEXTS_PER_REQUEST = 50;
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;

type TranslationCache = Record<string, string>;

let cache: TranslationCache = {};
let cacheLoaded = false;
const inFlight = new Map<string, Promise<string>>();

function loadCache() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) cache = parsed;
    }
  } catch (error) {
    console.warn('[Translation] Cache load failed; starting empty:', error instanceof Error ? error.message : error);
    cache = {};
  }
}

function saveCache() {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    const temporaryFile = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(cache), 'utf8');
    fs.renameSync(temporaryFile, CACHE_FILE);
  } catch (error) {
    console.warn('[Translation] Cache save failed:', error instanceof Error ? error.message : error);
  }
}

function normalizeText(text: unknown): string {
  return typeof text === 'string' ? text.trim() : '';
}

function cacheKey(target: DeepLTarget, text: string): string {
  return `en|${target}|${text}`;
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestDeepL(texts: string[], target: DeepLTarget): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Translation] DEEPL_API_KEY is not configured; returning source text.');
    return texts;
  }

  const endpoint = (process.env.DEEPL_API_URL || DEFAULT_DEEPL_URL).replace(/\/$/, '');
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      console.info(`[Translation] DeepL request: ${texts.length} text(s) -> ${DEEPL_TARGETS[target]}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: texts,
          source_lang: 'EN',
          target_lang: DEEPL_TARGETS[target],
          preserve_formatting: true,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const traceId = response.headers.get('x-trace-id');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload?.message === 'string' ? payload.message : `HTTP ${response.status}`;
        if (response.status === 429) console.warn('[Translation] DeepL rate limited.');
        console.warn(`[Translation] DeepL response ${response.status}${traceId ? ` (trace ${traceId})` : ''}: ${message}`);
        const error = new Error(message);
        if (!isRetryable(response.status) || attempt === MAX_RETRIES) throw error;
        lastError = error;
        await sleep(500 * (2 ** attempt));
        continue;
      }

      const translations = Array.isArray(payload?.translations) ? payload.translations : [];
      if (translations.length !== texts.length || translations.some((item: any) => typeof item?.text !== 'string')) {
        throw new Error('DeepL returned an invalid translation response.');
      }
      console.info(`[Translation] DeepL response: ${translations.length} translation(s)${traceId ? ` (trace ${traceId})` : ''}`);
      return translations.map((item: any) => item.text as string);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await sleep(500 * (2 ** attempt));
        continue;
      }
    }
  }

  console.error('[Translation] Translation failed:', lastError?.message || 'Unknown error');
  throw lastError || new Error('DeepL translation failed.');
}

async function translateMissing(texts: string[], target: DeepLTarget): Promise<string[]> {
  const translations: string[] = [];
  for (let offset = 0; offset < texts.length; offset += MAX_TEXTS_PER_REQUEST) {
    const chunk = texts.slice(offset, offset + MAX_TEXTS_PER_REQUEST);
    translations.push(...await requestDeepL(chunk, target));
  }
  return translations;
}

export function isSupportedTarget(value: unknown): value is DeepLTarget {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DEEPL_TARGETS, value);
}

export async function translateTexts(texts: unknown[], target: DeepLTarget): Promise<Record<string, string>> {
  loadCache();
  const uniqueTexts = Array.from(new Set(texts.map(normalizeText).filter(Boolean)))
    .filter((text) => text.length <= MAX_TEXT_LENGTH);
  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const text of uniqueTexts) {
    const key = cacheKey(target, text);
    if (typeof cache[key] === 'string' && cache[key].length > 0) {
      console.info('[Translation] Cache hit');
      result[text] = cache[key];
    } else {
      console.info('[Translation] Cache miss');
      missing.push(text);
    }
  }

  if (missing.length === 0) return result;
  if (!process.env.DEEPL_API_KEY?.trim()) {
    missing.forEach((text) => { result[text] = text; });
    return result;
  }

  const newTexts = missing.filter((text) => !inFlight.has(cacheKey(target, text)));
  if (newTexts.length > 0) {
    const sharedRequest = translateMissing(newTexts, target).then((translated) => {
      translated.forEach((value, index) => {
        const source = newTexts[index];
        const key = cacheKey(target, source);
        const safeValue = typeof value === 'string' && value.trim() ? value : source;
        cache[key] = safeValue;
        console.info('[Translation] Translation saved to cache');
      });
      saveCache();
      return translated;
    });

    newTexts.forEach((text, index) => {
      const key = cacheKey(target, text);
      inFlight.set(key, sharedRequest.then((translated) => translated[index] || text).finally(() => inFlight.delete(key)));
    });
  }

  await Promise.all(missing.map(async (text) => {
    const key = cacheKey(target, text);
    const translated = await inFlight.get(key);
    result[text] = translated || text;
  }));

  return result;
}
