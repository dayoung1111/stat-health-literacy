import { Suspense, type ReactNode } from 'react';

import { requireDemoPatient } from '@/lib/demo-patient';

import { Loading } from '../ui';

// 확인된 환자만 볼 수 있는 화면의 공통 틀.
// 주소의 코드와 쿠키는 요청마다 달라서 Suspense 안에서 읽는다.
export function PatientPage({
  params,
  render,
}: {
  params: Promise<{ code: string }>;
  render: (code: string) => ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ code }) => (
        <Gate code={code} render={render} />
      ))}
    </Suspense>
  );
}

async function Gate({
  code,
  render,
}: {
  code: string;
  render: (code: string) => ReactNode;
}) {
  await requireDemoPatient(code);
  return render(code);
}
