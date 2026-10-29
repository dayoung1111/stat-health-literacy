import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';

import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';
import { DayBeforeFrame } from './day-before-frame';

// 건강검진 기본 확인사항: 또박이 "검진 전날 준비" 수업.
// 수업은 public/lessons/day-before.html 한 파일이고, 앱 화면 안에 액자(iframe)로 넣는다.
export default function DayBeforePage({
  params,
}: PageProps<'/p/[code]/day-before'>) {
  return (
    <PatientPage params={params} render={(code) => <DayBefore code={code} />} />
  );
}

async function DayBefore({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('checkup')) notFound();

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 수업이 넓게 보이도록 틀 밖으로 넓힌다(영상 수업과 같음). */}
      <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
        <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
          검진 전날 준비
        </h1>
        <DayBeforeFrame code={code} language={issued.language} />
      </div>
      <CheckWithStaff />
    </>
  );
}
