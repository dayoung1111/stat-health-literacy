import { notFound } from 'next/navigation';

import { guideSteps } from '@/lib/demo-guide';

import { PictureLines } from '../../../../pictures';
import { ButtonLink, CallButton, PatientTopBar } from '../../../../ui';
import { PatientPage } from '../../../patient-page';

// "헷갈려요"를 누른 내용을 그림 + 짧은 한 줄씩 더 쉽게 보여 준다.
export default function EasierPage({
  params,
}: PageProps<'/p/[code]/guide/[section]/[paragraph]'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <Easier code={code} target={params} />}
    />
  );
}

async function Easier({
  code,
  target,
}: {
  code: string;
  target: Promise<{ section: string; paragraph: string }>;
}) {
  const { section, paragraph } = await target;
  const step = guideSteps[Number(section) - 1];
  if (!step || step.id !== paragraph) notFound();

  const backHref = `/p/${code}/guide/${section}`;

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: backHref }} />
      <h1 className="text-3xl leading-snug font-bold">
        괜찮아요 🙂
        <br />더 쉽게 볼까요?
      </h1>
      <div className="mt-6 rounded-3xl bg-amber-100 p-4">
        <PictureLines pictures={step.easier} />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <ButtonLink href={backHref}>이제 알겠어요 👍</ButtonLink>
        <CallButton variant="outline">아직 어려워요 → 병원에 전화</CallButton>
      </div>
    </>
  );
}
