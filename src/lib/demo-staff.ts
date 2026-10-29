import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { isHttpsRequest } from './request-origin';

// 시연용 임시 의료진 계정. 발급 기록은 education-store.ts에 있다. 로그인 단계에서
// 비밀번호 해시 저장·실제 세션·계정 표(DB)로 바꾼다. 이 쿠키는 서명이 없어 위조할 수 있다.
// 쿠키에는 아이디만 담고, 역할(간호사/관리자)은 아래 계정 정보에서 서버가 매번 다시 찾는다.

export type StaffRole = 'nurse' | 'admin';

export const roleLabels: Record<StaffRole, string> = {
  nurse: '간호사',
  admin: '관리자',
};

const demoAccounts: {
  id: string;
  password: string;
  name: string;
  role: StaffRole;
}[] = [
  { id: 'nurse01', password: '1234', name: '김간호사', role: 'nurse' },
  { id: 'nurse02', password: '1234', name: '이간호사', role: 'nurse' },
  { id: 'admin01', password: '1234', name: '관리자', role: 'admin' },
];

const cookieName = 'stat_demo_staff';
const eightHours = 60 * 60 * 8;

export function findDemoAccount(id: string, password: string) {
  const account = demoAccounts.find(
    (a) => a.id === id && a.password === password,
  );
  return account ? { id: account.id, role: account.role } : null;
}

// 관리자 화면의 계정 목록. 비밀번호는 내보내지 않는다.
export function listStaffAccounts() {
  return demoAccounts.map(({ id, name, role }) => ({ id, name, role }));
}

// 로그인한 뒤 처음 보여 줄 화면
export const homeFor = (role: StaffRole) =>
  role === 'admin' ? '/staff/admin' : '/staff/new';

export async function startStaffSession(id: string) {
  (await cookies()).set(cookieName, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isHttpsRequest(),
    maxAge: eightHours,
    path: '/staff',
  });
}

export async function endStaffSession() {
  (await cookies()).delete({ name: cookieName, path: '/staff' });
}

export async function getStaff() {
  const saved = (await cookies()).get(cookieName)?.value;
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
