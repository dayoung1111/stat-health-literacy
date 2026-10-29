'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { startDemoSession } from '@/lib/demo-patient';
import { checkPatientEntry } from '@/lib/education-store';

// 오류는 글이 아니라 종류만 돌려주고, 화면이 고른 언어로 보여 준다(src/lib/messages/ entry).
const sixDigits = z.string().regex(/^\d{6}$/);

const entrySchema = z.object({ code: sixDigits, birthDate: sixDigits });

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
