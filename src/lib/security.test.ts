import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isOwnedBy } from './code-access';
import { createLoginThrottle } from './login-throttle';
import { hashSecret, matchesSecret } from './password';
import { signToken, verifyToken } from './session-token';

const secret = 'a'.repeat(32);
const otherSecret = 'b'.repeat(32);

describe('비밀번호 해시', () => {
  it('원래 값이 해시 안에 그대로 들어 있지 않고 맞는 값만 통과한다', () => {
    const stored = hashSecret('my-password');
    assert.ok(!stored.includes('my-password'));
    assert.equal(matchesSecret('my-password', stored), true);
    assert.equal(matchesSecret('other', stored), false);
  });

  it('같은 값도 소금이 달라 해시가 매번 다르다', () => {
    assert.notEqual(hashSecret('same'), hashSecret('same'));
  });

  it('깨진 저장값은 통과하지 못한다', () => {
    assert.equal(matchesSecret('x', ''), false);
    assert.equal(matchesSecret('x', 'abc'), false);
  });
});

describe('로그인 쿠키 서명', () => {
  it('서명된 의료진 값은 아이디를 돌려준다', () => {
    const token = signToken(secret, 'staff', 'nurse01', 60);
    assert.equal(verifyToken(secret, token, 'staff'), 'nurse01');
  });

  it('쿠키 값을 admin01로 바꿔도(서명 없음) 들어가지 못한다', () => {
    assert.equal(verifyToken(secret, 'admin01', 'staff'), null);
    assert.equal(verifyToken(secret, undefined, 'staff'), null);
    assert.equal(verifyToken(secret, '', 'staff'), null);
  });

  it('서명된 값의 내용만 admin01로 바꾸면 서명이 맞지 않아 거절된다', () => {
    const [, mac] = signToken(secret, 'staff', 'nurse01', 60).split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ k: 'staff', s: 'admin01', e: Date.now() + 60_000 }),
    ).toString('base64url');
    assert.equal(verifyToken(secret, `${forgedBody}.${mac}`, 'staff'), null);
  });

  it('다른 비밀값으로 만든 서명은 거절된다', () => {
    const token = signToken(otherSecret, 'staff', 'admin01', 60);
    assert.equal(verifyToken(secret, token, 'staff'), null);
  });

  it('서명 없는 환자 쿠키(코드 번호만)로는 들어가지 못한다', () => {
    assert.equal(verifyToken(secret, '000000', 'patient'), null);
  });

  it('의료진 값을 환자 쿠키로, 환자 값을 의료진 쿠키로 쓸 수 없다', () => {
    const staff = signToken(secret, 'staff', 'admin01', 60);
    const patient = signToken(secret, 'patient', '000000', 60);
    assert.equal(verifyToken(secret, staff, 'patient'), null);
    assert.equal(verifyToken(secret, patient, 'staff'), null);
  });

  it('만료된 값은 거절된다', () => {
    const now = Date.now();
    const token = signToken(secret, 'patient', '000000', 60, now);
    assert.equal(verifyToken(secret, token, 'patient', now + 59_000), '000000');
    assert.equal(verifyToken(secret, token, 'patient', now + 61_000), null);
  });

  it('모양이 이상한 값은 오류 없이 거절된다', () => {
    for (const bad of ['a.b.c', '.', 'a.', '.b', '{}', 'x'.repeat(5000)]) {
      assert.equal(verifyToken(secret, bad, 'staff'), null);
    }
  });
});

describe('로그인 실패 잠금', () => {
  it('5번 틀리면 잠기고, 시간이 지나면 풀린다', () => {
    const limit = createLoginThrottle({ max: 5, lockMs: 1000 });
    for (let i = 1; i <= 4; i += 1) {
      assert.deepEqual(limit.recordFailure('nurse01', 0), {
        locked: false,
        remaining: 5 - i,
      });
    }
    assert.equal(limit.recordFailure('nurse01', 0).locked, true);
    assert.equal(limit.isLocked('nurse01', 500), true);
    assert.equal(limit.isLocked('nurse01', 1001), false);
    // 풀린 뒤에는 처음부터 다시 센다.
    assert.equal(limit.recordFailure('nurse01', 2000).remaining, 4);
  });

  it('성공하면 횟수를 지우고, 다른 아이디에는 영향이 없다', () => {
    const limit = createLoginThrottle({ max: 3 });
    limit.recordFailure('nurse01', 0);
    limit.recordFailure('nurse01', 0);
    limit.reset('nurse01');
    assert.equal(limit.recordFailure('nurse01', 0).remaining, 2);
    limit.recordFailure('nurse02', 0);
    limit.recordFailure('nurse02', 0);
    assert.equal(limit.isLocked('nurse01', 0), false);
  });

  it('기록이 한도를 넘으면 가장 오래된 것부터 지운다', () => {
    const limit = createLoginThrottle({ max: 1, maxEntries: 2 });
    limit.recordFailure('a', 0);
    limit.recordFailure('b', 0);
    limit.recordFailure('c', 0);
    assert.equal(limit.isLocked('a', 1), false);
    assert.equal(limit.isLocked('c', 1), true);
  });
});

describe('의료진별 코드 접근', () => {
  it('간호사는 다른 간호사가 발급한 코드를 볼 수 없다', () => {
    const row = { staffId: 'nurse02' };
    assert.equal(isOwnedBy(row, 'nurse01'), false);
    assert.equal(isOwnedBy(row, 'nurse02'), true);
  });
});
