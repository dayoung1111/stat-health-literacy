import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { verdictLabels, type Verdict } from '@/lib/medication-guide';

import { Labeled, Source } from '../../../language';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';
import { VerdictMark } from './med-icons';
import { MedicationFlow } from './medication-check';

// 드시는 약 안내(STAT 교육내용 초안 D. 복용약). 나이대와 상관없이 항상 전체 목록을 보여 준다.
export default function MedicationPage({
  params,
}: PageProps<'/p/[code]/medication'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <Medication code={code} />}
    />
  );
}

// 의료진이 입력한 날짜(날짜만, 한국 날짜)의 월·일. 없으면 null("의사 선생님과 정한 날짜부터").
// 문장은 화면이 고른 언어로 만든다.
function stopDate(date: string | null) {
  if (!date) return null;
  return { month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) };
}

async function Medication({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('medication')) notFound();

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 판정 그림 기준을 화면 맨 위에 작게 고정한다. */}
      <Labeled
        as="div"
        label="med.legend"
        role="note"
        className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stat-mint bg-stat-paper/95 px-4 py-2 text-xl backdrop-blur"
      >
        {(['ok', 'stop', 'ask'] as Verdict[]).map((v) => (
          <span key={v} className="flex items-center gap-1">
            <VerdictMark verdict={v} className="size-7" />
            <Source text={verdictLabels[v]} />
          </span>
        ))}
      </Labeled>
      <MedicationFlow
        code={code}
        initial={issued.medicationCheck?.medications ?? []}
        stopDate={stopDate(issued.bloodThinnerStopDate)}
      />
      <CheckWithStaff />
    </>
  );
}
