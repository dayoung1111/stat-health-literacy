import { Suspense, type ReactNode } from 'react';

import { requireStaff, type StaffRole } from '@/lib/demo-staff';

// 로그인한 의료진만 볼 수 있는 화면의 공통 틀. 역할(기본: 간호사)을 서버에서 매번 확인한다.
// 쿠키는 요청마다 달라 Suspense 안에서 읽는다.
export function StaffPage({
  role = 'nurse',
  children,
}: {
  role?: StaffRole;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-lg text-zinc-600">불러오는 중…</p>}>
      <Gate role={role}>{children}</Gate>
    </Suspense>
  );
}

async function Gate({
  role,
  children,
}: {
  role: StaffRole;
  children: ReactNode;
}) {
  await requireStaff(role);
  return children;
}
