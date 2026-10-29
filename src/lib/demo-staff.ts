import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSessionSecret } from './env';
import { createLoginThrottle } from './login-throttle';
import { matchesSecret } from './password';
import { isHttpsRequest } from './request-origin';
import { signToken, verifyToken } from './session-token';

// 시연용 임시 의료진 계정. 발급 기록은 education-store.ts(Supabase)에 있다. DB 단계에서 계정 표로 바꾼다.
// 비밀번호는 글자 그대로 두지 않고 해시(scrypt)만 저장한다. 시연 비밀번호는 README에 적혀 있다.
// 쿠키에는 서버 비밀값(SESSION_SECRET)으로 서명한 아이디만 담고, 서명이 맞지 않으면 로그인하지 않은 것으로 본다.
// 역할(간호사/관리자)은 쿠키가 아니라 아래 계정 정보에서 서버가 매번 다시 찾는다.

export type StaffRole = 'nurse' | 'admin';

export const roleLabels: Record<StaffRole, string> = {
  nurse: '간호사',
  admin: '관리자',
};

const demoAccounts: {
  id: string;
  passwordHash: string;
  name: string;
  role: StaffRole;
}[] = [
  {
    id: 'nurse01',
    passwordHash:
      'f58735b786cd03250c0a5810abe39fcf:4519433a8aea24ef758c0c20ee0778229d95a47ee036aeb96defde728ea202b6',
    name: '김간호사',
    role: 'nurse',
  },
  {
    id: 'nurse02',
    passwordHash:
      '22287acecab84f4e506ad7d8852a597e:33f15aea7f865fd40c671e0a54238e01944ebc6c22d085df85f99901f92e1a2a',
    name: '이간호사',
    role: 'nurse',
  },
  {
    id: 'admin01',
    passwordHash:
      '6c8d0bce89837a1a7f7a066545189f56:fa805f38b8f51f93dbee9927698216366c21b85a1c1ae9083d0040ecd8651689',
    name: '관리자',
    role: 'admin',
  },
];

const cookieName = 'stat_demo_staff';
const eightHours = 60 * 60 * 8;

// 같은 아이디로 5번 틀리면 10분 동안 잠근다(서버 메모리. 서버를 다시 켜면 풀린다).
const memory = globalThis as unknown as {
  statStaffThrottle?: ReturnType<typeof createLoginThrottle>;
};
const throttle = () => (memory.statStaffThrottle ??= createLoginThrottle());

export type StaffLogin =
  | { ok: true; id: string; role: StaffRole }
  | { ok: false; reason: 'wrong' | 'locked' };

// 없는 아이디도 같은 시간이 걸리고 같은 실패로 처리해서, 아이디가 있는지 알아내지 못하게 한다.
export async function checkStaffLogin(
  id: string,
  password: string,
): Promise<StaffLogin> {
  const limit = throttle();
  if (limit.isLocked(id)) return { ok: false, reason: 'locked' };
  const account = demoAccounts.find((a) => a.id === id);
  const matched = matchesSecret(
    password,
    (account ?? demoAccounts[0]).passwordHash,
  );
  if (account && matched) {
    limit.reset(id);
    return { ok: true, id: account.id, role: account.role };
  }
  const { locked } = limit.recordFailure(id);
  return { ok: false, reason: locked ? 'locked' : 'wrong' };
}

// 관리자 화면의 계정 목록. 비밀번호는 내보내지 않는다.
export function listStaffAccounts() {
  return demoAccounts.map(({ id, name, role }) => ({ id, name, role }));
}

// 로그인한 뒤 처음 보여 줄 화면
export const homeFor = (role: StaffRole) =>
  role === 'admin' ? '/staff/admin' : '/staff/new';

export async function startStaffSession(id: string) {
  (await cookies()).set(
    cookieName,
    signToken(getSessionSecret(), 'staff', id, eightHours),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: await isHttpsRequest(),
      maxAge: eightHours,
      path: '/staff',
    },
  );
}

export async function endStaffSession() {
  (await cookies()).delete({ name: cookieName, path: '/staff' });
}

export async function getStaff() {
  const saved = verifyToken(
    getSessionSecret(),
    (await cookies()).get(cookieName)?.value,
    'staff',
  );
  const account = demoAccounts.find((a) => a.id === saved);
  return account
    ? { id: account.id, name: account.name, role: account.role }
    : null;
}

// 로그인하지 않았으면(환자 포함) 의료진 로그인 화면으로, 역할이 다르면 자기 첫 화면으로 보낸다.
// 간호사는 관리자 화면에, 관리자는 간호사 화면(코드 발급·내 코드)에 들어갈 수 없다.
export async function requireStaff(role: StaffRole = 'nurse') {
  const staff = await getStaff();
  if (!staff) redirect('/staff');
  if (staff.role !== role) redirect(homeFor(staff.role));
  return staff;
}
