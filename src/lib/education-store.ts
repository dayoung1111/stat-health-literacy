import 'server-only';

import { randomInt } from 'node:crypto';

import { connection } from 'next/server';

import { Prisma } from '@/generated_prisma/client';

import { isOwnedBy } from './code-access';
import { demoGuide } from './demo-guide';
import { getDb } from './db';
import type { GuideKind } from './guide-catalog';
import type { MedicationId } from './medication-guide';
import { hashSecret, matchesSecret } from './password';

// 교육 코드와 환자 기록의 저장소. Supabase(Prisma)에 저장하므로 Vercel 서버가 여러 대여도 같은 기록을 본다.
// prisma/schema.prisma의 EducationCode·MedicationCheck·TeachbackResult·ConfusionMark·GuideCompletion과 같은 모양이다.
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
  /** 환자가 끝까지 마친 안내(대장내시경: 8교시 끝, 드시는 약: "확인했어요"). schema.prisma GuideCompletion과 같은 칸. */
  guideCompletions: { guide: GuideKind; completedAt: Date }[];
};

export const MAX_ATTEMPTS = 5;

// 시연용으로 늘 남겨 두는 코드. 랜덤 발급에서는 이 번호가 나오지 않는다.
// 000000(생년월일 111111)은 시연이 꼬였을 때 쓰는 예비 코드, 777777(생년월일 111111)은 안내를 모두 묶은 코드다.
const RESERVED_CODES = new Set(['000000', '482917', '777777']);
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
// 시연 코드는 7일이 지나도 사라지지 않게 아주 멀리 만료시킨다(발급한 코드만 7일 만료).
const DEMO_LIFETIME = 10 * 365 * 24 * 60 * 60 * 1000;

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

const withRecords = {
  medicationCheck: true,
  teachbackResults: true,
  confusionMarks: true,
  guideCompletions: true,
} as const;

type DbRow = Prisma.EducationCodeGetPayload<{ include: typeof withRecords }>;

// 날짜 전용 칸(@db.Date)은 UTC 자정으로 오므로 그대로 YYYY-MM-DD로 자른다.
const toDay = (date: Date) => date.toISOString().slice(0, 10);
const fromDay = (day: string) => new Date(`${day}T00:00:00.000Z`);

function toEducationCode(row: DbRow): EducationCode {
  const stored = (row.medicationCheck?.pickedAt ?? {}) as Record<
    string,
    string
  >;
  const pickedAt: Partial<Record<MedicationId, Date>> = {};
  for (const [id, at] of Object.entries(stored)) {
    pickedAt[id as MedicationId] = new Date(at);
  }
  return {
    code: row.code,
    staffId: row.staffId,
    guides: row.guides as GuideKind[],
    ageGroup: row.ageGroup,
    level: row.level,
    language: row.language,
    extras: row.extras,
    examDate: toDay(row.examDate),
    bloodThinnerStopDate: row.bloodThinnerStopDate
      ? toDay(row.bloodThinnerStopDate)
      : null,
    birthDateHash: row.birthDateHash,
    failedAttempts: row.failedAttempts,
    lockedAt: row.lockedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    medicationCheck: row.medicationCheck
      ? {
          medications: row.medicationCheck.medications as MedicationId[],
          checkedAt: row.medicationCheck.checkedAt,
          pickedAt,
        }
      : null,
    teachbackResults: row.teachbackResults.map((r) => ({
      guide: r.guide as GuideKind,
      question: r.question,
      result: r.result,
      answeredAt: r.answeredAt,
    })),
    confusionMarks: row.confusionMarks.map((m) => ({
      guide: m.guide as GuideKind,
      paragraphId: m.paragraphId,
      count: m.count,
      lastAt: m.lastAt,
    })),
    guideCompletions: row.guideCompletions.map((c) => ({
      guide: c.guide as GuideKind,
      completedAt: c.completedAt,
    })),
  };
}

