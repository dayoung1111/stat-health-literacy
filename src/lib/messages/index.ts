import { en } from './en';
import { ja } from './ja';
import { ko, type Messages } from './ko';
import { vi } from './vi';
import { zh } from './zh';

// 화면 문구 5개 언어. 고르는 목록 순서도 이 순서다. 모르는 언어는 한국어로 보여 준다.
export const languages = ['ko', 'en', 'ja', 'zh', 'vi'] as const;
export type Language = (typeof languages)[number];

const all: Record<Language, Messages> = { ko, en, ja, zh, vi };

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && languages.includes(value as Language);
}

export function getMessages(language: string): Messages {
  return isLanguage(language) ? all[language] : ko;
}

export type { Messages };
