import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Language, TranslationDictionary, translations } from '../i18n/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const ENGLISH = translations.en;
const SOURCE_LANGUAGE_STORAGE_KEY = 'tribal_lang';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG']);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'aria-placeholder'];

const trackedTextNodes = new Map<Text, string>();
const trackedAttributes = new Map<HTMLElement, Map<string, string>>();
let domTranslationTimer: ReturnType<typeof setTimeout> | undefined;
let domTranslationInFlight: Promise<void> | undefined;

function isSupportedLanguage(value: string | null): value is Language {
  return (
    value === 'en' ||
    value === 'as' ||
    value === 'bn' ||
    value === 'bho' ||
    value === 'gu' ||
    value === 'hi' ||
    value === 'kok' ||
    value === 'mai' ||
    value === 'ml' ||
    value === 'mr' ||
    value === 'ne' ||
    value === 'pa' ||
    value === 'sa' ||
    value === 'ta' ||
    value === 'te' ||
    value === 'ur'
  );
}

function containsSourceText(value: string): boolean {
  return /[A-Za-z]{2,}/.test(value) && value.length <= 5000;
}

function shouldSkipElement(element: Element | null): boolean {
  let current: Element | null = element;
  while (current) {
    if (SKIP_TAGS.has(current.tagName) || current.getAttribute('data-no-translate') === 'true') return true;
    current = current.parentElement;
  }
  return false;
}

function collectDomSources() {
  const textNodes: Array<{ node: Text; source: string }> = [];
  const attributes: Array<{ element: HTMLElement; attribute: string; source: string }> = [];
  if (!document.body) return { textNodes, attributes };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    const source = trackedTextNodes.get(textNode) || textNode.nodeValue || '';
    if (parent && !shouldSkipElement(parent) && containsSourceText(source)) {
      if (!trackedTextNodes.has(textNode)) trackedTextNodes.set(textNode, source);
      textNodes.push({ node: textNode, source: trackedTextNodes.get(textNode) || source });
    }
    node = walker.nextNode();
  }

  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (shouldSkipElement(element)) return;
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (!value || !containsSourceText(value)) continue;
      let stored = trackedAttributes.get(element);
      if (!stored) {
        stored = new Map<string, string>();
        trackedAttributes.set(element, stored);
      }
      if (!stored.has(attribute)) stored.set(attribute, value);
      attributes.push({ element, attribute, source: stored.get(attribute) || value });
    }
  });

  return { textNodes, attributes };
}

async function requestTranslations(texts: string[], targetLang: Exclude<Language, 'en'>): Promise<Record<string, string>> {
  const uniqueTexts = Array.from(new Set(texts.filter(containsSourceText)));
  if (uniqueTexts.length === 0) return {};
  try {
    const response = await fetch('/api/translate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: uniqueTexts, targetLang }),
    });
    if (!response.ok) return {};
    const payload = await response.json().catch(() => ({}));
    return payload?.translations && typeof payload.translations === 'object' ? payload.translations : {};
  } catch (error) {
    console.warn('[Translation] Browser request failed; keeping source text.', error);
    return {};
  }
}

async function translateDom(targetLang: Language) {
  const sources = collectDomSources();
  if (targetLang === 'en') {
    trackedTextNodes.forEach((source, node) => {
      if (node.isConnected) node.nodeValue = source;
    });
    trackedAttributes.forEach((values, element) => {
      if (!element.isConnected) return;
      values.forEach((source, attribute) => element.setAttribute(attribute, source));
    });
    return;
  }

  const textSources = sources.textNodes.map((item) => item.source);
  const attributeSources = sources.attributes.map((item) => item.source);
  const translated = await requestTranslations([...textSources, ...attributeSources], targetLang);

  sources.textNodes.forEach(({ node, source }) => {
    const value = translated[source];
    if (typeof value === 'string' && value && node.isConnected) {
      node.nodeValue = value;
    }
  });
  sources.attributes.forEach(({ element, attribute, source }) => {
    const value = translated[source];
    if (typeof value === 'string' && value && element.isConnected) {
      element.setAttribute(attribute, value);
    }
  });
}

function scheduleDomTranslation(targetLang: Language) {
  if (domTranslationTimer) clearTimeout(domTranslationTimer);
  domTranslationTimer = setTimeout(() => {
    domTranslationTimer = undefined;
    if (domTranslationInFlight) return;
    domTranslationInFlight = translateDom(targetLang).finally(() => {
      domTranslationInFlight = undefined;
    });
  }, 80);
}

async function translateDictionary(targetLang: Exclude<Language, 'en'>): Promise<TranslationDictionary> {
  const sourceValues: string[] = [];
  Object.values(ENGLISH).forEach((value) => {
    if (typeof value === 'string') sourceValues.push(value);
    else sourceValues.push(...value);
  });
  const translated = await requestTranslations(sourceValues, targetLang);
  const result = {} as TranslationDictionary;

  Object.entries(ENGLISH).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const nextValue = translated[value] || value;
      (result as any)[key] = nextValue;
    } else {
      (result as any)[key] = value.map((item: string) => {
        const nextValue = translated[item] || item;
        return nextValue;
      });
    }
  });
  return result;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(SOURCE_LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : 'en';
  });
  const [t, setT] = useState<TranslationDictionary>(ENGLISH);
  const currentLang = useRef<Language>(lang);

  const setLang = (newLang: Language) => {
    const safeLanguage = isSupportedLanguage(newLang) ? newLang : 'en';
    currentLang.current = safeLanguage;
    localStorage.setItem(SOURCE_LANGUAGE_STORAGE_KEY, safeLanguage);
    setLangState(safeLanguage);
  };

  useEffect(() => {
    currentLang.current = lang;
    let active = true;
    if (lang === 'en') {
      setT(ENGLISH);
      scheduleDomTranslation('en');
      return () => {
        active = false;
      };
    }

    setT(ENGLISH);
    scheduleDomTranslation(lang);
    translateDictionary(lang).then((dictionary) => {
      if (active && currentLang.current === lang) setT(dictionary);
    });
    return () => {
      active = false;
    };
  }, [lang]);

  useEffect(() => {
    const observer = new MutationObserver(() => scheduleDomTranslation(currentLang.current));
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (domTranslationTimer) clearTimeout(domTranslationTimer);
    };
  }, []);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
