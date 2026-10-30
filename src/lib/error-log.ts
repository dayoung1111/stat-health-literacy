import { z } from 'zod';

import { isCodeShape } from './code-shape';

// 환자 화면 오류 기록의 규칙. 환자 화면(오류 화면·사진 칸), 서버 저장(error-log-store.ts),
// 의료진 "오류 기록" 화면이 함께 쓴다. 서버 전용 기능이 없어 테스트에서도 그대로 불러 쓸 수 있다.
// 저장하지 않는 것: 생년월일, 이름, 환자가 입력한 값, 오류 문장, 전체 브라우저 정보.

export const errorKinds = [
  'photo-load',
  'no-response',
  'code-expired',
  'birth-locked',
  'other',
] as const;

export type ErrorKind = (typeof errorKinds)[number];

export const errorKindLabels: Record<ErrorKind, string> = {
  'photo-load': '사진 로드 실패',
  'no-response': '서버 응답 없음',
  'code-expired': '코드 만료',
  'birth-locked': '생년월일 오류 잠금',
  other: '그 밖의 오류',
};

/** 30일 지난 기록은 지운다. */
export const ERROR_LOG_DAYS = 30;

export const errorLogCutoff = (now: Date) =>
  new Date(now.getTime() - ERROR_LOG_DAYS * 24 * 60 * 60 * 1000);

// ── 화면 위치 ─────────────────────────────────────────
// 주소(/p/코드/video 등)에서 화면 이름을 정한다. 정해진 이름만 저장해서 다른 글이 섞이지 않게 한다.

export const ENTRY_PLACE = '코드 입력';
export const BIRTH_PLACE = '생년월일 입력';
const OTHER_PLACE = '그 밖의 화면';

const sectionPlaces: Record<string, string> = {
  home: '받은 안내 목록',
  video: '대장내시경 수업',
  check: '이해 확인 퀴즈',
  medication: '복용약 체크',
  colonoscopy: '대장내시경 안내',
  gastroscopy: '위내시경 수업',
  'day-before': '건강검진 전날 안내',
  guide: '안내문',
  prep: '장 정리약 안내',
  danger: '위험 증상 안내',
  preparing: '준비 중 안내',
};

const fixedPlaces = new Set([
  ENTRY_PLACE,
  BIRTH_PLACE,
  OTHER_PLACE,
  ...Object.values(sectionPlaces),
]);

const lessonPattern = /^대장내시경 수업 \d{1,2}교시 (\d{1,2}단계|돌발 퀴즈)$/;

/** 또박이 수업 안의 위치. lessonIndex·stepIndex는 0부터. 예: 대장내시경 수업 5교시 3단계 */
export const lessonPlace = (
  lessonIndex: number,
  stepIndex: number,
  quiz: boolean,
) =>
  `대장내시경 수업 ${lessonIndex + 1}교시 ${quiz ? '돌발 퀴즈' : `${stepIndex + 1}단계`}`;

export const isLessonPlace = (place: string) => lessonPattern.test(place);

/** 정해진 화면 이름이 아니면 "그 밖의 화면"으로 바꾼다. */
export const cleanPlace = (place: string) =>
  fixedPlaces.has(place) || isLessonPlace(place) ? place : OTHER_PLACE;

