import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSessionSecret } from './env';
import { createLoginThrottle } from './login-throttle';
import { isHttpsRequest } from './request-origin';
import { signToken, verifyToken } from './session-token';
import {
  findActiveStaffAccount,
  listDbStaffAccounts,
} from './staff-account-store';
import {
  verifyLogin,
  type StaffAccountRow,
  type StaffLogin,
  type StaffRole,
} from './staff-accounts';

// 시연용 의료진 계정(코드에 고정, 항상 로그인 가능). 관리자가 만든 간호사 계정은 DB(staff-account-store.ts)에 있다.
// 발급 기록은 education-store.ts(Supabase)에 있다.
// 비밀번호는 글자 그대로 두지 않고 해시(scrypt)만 저장한다. 시연 비밀번호는 README에 적혀 있다.
// 쿠키에는 서버 비밀값(SESSION_SECRET)으로 서명한 아이디만 담고, 서명이 맞지 않으면 로그인하지 않은 것으로 본다.
// 역할(간호사/관리자)은 쿠키가 아니라 아래 계정 정보에서 서버가 매번 다시 찾는다.

export type { StaffRole };

export const roleLabels: Record<StaffRole, string> = {
  nurse: '간호사',
  admin: '관리자',
};

const demoAccounts: StaffAccountRow[] = [
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

export type { StaffLogin };

// 시연 계정을 먼저 찾고, 없으면 DB 계정(사용 중인 것만)을 찾는다. DB를 읽지 못하면 없는 계정으로 본다.
async function findAccount(id: string): Promise<StaffAccountRow | null> {
  const demo = demoAccounts.find((a) => a.id === id);
  if (demo) return demo;
  try {
    return await findActiveStaffAccount(id);
  } catch {
    return null;
  }
}

export function checkStaffLogin(
  id: string,
  password: string,
): Promise<StaffLogin> {
  return verifyLogin(
    {
      throttle: throttle(),
      find: findAccount,
      fallbackHash: demoAccounts[0].passwordHash,
    },
    id,
    password,
  );
}

// 관리자 화면의 계정 목록(시연 계정 + DB 계정). 비밀번호는 내보내지 않는다.
export async function listStaffAccounts() {
  const demo = demoAccounts.map(({ id, name, role }) => ({
    id,
    name,
    role,
    active: true,
    demo: true,
  }));
  const created = await listDbStaffAccounts().catch(() => []);
  return [
    ...demo,
    ...created.map((a) => ({ ...a, role: 'nurse' as const, demo: false })),
  ];
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
  if (!saved) return null;
  const demo = demoAccounts.find((a) => a.id === saved);
  if (demo) return { id: demo.id, name: demo.name, role: demo.role };
  // DB 계정은 요청마다 다시 확인해서, 사용 중지한 계정은 이미 로그인했어도 바로 막는다.
  try {
    const account = await findActiveStaffAccount(saved);
    return account
      ? { id: account.id, name: account.name, role: account.role }
      : null;
  } catch {
    return null;
  }
}

// 로그인하지 않았으면(환자 포함) 의료진 로그인 화면으로, 역할이 다르면 자기 첫 화면으로 보낸다.
// 간호사는 관리자 화면에, 관리자는 간호사 화면(코드 발급·내 코드)에 들어갈 수 없다.
export async function requireStaff(role: StaffRole = 'nurse') {
  const staff = await getStaff();
  if (!staff) redirect('/staff');
  if (staff.role !== role) redirect(homeFor(staff.role));
  return staff;
}
