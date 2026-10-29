import { demoGuide } from '@/lib/demo-guide';

import { T } from '../../../language';
import { PhotoLesson } from '../../ttobak/photo-lesson-player';
import { allLessons } from '../../ttobak/photo-lesson';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 또박이 선생님 사진 수업. 수업 목록: 검진 전날 준비(basic-checkup-guide.ts) → 대장내시경 1·2교시(demo-guide.ts).
// 주소의 ?lesson=수업아이디 로 처음 보여 줄 수업을 고른다(없으면 맨 앞 수업).
export default function VideoPage({
  params,
  searchParams,
}: PageProps<'/p/[code]/video'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          <Lessons lesson={searchParams.then((query) => query.lesson)} />
          <CheckWithStaff />
        </>
      )}
    />
  );
}

async function Lessons({
  lesson: lessonParam,
}: {
  lesson: Promise<string | string[] | undefined>;
}) {
  const wanted = await lessonParam;
  const start = Math.max(
    0,
    allLessons.findIndex((lesson) => lesson.id === wanted),
  );
  const colonoscopy = allLessons[start].group === 'colonoscopy';

  return (
    // 환자 화면 틀은 휴대폰 너비라서, PC에서는 영상과 수업 목록이 넓게 보이도록 틀 밖으로 넓힌다.
    <div className="relative left-1/2 w-[min(calc(100vw-2rem),1280px)] -translate-x-1/2">
      <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
        <T id="video.title" />
        <span className="ml-3 text-xl font-normal text-zinc-600">
          {colonoscopy ? (
            <T
              id="video.examPrep"
              vars={{ exam: { source: demoGuide.examName } }}
            />
          ) : (
            <T id="video.basic" />
          )}
        </span>
      </h1>
      <PhotoLesson key={start} lessons={allLessons} startLesson={start} />
    </div>
  );
}
