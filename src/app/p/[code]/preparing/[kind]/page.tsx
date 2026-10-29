import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { guideCatalog, guideKinds, type GuideKind } from '@/lib/guide-catalog';
import { screenTexts } from '@/lib/screen-texts';

import { T, TranslatedTtobagi } from '../../../../translated';
import { ButtonLink, CallButton, PatientTopBar } from '../../../ui';
import { PatientPage } from '../../patient-page';

// 아직 내용이 없는 안내를 눌렀을 때(지금은 모든 안내에 내용이 있어 쓰이지 않는다).
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
        <T>{guideCatalog[kind].name}</T>
      </h1>
      <TranslatedTtobagi
        pose="explain"
        message={screenTexts.preparing.message}
      />
      <div className="mt-8 flex flex-col gap-4">
        <ButtonLink href={`/p/${code}/home`}>
          🏠 <T>{screenTexts.preparing.other}</T>
        </ButtonLink>
        <CallButton variant="outline">
          📞 <T>{screenTexts.preparing.callIfCurious}</T>
        </CallButton>
      </div>
    </>
  );
}
