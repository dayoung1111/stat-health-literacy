import 'server-only';

import en from './translations/en.json';
import ja from './translations/ja.json';
import vi from './translations/vi.json';
import zh from './translations/zh.json';

// 미리 번역해 둔 문장(src/lib/translations/*.json: 한국어 원문 → 번역). AI를 부르지 않고 바로 쓴다.
// 한국어 원문이 한 글자라도 바뀌면 여기서 찾지 못하고, 그 문장만 AI가 번역한다.
const presets: Record<string, Record<string, string>> = { en, ja, vi, zh };

export const presetFor = (language: string, text: string) =>
  presets[language]?.[text];
