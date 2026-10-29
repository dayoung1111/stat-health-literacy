import Link from 'next/link';
import { Suspense } from 'react';

import { getStaff, homeFor, roleLabels } from '@/lib/demo-staff';

import { logoutStaff } from '../actions';
import { navy } from '../ui';

export default function StaffAppLayout({ children }: LayoutProps<'/staff'>) {
  return (
    <>
      <header className={`text-white ${navy}`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 whitespace-nowrap">
          <Suspense
            fallback={
              <span className="text-lg font-semibold">S.T.A.T 의료진</span>
            }
          >
            <StaffMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </>
  );
}

// 역할에 맞는 메뉴만 보여 준다. 실제 접근 막기는 각 화면의 서버 확인(requireStaff)이 한다.
async function StaffMenu() {
  const staff = await getStaff();
  return (
    <>
      <Link
        href={staff ? homeFor(staff.role) : '/staff'}
        className="text-lg font-semibold"
      >
        S.T.A.T {staff?.role === 'admin' ? '관리자' : '의료진'}
      </Link>
      {staff && (
        <nav
          aria-label="의료진 메뉴"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:gap-x-5 sm:text-base"
        >
          {staff.role === 'nurse' ? (
            <>
              <Link href="/staff/new" className="hover:underline">
                새 코드 발급
              </Link>
              <Link href="/staff/codes" className="hover:underline">
                내 코드 목록
              </Link>
            </>
          ) : (
            <Link href="/staff/admin" className="hover:underline">
              관리자 화면
            </Link>
          )}
          <span className="font-semibold">
            {staff.name}
            <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-xs">
              {roleLabels[staff.role]}
            </span>
          </span>
          <form action={logoutStaff}>
            <button
              type="submit"
              className="rounded border border-white/60 px-3 py-1 text-sm hover:bg-white/10"
            >
              로그아웃
            </button>
          </form>
        </nav>
      )}
    </>
  );
}
