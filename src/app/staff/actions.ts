'use server';

import { refresh } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { canDiscardCode, canManageCode } from '@/lib/code-access';
import { isCodeShape } from '@/lib/code-shape';
import {
  endStaffSession,
  checkStaffLogin,
  getStaff,
  homeFor,
  requireStaff,
  startStaffSession,
} from '@/lib/demo-staff';
import {
  createEducationCode,
  discardCode,
  findActiveCode,
  resetDemoRecords,
  unlockCode,
} from '@/lib/education-store';
import { guideKinds } from '@/lib/guide-catalog';
import { ages, extras, languages, levels } from '@/lib/staff-options';

export type LoginState = { message?: string };

// 길이·글자를 제한해서 너무 긴 값이나 이상한 값으로 서버를 괴롭히지 못하게 한다.
const loginSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/),
  password: z.string().min(1).max(64),
});

export async function loginStaff(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  const account = parsed.success
    ? await checkStaffLogin(parsed.data.id, parsed.data.password)
    : null;
  if (account && !account.ok && account.reason === 'locked') {
    return {
      message: '5번 틀려서 잠시 잠겼어요. 10분 뒤에 다시 해 주세요',
    };
  }
  if (!account?.ok) {
    return { message: '아이디나 비밀번호를 다시 확인해 주세요' };
  }

  // 같은 로그인 화면에서 아이디에 따라 간호사·관리자 첫 화면으로 나눈다.
  await startStaffSession(account.id);
  redirect(homeFor(account.role));
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

  // 고른 안내를 코드 1개(QR·링크 1개)로 묶어 발급한다. Supabase(education-store.ts)에 저장한다.
  const { age, ...rest } = parsed.data;
  const issued = await createEducationCode({
    ...rest,
    ageGroup: age,
    staffId: staff.id,
  });
  redirect(`/staff/issued/${issued.code}`);
}

// ── 코드 관리(관리자 화면·내 코드 목록의 버튼) ─────────────────────────
// 버튼을 누를 때마다 서버가 로그인과 역할을 다시 확인한다(화면에 버튼이 보이는지와 상관없이).

export type CodeActionResult = { ok: true } | { ok: false; message: string };

// 🔄 시연 기록 초기화: 관리자만. 시연 코드(000000·482917·777777·DEMO)의 기록만 지우고 코드는 남긴다.
export async function resetDemoRecordsAction(): Promise<CodeActionResult> {
  await requireStaff('admin');
  await resetDemoRecords();
  refresh();
  return { ok: true };
}

// 관리할 수 있는 코드(관리자: 모든 코드, 간호사: 자기가 발급한 코드). 남의 코드·없는 코드는 404.
async function managedCode(code: unknown) {
  const staff = await getStaff();
  if (!staff) redirect('/staff');
  if (typeof code !== 'string' || !isCodeShape(code)) notFound();
  const row = await findActiveCode(code);
  if (!row || !canManageCode(staff, row)) notFound();
  return { staff, row };
}

// 🔓 잠금 풀기: 틀린 횟수 0, 잠금 해제
export async function unlockCodeAction(
  code: string,
): Promise<CodeActionResult> {
  const { row } = await managedCode(code);
  await unlockCode(row.code);
  refresh();
  return { ok: true };
}

// 🗑️ 코드 폐기: 코드와 기록을 지운다. 시연 코드는 폐기할 수 없다.
export async function discardCodeAction(
  code: string,
): Promise<CodeActionResult> {
  const { staff, row } = await managedCode(code);
  if (!canDiscardCode(staff, row)) {
    return { ok: false, message: '시연 코드는 폐기할 수 없어요' };
  }
  await discardCode(row.code);
  refresh();
  return { ok: true };
}
