import { createHmac, timingSafeEqual } from 'node:crypto';

// 로그인 쿠키에 담는 서명된 값. "내용.서명" 모양이고 서명은 서버 비밀값(SESSION_SECRET)으로 만든 HMAC-SHA256이다.
// 쿠키 값을 직접 바꾸면 서명이 맞지 않아 거절된다. 비밀값은 이 파일 밖(env.ts)에서 받아 넘긴다.

export type SessionKind = 'staff' | 'patient';

const sign = (secret: string, body: string) =>
  createHmac('sha256', secret).update(body).digest('base64url');

export function signToken(
  secret: string,
  kind: SessionKind,
  subject: string,
  maxAgeSeconds: number,
  now = Date.now(),
) {
  const body = Buffer.from(
    JSON.stringify({ k: kind, s: subject, e: now + maxAgeSeconds * 1000 }),
  ).toString('base64url');
  return `${body}.${sign(secret, body)}`;
}

// 서명·종류(의료진/환자)·만료가 모두 맞으면 담긴 값(아이디 또는 코드)을, 아니면 null을 돌려준다.
export function verifyToken(
  secret: string,
  token: string | undefined,
  kind: SessionKind,
  now = Date.now(),
) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  const expected = Buffer.from(sign(secret, body));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const data: unknown = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    );
    if (typeof data !== 'object' || data === null) return null;
    const { k, s, e } = data as { k?: unknown; s?: unknown; e?: unknown };
    if (k !== kind || typeof s !== 'string' || typeof e !== 'number') {
      return null;
    }
    return e > now ? s : null;
  } catch {
    return null;
  }
}
