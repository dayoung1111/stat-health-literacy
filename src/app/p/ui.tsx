import Link from 'next/link';
import type { ReactNode } from 'react';

import { hospital } from '@/lib/demo-guide';

// 환자 화면에서 반복되는 버튼·링크 모양. 글씨는 18px 이상을 유지한다.
const focus =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700';

export const buttonClass = {
  primary: `flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-700 px-6 text-2xl font-bold text-white hover:bg-blue-800 disabled:bg-zinc-400 ${focus}`,
  outline: `flex min-h-16 w-full items-center justify-center rounded-2xl border-2 border-blue-700 bg-white px-6 text-xl font-bold text-blue-700 hover:bg-blue-50 ${focus}`,
  danger: `flex min-h-16 w-full items-center justify-center rounded-2xl border-2 border-red-700 bg-white px-6 text-xl font-bold text-red-700 hover:bg-red-50 ${focus}`,
  call: `flex min-h-16 w-full items-center justify-center rounded-2xl bg-red-700 px-6 text-2xl font-bold text-white hover:bg-red-800 ${focus}`,
};

export function ButtonLink({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: keyof typeof buttonClass;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass[variant]}>
      {children}
    </Link>
  );
}

export function CallButton({
  variant = 'call',
  children = '📞 병원에 전화하기',
}: {
  variant?: keyof typeof buttonClass;
  children?: ReactNode;
}) {
  return (
    <a href={`tel:${hospital.phone}`} className={buttonClass[variant]}>
      {children}
    </a>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-block py-2 text-lg text-zinc-600 underline-offset-4 hover:underline"
    >
      ← {children}
    </Link>
  );
}

export function Loading() {
  return <p className="text-lg text-zinc-600">불러오는 중…</p>;
}

export function CheckWithStaff() {
  return (
    <p className="mt-10 border-t border-zinc-200 pt-4 text-lg text-zinc-600">
      정확한 내용은 의료진에게 확인하세요.
    </p>
  );
}
