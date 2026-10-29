import { en } from './en';
import { ko, type Messages } from './ko';
import { vi } from './vi';
import { zh } from './zh';

// 의료진이 발급할 때 고른 언어(staff-options.ts의 languages)로 문구를 고른다. 모르는 언어는 한국어.
const all: Record<string, Messages> = { ko, en, zh, vi };

export function getMessages(language: string): Messages {
  return all[language] ?? ko;
}

export type { Messages };
