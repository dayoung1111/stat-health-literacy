'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isCodeShape } from '@/lib/code-token';
import { startDemoSession } from '@/lib/demo-patient';
import { checkPatientEntry } from '@/lib/education-store';

// 오류는 글이 아니라 종류만 돌려주고, 화면이 고른 언어로 보여 준다(src/lib/messages/ entry).
const sixDigits = z.string().regex(/^\d{6}$/);

// 코드는 직접 넣는 6자리 번호 또는 링크로 온 코드(DEMO·토큰)
const entrySchema = z.object({
  code: z.string().refine(isCodeShape),
  birthDate: sixDigits,
});

export type EntryError =
  { kind: 'locked' } | { kind: 'wrong'; remaining?: number };

export type EntryState = {
  /** true: 숫자 6자리가 아님 */
  fieldErrors?: { code?: boolean; birthDate?: boolean };
  error?: EntryError;
};

export async function enterPatient(
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = entrySchema.safeParse({
    code: String(formData.get('code') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: { code: !!errors.code, birthDate: !!errors.birthDate },
    };
  }

  const { code, birthDate } = parsed.data;
  const entry = await checkPatientEntry(code, birthDate);
  if (!entry.ok) {
    if (entry.reason === 'locked') return { error: { kind: 'locked' } };
    return {
      error:
        entry.reason === 'wrong'
          ? { kind: 'wrong', remaining: entry.remaining }
          : { kind: 'wrong' },
    };
  }

  await startDemoSession(code);
  redirect(`/p/${code}/home`);
}
