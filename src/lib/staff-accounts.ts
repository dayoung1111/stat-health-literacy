import { z } from 'zod';

import { createLoginThrottle } from './login-throttle';
import { hashSecret, matchesSecret } from './password';

// 간호사 계정의 규칙(DB·쿠키와 상관없는 부분). 저장은 staff-account-store.ts, 로그인 상태는 demo-staff.ts.

export type StaffRole = 'nurse' | 'admin';

export type StaffAccountRow = {
  id: string;
  name: string;
  passwordHash: string;
  role: StaffRole;
};

// 시연 계정 아이디는 새 계정이 쓸 수 없다(같은 아이디로 시연 계정을 가리지 못하게).
export const demoStaffIds = ['nurse01', 'nurse02', 'admin01'];

export const newAccountSchema = z.object({
  id: z
    .string()
    .trim()
    .min(3, '아이디는 3자 이상으로 해 주세요')
    .max(32, '아이디는 32자 이하로 해 주세요')
    .regex(/^[A-Za-z0-9_-]+$/, '아이디는 영문·숫자·_·-만 쓸 수 있어요')
    .refine((v) => !demoStaffIds.includes(v), '이미 있는 아이디예요'),
  name: z
    .string()
    .trim()
    .min(1, '이름을 적어 주세요')
    .max(30, '이름은 30자 이하로 해 주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상으로 해 주세요')
    .max(64, '비밀번호는 64자 이하로 해 주세요'),
});

export type NewAccountDeps = {
  /** 호출한 사람의 역할(서버가 로그인 정보에서 직접 확인한 값) */
  role: StaffRole | null;
  insert: (row: StaffAccountRow) => Promise<boolean>;
};

export type AccountResult =
  | { ok: true }
  | { ok: false; message: string; field?: 'id' | 'name' | 'password' };

// 관리자만 만들 수 있다. 부르는 쪽이 requireStaff('admin')을 해도, 여기서 한 번 더 막는다.
export async function createNurseAccount(
  deps: NewAccountDeps,
  input: { id: unknown; name: unknown; password: unknown },
): Promise<AccountResult> {
  if (deps.role !== 'admin') {
    return { ok: false, message: '관리자만 계정을 만들 수 있어요' };
  }
  const parsed = newAccountSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0];
    return {
      ok: false,
      message: issue.message,
      field:
        field === 'id' || field === 'name' || field === 'password'
          ? field
          : undefined,
    };
  }
  const created = await deps.insert({
    id: parsed.data.id,
    name: parsed.data.name,
    passwordHash: hashSecret(parsed.data.password),
    role: 'nurse',
  });
  return created
    ? { ok: true }
    : { ok: false, message: '이미 있는 아이디예요', field: 'id' };
}

export type DisableDeps = {
  role: StaffRole | null;
  disable: (id: string) => Promise<boolean>;
};

// 관리자만 중지할 수 있다. 시연 계정(코드에 있음)은 중지할 수 없다.
export async function disableNurseAccount(
  deps: DisableDeps,
  id: unknown,
): Promise<AccountResult> {
  if (deps.role !== 'admin') {
    return { ok: false, message: '관리자만 계정을 중지할 수 있어요' };
  }
  if (typeof id !== 'string' || demoStaffIds.includes(id)) {
    return { ok: false, message: '시연 계정은 중지할 수 없어요' };
  }
  return (await deps.disable(id))
    ? { ok: true }
    : { ok: false, message: '계정을 찾지 못했어요' };
}

export type StaffLogin =
  | { ok: true; id: string; role: StaffRole }
  | { ok: false; reason: 'wrong' | 'locked' };

// 같은 아이디로 5번 틀리면 10분 동안 잠근다. 없는 아이디·사용 중지 계정도 같은 시간이 걸리고
// 같은 실패로 처리해서, 아이디가 있는지 알아내지 못하게 한다.
export async function verifyLogin(
  deps: {
    throttle: ReturnType<typeof createLoginThrottle>;
    find: (id: string) => Promise<StaffAccountRow | null>;
    fallbackHash: string;
  },
  id: string,
  password: string,
): Promise<StaffLogin> {
  if (deps.throttle.isLocked(id)) return { ok: false, reason: 'locked' };
  const account = await deps.find(id);
  const matched = matchesSecret(
    password,
    (account ?? { passwordHash: deps.fallbackHash }).passwordHash,
  );
  if (account && matched) {
    deps.throttle.reset(id);
    return { ok: true, id: account.id, role: account.role };
  }
  const { locked } = deps.throttle.recordFailure(id);
  return { ok: false, reason: locked ? 'locked' : 'wrong' };
}
