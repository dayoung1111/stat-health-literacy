import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';

import { requireStaff } from '@/lib/demo-staff';
import { findCodeForStaff } from '@/lib/education-store';
import { guideNames } from '@/lib/guide-catalog';
import { settingLabel } from '@/lib/staff-options';

import { Panel, StaffBack } from '../../../ui';
import { StaffPage } from '../../../staff-page';
import { IssuedActions } from './issued-actions';

// ④ 코드 발급 완료: 고른 안내를 묶은 코드 1개·QR 1개·링크 1개.
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

// 지금 이 화면을 연 주소(예: 배포 주소, 같은 와이파이의 맥 주소)로 환자 링크를 만든다.
async function patientLink(code: string) {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocol =
    h.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}/p/${code}`;
}

async function Issued({ code }: { code: string }) {
  const staff = await requireStaff();
  const issued = await findCodeForStaff(staff.id, code);
  if (!issued) notFound();

  const link = await patientLink(code);
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 320 });
  const expiry = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
  }).format(issued.expiresAt);

  return (
    <div className="mx-auto max-w-xl print:max-w-none">
      <div className="print:hidden">
        <StaffBack fallback="/staff/new" />
      </div>
      <Panel title="④ 발급 완료">
        <div className="text-center">
          <p className="text-base font-semibold text-zinc-600">
            환자 교육 코드
          </p>
          <p className="mt-2 font-mono text-6xl font-bold tracking-[0.2em] text-blue-700">
            {code}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- 서버에서 만든 QR 그림(data URL) */}
          <img
            src={qr}
            alt={`환자 링크 QR 코드: ${link}`}
            width={160}
            height={160}
            className="mx-auto mt-5 size-40"
          />
          <p className="mt-2 text-sm break-all text-zinc-500">{link}</p>
          <p className="mt-3 text-base text-zinc-700">{expiry}까지 (7일)</p>
        </div>
        <dl className="mt-5 grid gap-2 rounded-lg bg-zinc-50 p-4 text-base">
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 font-semibold text-zinc-600">
              묶은 안내
            </dt>
            <dd>{guideNames(issued.guides).join(', ')}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 font-semibold text-zinc-600">설정</dt>
            <dd>{settingLabel(issued)}</dd>
          </div>
        </dl>
        <IssuedActions code={code} link={link} />
      </Panel>
    </div>
  );
}
