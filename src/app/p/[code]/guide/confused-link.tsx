'use client';

import { useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';

import { recordConfusion } from '../../records';

// "헷갈려요" 버튼. 누른 문단을 기록(의료진 코드 상세에 보임)한 뒤 더 쉬운 설명으로 간다.
// 미리 불러오기(prefetch)로 잘못 기록되지 않도록, 누를 때만 기록한다.
export function ConfusedLink({
  code,
  paragraphId,
  href,
  className,
  children,
}: {
  code: string;
  paragraphId: string;
  href: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <a
      href={href}
      aria-busy={pending || undefined}
      onClick={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await recordConfusion(code, paragraphId);
          router.push(href);
        });
      }}
      className={className}
    >
      {children}
    </a>
  );
}
