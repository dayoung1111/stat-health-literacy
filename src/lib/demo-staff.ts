import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 시연용 임시 의료진 계정. 발급 기록은 education-store.ts에 있다. 로그인 단계에서
// 비밀번호 해시 저장·실제 세션으로 바꾼다. 이 쿠키는 서명이 없어 위조할 수 있다.
const demoStaff = { id: 'nurse01', password: '1234', name: '김간호사' };
const cookieName = 'stat_demo_staff';
const eightHours = 60 * 60 * 8;

export function isDemoStaff(id: string, password: string) {
  return id === demoStaff.id && password === demoStaff.password;
}

export async function startStaffSession() {
  (await cookies()).set(cookieName, demoStaff.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: eightHours,
    path: '/staff',
  });
}

export async function endStaffSession() {
  (await cookies()).delete({ name: cookieName, path: '/staff' });
}

export async function getStaff() {
  const saved = (await cookies()).get(cookieName)?.value;
  return saved === demoStaff.id
    ? { id: demoStaff.id, name: demoStaff.name }
    : null;
}

// 로그인하지 않았으면(환자 포함) 의료진 로그인 화면으로 보낸다.
export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect('/staff');
  return staff;
}
