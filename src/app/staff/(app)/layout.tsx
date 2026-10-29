import Link from 'next/link';
import { Suspense } from 'react';

import { getStaff } from '@/lib/demo-staff';

import { logoutStaff } from '../actions';
import { navy } from '../ui';

export default function StaffAppLayout({ children }: LayoutProps<'/staff'>) {
  return (
    <>
      <header className={`text-white ${navy}`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 whitespace-nowrap">
          <Link href="/staff/new" className="text-lg font-semibold">
            S.T.A.T 의료진
          </Link>
          <nav
            aria-label="의료진 메뉴"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:gap-x-5 sm:text-base"
          >
            <Link href="/staff/new" className="hover:underline">
              새 코드 발급
            </Link>
            <Link href="/staff/codes" className="hover:underline">
              내 코드 목록
            </Link>
            <Suspense fallback={null}>
              <StaffName />
            </Suspense>
            <form action={logoutStaff}>
              <button
                type="submit"
                className="rounded border border-white/60 px-3 py-1 text-sm hover:bg-white/10"
              >
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </>
  );
}

async function StaffName() {
  const staff = await getStaff();
  return staff ? <span className="font-semibold">{staff.name}</span> : null;
}
