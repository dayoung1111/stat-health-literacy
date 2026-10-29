import { createHash } from 'node:crypto';

// AI 번역 결과를 믿기 전에 확인하는 규칙과 저장 키. 서버 비밀값이 없어서 단위 테스트를 할 수 있다.

// 한국어 원문을 번역하는 언어. 한국어(ko)는 원문 그대로 보여 주므로 번역하지 않는다.
export const translatableLanguages = ['en', 'ja', 'zh', 'vi'] as const;
export type TranslatableLanguage = (typeof translatableLanguages)[number];

export function isTranslatable(
  language: string,
): language is TranslatableLanguage {
  return (translatableLanguages as readonly string[]).includes(language);
}

// 저장 키: 언어 + 한국어 원문의 지문. 원문이 한 글자라도 바뀌면 다른 키가 되어 그 문장만 새로 번역된다.
export const cacheKey = (language: string, text: string) =>
  `${language}:${createHash('sha256').update(text).digest('hex')}`;

const numberPattern = /\d+(?:[.,]\d+)?/g;

function countNumbers(text: string) {
  const counts = new Map<string, number>();
  for (const token of text.match(numberPattern) ?? []) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

// 숫자·시간·양(1L, 500mL 등)이 번역문에 그대로 있어야 한다. 하나라도 빠지거나 바뀌면 번역을 쓰지 않는다.
export function numbersKept(source: string, translated: string) {
  const after = countNumbers(translated);
  for (const [token, count] of countNumbers(source)) {
    if ((after.get(token) ?? 0) < count) return false;
  }
  return true;
}

// 번역문으로 쓸 수 있는지: 비어 있지 않고, 터무니없이 길지 않고(원문에 없는 내용을 덧붙이지 않았는지 보는 최소 확인), 숫자가 그대로다.
export function isUsableTranslation(source: string, translated: string) {
  const text = translated.trim();
  if (text === '') return false;
  if (text.length > source.length * 6 + 40) return false;
  return numbersKept(source, text);
}
