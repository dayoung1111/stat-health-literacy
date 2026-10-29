import 'server-only';

import { connection } from 'next/server';

import { isOwnedBy } from './code-access';
import {
  birthCheckFor,
  createCodeToken,
  DEMO_CODE,
  looksLikeCodeToken,
  matchesBirthDate,
  readCodeToken,
} from './code-token';
import { demoGuide } from './demo-guide';
import { getCodeTokenSecret } from './env';
import type { GuideKind } from './guide-catalog';
import { createLoginThrottle } from './login-throttle';
import type { MedicationId } from './medication-guide';
import { matchesSecret } from './password';

// 교육 코드와 환자 기록의 "시연용 임시 저장소"(앱 서버 메모리).
// prisma/schema.prisma의 EducationCode·MedicationCheck·TeachbackResult·ConfusionMark와 같은 모양이다.
// DB를 연결할 때는 이 파일의 함수 안쪽만 Prisma 조회로 바꾼다. 화면·서버 처리 코드는 그대로 둔다.
// 주의: 앱을 다시 켜면 지워지고(시연 데이터만 다시 생김), Vercel처럼 서버가 여러 대면 서로 공유되지 않는다.
// 그래서 새로 발급하는 코드와 /p/DEMO는 여기에 저장하지 않는다. 발급 내용은 암호화·서명한 토큰(code-token.ts)으로
// 링크·QR에 담고, 읽을 때마다 토큰을 풀어 같은 모양의 행을 만든다. 그 코드의 결과 기록(약·티치백 등)은 남지 않는다.
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
  /** 피를 묽게 하는 약 중단 시작일 YYYY-MM-DD(선택). schema.prisma EducationCode.bloodThinnerStopDate와 같은 칸. */
  bloodThinnerStopDate: string | null;
  birthDateHash: string;
  failedAttempts: number;
  lockedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  /** 환자가 고른 "드시는 약". pickedAt은 약마다 처음 고른 시간(schema.prisma MedicationCheck.pickedAt과 같은 칸). */
  medicationCheck: {
    medications: MedicationId[];
    checkedAt: Date;
    pickedAt: Partial<Record<MedicationId, Date>>;
  } | null;
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
  /** 환자가 끝까지 마친 안내(대장내시경: 8교시 끝, 드시는 약: "확인했어요"). schema.prisma에는 아직 칸이 없다. */
  guideCompletions: { guide: GuideKind; completedAt: Date }[];
};

export const MAX_ATTEMPTS = 5;

// 000000(생년월일 111111)은 시연이 꼬였을 때 쓰는 예비 코드다(아래 seedDemoCodes, 서버 메모리).
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// 시연용 코드의 생년월일은 해시로만 둔다(원래 값은 README의 시연 안내에 있다).
const demoBirthHash = {
  backup:
    '10d3b4f10fd575df1a89657a5890e7ee:b5dbbded40bd859c439897bbde0a680bf91f2e2cc38a0ef98571fa116a2a9ed0',
  gastro:
    'c0f4d6f634164a00a98b84b8e716c9e1:1b2c60ac621ce1922b45347aff5d2ddedb79760239da176a557419c2e3830d93',
  colon:
    'e1081659c0ee20b75ed6867ca0949767:57a09b145a6d3a04dd78bcd7c0d497580e97432ac5e978953233f73b44fc1a54',
  vi: 'e7dcd26e697aedcbfd9340576e02a800:b86ea6aa037d5fa609a7819af946cb02377aa06be635167dfd744d8e6d986dd6',
  checkup:
    '9654a4eff1dbf5f2bd9574845300ddc6:a00beee9378349a23b70d13d7cc34cbd678cdb24e773462c46307a9ac7ecda51',
};

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

// 발급: 서버에 저장하지 않고, 발급 내용을 암호화·서명한 토큰을 코드로 쓴다(링크·QR에 그대로 담김).
// 그래서 서버가 여러 대이거나 다시 켜져도 발급 화면·환자 화면이 열린다.
export async function createEducationCode(input: {
  staffId: string;
  guides: GuideKind[];
  ageGroup: string;
  level: string;
  language: string;
  extras: string[];
  examDate: string;
  bloodThinnerStopDate: string | null;
  birthDate: string;
}) {
  const now = new Date();
  const { birthDate, ...rest } = input;
  const code = createCodeToken(
    getCodeTokenSecret(),
    {
      ...rest,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    },
    birthDate,
  );
  const row = await findActiveCode(code);
  if (!row) throw new Error('방금 만든 교육 코드를 읽지 못했어요.');
  return row;
}