/** 주소에서 화면 이름과 교육 코드를 찾는다. 주소 뒤의 ?·# 부분은 보지 않는다. */
export function placeFromPath(pathname: string) {
  const [, root, code, section] = pathname.split(/[?#]/)[0].split('/');
  if (root !== 'p') return { place: OTHER_PLACE, code: null };
  if (!code) return { place: ENTRY_PLACE, code: null };
  const shaped = isCodeShape(code) ? code : null;
  if (!section) return { place: BIRTH_PLACE, code: shaped };
  return { place: sectionPlaces[section] ?? OTHER_PLACE, code: shaped };
}

// ── 오류 번호·종류·기기 ──────────────────────────────

/** 환자에게 보여 줄 오류 번호. 예: E-4821 */
export const newErrorNumber = (random = Math.random) =>
  `E-${1000 + Math.floor(random() * 9000)}`;

const errorNumberPattern = /^E-\d{4}$/;

/** 화면에서 잡힌 오류의 종류. 오류 문장은 종류를 고르는 데만 쓰고 저장하지 않는다. */
export function classifyError(error: unknown, online: boolean): ErrorKind {
  if (!online) return 'no-response';
  const text =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /fetch|network|chunk|timeout|timed out|connection/i.test(text)
    ? 'no-response'
    : 'other';
}

/** 기기 종류와 브라우저 이름만 뽑는다(전체 브라우저 정보는 저장하지 않는다). */
export function deviceFromUserAgent(userAgent: string) {
  const ua = userAgent.slice(0, 300);
  const device =
    /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
      ? '태블릿'
      : /Mobi|iPhone|Android/i.test(ua)
        ? '휴대폰'
        : 'PC';
  const browsers: [RegExp, string][] = [
    [/KAKAOTALK/i, '카카오톡'],
    [/NAVER/, '네이버 앱'],
    [/SamsungBrowser/i, '삼성 인터넷'],
    [/Whale/i, '웨일'],
    [/Edg(e|A|iOS)?\//, 'Edge'],
    [/Firefox|FxiOS/, 'Firefox'],
    [/CriOS|Chrome/, 'Chrome'],
    [/Safari/, 'Safari'],
  ];
  const browser = browsers.find(([pattern]) => pattern.test(ua))?.[1] ?? '기타';
  return { device, browser };
}

// ── 횟수 제한 ─────────────────────────────────────────
// 같은 기기(접속 주소 + 브라우저)에서 정해진 시간 안에 limit건까지만 저장한다.

export function createRateLimit({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const hits = new Map<string, number[]>();
  return {
    /** 저장해도 되면 true(그리고 1건으로 센다). */
    take(key: string, now: number) {
      const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
      const allowed = recent.length < limit;
      if (allowed) recent.push(now);
      hits.set(key, recent);
      // 오래된 기기 기록은 지워 서버 메모리가 계속 늘지 않게 한다.
      if (hits.size > 1000) {
        for (const [k, list] of hits) {
          if (list.every((at) => now - at >= windowMs)) hits.delete(k);
        }
      }
      return allowed;
    },
  };
}

export type RateLimit = ReturnType<typeof createRateLimit>;

// ── 저장 ──────────────────────────────────────────────

/** 환자 화면이 보내는 값. 이 밖의 값(생년월일·이름·오류 문장 등)은 받아도 버린다. */
const reportSchema = z.object({
  errorNumber: z.string().regex(errorNumberPattern),
  kind: z.enum(errorKinds),
  place: z.string().max(60),
  code: z.string().max(6).nullish(),
  digest: z
    .string()
    .regex(/^[\w-]{1,64}$/)
    .nullish(),
});

export type ErrorReport = z.input<typeof reportSchema>;

/** DB에 저장하는 칸(schema.prisma ErrorLog와 같은 모양). */
export type ErrorLogRow = {
  errorNumber: string;
  code: string | null;
  staffId: string | null;
  place: string;
  kind: ErrorKind;
  device: string;
  browser: string;
  digest: string | null;
  createdAt: Date;
};

export type ErrorLogDeps = {
  limiter: RateLimit;
  /** 코드를 발급한 간호사 아이디. 없는 코드면 null. */
  ownerOf: (code: string) => Promise<string | null>;
  create: (row: ErrorLogRow) => Promise<unknown>;
};

export async function saveErrorLog(
  deps: ErrorLogDeps,
  input: unknown,
  context: { deviceKey: string; userAgent: string; now: Date },
): Promise<'saved' | 'invalid' | 'limited'> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return 'invalid';
  if (!deps.limiter.take(context.deviceKey, context.now.getTime())) {
    return 'limited';
  }
  const report = parsed.data;
  // 코드는 실제로 있는 코드일 때만 남긴다. 만료돼 지워진 코드는 "코드 만료"일 때만 번호를 남긴다.
  const shaped = report.code && isCodeShape(report.code) ? report.code : null;
  const staffId = shaped ? await deps.ownerOf(shaped) : null;
  const code = staffId || report.kind === 'code-expired' ? shaped : null;
  const { device, browser } = deviceFromUserAgent(context.userAgent);
  // 저장할 칸을 하나씩 직접 고른다. 받은 값을 통째로 넣지 않는다.
  await deps.create({
    errorNumber: report.errorNumber,
    code,
    staffId,
    place: cleanPlace(report.place),
    kind: report.kind,
    device,
    browser,
    digest: report.digest ?? null,
    createdAt: context.now,
  });
  return 'saved';
}

// ── 보기 권한 ─────────────────────────────────────────
// 관리자: 전체, 간호사: 자기가 발급한 코드의 기록, 로그인하지 않음: 없음(null).

export type ErrorLogViewer = { id: string; role: 'nurse' | 'admin' } | null;

export function errorLogScope(viewer: ErrorLogViewer) {
  if (!viewer) return null;
  return viewer.role === 'admin' ? {} : { staffId: viewer.id };
}

export function canSeeErrorLog(
  viewer: ErrorLogViewer,
  row: { staffId: string | null },
) {
  const scope = errorLogScope(viewer);
  if (!scope) return false;
  return !('staffId' in scope) || scope.staffId === row.staffId;
}

/** 검색어: 오류 번호(E-4821, 4821) 또는 교육 코드(6자리, DEMO). 알 수 없으면 null. */
export function parseErrorSearch(query: string) {
  const text = query.trim().toUpperCase();
  const number = /^E-?(\d{4})$/.exec(text) ?? /^(\d{4})$/.exec(text);
  if (number) return { errorNumber: `E-${number[1]}` };
  if (isCodeShape(text)) return { code: text };
  return null;
}

/** 같은 화면·같은 오류를 묶어 몇 건인지(해결 안 된 건수, 마지막 시각) 센다. */
export function groupErrorLogs(
  rows: {
    place: string;
    kind: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }[],
) {
  const groups = new Map<
    string,
    { place: string; kind: string; count: number; open: number; lastAt: Date }
  >();
  for (const row of rows) {
    const key = `${row.place}\0${row.kind}`;
    const group = groups.get(key) ?? {
      place: row.place,
      kind: row.kind,
      count: 0,
      open: 0,
      lastAt: row.createdAt,
    };
    group.count += 1;
    if (!row.resolvedAt) group.open += 1;
    if (row.createdAt > group.lastAt) group.lastAt = row.createdAt;
    groups.set(key, group);
  }
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.open > 0) - Number(a.open > 0) ||
      b.count - a.count ||
      b.lastAt.getTime() - a.lastAt.getTime(),
  );
}
