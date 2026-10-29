import 'server-only';

import { randomBytes } from 'node:crypto';

import { z } from 'zod';

const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .url('올바른 PostgreSQL 연결 주소를 입력해 주세요.')
    .refine(
      (value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
      'postgres:// 또는 postgresql://로 시작하는 연결 주소를 입력해 주세요.',
    ),
});

export function getDatabaseEnv() {
  const result = databaseEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!result.success) {
    throw new Error(
      '.env 파일의 DATABASE_URL에 실제 Supabase PostgreSQL 연결 주소를 입력한 뒤 서버를 재시작해 주세요.',
    );
  }

  return result.data;
}

// 로그인 쿠키 서명용 비밀값. 서버에서만 읽고 NEXT_PUBLIC_을 붙이지 않는다(브라우저로 나가면 안 된다).
// 운영(production)에서는 꼭 있어야 하고, 개발 중에 없으면 서버를 켤 때마다 새로 만든 임시 값을 쓴다
// (그래서 서버를 다시 켜면 로그인이 풀린다).
const sessionSecretSchema = z.string().min(32);

const devSecret = globalThis as unknown as { statDevSessionSecret?: string };

export function getSessionSecret() {
  const raw = process.env.SESSION_SECRET;
  if (raw) {
    const result = sessionSecretSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        '.env의 SESSION_SECRET이 너무 짧아요. 32글자 이상의 무작위 값으로 바꾼 뒤 서버를 재시작해 주세요.',
      );
    }
    return result.data;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET이 없어요. .env(또는 Vercel 환경 변수)에 32글자 이상의 무작위 값을 넣고 서버를 재시작해 주세요.',
    );
  }
  devSecret.statDevSessionSecret ??= randomBytes(32).toString('hex');
  return devSecret.statDevSessionSecret;
}
