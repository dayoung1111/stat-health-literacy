import { notFound } from 'next/navigation';

import { guideSteps } from '@/lib/demo-guide';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { T } from '../../../../../language';
import { Ttobagi } from '../../../../../ttobagi';
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
      <h1 className="sr-only">
        <T id="guide.easierTitle" />
      </h1>
      <Ttobagi pose="explain" message={ttobagiSays.explain} />
      <div className="mt-2 rounded-3xl bg-stat-sun p-4">
        <PictureLines pictures={step.easier} />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <ButtonLink href={backHref}>
          <T id="guide.gotIt" />
        </ButtonLink>
        <CallButton variant="outline">
          <T id="guide.stillHard" />
        </CallButton>
      </div>
    </>
  );
}
