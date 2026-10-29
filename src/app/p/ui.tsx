import Link from 'next/link';
import type { ReactNode } from 'react';

import { hospital } from '@/lib/demo-guide';

import { BackButton, backButtonClass } from '../back-button';

// 환자 화면에서 반복되는 버튼·링크 모양. 글씨는 20px 이상, 둥근 모양을 유지한다.
const focus =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green';

export const buttonClass = {
  primary: `flex min-h-18 w-full items-center justify-center rounded-3xl bg-stat-green px-6 text-2xl font-bold text-white hover:bg-stat-green-dark disabled:bg-zinc-400 ${focus}`,
  outline: `flex min-h-18 w-full items-center justify-center rounded-3xl border-2 border-stat-green bg-white px-6 text-xl font-bold text-stat-green hover:bg-stat-mint ${focus}`,
  danger: `flex min-h-18 w-full items-center justify-center rounded-3xl border-2 border-stat-alert bg-white px-6 text-xl font-bold text-stat-alert hover:bg-stat-alert-soft ${focus}`,
  disabled:
    'flex min-h-18 w-full items-center justify-center rounded-3xl border-2 border-zinc-200 bg-white px-6 text-xl font-bold text-zinc-400',
  call: `flex min-h-18 w-full items-center justify-center rounded-3xl bg-stat-alert px-6 text-2xl font-bold text-white hover:bg-stat-alert-dark ${focus}`,
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
      className="inline-block py-2 text-xl text-zinc-600 underline-offset-4 hover:underline"
    >
      ← {children}
    </Link>
  );
}

// 로그인 뒤 환자 화면 위쪽: 왼쪽 "← 뒤로", 오른쪽 "🏠 처음으로"(환자 홈).
export function PatientTopBar({
  code,
  back,
  showHome = true,
}: {
  code: string;
  back: { href?: string; fallback?: string };
  showHome?: boolean;
}) {
  return (
    <nav
      aria-label="화면 이동"
      className="mb-4 flex items-center justify-between"
    >
      <BackButton {...back} />
      {showHome && (
        <Link href={`/p/${code}/home`} className={backButtonClass}>
          🏠 처음으로
        </Link>
      )}
    </nav>
  );
}

export function Loading() {
  return <p className="text-xl text-zinc-600">불러오는 중…</p>;
}

export function CheckWithStaff() {
  return (
    <p className="mt-10 border-t border-stat-mint pt-4 text-xl text-zinc-600">
      정확한 내용은 의료진에게 확인하세요.
    </p>
  );
}
