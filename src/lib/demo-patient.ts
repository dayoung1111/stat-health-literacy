import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { findActiveCode } from './education-store';

// 환자 입장 확인용 쿠키. 코드·생년월일 확인은 education-store.ts가 한다(5번 틀리면 잠김).
// 로그인 단계에서 실제 세션으로 바꾼다. 이 쿠키는 서명이 없어 위조할 수 있으므로 실제 환자 정보에 쓰지 않는다.
const cookieName = 'stat_demo_patient';
const sevenDays = 60 * 60 * 24 * 7;

export async function startDemoSession(code: string) {
  (await cookies()).set(cookieName, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sevenDays,
    path: '/p',
  });
}

// 생년월일을 확인한 같은 코드이고, 코드가 만료·잠김이 아니어야 한다.
export async function getPatientCode(code: string) {
  const saved = (await cookies()).get(cookieName)?.value;
  if (saved !== code) return null;
  const row = await findActiveCode(code);
  return row && !row.lockedAt ? row : null;
}

export async function hasDemoSession(code: string) {
  return (await getPatientCode(code)) !== null;
}

// 확인되지 않은 환자는 생년월일 화면으로 돌려보낸다. 확인되면 그 코드 기록을 돌려준다.
export async function requireDemoPatient(code: string) {
  const row = await getPatientCode(code);
  if (!row) redirect(`/p/${encodeURIComponent(code)}`);
  return row;
}

// 시연에서 항상 "검사 전날" 화면이 보이도록 검사일을 한국 날짜 기준 내일로 둔다.
// 날짜 전용 값이므로 UTC 자정 기준으로 계산하고 시간대를 더하지 않는다.
export async function getDemoSchedule() {
  // 오늘 날짜는 요청 때마다 달라지므로 미리 만들어 두지 않고 요청 시점에 계산한다.
  await connection();
  const todayKst = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  const today = new Date(`${todayKst}T00:00:00Z`);
  const examDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const daysLeft = Math.round(
    (examDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  const examLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(examDate);

  return { examLabel, daysLeft };
}
