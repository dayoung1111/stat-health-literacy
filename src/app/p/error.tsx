'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { classifyError, newErrorNumber } from '@/lib/error-log';

import { useTranslatedTexts } from '../translated';
import { reportError } from './error-report';
import { errorScreenTexts, PatientErrorView } from './error-screen';

// 환자 화면(/p 아래 전체: 코드 입력·안내·또박이 수업·퀴즈·복용약 체크)에서 오류가 나면
// 하얀 화면 대신 이 화면을 보여 주고, 오류 번호와 화면 위치를 서버에 남긴다.
export default function PatientError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const pathname = usePathname();
  // 오류 번호는 처음 한 번만 정한다(화면을 다시 그려도 같은 번호).
  const [errorNumber] = useState(() => newErrorNumber());

  useEffect(() => {
    reportError({
      pathname,
      errorNumber,
      once: errorNumber,
      kind: classifyError(error, navigator.onLine),
      digest:
        error instanceof Error && 'digest' in error
          ? String(error.digest)
          : undefined,
    });
    // 개발 중 원인을 찾을 수 있게 브라우저 콘솔에만 남긴다(서버에는 오류 문장을 보내지 않는다).
    console.error(error);
  }, [pathname, errorNumber, error]);

  const keys = Object.keys(
    errorScreenTexts,
  ) as (keyof typeof errorScreenTexts)[];
  const { texts } = useTranslatedTexts(
    keys.map((key) => errorScreenTexts[key]),
  );
  const translated = Object.fromEntries(
    keys.map((key, i) => [key, texts[i]]),
  ) as typeof errorScreenTexts;

  return (
    <PatientErrorView
      errorNumber={errorNumber}
      texts={translated}
      onRetry={retry}
    />
  );
}
