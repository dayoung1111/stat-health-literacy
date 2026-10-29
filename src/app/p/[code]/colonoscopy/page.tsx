import Link from 'next/link';
import { notFound } from 'next/navigation';

import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule, requireDemoPatient } from '@/lib/demo-patient';

import { ByLang, Labeled, Source, T } from '../../../language';
import { Ttobagi } from '../../../ttobagi';
import { PictureRow } from '../../pictures';
import { photoLessons } from '../../ttobak/photo-lesson';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 대장내시경 안내 첫 화면(환자 홈의 "대장내시경" 카드). 팀장님이 만든 이전 환자 홈 내용을 그대로 옮겼다.
export default function ColonoscopyPage({
  params,
}: PageProps<'/p/[code]/colonoscopy'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <ColonoscopyHome code={code} />}
    />
  );
}

function Greeting({ daysLeft }: { daysLeft: number }) {
  if (daysLeft > 1) return <T id="colon.daysLeft" vars={{ days: daysLeft }} />;
  if (daysLeft === 1) return <T id="colon.tomorrow" />;
  if (daysLeft === 0) return <T id="colon.today" />;
  return <T id="colon.after" />;
}

const menuClass =
  'flex min-h-20 items-center gap-4 rounded-3xl px-6 text-2xl font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green';

async function ColonoscopyHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('colonoscopy')) notFound();
  const { examLabel, examLabelEn, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      <p className="text-xl text-zinc-700">
        <Source text={hospital.name} /> · <Source text={demoGuide.examName} /> ·{' '}
        <ByLang ko={examLabel} en={examLabelEn} />
      </p>
      <h1 className="mt-2 text-3xl leading-snug font-bold break-keep">
        <T id="home.hello" />
        <br />
        <Greeting daysLeft={daysLeft} />
      </h1>

      <div className="mt-5">
        <Ttobagi pose="time" message={{ source: todo.speech }} />
      </div>
      <section
        aria-labelledby="todo-title"
        className="mt-2 rounded-3xl bg-stat-sun p-6"
      >
        <h2 id="todo-title" className="text-xl font-bold text-stat-ink">
          <span aria-hidden="true">⏰ </span>
          <T id="colon.todo" />
        </h2>
        <p className="mt-1 text-3xl font-bold">
          <Source text={todo.title} />
        </p>
        <div className="mt-5">
          <PictureRow pictures={todo.pictures} />
        </div>
        <p className="mt-5 text-center text-xl">
          <Source text={todo.line} />
        </p>
      </section>

      <Labeled label="colon.menu" className="mt-8 flex flex-col gap-4">
        <Link
          href={`/p/${code}/video?lesson=${photoLessons[0].id}`}
          className={`${menuClass} min-h-28 bg-stat-green text-3xl text-white`}
        >
          <span aria-hidden="true" className="text-5xl">
            🎬
          </span>
          <T id="colon.video" />
        </Link>
        <Link
          href={`/p/${code}/guide/1`}
          className={`${menuClass} bg-stat-mint text-stat-green`}
        >
          <span aria-hidden="true" className="text-4xl">
            📖
          </span>
          <T id="colon.guide" />
        </Link>
        <Link
          href={`/p/${code}/check`}
          className={`${menuClass} bg-stat-sun text-stat-ink`}
        >
          <span aria-hidden="true" className="text-4xl">
            ✅
          </span>
          <T id="colon.check" />
        </Link>
        <Link
          href={`/p/${code}/danger`}
          className={`${menuClass} bg-stat-alert-soft text-stat-alert`}
        >
          <span aria-hidden="true" className="text-4xl">
            🚨
          </span>
          <T id="colon.danger" />
        </Link>
      </Labeled>
      <CheckWithStaff />
    </>
  );
}
