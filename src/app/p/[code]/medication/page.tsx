import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { readyGuides } from '@/lib/guide-progress';
import { verdictLabels, type Verdict } from '@/lib/medication-guide';

import { T } from '../../../translated';
import { GuideBoard } from '../../guide-board';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';
import { VerdictMark } from './med-icons';
import { MedicationFlow } from './medication-check';

// 드시는 약 안내(STAT 교육내용 초안 D. 복용약). 나이대와 상관없이 항상 전체 목록을 보여 준다.
// 한 번 저장했으면 📋 내 약 정리부터 보여 준다.
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

// 의료진이 입력한 날짜(날짜만, 한국 날짜). 없으면 date는 null이고 정해 둔 문장을 쓴다.
// short는 그림 달력 칸에 쓰는 짧은 글자(예: 11/3, 날짜가 없으면 ?).
function stopDate(date: string | null) {
  if (!date) return { date: null, short: '?' };
  return {
    date,
    short: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
  };
}

async function Medication({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('medication')) notFound();

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 판정 그림 기준을 화면 맨 위에 작게 고정한다. */}
      <div
        aria-label="판정 그림 뜻"
        role="note"
        className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stat-mint bg-stat-paper/95 px-4 py-2 text-xl backdrop-blur"
      >
        {(['ok', 'stop', 'ask'] as Verdict[]).map((v) => (
          <span key={v} className="flex items-center gap-1">
            <VerdictMark verdict={v} className="size-7" />
            <T>{verdictLabels[v]}</T>
          </span>
        ))}
      </div>
      <MedicationFlow
        code={code}
        saved={issued.medicationCheck?.medications ?? null}
        stopDate={stopDate(issued.bloodThinnerStopDate)}
        language={issued.language}
        guides={readyGuides(issued.guides)}
        completed={issued.guideCompletions.map((c) => c.guide)}
      />
      {/* 약 고르기·정리 화면 모두 아래에 받은 안내 현황판을 둔다. */}
      <div className="mt-8">
        <GuideBoard
          code={code}
          current="medication"
          guides={readyGuides(issued.guides)}
          completed={issued.guideCompletions.map((c) => c.guide)}
          language={issued.language}
        />
      </div>
      <CheckWithStaff />
    </>
  );
}
