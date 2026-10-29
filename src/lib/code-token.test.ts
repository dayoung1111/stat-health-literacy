import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createCodeToken,
  looksLikeCodeToken,
  matchesBirthDate,
  readCodeToken,
} from './code-token';

const secret = 'test-secret-0123456789abcdef0123456789abcdef';
const now = new Date('2026-10-30T03:00:00Z');
const data = {
  staffId: 'nurse01',
  guides: ['checkup', 'colonoscopy', 'gastroscopy', 'medication'] as const,
  ageGroup: '60',
  level: 'easy',
  language: 'ko',
  extras: ['large-text'],
  examDate: '2026-11-05',
  bloodThinnerStopDate: '2026-11-01',
  createdAt: now,
  expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
};
const token = createCodeToken(
  secret,
  { ...data, guides: [...data.guides] },
  '800101',
);

describe('교육 코드 토큰', () => {
  it('발급 내용을 그대로 되돌려 읽는다', () => {
    assert.ok(looksLikeCodeToken(token), token);
    const read = readCodeToken(secret, token, now);
    assert.ok(read);
    assert.deepEqual(read.guides, data.guides);
    assert.equal(read.examDate, '2026-11-05');
    assert.equal(read.bloodThinnerStopDate, '2026-11-01');
    assert.equal(read.staffId, 'nurse01');
    assert.deepEqual(read.extras, ['large-text']);
    assert.equal(read.expiresAt.getTime(), data.expiresAt.getTime());
  });

  it('생년월일 원래 숫자는 담지 않고 확인값으로만 맞춰 본다', () => {
    const read = readCodeToken(secret, token, now)!;
    assert.ok(!read.birthCheck.includes('800101'));
    assert.equal(matchesBirthDate(secret, '800101', read.birthCheck), true);
    assert.equal(matchesBirthDate(secret, '800102', read.birthCheck), false);
  });

  it('글자 하나만 바꿔도(변조) 거절한다', () => {
    for (const i of [0, 20, token.length - 1]) {
      const c = token[i] === 'A' ? 'B' : 'A';
      const changed = token.slice(0, i) + c + token.slice(i + 1);
      assert.equal(readCodeToken(secret, changed, now), null, `위치 ${i}`);
    }
  });

  it('다른 비밀값으로 만든 토큰(위조)과 이상한 값은 거절한다', () => {
    const forged = createCodeToken(
      'another-secret-0123456789abcdef0123456789',
      { ...data, guides: [...data.guides] },
      '800101',
    );
    assert.equal(readCodeToken(secret, forged, now), null);
    assert.equal(readCodeToken(secret, '123456', now), null);
    assert.equal(readCodeToken(secret, 'A'.repeat(80), now), null);
  });

  it('7일이 지나면(만료) 거절한다', () => {
    const later = new Date(data.expiresAt.getTime() + 1000);
    assert.equal(readCodeToken(secret, token, later), null);
  });

  it('QR에 담기 좋은 길이다', () => {
    assert.ok(token.length < 400, `길이 ${token.length}`);
  });
});
