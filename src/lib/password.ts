import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// 비밀번호·생년월일처럼 되돌릴 수 없게 저장할 값의 해시(scrypt, 값마다 다른 소금).
// 저장 모양은 "소금:해시"(둘 다 16진수)이며 DB 단계에서도 같은 방식을 쓴다.
export function hashSecret(value: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(value, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function matchesSecret(value: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(value, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
