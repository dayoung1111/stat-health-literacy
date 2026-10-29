import { demoGuide } from '@/lib/demo-guide';

import { T } from '../../../language';
import { PhotoLesson } from '../../ttobak/photo-lesson-player';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 또박이 선생님 사진 수업. 내용은 안내문·티치백과 같은 demo-guide.ts를 쓴다.
export default function VideoPage({ params }: PageProps<'/p/[code]/video'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          {/* 환자 화면 틀은 휴대폰 너비라서, PC에서는 영상과 수업 목록이 넓게 보이도록 틀 밖으로 넓힌다. */}
          <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
            <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
              <T id="video.title" />
              <span className="ml-3 text-xl font-normal text-zinc-600">
                <T
                  id="video.examPrep"
                  vars={{ exam: { source: demoGuide.examName } }}
                />
              </span>
            </h1>
            <PhotoLesson />
          </div>
          <CheckWithStaff />
        </>
      )}
    />
  );
}
