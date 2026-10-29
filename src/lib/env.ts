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

// 교육 코드 토큰(링크·QR에 담는 발급 내용) 암호화·서명용 비밀값. 서버에서만 읽는다.
// 없으면 개발용 기본값을 쓰고 경고를 남긴다. 기본값은 소스에 공개돼 있어 누구나 토큰을 만들 수 있으므로,
// 배포(Vercel)에서는 꼭 32글자 이상의 무작위 값을 환경 변수로 넣어야 한다.
// 값을 바꾸면 그 전에 발급한 링크·QR은 모두 "코드를 다시 확인해 주세요"가 된다.
const devCodeTokenSecret =
  'stat-dev-only-code-token-secret-do-not-use-in-production';
const codeTokenWarned = globalThis as unknown as {
  statCodeTokenWarned?: boolean;
};

export function getCodeTokenSecret() {
  const raw = process.env.CODE_TOKEN_SECRET?.trim();
  if (raw && raw.length >= 32) return raw;
  if (!codeTokenWarned.statCodeTokenWarned) {
    codeTokenWarned.statCodeTokenWarned = true;
    console.warn(
      raw
        ? '[경고] CODE_TOKEN_SECRET이 32글자보다 짧아 개발용 기본값을 씁니다. 32글자 이상의 무작위 값으로 바꿔 주세요.'
        : '[경고] CODE_TOKEN_SECRET이 없어 개발용 기본값으로 교육 코드 링크를 만듭니다. 배포 환경에서는 꼭 Vercel 환경 변수에 넣어 주세요.',
    );
  }
  return devCodeTokenSecret;
}

// AI 번역용 Anthropic API 키(선택). 서버에서만 읽고 NEXT_PUBLIC_을 붙이지 않는다.
// 없으면 null을 돌려주고, 이때 화면은 번역하지 않고 한국어로 보여 준다(앱은 정상 작동).
export function getTranslationEnv() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  return apiKey ? { apiKey } : null;
}
