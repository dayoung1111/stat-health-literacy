import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { guideCatalog, guideKinds, type GuideKind } from '@/lib/guide-catalog';

import { Source, T } from '../../../../language';
import { Ttobagi } from '../../../../ttobagi';
import { ButtonLink, CallButton, PatientTopBar } from '../../../ui';
import { PatientPage } from '../../patient-page';

// 아직 내용이 없는 안내(건강검진 기본 확인사항, 위내시경)를 눌렀을 때.
export default function PreparingPage({
  params,
}: PageProps<'/p/[code]/preparing/[kind]'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <Preparing code={code} kind={params.then((p) => p.kind)} />
      )}
    />
  );
}

async function Preparing({
  code,
  kind: kindParam,
}: {
  code: string;
  kind: Promise<string>;
}) {
  const issued = await requireDemoPatient(code);
  const kind = (await kindParam) as GuideKind;
  if (!guideKinds.includes(kind) || !issued.guides.includes(kind)) notFound();

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      <h1 className="mb-4 text-3xl font-bold break-keep">
        <Source text={guideCatalog[kind].name} />
      </h1>
      <Ttobagi pose="explain" message={{ id: 'preparing.say' }} />
      <div className="mt-8 flex flex-col gap-4">
        <ButtonLink href={`/p/${code}/home`}>
          <T id="preparing.other" />
        </ButtonLink>
        <CallButton variant="outline">
          <T id="preparing.call" />
        </CallButton>
      </div>
    </>
  );
}
