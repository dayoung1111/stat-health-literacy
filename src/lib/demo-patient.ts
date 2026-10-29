import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

// 시연용 임시 코드. DB·로그인 단계(계획 3~5단계)에서 DB 조회와 실제 세션으로 바꾼다.
// 이 쿠키는 서명이 없어 위조할 수 있으므로 실제 환자 정보에 쓰지 않는다.
const demoPatient = { code: '482917', birthDate: '590312' };
const cookieName = 'stat_demo_patient';
const sevenDays = 60 * 60 * 24 * 7;

export function isDemoPatient(code: string, birthDate: string) {
  return code === demoPatient.code && birthDate === demoPatient.birthDate;
}

export async function startDemoSession(code: string) {
  (await cookies()).set(cookieName, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sevenDays,
    path: '/p',
  });
}

export async function hasDemoSession(code: string) {
  const saved = (await cookies()).get(cookieName)?.value;
  return code === demoPatient.code && saved === code;
}

// 확인되지 않은 환자는 생년월일 화면으로 돌려보낸다.
export async function requireDemoPatient(code: string) {
  if (!(await hasDemoSession(code))) {
    redirect(`/p/${encodeURIComponent(code)}`);
  }
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

  // 검사 당일 두 번째 약(새벽 5시, 1시간)을 다 드신 뒤인지: 한국 시간 6시부터로 본다.
  const kstHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date()),
  );
  const afterSecondDose = daysLeft === 0 && kstHour >= 6;

  return { examLabel, daysLeft, afterSecondDose };
}
