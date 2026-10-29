import { Suspense, type ReactNode } from 'react';

import { requireStaff } from '@/lib/demo-staff';

// 로그인한 의료진만 볼 수 있는 화면의 공통 틀. 쿠키는 요청마다 달라 Suspense 안에서 읽는다.
export function StaffPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="text-lg text-zinc-600">불러오는 중…</p>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: ReactNode }) {
  await requireStaff();
  return children;
}
