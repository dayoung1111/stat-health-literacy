'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

// 환자·의료진 화면 왼쪽 위의 "← 뒤로" 버튼.
// href가 있으면 항상 그 화면으로, 없으면 방금 본 화면으로 간다.
// 문자 링크로 바로 열어 이전 화면이 없으면 fallback 화면으로 간다.
// 환자 화면은 고른 언어의 글자를 children으로 넘긴다(의료진 화면은 한국어 그대로).
export const backButtonClass =
  'inline-flex min-h-12 items-center rounded-2xl border-2 border-zinc-300 bg-white px-4 text-xl font-bold text-zinc-800 hover:border-blue-700 hover:text-blue-700 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export function BackButton({
  href,
  fallback = '/',
  onClick,
  children = '← 뒤로',
}: {
  href?: string;
  fallback?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={backButtonClass}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={backButtonClass}
      onClick={
        onClick ??
        (() =>
          window.history.length > 1 ? router.back() : router.push(fallback))
      }
    >
      {children}
    </button>
  );
}
