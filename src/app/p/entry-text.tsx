'use client';

import type { Messages } from '@/lib/messages';

import { useLanguageOr } from '../language-provider';

type EntryTextName = {
  [K in keyof Messages['entry']]: Messages['entry'][K] extends string
    ? K
    : never;
}[keyof Messages['entry']];

// 번호 입력 화면의 글 한 조각을 고른 언어로 보여 준다(서버 화면 안에서도 쓸 수 있게).
// 줄바꿈(\n)은 화면에서 줄을 바꾼다.
// 환자가 직접 고른 언어가 먼저이고, 고른 적이 없으면 language(의료진이 발급 때 고른 언어), 그것도 없으면 한국어.
export function EntryText({
  name,
  language = 'ko',
}: {
  name: EntryTextName;
  language?: string;
}) {
  const { t } = useLanguageOr(language);
  return <span className="whitespace-pre-line">{t.entry[name]}</span>;
}
