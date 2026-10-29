import Link from 'next/link';
import { notFound } from 'next/navigation';

import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule, requireDemoPatient } from '@/lib/demo-patient';

import { Ttobagi } from '../../../ttobagi';
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

function greeting(daysLeft: number) {
  if (daysLeft > 1) return `검사까지 ${daysLeft}일 남았어요`;
  if (daysLeft === 1) return '내일이 검사 날이에요';
  if (daysLeft === 0) return '오늘이 검사 날이에요';
  return '검사 잘 받으셨어요';
}

const menuClass =
  'flex min-h-20 items-center gap-4 rounded-3xl px-6 text-2xl font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green';

async function ColonoscopyHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('colonoscopy')) notFound();
  const { examLabel, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
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

      <nav aria-label="환자 메뉴" className="mt-2 flex flex-col gap-4">
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
