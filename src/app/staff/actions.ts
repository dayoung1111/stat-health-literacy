'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  endStaffSession,
  isDemoStaff,
  requireStaff,
  startStaffSession,
} from '@/lib/demo-staff';
import { createEducationCode } from '@/lib/education-store';
import { guideKinds } from '@/lib/guide-catalog';
import { ages, extras, languages, levels } from '@/lib/staff-options';

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
  guides: z
    .array(z.enum(guideKinds))
    .min(1, '보낼 안내를 하나 이상 골라 주세요')
    .transform((list) => [...new Set(list)]),
  age: z.enum(ids(ages)),
  level: z.enum(ids(levels)),
  language: z.enum(ids(languages)),
  extras: z.array(z.enum(ids(extras))),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '검사일을 골라 주세요')
    .refine(isRealDate, '검사일을 다시 확인해 주세요'),
  // 선택 칸. 비우면 환자 화면에 "의사 선생님과 정한 날짜부터"로 보인다.
  bloodThinnerStopDate: z
    .string()
    .refine(
      (v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && isRealDate(v)),
      '날짜를 다시 확인해 주세요',
    )
    .transform((v) => (v === '' ? null : v)),
  birthDate: z
    .string()
    .regex(/^\d{6}$/, '숫자 6자리를 넣어 주세요 (예: 590312)')
    .refine(
      (v) => isRealDate(`2000-${v.slice(2, 4)}-${v.slice(4, 6)}`),
      '생년월일을 다시 확인해 주세요',
    ),
});

export type IssueState = {
  fieldErrors?: {
    examDate?: string;
    birthDate?: string;
    bloodThinnerStopDate?: string;
  };
  /** 화면에서 그 단계로 돌아가 고칠 수 있게 알려 준다. */
  step?: 'guides' | 'patient';
  message?: string;
};

export async function issueCode(
  _prev: IssueState,
  formData: FormData,
): Promise<IssueState> {
  const staff = await requireStaff();

  const parsed = issueSchema.safeParse({
    guides: formData.getAll('guides'),
    age: formData.get('age'),
    level: formData.get('level'),
    language: formData.get('language'),
    extras: formData.getAll('extras'),
    examDate: String(formData.get('examDate') ?? ''),
    bloodThinnerStopDate: String(formData.get('bloodThinnerStopDate') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        examDate: errors.examDate?.[0],
        bloodThinnerStopDate: errors.bloodThinnerStopDate?.[0],
        birthDate: errors.birthDate?.[0],
      },
      ...(errors.guides
        ? { step: 'guides' as const, message: errors.guides[0] }
        : errors.age || errors.level || errors.language || errors.extras
          ? {
              step: 'patient' as const,
              message: '나이대와 설명 단계를 다시 골라 주세요',
            }
          : {}),
    };
  }

  // 고른 안내를 코드 1개(QR·링크 1개)로 묶어 발급한다. 지금은 시연용 임시 저장소에 둔다.
  const { age, ...rest } = parsed.data;
  const issued = await createEducationCode({
    ...rest,
    ageGroup: age,
    staffId: staff.id,
  });
  redirect(`/staff/issued/${issued.code}`);
}