// 토큰·고정 시연 코드는 저장된 행이 없으므로, 읽을 때마다 같은 모양의 행을 만들어 돌려준다.
// 생년월일 확인값은 앞에 token:을 붙여 예전 해시와 구분한다. 결과 기록(약·티치백 등)은 남지 않는다.
const tokenHashPrefix = 'token:';

function rowFromToken(
  code: string,
  data: Omit<
    EducationCode,
    | 'code'
    | 'birthDateHash'
    | 'failedAttempts'
    | 'lockedAt'
    | 'medicationCheck'
    | 'teachbackResults'
    | 'confusionMarks'
    | 'guideCompletions'
  >,
  birthCheck: string,
): EducationCode {
  return {
    ...data,
    code,
    birthDateHash: tokenHashPrefix + birthCheck,
    failedAttempts: 0,
    lockedAt: null,
    medicationCheck: null,
    teachbackResults: [],
    confusionMarks: [],
    guideCompletions: [],
  };
}

// /p/DEMO: 4개 안내(기본 검진 → 위내시경 → 대장내시경 → 복용약), 생년월일 800101,
// 검사일은 들어온 날(한국 날짜) + 2일. 소스코드 고정값이라 서버 저장이 필요 없다.
function demoRow(): EducationCode {
  const secret = getCodeTokenSecret();
  const todayKst = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  const exam = new Date(`${todayKst}T00:00:00Z`);
  exam.setUTCDate(exam.getUTCDate() + 2);
  const now = new Date();
  return rowFromToken(
    DEMO_CODE,
    {
      staffId: 'demo',
      guides: ['checkup', 'gastroscopy', 'colonoscopy', 'medication'],
      ageGroup: '60',
      level: 'easy',
      language: 'ko',
      extras: [],
      examDate: exam.toISOString().slice(0, 10),
      bloodThinnerStopDate: null,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    },
    birthCheckFor(secret, '800101'),
  );
}

/** 만료되지 않은 코드. 없으면(위조·변조·만료 토큰 포함) null. */
export async function findActiveCode(code: string) {
  await removeExpired();
  if (code === DEMO_CODE) return demoRow();
  if (looksLikeCodeToken(code)) {
    const data = readCodeToken(getCodeTokenSecret(), code);
    if (!data) return null;
    const { birthCheck, ...rest } = data;
    return rowFromToken(code, rest, birthCheck);
  }
  return codes().get(code) ?? null;
}

