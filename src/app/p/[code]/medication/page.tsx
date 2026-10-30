import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { readyGuides } from '@/lib/guide-progress';
import { verdictLabels, type Verdict } from '@/lib/medication-guide';

import { screenTexts } from '@/lib/screen-texts';

import { LabeledBox, T } from '../../../translated';
import { GuideBoard } from '../../guide-board';
import { DesignTopBar } from '../../screen-design';
import { CheckWithStaff } from '../../ui';
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
      {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 약 내용(왼쪽)과 받은 안내(오른쪽)를 한 덩어리로 묶어
          틀 밖으로 넓힌다. 두 칸이 붙어 보이도록 전체 너비는 약 내용 칸 + 받은 안내 칸 정도로만 넓힌다. */}
      <div className="relative left-1/2 w-[min(calc(100vw-2rem),900px)] -translate-x-1/2">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {/* 위쪽 버튼 줄도 약 내용 칸과 같은 폭이다. */}
            <DesignTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
            {/* 판정 그림 기준. 약 카드를 가리지 않도록 따라다니지 않고 맨 위에 둔다. */}
            <LabeledBox
              label={screenTexts.common.verdictKey}
              role="note"
              className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stat-mint py-2 text-xl"
            >
              {(['ok', 'stop', 'ask'] as Verdict[]).map((v) => (
                <span key={v} className="flex items-center gap-1">
                  <VerdictMark verdict={v} className="size-7" />
                  <T>{verdictLabels[v]}</T>
                </span>
              ))}
            </LabeledBox>
            <MedicationFlow
              code={code}
              saved={issued.medicationCheck?.medications ?? null}
              stopDate={stopDate(issued.bloodThinnerStopDate)}
              language={issued.language}
              guides={guides}
              completed={completed}
            />
          </div>
          {/* 휴대폰에서는 내용 아래, PC에서는 오른쪽 칸 맨 위(위쪽 버튼 줄과 같은 높이) */}
          <aside className="flex flex-col gap-4">
            <GuideBoard
              code={code}
              current="medication"
              guides={guides}
              completed={completed}
              language={issued.language}
            />
          </aside>
        </div>
      </div>
      <CheckWithStaff />
    </>
  );
}
