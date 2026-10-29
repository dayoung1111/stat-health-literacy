import { notFound } from 'next/navigation';

import { getExpiryLabel, getMyCode } from '@/lib/demo-staff';

import { Panel } from '../../../ui';
import { StaffPage } from '../../../staff-page';
import { IssuedActions } from './issued-actions';

// ④ 코드 발급 완료: 환자에게 전달할 코드와 링크.
export default function IssuedPage({
  params,
}: PageProps<'/staff/issued/[code]'>) {
  return (
    <StaffPage>
      {params.then(({ code }) => (
        <Issued code={code} />
      ))}
    </StaffPage>
  );
}

async function Issued({ code }: { code: string }) {
  if (!(await getMyCode(code))) notFound();
  const expiry = await getExpiryLabel();

  return (
    <div className="mx-auto max-w-xl print:max-w-none">
      <Panel title="④ 발급 완료">
        <div className="text-center">
          <p className="text-base font-semibold text-zinc-600">
            환자 교육 코드
          </p>
          <p className="mt-2 font-mono text-6xl font-bold tracking-[0.2em] text-blue-700">
            {code}
          </p>
          <div
            role="img"
            aria-label="QR 코드 자리 (준비 중)"
            className="mx-auto mt-5 flex size-36 items-center justify-center border-4 border-zinc-900 bg-[repeating-linear-gradient(45deg,#18181b_0_8px,#fff_8px_16px)]"
          >
            <span className="bg-white px-2 py-1 text-sm font-bold">
              QR 준비 중
            </span>
          </div>
          <p className="mt-3 text-base text-zinc-700">{expiry}까지 (7일)</p>
        </div>
        <IssuedActions code={code} />
      </Panel>
    </div>
  );
}
