import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canDiscardCode,
  canManageCode,
  DEMO_CODES,
  demoResetWhere,
  isDemoCode,
} from './code-access';
import { mostMissedQuestions } from './teachback-stats';

// 관리자 화면·내 코드 목록의 코드 관리 규칙. 서버 처리(staff/actions.ts)와 DB 함수(education-store.ts)가 이 규칙을 쓴다.

const admin = { id: 'admin01', role: 'admin' as const };
const nurse1 = { id: 'nurse01', role: 'nurse' as const };
const nurse2 = { id: 'nurse02', role: 'nurse' as const };

const realCode = { code: '123456', staffId: 'nurse01' };
const otherNurseCode = { code: '550031', staffId: 'nurse02' };

describe('🔄 시연 기록 초기화', () => {
  it('시연 코드 4개(000000·482917·777777·DEMO)만 고른다', () => {
    assert.deepEqual(
      [...demoResetWhere().code.in].sort(),
      ['000000', '482917', '777777', 'DEMO'].sort(),
    );
  });

  it('실제 발급 코드와 시연용 예시 코드는 초기화 대상이 아니다', () => {
    const picked = demoResetWhere().code.in;
    for (const code of ['123456', '999999', '305566', '771204', '550031']) {
      assert.equal(
        picked.includes(code),
        false,
        `${code}가 초기화 대상에 있음`,
      );
      assert.equal(isDemoCode(code), false);
    }
  });

  it('고르는 조건은 코드 번호뿐이다(다른 조건으로 넓어지지 않음)', () => {
    assert.deepEqual(Object.keys(demoResetWhere()), ['code']);
    assert.deepEqual(Object.keys(demoResetWhere().code), ['in']);
    assert.equal(demoResetWhere().code.in.length, DEMO_CODES.length);
  });
});

describe('🔓 잠금 풀기 / 🗑️ 폐기 권한', () => {
  it('간호사는 자기가 발급한 코드만 관리할 수 있다', () => {
    assert.equal(canManageCode(nurse1, realCode), true);
    assert.equal(canDiscardCode(nurse1, realCode), true);
  });

  it('간호사는 다른 간호사의 코드를 잠금 풀기·폐기할 수 없다', () => {
    assert.equal(canManageCode(nurse1, otherNurseCode), false);
    assert.equal(canDiscardCode(nurse1, otherNurseCode), false);
    assert.equal(canManageCode(nurse2, realCode), false);
    assert.equal(canDiscardCode(nurse2, realCode), false);
  });

  it('관리자는 모든 실제 코드를 관리할 수 있다', () => {
    assert.equal(canManageCode(admin, realCode), true);
    assert.equal(canDiscardCode(admin, otherNurseCode), true);
  });

  it('시연 코드는 관리자도, 발급한 간호사도 폐기할 수 없다(잠금 풀기는 된다)', () => {
    for (const code of DEMO_CODES) {
      const demo = { code, staffId: 'nurse01' };
      assert.equal(canDiscardCode(admin, demo), false, `관리자가 ${code} 폐기`);
      assert.equal(
        canDiscardCode(nurse1, demo),
        false,
        `간호사가 ${code} 폐기`,
      );
      assert.equal(canManageCode(nurse1, demo), true);
    }
  });
});

describe('❌ 많이 틀린 문제 TOP 3', () => {
  const tb = (
    question: string,
    result: 'correct' | 'retry_correct' | 'wrong',
    guide: 'colonoscopy' | 'medication' = 'colonoscopy',
  ) => ({ guide, question, result, answeredAt: new Date(0) });

  it('처음에 틀린 코드 수(틀림 + 다시 설명 후 맞힘)로 순위를 매기고 3개까지 보여 준다', () => {
    const codes = [
      {
        teachbackResults: [
          tb('A', 'wrong'),
          tb('B', 'wrong'),
          tb('C', 'correct'),
        ],
      },
      {
        teachbackResults: [
          tb('A', 'retry_correct'),
          tb('B', 'wrong'),
          tb('D', 'wrong'),
        ],
      },
      { teachbackResults: [tb('A', 'wrong'), tb('E', 'wrong')] },
    ];
    assert.deepEqual(mostMissedQuestions(codes), [
      { label: '대장내시경 › A', count: 3 },
      { label: '대장내시경 › B', count: 2 },
      { label: '대장내시경 › D', count: 1 },
    ]);
  });

  it('맞힌 문제와 복용약 확인 질문은 세지 않는다', () => {
    const codes = [
      {
        teachbackResults: [
          tb('A', 'correct'),
          tb('blood-pressure', 'wrong', 'medication'),
        ],
      },
    ];
    assert.deepEqual(mostMissedQuestions(codes), []);
  });
});
