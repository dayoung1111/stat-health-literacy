import { notFound } from 'next/navigation';

import { demoGuide } from '@/lib/demo-guide';

import { BackLink, ButtonLink, CallButton } from '../../../../ui';
import { PatientPage } from '../../../patient-page';

// "헷갈려요"를 누른 문단을 한 단계 더 쉽게 보여 준다.
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
  const { section, paragraph: paragraphId } = await target;
  const paragraph = demoGuide.sections[Number(section) - 1]?.paragraphs.find(
    (p) => p.id === paragraphId,
  );
  if (!paragraph) notFound();

  const backHref = `/p/${code}/guide/${section}`;

  return (
    <>
      <BackLink href={backHref}>안내문</BackLink>
      <h1 className="mt-4 text-3xl font-bold">더 쉽게 알려 드릴게요</h1>
      <ul className="mt-6 flex flex-col gap-3 rounded-2xl bg-amber-50 p-6">
        {paragraph.easier.map((item) => (
          <li key={item.text} className="text-2xl leading-relaxed">
            <span aria-hidden="true">{item.icon} </span>
            {item.text}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4">
        <ButtonLink href={backHref}>이제 알겠어요 👍</ButtonLink>
        <CallButton variant="outline">아직 어려워요 → 병원 전화</CallButton>
      </div>
    </>
  );
}
