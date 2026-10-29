'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isDemoPatient, startDemoSession } from '@/lib/demo-patient';

const sixDigits = z
  .string({ error: '숫자 6자리를 넣어 주세요' })
  .regex(/^\d{6}$/, '숫자 6자리를 넣어 주세요');

const entrySchema = z.object({ code: sixDigits, birthDate: sixDigits });

export type EntryState = {
  fieldErrors?: { code?: string; birthDate?: string };
  message?: string;
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
      fieldErrors: { code: errors.code?.[0], birthDate: errors.birthDate?.[0] },
    };
  }

  const { code, birthDate } = parsed.data;
  if (!isDemoPatient(code, birthDate)) {
    return { message: '번호나 생년월일을 다시 확인해 주세요' };
  }

  await startDemoSession(code);
  redirect(`/p/${code}/home`);
}
