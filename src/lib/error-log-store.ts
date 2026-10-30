import 'server-only';

import { headers } from 'next/headers';
import { connection } from 'next/server';

import { getDb } from './db';
import {
  createRateLimit,
  errorLogCutoff,
  errorLogScope,
  saveErrorLog,
  type ErrorLogViewer,
  type ErrorReport,
} from './error-log';

// 환자 화면 오류 기록의 저장소(Supabase error_logs 표). 규칙은 error-log.ts에 있다.
// 보기 권한: 관리자=전체, 간호사=자기가 발급한 코드, 로그인하지 않음=없음. 부르는 쪽이 아니라 여기서 매번 거른다.

// 같은 기기(접속 주소 + 브라우저)에서 10분에 10건까지만 저장한다(서버 메모리. 서버마다 따로 센다).
const memory = globalThis as unknown as {
  statErrorLogLimit?: ReturnType<typeof createRateLimit>;
};
const limiter = () =>
  (memory.statErrorLogLimit ??= createRateLimit({
    limit: 10,
    windowMs: 10 * 60 * 1000,
  }));

// 30일 지난 기록을 지운다. 지금 시각은 요청마다 다르므로 요청이 들어온 뒤에 읽는다.
async function removeOld() {
  await connection();
  await getDb().errorLog.deleteMany({
    where: { createdAt: { lt: errorLogCutoff(new Date()) } },
  });
}

/** 환자 화면 오류를 저장한다. 저장이 실패해도 환자 화면이 멈추지 않도록 오류를 밖으로 던지지 않는다. */
export async function recordPatientError(report: ErrorReport) {
  try {
    const list = await headers();
    const userAgent = (list.get('user-agent') ?? '').slice(0, 300);
    const address =
      list.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      list.get('x-real-ip') ??
      '';
    const db = getDb();
    const result = await saveErrorLog(
      {
        limiter: limiter(),
        ownerOf: async (code) =>
          (
            await db.educationCode.findFirst({
              where: { code },
              select: { staffId: true },
            })
          )?.staffId ?? null,
        create: (row) => db.errorLog.create({ data: row }),
      },
      report,
      { deviceKey: `${address}|${userAgent}`, userAgent, now: new Date() },
    );
    if (result === 'saved') await removeOld();
    return result;
  } catch {
    // 기록 저장 실패는 서버 로그에 종류만 남긴다(환자 정보 없음).
    console.error('[error-log] 오류 기록을 저장하지 못했어요');
    return 'failed' as const;
  }
}

/** 보이는 오류 기록(최근 순 300건). search는 parseErrorSearch 결과. */
export async function listErrorLogs(
  viewer: ErrorLogViewer,
  search: { errorNumber: string } | { code: string } | null,
) {
  const scope = errorLogScope(viewer);
  if (!scope) return [];
  await removeOld();
  return getDb().errorLog.findMany({
    // 검색 조건이 권한 조건을 덮지 못하도록 권한(scope)을 마지막에 둔다.
    where: { ...search, ...scope },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
}

/** "해결함": 기록 1건 또는 같은 화면·같은 오류 묶음. 볼 수 있는 기록만 바꾼다. 바꾼 건수를 돌려준다. */
export async function resolveErrorLogs(
  viewer: ErrorLogViewer,
  target: { id: string } | { place: string; kind: string },
) {
  const scope = errorLogScope(viewer);
  if (!scope || !viewer) return 0;
  await connection();
  const { count } = await getDb().errorLog.updateMany({
    where: { ...target, ...scope, resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedBy: viewer.id },
  });
  return count;
}
