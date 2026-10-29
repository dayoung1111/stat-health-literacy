'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  demoIssuedCode,
  endStaffSession,
  isDemoStaff,
  requireStaff,
  startStaffSession,
} from '@/lib/demo-staff';
import { ages, exams, extras, languages, levels } from '@/lib/staff-options';

export type LoginState = { message?: string };

const loginSchema = z.object({
  id: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginStaff(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success || !isDemoStaff(parsed.data.id, parsed.data.password)) {
    return { message: '아이디나 비밀번호를 다시 확인해 주세요' };
  }

  await startStaffSession();
  redirect('/staff/new');
}

export async function logoutStaff() {
  await endStaffSession();
  redirect('/staff');
}

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]];

function isRealDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const issueSchema = z.object({
  exam: z.enum(ids(exams)),
  age: z.enum(ids(ages)),
  level: z.enum(ids(levels)),
  language: z.enum(ids(languages)),
  extras: z.array(z.enum(ids(extras))),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '검사일을 골라 주세요')
    .refine(isRealDate, '검사일을 다시 확인해 주세요'),
  birthDate: z
    .string()
    .regex(/^\d{6}$/, '숫자 6자리를 넣어 주세요 (예: 590312)')
    .refine(
      (v) => isRealDate(`2000-${v.slice(2, 4)}-${v.slice(4, 6)}`),
      '생년월일을 다시 확인해 주세요',
    ),
});

export type IssueState = {
  fieldErrors?: { examDate?: string; birthDate?: string };
  message?: string;
};

export async function issueCode(
  _prev: IssueState,
  formData: FormData,
): Promise<IssueState> {
  await requireStaff();

  const parsed = issueSchema.safeParse({
    exam: formData.get('exam'),
    age: formData.get('age'),
    level: formData.get('level'),
    language: formData.get('language'),
    extras: formData.getAll('extras'),
    examDate: String(formData.get('examDate') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        examDate: errors.examDate?.[0],
        birthDate: errors.birthDate?.[0],
      },
      message:
        errors.exam || errors.age || errors.level || errors.language
          ? '나이대와 설명 단계를 다시 골라 주세요'
          : undefined,
    };
  }

  // 시연 단계: 저장하지 않고 시연용 코드를 발급한 것으로 보여 준다.
  // DB 단계에서 새 코드 생성·생년월일 해시 저장·7일 만료를 기록한다.
  redirect(`/staff/issued/${demoIssuedCode}`);
}
