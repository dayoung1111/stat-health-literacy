import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  canSeeErrorLog,
  classifyError,
  createRateLimit,
  deviceFromUserAgent,
  errorLogScope,
  groupErrorLogs,
  lessonPlace,
  parseErrorSearch,
  placeFromPath,
  saveErrorLog,
  type ErrorLogRow,
} from './error-log';

// 환자 화면 오류 기록 규칙. 서버 저장(error-log-store.ts)과 오류 기록 화면이 이 규칙을 쓴다.

const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const galaxy =
  'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36';
const windows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/** 실제 DB 대신 저장된 줄을 모아 두는 가짜 저장소. 코드 482917은 nurse01, 550031은 nurse02가 발급했다. */
function fakeStore(limit = 10) {
  const rows: ErrorLogRow[] = [];
  const owners: Record<string, string> = {
    '482917': 'nurse01',
    '550031': 'nurse02',
  };
  return {
    rows,
    deps: {
      limiter: createRateLimit({ limit, windowMs: 10 * 60 * 1000 }),
      ownerOf: async (code: string) => owners[code] ?? null,
      create: async (row: ErrorLogRow) => {
        rows.push(row);
      },
    },
  };
}

const now = new Date('2026-10-30T01:00:00Z');
const context = { deviceKey: '1.2.3.4|phone', userAgent: galaxy, now };

describe('기록 저장', () => {
  it('오류 번호·시간·교육 코드·화면 위치·종류·기기를 저장하고, 해결 여부는 비워 둔다', async () => {
    const { rows, deps } = fakeStore();
    const result = await saveErrorLog(
      deps,
      {
        errorNumber: 'E-4821',
        kind: 'photo-load',
        place: '대장내시경 수업 5교시 3단계',
        code: '482917',
      },
      context,
    );
    assert.equal(result, 'saved');
    assert.deepEqual(rows, [
      {
        errorNumber: 'E-4821',
        code: '482917',
        staffId: 'nurse01',
        place: '대장내시경 수업 5교시 3단계',
        kind: 'photo-load',
        device: '휴대폰',
        browser: '삼성 인터넷',
        digest: null,
        createdAt: now,
      },
    ]);
  });

  it('생년월일·이름·입력값·오류 문장은 함께 보내도 저장하지 않는다', async () => {
    const { rows, deps } = fakeStore();
    await saveErrorLog(
      deps,
      {
        errorNumber: 'E-1234',
        kind: 'other',
        place: '복용약 체크',
        code: '482917',
        birthDate: '590312',
        name: '홍길동',
        typed: '590312',
        message: '홍길동 590312 오류',
      },
      context,
    );
    assert.equal(rows.length, 1);
    const saved = JSON.stringify(rows[0]);
    for (const secret of [
      '590312',
      '홍길동',
      'birthDate',
      'message',
      'typed',
    ]) {
      assert.equal(saved.includes(secret), false, `${secret}가 저장됨`);
    }
    assert.deepEqual(Object.keys(rows[0]).sort(), [
      'browser',
      'code',
      'createdAt',
      'device',
      'digest',
      'errorNumber',
      'kind',
      'place',
      'staffId',
    ]);
  });

  it('정해지지 않은 화면 이름(입력값 등)은 "그 밖의 화면"으로 바꾼다', async () => {
    const { rows, deps } = fakeStore();
    await saveErrorLog(
      deps,
      { errorNumber: 'E-1111', kind: 'other', place: '생년월일 590312' },
      context,
    );
    assert.equal(rows[0].place, '그 밖의 화면');
  });

  it('없는 코드는 비우고, "코드 만료"일 때만 링크의 코드 번호를 남긴다', async () => {
    const { rows, deps } = fakeStore();
    await saveErrorLog(
      deps,
      { errorNumber: 'E-2222', kind: 'other', place: '안내문', code: '999999' },
      context,
    );
    await saveErrorLog(
      deps,
      {
        errorNumber: 'E-3333',
        kind: 'code-expired',
        place: '생년월일 입력',
        code: '999999',
      },
      context,
    );
    assert.equal(rows[0].code, null);
    assert.equal(rows[1].code, '999999');
    assert.equal(rows[1].staffId, null);
  });

  it('모양이 틀린 값(오류 번호·종류)은 저장하지 않는다', async () => {
    const { rows, deps } = fakeStore();
    assert.equal(
      await saveErrorLog(
        deps,
        { errorNumber: '590312', kind: 'other', place: '안내문' },
        context,
      ),
      'invalid',
    );
    assert.equal(
      await saveErrorLog(
        deps,
        { errorNumber: 'E-1234', kind: 'hack', place: '안내문' },
        context,
      ),
      'invalid',
    );
    assert.equal(rows.length, 0);
  });

  it('같은 기기에서 짧은 시간에 너무 많이 보내면 그만 저장한다(다른 기기는 계속 저장)', async () => {
    const { rows, deps } = fakeStore(3);
    const report = { errorNumber: 'E-5555', kind: 'other', place: '안내문' };
    const results = [];
    for (let i = 0; i < 5; i += 1) {
      results.push(await saveErrorLog(deps, report, context));
    }
    assert.deepEqual(results, [
      'saved',
      'saved',
      'saved',
      'limited',
      'limited',
    ]);
    assert.equal(
      await saveErrorLog(deps, report, { ...context, deviceKey: 'other' }),
      'saved',
    );
    assert.equal(rows.length, 4);
  });

  it('시간이 지나면 다시 저장할 수 있다', () => {
    const limit = createRateLimit({ limit: 1, windowMs: 1000 });
    assert.equal(limit.take('a', 0), true);
    assert.equal(limit.take('a', 500), false);
    assert.equal(limit.take('a', 1500), true);
  });
});

