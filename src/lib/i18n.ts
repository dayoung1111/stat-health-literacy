// 환자 화면의 한국어/영어 글자. 화면 문장은 locales/ko.json·en.json의 ui에 있다.
// 의료 안내 원문(demo-guide.ts·medication-guide.ts·guide-catalog.ts)은 그대로 두고,
// en.json의 source에 "한국어 원문 → 영어" 짝을 둔다.
// 원문이 바뀌어 영어 짝이 없으면 한국어 원문을 그대로 보여 준다(옛 번역이 바뀐 의료 내용과 다르게 보이지 않도록).
// 의료 안내 영어는 간호학과 검수가 필요하다: docs/i18n-review.md

import en from '../../locales/en.json';
import ko from '../../locales/ko.json';

export const langs = ['ko', 'en'] as const;
export type Lang = (typeof langs)[number];
export type TextId = keyof typeof ko.ui;

/** 문장 속 {이름} 자리에 넣을 값. { source }는 한국어 원문이라 언어에 맞게 바꿔 넣는다. */
export type Vars = Record<string, string | number | { source: string }>;

/** 또박이 말: 화면 문장(id) 또는 의료 안내 원문(source) */
export type Said = { id: TextId; vars?: Vars } | { source: string };

// 영어 파일에 빠진 화면 문장이 있으면 여기서 타입 오류가 난다.
const ui: Record<Lang, Record<TextId, string>> = { ko: ko.ui, en: en.ui };
const sourceEn: Record<string, string> = en.source;
const subtitleKeysEn: Record<string, string> = en.subtitleKeys;

/** 의료 안내 원문(한국어)을 고른 언어로. 영어 짝이 없으면 원문 그대로. */
export function source(lang: Lang, korean: string) {
  return lang === 'en' ? (sourceEn[korean] ?? korean) : korean;
}

/** 화면 문장. {이름} 자리는 vars로 채운다. 영어가 아직 비어 있으면("") 한국어를 보여 준다. */
export function text(lang: Lang, id: TextId, vars?: Vars) {
  const template = ui[lang][id] || ui.ko[id];
  return template.replace(/\{(\w+)\}/g, (all, name: string) => {
    const value = vars?.[name];
    if (value === undefined) return all;
    return typeof value === 'object'
      ? source(lang, value.source)
      : String(value);
  });
}

export function say(lang: Lang, said: Said) {
  return 'id' in said
    ? text(lang, said.id, said.vars)
    : source(lang, said.source);
}

/** 영상 자막에서 색으로 강조할 말. 영어 자막 안에 그대로 들어 있어야 한다(없으면 강조하지 않음). */
export function subtitleKey(lang: Lang, key: string) {
  return lang === 'en' ? (subtitleKeysEn[key] ?? '') : key;
}

/** 브라우저 음성 언어 */
export const speechLang: Record<Lang, string> = { ko: 'ko-KR', en: 'en-US' };
