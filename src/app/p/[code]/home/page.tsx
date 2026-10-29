import Link from 'next/link';

import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule } from '@/lib/demo-patient';

import { Ttobagi } from '../../../ttobagi';
import { PictureRow } from '../../pictures';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

export default function PatientHomePage({
  params,
}: PageProps<'/p/[code]/home'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <PatientHome code={code} />}
    />
  );
}

function greeting(daysLeft: number) {
  if (daysLeft > 1) return `검사까지 ${daysLeft}일 남았어요`;
  if (daysLeft === 1) return '내일이 검사 날이에요';
  if (daysLeft === 0) return '오늘이 검사 날이에요';
  return '검사 잘 받으셨어요';
}

const menuClass =
  'flex min-h-20 items-center gap-4 rounded-3xl px-6 text-2xl font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green';

async function PatientHome({ code }: { code: string }) {
  const { examLabel, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);

  return (
    <>
      <PatientTopBar code={code} back={{ href: '/' }} showHome={false} />
      <p className="text-xl text-zinc-700">
        {hospital.name} · {demoGuide.examName} · {examLabel}
      </p>
      <h1 className="mt-2 text-3xl leading-snug font-bold break-keep">
        안녕하세요 🙂
        <br />
        {greeting(daysLeft)}
      </h1>

      <div className="mt-5">
        <Ttobagi pose="time" message={todo.speech} />
      </div>
      <section
        aria-labelledby="todo-title"
        className="mt-2 rounded-3xl bg-stat-sun p-6"
      >
        <h2 id="todo-title" className="text-xl font-bold text-stat-ink">
          <span aria-hidden="true">⏰ </span>지금 할 일
        </h2>
        <p className="mt-1 text-3xl font-bold">{todo.title}</p>
        <div className="mt-5">
          <PictureRow pictures={todo.pictures} />
        </div>
        <p className="mt-5 text-center text-xl">{todo.line}</p>
      </section>

      <nav aria-label="환자 메뉴" className="mt-8 flex flex-col gap-4">
        <Link
          href={`/p/${code}/video`}
          className={`${menuClass} min-h-28 bg-stat-green text-3xl text-white`}
        >
          <span aria-hidden="true" className="text-5xl">
            🎬
          </span>
          또박이 선생님 수업 보기
        </Link>
        <Link
          href={`/p/${code}/guide/1`}
          className={`${menuClass} bg-stat-mint text-stat-green`}
        >
          <span aria-hidden="true" className="text-4xl">
            📖
          </span>
          안내문 같이 보기
        </Link>
        <Link
          href={`/p/${code}/check`}
          className={`${menuClass} bg-stat-sun text-stat-ink`}
        >
          <span aria-hidden="true" className="text-4xl">
            ✅
          </span>
          잘 이해했는지 확인해요
        </Link>
        <Link
          href={`/p/${code}/danger`}
          className={`${menuClass} bg-stat-alert-soft text-stat-alert`}
        >
          <span aria-hidden="true" className="text-4xl">
            🚨
          </span>
          이럴 땐 바로 병원에
        </Link>
      </nav>
      <CheckWithStaff />
    </>
  );
}
