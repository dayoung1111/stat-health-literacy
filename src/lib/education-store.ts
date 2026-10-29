import 'server-only';

import {
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

import { connection } from 'next/server';

import { demoGuide } from './demo-guide';
import type { GuideKind } from './guide-catalog';
import type { MedicationId } from './medication-guide';

// 교육 코드와 환자 기록의 "시연용 임시 저장소"(앱 서버 메모리).
// prisma/schema.prisma의 EducationCode·MedicationCheck·TeachbackResult·ConfusionMark와 같은 모양이다.
// DB를 연결할 때는 이 파일의 함수 안쪽만 Prisma 조회로 바꾼다. 화면·서버 처리 코드는 그대로 둔다.
// 주의: 앱을 다시 켜면 지워지고(시연 데이터만 다시 생김), Vercel처럼 서버가 여러 대면 서로 공유되지 않는다.
// 환자 이름·등록번호·전화번호는 받지도 저장하지도 않는다.

export type TeachbackOutcome = 'correct' | 'retry_correct' | 'wrong';

export type EducationCode = {
  code: string;
  staffId: string;
  guides: GuideKind[];
  ageGroup: string;
  level: string;
  language: string;
  extras: string[];
  /** 검사일 YYYY-MM-DD(한국 날짜) */
  examDate: string;
  birthDateHash: string;
  failedAttempts: number;
  lockedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  medicationCheck: { medications: MedicationId[]; checkedAt: Date } | null;
  teachbackResults: {
    guide: GuideKind;
    question: string;
    result: TeachbackOutcome;
    answeredAt: Date;
  }[];
  confusionMarks: {
    guide: GuideKind;
    paragraphId: string;
    count: number;
    lastAt: Date;
  }[];
};

export const MAX_ATTEMPTS = 5;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// 생년월일 6자리를 되돌릴 수 없게 바꾼다(코드마다 다른 소금). DB 단계에서도 같은 방식을 쓴다.
function hashBirthDate(birthDate: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(birthDate, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function matchesBirthDate(birthDate: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(birthDate, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// 개발 중 화면을 고쳐도 지워지지 않도록 전역에 둔다.
const memory = globalThis as unknown as {
  statEducationCodes?: Map<string, EducationCode>;
};

function codes() {
  if (!memory.statEducationCodes) {
    memory.statEducationCodes = new Map();
    seedDemoCodes(memory.statEducationCodes);
  }
  return memory.statEducationCodes;
}

// 만료(발급 7일 뒤)된 코드는 묶인 약 체크·티치백·헷갈려요 기록과 함께 지운다.
// 지금 시각은 요청마다 다르므로 요청이 들어온 뒤에 읽는다(화면 미리 만들기에서 제외).
async function removeExpired() {
  await connection();
  const now = Date.now();
  for (const [code, row] of codes()) {
    if (row.expiresAt.getTime() <= now) codes().delete(code);
  }
}

function newCode() {
  for (;;) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    if (!codes().has(code)) return code;
  }
}

export async function createEducationCode(input: {
  staffId: string;
  guides: GuideKind[];
  ageGroup: string;
  level: string;
  language: string;
  extras: string[];
  examDate: string;
  birthDate: string;
}) {
  await removeExpired();
  const now = new Date();
  const { birthDate, ...rest } = input;
  const row: EducationCode = {
    ...rest,
    code: newCode(),
    birthDateHash: hashBirthDate(birthDate),
    failedAttempts: 0,
    lockedAt: null,
    expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    createdAt: now,
    medicationCheck: null,
    teachbackResults: [],
    confusionMarks: [],
  };
  codes().set(row.code, row);
  return row;
}

/** 만료되지 않은 코드. 없으면 null. */
export async function findActiveCode(code: string) {
  await removeExpired();
  return codes().get(code) ?? null;
}

export type EntryResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'locked' }
  | { ok: false; reason: 'wrong'; remaining: number };

// 환자 입장: 코드 + 생년월일 확인. 5번 틀리면 잠근다.
export async function checkPatientEntry(
  code: string,
  birthDate: string,
): Promise<EntryResult> {
  const row = await findActiveCode(code);
  if (!row) return { ok: false, reason: 'not-found' };
  if (row.lockedAt) return { ok: false, reason: 'locked' };
  if (matchesBirthDate(birthDate, row.birthDateHash)) {
    row.failedAttempts = 0;
    return { ok: true };
  }
  row.failedAttempts += 1;
  if (row.failedAttempts >= MAX_ATTEMPTS) {
    row.lockedAt = new Date();
    return { ok: false, reason: 'locked' };
  }
  return {
    ok: false,
    reason: 'wrong',
    remaining: MAX_ATTEMPTS - row.failedAttempts,
  };
}

// 의료진은 자기가 발급한 코드만 본다.
export async function listCodesForStaff(staffId: string) {
  await removeExpired();
  return [...codes().values()]
    .filter((row) => row.staffId === staffId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function findCodeForStaff(staffId: string, code: string) {
  const row = await findActiveCode(code);
  return row && row.staffId === staffId ? row : null;
}

// "내가 먹는 약": 다시 체크하면 최신으로 바꾼다.
export async function saveMedicationCheck(
  code: string,
  medications: MedicationId[],
) {
  const row = await findActiveCode(code);
  if (!row) return;
  row.medicationCheck = { medications, checkedAt: new Date() };
}

// 티치백: 같은 안내의 같은 질문은 최신 결과로 바꾼다.
export async function saveTeachbackResult(
  code: string,
  guide: GuideKind,
  question: string,
  result: TeachbackOutcome,
) {
  const row = await findActiveCode(code);
  if (!row) return;
  const answeredAt = new Date();
  const found = row.teachbackResults.find(
    (r) => r.guide === guide && r.question === question,
  );
  if (found) Object.assign(found, { result, answeredAt });
  else row.teachbackResults.push({ guide, question, result, answeredAt });
}

// "헷갈려요": 같은 문단을 다시 누르면 횟수를 늘리고 마지막 시각을 바꾼다.
export async function addConfusionMark(
  code: string,
  guide: GuideKind,
  paragraphId: string,
) {
  const row = await findActiveCode(code);
  if (!row) return;
  const lastAt = new Date();
  const found = row.confusionMarks.find(
    (m) => m.guide === guide && m.paragraphId === paragraphId,
  );
  if (found) Object.assign(found, { count: found.count + 1, lastAt });
  else row.confusionMarks.push({ guide, paragraphId, count: 1, lastAt });
}

// 시연 데이터. 482917(생년월일 590312)은 결과가 비어 있어, 환자 화면에서 한 결과가 그대로 쌓인다.
// 나머지는 의료진 목록이 비어 보이지 않게 넣은 예시이며, 550031은 다른 간호사 코드(보이면 안 됨).
function seedDemoCodes(map: Map<string, EducationCode>) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const examDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(tomorrow);
  const base = {
    extras: [] as string[],
    examDate,
    failedAttempts: 0,
    lockedAt: null,
    expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    medicationCheck: null,
    teachbackResults: [] as EducationCode['teachbackResults'],
    confusionMarks: [] as EducationCode['confusionMarks'],
  };
  const topics = demoGuide.questions.map((q) => q.topic);
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  const rows: EducationCode[] = [
    {
      ...base,
      code: '482917',
      staffId: 'nurse01',
      guides: ['colonoscopy', 'medication'],
      ageGroup: '60',
      level: 'easy',
      language: 'ko',
      birthDateHash: hashBirthDate('590312'),
      createdAt: minutesAgo(5),
    },
    {
      ...base,
      code: '305566',
      staffId: 'nurse01',
      guides: ['colonoscopy'],
      ageGroup: '50',
      level: 'normal',
      language: 'vi',
      birthDateHash: hashBirthDate('700101'),
      createdAt: minutesAgo(60),
      teachbackResults: [
        {
          guide: 'colonoscopy',
          question: topics[0],
          result: 'wrong',
          answeredAt: minutesAgo(40),
        },
        {
          guide: 'colonoscopy',
          question: topics[1],
          result: 'correct',
          answeredAt: minutesAgo(39),
        },
        {
          guide: 'colonoscopy',
          question: topics[2],
          result: 'wrong',
          answeredAt: minutesAgo(38),
        },
        {
          guide: 'colonoscopy',
          question: topics[3],
          result: 'correct',
          answeredAt: minutesAgo(37),
        },
      ],
      confusionMarks: [
        {
          guide: 'colonoscopy',
          paragraphId: 'prep-mix',
          count: 2,
          lastAt: minutesAgo(45),
        },
      ],
    },
    {
      ...base,
      code: '771204',
      staffId: 'nurse01',
      guides: ['gastroscopy', 'medication'],
      ageGroup: '70',
      level: 'very-easy',
      language: 'ko',
      extras: ['large-text', 'guardian'],
      birthDateHash: hashBirthDate('480215'),
      createdAt: minutesAgo(120),
      medicationCheck: {
        medications: ['blood-pressure', 'blood-thinner'],
        checkedAt: minutesAgo(100),
      },
    },
    {
      ...base,
      code: '550031',
      staffId: 'nurse02',
      guides: ['checkup'],
      ageGroup: '10-40',
      level: 'normal',
      language: 'ko',
      birthDateHash: hashBirthDate('900101'),
      createdAt: minutesAgo(30),
    },
  ];
  for (const row of rows) map.set(row.code, row);
}
