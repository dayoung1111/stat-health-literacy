'use client';

import type { Messages } from '@/lib/messages';

import { useLanguage } from '../language-provider';

type EntryTextName = {
  [K in keyof Messages['entry']]: Messages['entry'][K] extends string
    ? K
    : never;
}[keyof Messages['entry']];

// 번호 입력 화면의 글 한 조각을 고른 언어로 보여 준다(서버 화면 안에서도 쓸 수 있게).
// 줄바꿈(\n)은 화면에서 줄을 바꾼다.
export function EntryText({ name }: { name: EntryTextName }) {
  const { t } = useLanguage();
  return <span className="whitespace-pre-line">{t.entry[name]}</span>;
}
