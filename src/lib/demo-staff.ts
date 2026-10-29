import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

// 시연용 임시 의료진 계정과 가짜 발급 기록. DB·로그인 단계(계획 3~5단계)에서
// 비밀번호 해시 저장·실제 세션·DB 조회로 바꾼다. 이 쿠키는 서명이 없어 위조할 수 있다.
const demoStaff = { id: 'nurse01', password: '1234', name: '김간호사' };
const cookieName = 'stat_demo_staff';
const eightHours = 60 * 60 * 8;

// 시연에서는 어떤 검사를 골라도 시연용 환자 코드를 발급한 것으로 보여 준다.
export const demoIssuedCode = '482917';

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

export type QuestionResult = {
  question: string;
  result: 'correct' | 'retry-correct' | 'wrong';
};

type IssuedCode = {
  code: string;
  issuedBy: string;
  exam: string;
  examDate: string;
  setting: string;
  results: QuestionResult[];
  relearn?: string;
  confused?: string;
};

const issuedCodes: IssuedCode[] = [
  {
    code: '482917',
    issuedBy: 'nurse01',
    exam: '대장내시경',
    examDate: '11/5',
    setting: '60대·쉬움',
    results: [
      { question: '약은 언제부터?', result: 'correct' },
      { question: '피할 음식은?', result: 'retry-correct' },
      { question: '당일 아침 당뇨약은?', result: 'wrong' },
    ],
    relearn: '검사 당일 아침 당뇨약 중단 (2번 틀림)',
    confused: '장정결제 복용법 (2회)',
  },
  {
    code: '305566',
    issuedBy: 'nurse01',
    exam: '대장내시경',
    examDate: '11/5',
    setting: '베트남어',
    results: [
      { question: '약은 언제부터?', result: 'wrong' },
      { question: '피할 음식은?', result: 'correct' },
      { question: '당일 아침 당뇨약은?', result: 'wrong' },
    ],
    relearn: '장 비우는 약 시작 시간, 당일 아침 당뇨약 중단',
    confused: '먹는 약 (1회)',
  },
  {
    code: '771204',
    issuedBy: 'nurse01',
    exam: '위내시경',
    examDate: '11/6',
    setting: '70대·아주쉬움',
    results: [
      { question: '검사 전 금식 시간은?', result: 'correct' },
      { question: '아침 약은?', result: 'correct' },
      { question: '검사 후 식사는?', result: 'retry-correct' },
    ],
  },
  // 다른 간호사의 코드. 목록·상세에서 보이지 않아야 한다.
  {
    code: '550031',
    issuedBy: 'nurse02',
    exam: '퇴원 교육',
    examDate: '11/7',
    setting: '10~50대·보통',
    results: [],
  },
];

export function passedCount(results: QuestionResult[]) {
  return results.filter((r) => r.result !== 'wrong').length;
}

// 의료진은 자기가 발급한 코드만 본다.
export async function getMyCodes() {
  const staff = await requireStaff();
  return issuedCodes.filter((c) => c.issuedBy === staff.id);
}

export async function getMyCode(code: string) {
  const mine = await getMyCodes();
  return mine.find((c) => c.code === code) ?? null;
}

// 코드는 발급 후 7일 뒤 만료된다. 화면에는 한국 날짜로 보여 준다.
export async function getExpiryLabel() {
  await connection();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
  }).format(expires);
}
