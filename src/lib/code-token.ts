import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { guideKinds, type GuideKind } from './guide-catalog';

// 교육 코드 토큰: 발급 내용(안내·검사일·약 중단일·생년월일 확인값 등)을 서버 비밀값으로
// 암호화·서명(AES-256-GCM)해 링크·QR 주소에 그대로 담는다. 서버 메모리·파일·DB에 저장하지 않으므로
// Vercel 서버가 여러 대이거나 다시 켜져도 같은 링크가 열린다.
// 생년월일은 원래 숫자가 아니라 비밀값으로 만든 확인값(HMAC)만 담는다.
// 이 파일은 비밀값을 인자로 받기만 한다(환경 변수는 env.ts getCodeTokenSecret).

export type CodeTokenData = {
  staffId: string;
  guides: GuideKind[];
  ageGroup: string;
  level: string;
  language: string;
  extras: string[];
  /** 검사일 YYYY-MM-DD */
  examDate: string;
  /** 피를 묽게 하는 약 중단 시작일 YYYY-MM-DD(없으면 null) */
  bloodThinnerStopDate: string | null;
  createdAt: Date;
  expiresAt: Date;
};

export type ReadCodeToken = CodeTokenData & {
  /** 생년월일 확인값. matchesBirthDate로 비교한다. */
  birthCheck: string;
};

const version = 1;
// 토큰 모양: 주소에 그대로 쓸 수 있는 글자(base64url)만, 길이는 넉넉히.
const tokenPattern = /^[A-Za-z0-9_-]{40,1000}$/;

export const looksLikeCodeToken = (value: string) => tokenPattern.test(value);

const keyFor = (secret: string, use: string) =>
  createHash('sha256').update(`stat-code-token:${use}:${secret}`).digest();

/** 생년월일 확인값: 비밀값으로 만든 HMAC 앞 16바이트(원래 숫자는 담지 않는다). */
export function birthCheckFor(secret: string, birthDate: string) {
  return createHmac('sha256', keyFor(secret, 'birth'))
    .update(birthDate)
    .digest()
    .subarray(0, 16)
    .toString('base64url');
}

export function matchesBirthDate(
  secret: string,
  birthDate: string,
  birthCheck: string,
) {
  const expected = Buffer.from(birthCheckFor(secret, birthDate));
  const actual = Buffer.from(birthCheck);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

export function createCodeToken(
  secret: string,
  data: CodeTokenData,
  birthDate: string,
) {
  // 주소를 짧게 하려고 이름 없이 순서대로 담는다. 안내는 목록 번호로 줄인다.
  const body = JSON.stringify([
    version,
    data.staffId,
    data.guides.map((g) => guideKinds.indexOf(g)).join(''),
    data.ageGroup,
    data.level,
    data.language,
    data.extras,
    data.examDate,
    data.bloodThinnerStopDate,
    birthCheckFor(secret, birthDate),
    seconds(data.createdAt),
    seconds(data.expiresAt),
  ]);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(secret, 'enc'), iv);
  const encrypted = Buffer.concat([
    cipher.update(body, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    'base64url',
  );
}

const isText = (v: unknown): v is string => typeof v === 'string';
const isDate = (v: unknown): v is string =>
  isText(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 토큰을 풀어 발급 내용을 돌려준다. 위조·변조·만료·모양이 틀리면 null. */
export function readCodeToken(
  secret: string,
  token: string,
  now = new Date(),
): ReadCodeToken | null {
  if (!looksLikeCodeToken(token)) return null;
  let parts: unknown;
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 12 + 16 + 1) return null;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      keyFor(secret, 'enc'),
      raw.subarray(0, 12),
    );
    decipher.setAuthTag(raw.subarray(12, 28));
    const body = Buffer.concat([
      decipher.update(raw.subarray(28)),
      decipher.final(),
    ]).toString('utf8');
    parts = JSON.parse(body);
  } catch {
    return null; // 서명이 맞지 않으면(위조·변조) 여기서 거절된다.
  }
  if (!Array.isArray(parts) || parts.length !== 12 || parts[0] !== version) {
    return null;
  }
  const [
    ,
    staffId,
    guideDigits,
    ageGroup,
    level,
    language,
    extras,
    examDate,
    stopDate,
    birthCheck,
    created,
    expires,
  ] = parts as unknown[];
  if (
    !isText(staffId) ||
    !isText(guideDigits) ||
    !/^[0-9]{1,9}$/.test(guideDigits) ||
    !isText(ageGroup) ||
    !isText(level) ||
    !isText(language) ||
    !Array.isArray(extras) ||
    !extras.every(isText) ||
    !isDate(examDate) ||
    !(stopDate === null || isDate(stopDate)) ||
    !isText(birthCheck) ||
    typeof created !== 'number' ||
    typeof expires !== 'number'
  ) {
    return null;
  }
  const guides = [...guideDigits].map((d) => guideKinds[Number(d)]);
  if (guides.some((g) => g === undefined)) return null;
  const expiresAt = new Date(expires * 1000);
  if (expiresAt.getTime() <= now.getTime()) return null;
  return {
    staffId,
    guides,
    ageGroup,
    level,
    language,
    extras,
    examDate,
    bloodThinnerStopDate: stopDate,
    birthCheck,
    createdAt: new Date(created * 1000),
    expiresAt,
  };
}

/** 소스코드에 고정한 시연용 코드(/p/DEMO). 서버 저장 없이 늘 같은 내용으로 열린다. */
export const DEMO_CODE = 'DEMO';

/** 주소의 교육 코드 모양: 예전 6자리 번호, 고정 시연 코드, 링크용 토큰 */
export const isCodeShape = (value: string) =>
  /^\d{6}$/.test(value) || value === DEMO_CODE || looksLikeCodeToken(value);
