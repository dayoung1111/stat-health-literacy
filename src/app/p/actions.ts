'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { startDemoSession } from '@/lib/demo-patient';
import { checkPatientEntry } from '@/lib/education-store';
import type { TextId, Vars } from '@/lib/i18n';

// 안내 문장은 id로 돌려주고, 화면이 고른 언어(한국어/영어)로 보여 준다.
// 고른 언어는 서버로 보내지 않는다.
const sixDigitsMessage = 'entry.sixDigits' satisfies TextId;
const sixDigits = z
  .string({ error: sixDigitsMessage })
  .regex(/^\d{6}$/, sixDigitsMessage);

const entrySchema = z.object({ code: sixDigits, birthDate: sixDigits });

export type EntryMessage = { id: TextId; vars?: Vars };

export type EntryState = {
  fieldErrors?: { code?: TextId; birthDate?: TextId };
  message?: EntryMessage;
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
    // 위 검사가 쓰는 문장은 숫자 6자리 안내 하나뿐이다.
    const fieldError = (list?: string[]) =>
      list?.length ? sixDigitsMessage : undefined;
    return {
      fieldErrors: {
        code: fieldError(errors.code),
        birthDate: fieldError(errors.birthDate),
      },
    };
  }

  const { code, birthDate } = parsed.data;
  const entry = await checkPatientEntry(code, birthDate);
  if (!entry.ok) {
    if (entry.reason === 'locked') {
      return { message: { id: 'entry.locked' } };
    }
    return {
      message:
        entry.reason === 'wrong'
          ? { id: 'entry.wrongLeft', vars: { remaining: entry.remaining } }
          : { id: 'entry.wrong' },
    };
  }

  await startDemoSession(code);
  redirect(`/p/${code}/home`);
}
