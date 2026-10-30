import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';
import { readyGuides } from '@/lib/guide-progress';
import { screenTexts } from '@/lib/screen-texts';

import { T } from '../../../translated';

import { DesignTopBar } from '../../screen-design';
import { CheckWithStaff } from '../../ui';
import { PatientPage } from '../patient-page';
import { GastroscopyFrame } from './gastroscopy-frame';

// 위내시경: 또박이 "위내시경 준비" 수업(디자인 시안 Gastro.dc.html, 병원 안내문 확인 전 예시).
// 수업은 public/lessons/gastroscopy.html 한 파일이고, 앱 화면 안에 액자(iframe)로 넣는다.
export default function GastroscopyPage({
  params,
}: PageProps<'/p/[code]/gastroscopy'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <Gastroscopy code={code} />}
    />
  );
}

async function Gastroscopy({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('gastroscopy')) notFound();

  return (
    <>
      <DesignTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 수업이 넓게 보이도록 틀 밖으로 넓힌다(영상 수업과 같음). */}
      <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
        <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
          <T>{screenTexts.gastroscopy.title}</T>
        </h1>
        <GastroscopyFrame
          code={code}
          language={issued.language}
          guides={readyGuides(issued.guides)}
          completed={issued.guideCompletions.map((c) => c.guide)}
        />
      </div>
      <CheckWithStaff />
    </>
  );
}
