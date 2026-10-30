import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { readyGuides } from '@/lib/guide-progress';
import { verdictLabels, type Verdict } from '@/lib/medication-guide';

import { T } from '../../../translated';
import { GuideBoard } from '../../guide-board';
import { LessonWithBoard } from '../../lesson-layout';
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

  const guides = readyGuides(issued.guides);
  const completed = issued.guideCompletions.map((c) => c.guide);

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 대장내시경 수업처럼 틀 밖으로 넓혀 오른쪽 칸에 받은 안내를 둔다. */}
      <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
        <LessonWithBoard
          board={
            <GuideBoard
              code={code}
              current="medication"
              guides={guides}
              completed={completed}
              language={issued.language}
            />
          }
        >
          {/* 판정 그림 기준. 약 카드를 가리지 않도록 따라다니지 않고 맨 위에 둔다. */}
          <div
            aria-label="판정 그림 뜻"
            role="note"
            className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stat-mint py-2 text-xl"
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
            guides={guides}
            completed={completed}
          />
        </LessonWithBoard>
      </div>
      <CheckWithStaff />
    </>
  );
}
