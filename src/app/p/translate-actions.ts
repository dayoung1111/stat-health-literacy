'use server';

import { z } from 'zod';

import { getSessionPatientCode } from '@/lib/demo-patient';
import { translateTexts } from '@/lib/translate';
import { translatableLanguages } from '@/lib/translation-rules';

// 환자 화면이 한국어 문장을 고른 언어로 받아 가는 서버 함수.
// 생년월일을 확인한 환자만 쓸 수 있고, 한 번에 보낼 수 있는 개수·길이와 분당 횟수를 제한한다.
// 어떤 경우에도 실패하지 않고, 번역할 수 없으면 한국어 원문을 그대로 돌려준다.
const requestSchema = z.object({
  language: z.enum(translatableLanguages),
  texts: z.array(z.string().max(600)).min(1).max(40),
});

const PER_MINUTE = 30;
const windows = globalThis as unknown as {
  statTranslateWindows?: Map<string, { start: number; count: number }>;
};

function withinLimit(code: string) {
  const map = (windows.statTranslateWindows ??= new Map());
  const now = Date.now();
  const entry = map.get(code);
  if (!entry || now - entry.start > 60_000) {
    map.set(code, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= PER_MINUTE;
}

export async function translateForPatient(
  language: string,
  texts: string[],
): Promise<string[]> {
  const parsed = requestSchema.safeParse({ language, texts });
  if (!parsed.success) return texts;
  const code = await getSessionPatientCode();
  if (!code || !withinLimit(code)) return texts;
  return translateTexts(parsed.data.language, parsed.data.texts);
}