// 토큰·시연 코드의 생년월일 실패 잠금. 저장소가 없어 서버 한 대 안에서만 세는 보조 장치다
// (서버가 바뀌면 처음부터 센다). 화면 표시는 이것에 기대지 않는다.
const tokenEntryThrottle = createLoginThrottle({ max: MAX_ATTEMPTS });

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
  if (row.birthDateHash.startsWith(tokenHashPrefix)) {
    const key = code.slice(0, 64);
    if (tokenEntryThrottle.isLocked(key))
      return { ok: false, reason: 'locked' };
    const check = row.birthDateHash.slice(tokenHashPrefix.length);
    if (matchesBirthDate(getCodeTokenSecret(), birthDate, check)) {
      tokenEntryThrottle.reset(key);
      return { ok: true };
    }
    const { locked, remaining } = tokenEntryThrottle.recordFailure(key);
    return locked
      ? { ok: false, reason: 'locked' }
      : { ok: false, reason: 'wrong', remaining };
  }
  if (row.lockedAt) return { ok: false, reason: 'locked' };
  if (matchesSecret(birthDate, row.birthDateHash)) {
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

// 관리자 화면: 모든 간호사의 코드(만료된 코드 제외). 역할 확인은 부르는 쪽(requireStaff('admin'))에서 한다.
export async function listAllCodes() {
  await removeExpired();
  return [...codes().values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

// 의료진은 자기가 발급한 코드만 본다.
export async function listCodesForStaff(staffId: string) {
  await removeExpired();
  return [...codes().values()]
    .filter((row) => isOwnedBy(row, staffId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function findCodeForStaff(staffId: string, code: string) {
  const row = await findActiveCode(code);
  return row && isOwnedBy(row, staffId) ? row : null;
}

// "내가 먹는 약": 다시 저장하면 최신 목록으로 바꾼다(추가·빼기 모두).
export async function saveMedicationCheck(
  code: string,
  medications: MedicationId[],
) {
  const row = await findActiveCode(code);
  if (!row) return;
  // 약을 더하거나 빼도, 이미 고른 약의 "고른 시간"은 그대로 둔다.
  const now = new Date();
  const before = row.medicationCheck?.pickedAt ?? {};
  const pickedAt: Partial<Record<MedicationId, Date>> = {};
  for (const id of medications) pickedAt[id] = before[id] ?? now;
  row.medicationCheck = { medications, checkedAt: now, pickedAt };
}

// 티치백: 같은 안내의 같은 질문은 최신 결과로 바꾼다.
// 복용약 확인 질문도 여기에 guide='medication', question=약 아이디로 저장한다.
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

// 안내 완료: 처음 마친 시각을 남긴다(다시 마쳐도 그대로). 바뀐 코드 정보를 돌려준다.
export async function markGuideCompleted(code: string, guide: GuideKind) {
  const row = await findActiveCode(code);
  if (!row) return null;
  if (!row.guideCompletions.some((c) => c.guide === guide)) {
    row.guideCompletions.push({ guide, completedAt: new Date() });
  }
  return row;
}

// 시연 데이터. 000000(생년월일 111111, 예비)과 482917(생년월일 590312)은 결과가 비어 있어,
// 환자 화면에서 한 결과가 그대로 쌓인다.
// 나머지는 의료진 목록이 비어 보이지 않게 넣은 예시이며, 550031은 다른 간호사 코드(보이면 안 됨).
function seedDemoCodes(map: Map<string, EducationCode>) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const examDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(tomorrow);
  // 코드마다 목록(배열)을 새로 만든다. 같은 배열을 나눠 쓰면 한 환자의 기록이 다른 코드에도 보인다.
  const base = () => ({
    extras: [] as string[],
    examDate,
    bloodThinnerStopDate: null,
    failedAttempts: 0,
    lockedAt: null,
    expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    medicationCheck: null,
    teachbackResults: [] as EducationCode['teachbackResults'],
    confusionMarks: [] as EducationCode['confusionMarks'],
    guideCompletions: [] as EducationCode['guideCompletions'],
  });
  const topics = demoGuide.questions.map((q) => q.topic);
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  const rows: EducationCode[] = [
    {
      ...base(),
      code: '000000',
      staffId: 'nurse01',
      guides: ['colonoscopy', 'medication'],
      ageGroup: '60',
      level: 'easy',
      language: 'ko',
      birthDateHash: demoBirthHash.backup,
      createdAt: minutesAgo(10),
    },
    {
      ...base(),
      code: '482917',
      staffId: 'nurse01',
      guides: ['colonoscopy', 'medication'],
      ageGroup: '60',
      level: 'easy',
      language: 'ko',
      birthDateHash: demoBirthHash.colon,
      createdAt: minutesAgo(5),
    },
    {
      ...base(),
      code: '305566',
      staffId: 'nurse01',
      guides: ['colonoscopy'],
      ageGroup: '50',
      level: 'normal',
      language: 'vi',
      birthDateHash: demoBirthHash.vi,
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
      ...base(),
      code: '771204',
      staffId: 'nurse01',
      guides: ['gastroscopy', 'medication'],
      ageGroup: '70',
      level: 'very-easy',
      language: 'ko',
      extras: ['large-text', 'guardian'],
      birthDateHash: demoBirthHash.gastro,
      createdAt: minutesAgo(120),
      medicationCheck: {
        medications: ['blood-pressure', 'blood-thinner'],
        checkedAt: minutesAgo(100),
        pickedAt: {
          'blood-pressure': minutesAgo(100),
          'blood-thinner': minutesAgo(100),
        },
      },
    },
    {
      ...base(),
      code: '550031',
      staffId: 'nurse02',
      guides: ['checkup'],
      ageGroup: '10-40',
      level: 'normal',
      language: 'ko',
      birthDateHash: demoBirthHash.checkup,
      createdAt: minutesAgo(30),
    },
  ];
  for (const row of rows) map.set(row.code, row);
}
