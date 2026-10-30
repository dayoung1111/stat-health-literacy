'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentProps } from 'react';

import {
  isLessonPlace,
  newErrorNumber,
  placeFromPath,
  type ErrorKind,
} from '@/lib/error-log';

import { T } from '../translated';
import { reportPatientError } from './error-actions';

// 환자 화면에서 오류를 서버(error_logs)에 남기는 도구. 저장이 실패해도 화면은 그대로 둔다.

// 또박이 수업이 지금 몇 교시 몇 단계인지(photo-lesson-player.tsx가 알려 준다).
let lessonNow: string | null = null;

export function setLessonPlace(place: string | null) {
  lessonNow = place;
}

/** 주소로 정한 화면 이름. 수업 화면이면 교시·단계까지 붙인다. */
export function currentPlace(pathname: string) {
  const found = placeFromPath(pathname);
  return found.place === '대장내시경 수업' &&
    lessonNow &&
    isLessonPlace(lessonNow)
    ? { ...found, place: lessonNow }
    : found;
}

// 같은 화면에서 같은 오류(같은 사진 등)는 한 번만 보낸다.
const sent = new Set<string>();

/** 오류를 서버에 보내고, 환자에게 보여 줄 오류 번호를 돌려준다. */
export function reportError({
  pathname,
  kind,
  digest,
  once,
  errorNumber = newErrorNumber(),
}: {
  pathname: string;
  kind: ErrorKind;
  digest?: string;
  /** 같은 값이면 한 번만 보낸다(예: 사진 주소). */
  once?: string;
  /** 화면에 이미 보여 준 번호가 있으면 그 번호로 남긴다. */
  errorNumber?: string;
}) {
  const { place, code } = currentPlace(pathname);
  const key = `${pathname}\0${place}\0${kind}\0${once ?? errorNumber}`;
  if (sent.has(key)) return errorNumber;
  sent.add(key);
  reportPatientError({ errorNumber, kind, place, code, digest }).catch(() => {
    // 서버에 닿지 않아도 환자 화면은 그대로 둔다.
  });
  return errorNumber;
}

/**
 * 사진 한 장. 불러오지 못하면 그 칸만 "사진을 불러오지 못했어요"로 바꾸고 기록을 남긴다.
 * next/image의 fill 사진과 같은 자리(부모 칸 전체)를 차지한다.
 */
export function SafeImage({ alt, ...props }: ComponentProps<typeof Image>) {
  const pathname = usePathname();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        role="img"
        aria-label={`${alt} (사진을 불러오지 못했어요)`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-100 p-2 text-center text-base leading-snug font-semibold break-keep text-zinc-600"
      >
        <span aria-hidden="true" className="text-2xl">
          🖼️
        </span>
        <T>사진을 불러오지 못했어요</T>
      </span>
    );
  }
  return (
    <Image
      {...props}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        reportError({
          pathname,
          kind: 'photo-load',
          once: String(props.src),
        });
        props.onError?.(event);
      }}
    />
  );
}

/** 화면이 보이면 한 번 기록한다(예: 만료된 코드 링크를 열었을 때). */
export function ReportOnce({ kind }: { kind: ErrorKind }) {
  const pathname = usePathname();
  useEffect(() => {
    reportError({ pathname, kind, once: kind });
  }, [pathname, kind]);
  return null;
}