describe('화면 위치·종류·기기', () => {
  it('주소에서 화면 이름과 교육 코드를 찾는다', () => {
    assert.deepEqual(placeFromPath('/p'), { place: '코드 입력', code: null });
    assert.deepEqual(placeFromPath('/p/482917'), {
      place: '생년월일 입력',
      code: '482917',
    });
    assert.deepEqual(placeFromPath('/p/DEMO/medication'), {
      place: '복용약 체크',
      code: 'DEMO',
    });
    assert.deepEqual(placeFromPath('/p/482917/video'), {
      place: '대장내시경 수업',
      code: '482917',
    });
    assert.equal(placeFromPath('/p/<script>/home').code, null);
  });

  it('수업 위치는 "몇 교시 몇 단계" 또는 "돌발 퀴즈"로 적는다', () => {
    assert.equal(lessonPlace(4, 2, false), '대장내시경 수업 5교시 3단계');
    assert.equal(lessonPlace(0, 0, true), '대장내시경 수업 1교시 돌발 퀴즈');
  });

  it('인터넷이 끊기거나 서버가 답하지 않으면 "서버 응답 없음"', () => {
    assert.equal(classifyError(new Error('boom'), false), 'no-response');
    assert.equal(
      classifyError(new TypeError('Failed to fetch'), true),
      'no-response',
    );
    assert.equal(classifyError(new Error('x is undefined'), true), 'other');
  });

  it('기기는 휴대폰/PC와 브라우저 이름만 남긴다', () => {
    assert.deepEqual(deviceFromUserAgent(iphone), {
      device: '휴대폰',
      browser: 'Safari',
    });
    assert.deepEqual(deviceFromUserAgent(galaxy), {
      device: '휴대폰',
      browser: '삼성 인터넷',
    });
    assert.deepEqual(deviceFromUserAgent(windows), {
      device: 'PC',
      browser: 'Chrome',
    });
  });
});

describe('보기 권한', () => {
  const admin = { id: 'admin01', role: 'admin' as const };
  const nurse1 = { id: 'nurse01', role: 'nurse' as const };
  const nurse2 = { id: 'nurse02', role: 'nurse' as const };
  const logs = [
    { staffId: 'nurse01' },
    { staffId: 'nurse02' },
    { staffId: null },
  ];

  it('관리자는 모든 기록을 본다', () => {
    assert.deepEqual(errorLogScope(admin), {});
    assert.equal(
      logs.every((log) => canSeeErrorLog(admin, log)),
      true,
    );
  });

  it('간호사는 자기가 발급한 코드의 기록만 본다(다른 간호사·코드 없는 기록은 못 봄)', () => {
    assert.deepEqual(errorLogScope(nurse1), { staffId: 'nurse01' });
    assert.deepEqual(
      logs.filter((log) => canSeeErrorLog(nurse1, log)),
      [{ staffId: 'nurse01' }],
    );
    assert.deepEqual(
      logs.filter((log) => canSeeErrorLog(nurse2, log)),
      [{ staffId: 'nurse02' }],
    );
  });

  it('로그인하지 않은 사람은 아무 기록도 못 본다', () => {
    assert.equal(errorLogScope(null), null);
    assert.equal(
      logs.some((log) => canSeeErrorLog(null, log)),
      false,
    );
  });

  it('검색은 오류 번호·교육 코드만 받는다', () => {
    assert.deepEqual(parseErrorSearch('e-4821'), { errorNumber: 'E-4821' });
    assert.deepEqual(parseErrorSearch('4821'), { errorNumber: 'E-4821' });
    assert.deepEqual(parseErrorSearch(' 482917 '), { code: '482917' });
    assert.deepEqual(parseErrorSearch('demo'), { code: 'DEMO' });
    assert.equal(parseErrorSearch('홍길동'), null);
  });

  it('Supabase 접근 규칙(RLS)을 켜고 공개 API(anon·authenticated) 권한을 뺀다', () => {
    const sql = readFileSync(
      new URL(
        '../../prisma/migrations/20261030120000_error_logs/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    assert.match(sql, /ALTER TABLE "error_logs" ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE "error_logs" FROM anon/);
    assert.match(sql, /REVOKE ALL ON TABLE "error_logs" FROM authenticated/);
    // 누구에게나 열어 주는 허용 규칙(policy)은 만들지 않는다.
    assert.doesNotMatch(sql, /CREATE POLICY/i);
  });
});

describe('같은 오류 묶기', () => {
  it('같은 화면·같은 오류를 묶어 건수와 해결 안 된 건수를 센다', () => {
    const at = (m: number) => new Date(now.getTime() + m * 60_000);
    const groups = groupErrorLogs([
      {
        place: '복용약 체크',
        kind: 'other',
        createdAt: at(1),
        resolvedAt: null,
      },
      {
        place: '복용약 체크',
        kind: 'other',
        createdAt: at(3),
        resolvedAt: at(4),
      },
      {
        place: '복용약 체크',
        kind: 'no-response',
        createdAt: at(2),
        resolvedAt: null,
      },
      { place: '안내문', kind: 'other', createdAt: at(5), resolvedAt: at(6) },
    ]);
    assert.deepEqual(
      groups.map((g) => [g.place, g.kind, g.count, g.open]),
      [
        ['복용약 체크', 'other', 2, 1],
        ['복용약 체크', 'no-response', 1, 1],
        ['안내문', 'other', 1, 0],
      ],
    );
    assert.deepEqual(groups[0].lastAt, at(3));
  });
});
