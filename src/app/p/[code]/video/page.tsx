import { demoGuide } from '@/lib/demo-guide';
import { requireDemoPatient } from '@/lib/demo-patient';
import { readyGuides } from '@/lib/guide-progress';
import { screenTexts } from '@/lib/screen-texts';

import { T } from '../../../translated';

import { PhotoLesson } from '../../ttobak/photo-lesson-player';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 또박이 선생님 대장내시경 수업(1~8교시). 내용은 안내문·티치백과 같은 demo-guide.ts를 쓴다.
export default function VideoPage({ params }: PageProps<'/p/[code]/video'>) {
  return (
    <PatientPage params={params} render={(code) => <Video code={code} />} />
  );
}

async function Video({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 영상과 수업 목록이 넓게 보이도록 틀 밖으로 넓힌다. */}
      <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
        <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
          <T>{screenTexts.video.title}</T>
          <span className="ml-3 text-xl font-normal text-zinc-600">
            <T>{demoGuide.examName}</T> <T>{screenTexts.video.prepare}</T>
          </span>
        </h1>
        <PhotoLesson
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