// 만료(발급 7일 뒤)된 코드는 묶인 약 체크·티치백·헷갈려요·안내 완료 기록과 함께 지운다(DB 관계의 cascade).
// 조회는 만료 여부를 따로 걸러 내므로, 지우기는 발급·목록에서만 한다.
// 지금 시각은 요청마다 다르므로 요청이 들어온 뒤에 읽는다(화면 미리 만들기에서 제외).
async function removeExpired() {
  await connection();
  await getDb().educationCode.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

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
  await ensureDemoCodes();
  await removeExpired();
  const now = new Date();
  const { birthDate, examDate, bloodThinnerStopDate, ...rest } = input;
  const birthDateHash = hashSecret(birthDate);
  // 번호가 겹치면(DB의 고유 제약) 새 번호로 다시 시도한다. 여러 서버가 동시에 발급해도 안전하다.
  for (let tries = 0; tries < 20; tries += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    if (RESERVED_CODES.has(code)) continue;
    try {
      const row = await getDb().educationCode.create({
        data: {
          ...rest,
          code,
          examDate: fromDay(examDate),
          bloodThinnerStopDate: bloodThinnerStopDate
            ? fromDay(bloodThinnerStopDate)
            : null,
          birthDateHash,
          expiresAt: new Date(now.getTime() + SEVEN_DAYS),
          createdAt: now,
        },
        include: withRecords,
      });
      return toEducationCode(row);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error('빈 교육 코드를 찾지 못했어요. 잠시 뒤 다시 시도해 주세요.');
}

/** 만료되지 않은 코드. 없으면 null. */
export async function findActiveCode(code: string) {
  await ensureDemoCodes();
  await connection();
  const row = await getDb().educationCode.findFirst({
    where: { code, expiresAt: { gt: new Date() } },
    include: withRecords,
  });
  return row ? toEducationCode(row) : null;
}

// 기록을 남길 때 필요한 것은 코드의 아이디뿐이다.
async function findActiveCodeId(code: string) {
  await ensureDemoCodes();
  await connection();
  const row = await getDb().educationCode.findFirst({
    where: { code, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return row?.id ?? null;
}

export type EntryResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'locked' }
  | { ok: false; reason: 'wrong'; remaining: number };

// 환자 입장: 코드 + 생년월일 확인. 5번 틀리면 잠근다.
// 확인 전에 틀린 횟수를 먼저 1 올린다(DB에서 한 번에). 동시에 여러 번 시도해도 5번까지만 확인할 수 있다.
export async function checkPatientEntry(
  code: string,
  birthDate: string,
): Promise<EntryResult> {
  await ensureDemoCodes();
  await connection();
  const db = getDb();
  const row = await db.educationCode.findFirst({
    where: { code, expiresAt: { gt: new Date() } },
    select: { id: true, birthDateHash: true, lockedAt: true },
  });
  if (!row) return { ok: false, reason: 'not-found' };
  if (row.lockedAt) return { ok: false, reason: 'locked' };

  const { failedAttempts } = await db.educationCode.update({
    where: { id: row.id },
    data: { failedAttempts: { increment: 1 } },
    select: { failedAttempts: true },
  });
  if (failedAttempts > MAX_ATTEMPTS) return { ok: false, reason: 'locked' };

  if (matchesSecret(birthDate, row.birthDateHash)) {
    await db.educationCode.update({
      where: { id: row.id },
      data: { failedAttempts: 0 },
    });
    return { ok: true };
  }
  if (failedAttempts >= MAX_ATTEMPTS) {
    await db.educationCode.updateMany({
      where: { id: row.id, lockedAt: null },
      data: { lockedAt: new Date() },
    });
    return { ok: false, reason: 'locked' };
  }
  return {
    ok: false,
    reason: 'wrong',
    remaining: MAX_ATTEMPTS - failedAttempts,
  };
}

// 관리자 화면: 모든 간호사의 코드(만료된 코드 제외). 역할 확인은 부르는 쪽(requireStaff('admin'))에서 한다.
export async function listAllCodes() {
  await ensureDemoCodes();
  await removeExpired();
  const rows = await getDb().educationCode.findMany({
    include: withRecords,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return rows.map(toEducationCode);
}

// 의료진은 자기가 발급한 코드만 본다.
export async function listCodesForStaff(staffId: string) {
  await ensureDemoCodes();
  await removeExpired();
  const rows = await getDb().educationCode.findMany({
    where: { staffId },
    include: withRecords,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return rows.map(toEducationCode);
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
  const codeId = await findActiveCodeId(code);
  if (!codeId) return;
  const db = getDb();
  // 약을 더하거나 빼도, 이미 고른 약의 "고른 시간"은 그대로 둔다.
  const now = new Date();
  const before = await db.medicationCheck.findUnique({
    where: { codeId },
    select: { pickedAt: true },
  });
  const stored = (before?.pickedAt ?? {}) as Record<string, string>;
  const pickedAt: Record<string, string> = {};
  for (const id of medications) pickedAt[id] = stored[id] ?? now.toISOString();
  await db.medicationCheck.upsert({
    where: { codeId },
    create: { codeId, medications, checkedAt: now, pickedAt },
    update: { medications, checkedAt: now, pickedAt },
  });
}

// 티치백: 같은 안내의 같은 질문은 최신 결과로 바꾼다.
// 복용약 확인 질문도 여기에 guide='medication', question=약 아이디로 저장한다.
export async function saveTeachbackResult(
  code: string,
  guide: GuideKind,
  question: string,
  result: TeachbackOutcome,
) {
  const codeId = await findActiveCodeId(code);
  if (!codeId) return;
  const answeredAt = new Date();
  await getDb().teachbackResult.upsert({
    where: { codeId_guide_question: { codeId, guide, question } },
    create: { codeId, guide, question, result, answeredAt },
    update: { result, answeredAt },
  });
}

// "헷갈려요": 같은 문단을 다시 누르면 횟수를 늘리고 마지막 시각을 바꾼다.
export async function addConfusionMark(
  code: string,
  guide: GuideKind,
  paragraphId: string,
) {
  const codeId = await findActiveCodeId(code);
  if (!codeId) return;
  const lastAt = new Date();
  await getDb().confusionMark.upsert({
    where: { codeId_guide_paragraphId: { codeId, guide, paragraphId } },
    create: { codeId, guide, paragraphId, count: 1, lastAt },
    update: { count: { increment: 1 }, lastAt },
  });
}

// 안내 완료: 처음 마친 시각을 남긴다(다시 마쳐도 그대로). 바뀐 코드 정보를 돌려준다.
export async function markGuideCompleted(code: string, guide: GuideKind) {
  const codeId = await findActiveCodeId(code);
  if (!codeId) return null;
  await getDb().guideCompletion.upsert({
    where: { codeId_guide: { codeId, guide } },
    create: { codeId, guide, completedAt: new Date() },
    update: {},
  });
  return findActiveCode(code);
}

// 시연 데이터를 DB에 한 번만 넣는다. 이미 있는 코드는 건드리지 않아 결과가 쌓인 채로 남는다.
// 000000(생년월일 111111, 예비)과 482917(생년월일 590312)은 결과가 비어 있어,
// 환자 화면에서 한 결과가 그대로 쌓인다. 777777(생년월일 111111)은 건강검진·대장내시경·위내시경·드시는 약을 모두 묶었다.
// 나머지는 의료진 목록이 비어 보이지 않게 넣은 예시이며, 550031은 다른 간호사 코드(보이면 안 됨).
// 서버(람다)마다 한 번만 확인하고, 동시에 시작한 서버끼리는 DB의 고유 제약(code)으로 중복을 막는다.
const seedState = globalThis as unknown as {
  statDemoSeed?: Promise<void>;
};

function ensureDemoCodes() {
  seedState.statDemoSeed ??= seedDemoCodes().catch((error) => {
    // 실패하면 다음 요청에서 다시 시도한다.
    seedState.statDemoSeed = undefined;
    throw error;
  });
  return seedState.statDemoSeed;
}

async function seedDemoCodes() {
  const db = getDb();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const examDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(tomorrow);
  const base = {
    extras: [] as string[],
    examDate: fromDay(examDate),
    expiresAt: new Date(now.getTime() + DEMO_LIFETIME),
  };
  const topics = demoGuide.questions.map((q) => q.topic);
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  const rows: Prisma.EducationCodeCreateInput[] = [
    {
      ...base,
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
      ...base,
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
      ...base,
      code: '777777',
      staffId: 'nurse01',
      guides: ['checkup', 'colonoscopy', 'gastroscopy', 'medication'],
      ageGroup: '60',
      level: 'easy',
      language: 'ko',
      birthDateHash: demoBirthHash.backup,
      createdAt: minutesAgo(2),
    },
    {
      ...base,
      code: '305566',
      staffId: 'nurse01',
      guides: ['colonoscopy'],
      ageGroup: '50',
      level: 'normal',
      language: 'vi',
      birthDateHash: demoBirthHash.vi,
      createdAt: minutesAgo(60),
      teachbackResults: {
        create: [
          ['wrong', 40],
          ['correct', 39],
          ['wrong', 38],
          ['correct', 37],
        ].map(([result, ago], i) => ({
          guide: 'colonoscopy',
          question: topics[i],
          result: result as TeachbackOutcome,
          answeredAt: minutesAgo(ago as number),
        })),
      },
      confusionMarks: {
        create: [
          {
            guide: 'colonoscopy',
            paragraphId: 'prep-mix',
            count: 2,
            lastAt: minutesAgo(45),
          },
        ],
      },
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
      birthDateHash: demoBirthHash.gastro,
      createdAt: minutesAgo(120),
      medicationCheck: {
        create: {
          medications: ['blood-pressure', 'blood-thinner'],
          checkedAt: minutesAgo(100),
          pickedAt: {
            'blood-pressure': minutesAgo(100).toISOString(),
            'blood-thinner': minutesAgo(100).toISOString(),
          },
        },
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
      birthDateHash: demoBirthHash.checkup,
      createdAt: minutesAgo(30),
    },
  ];

  const existing = await db.educationCode.findMany({
    where: { code: { in: rows.map((row) => row.code) } },
    select: { code: true },
  });
  const have = new Set(existing.map((row) => row.code));
  for (const row of rows) {
    if (have.has(row.code)) continue;
    try {
      await db.educationCode.create({ data: row });
    } catch (error) {
      // 다른 서버가 방금 먼저 넣었으면 그대로 둔다.
      if (!isUniqueViolation(error)) throw error;
    }
  }
}
