import Link from 'next/link';
import { notFound } from 'next/navigation';

import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule, requireDemoPatient } from '@/lib/demo-patient';
import { homeTexts } from '@/lib/home-texts';
import { screenTexts } from '@/lib/screen-texts';

import { LocalDate, T, TranslatedTtobagi } from '../../../translated';
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
  const texts = screenTexts.colonoscopy;
  if (daysLeft > 1) return texts.daysLeft(daysLeft);
  if (daysLeft === 1) return texts.tomorrow;
  if (daysLeft === 0) return texts.today;
  return texts.done;
}

const menuClass =
  'flex min-h-20 items-center gap-4 rounded-3xl px-6 text-2xl font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green';

async function ColonoscopyHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('colonoscopy')) notFound();
  const { examDate, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      <p className="text-xl text-zinc-700">
        <T>{hospital.name}</T> · <T>{demoGuide.examName}</T> ·{' '}
        <LocalDate date={examDate} />
      </p>
      <h1 className="mt-2 text-3xl leading-snug font-bold break-keep">
        <T>{homeTexts.greeting}</T>
        <br />
        <T>{greeting(daysLeft)}</T>
      </h1>

      <div className="mt-5">
        <TranslatedTtobagi pose="time" message={todo.speech} />
      </div>

      <nav aria-label="환자 메뉴" className="mt-2 flex flex-col gap-4">
        <Link
          href={`/p/${code}/video`}
          className={`${menuClass} min-h-28 bg-stat-green text-3xl text-white`}
        >
          <span aria-hidden="true" className="text-5xl">
            🎬
          </span>
          <T>{screenTexts.colonoscopy.video}</T>
        </Link>
        <Link
          href={`/p/${code}/guide/1`}
          className={`${menuClass} bg-stat-mint text-stat-green`}
        >
          <span aria-hidden="true" className="text-4xl">
            📖
          </span>
          <T>{screenTexts.colonoscopy.guide}</T>
        </Link>
        <Link
          href={`/p/${code}/check`}
          className={`${menuClass} bg-stat-sun text-stat-ink`}
        >
          <span aria-hidden="true" className="text-4xl">
            ✅
          </span>
          <T>{screenTexts.colonoscopy.check}</T>
        </Link>
        <Link
          href={`/p/${code}/danger`}
          className={`${menuClass} bg-stat-alert-soft text-stat-alert`}
        >
          <span aria-hidden="true" className="text-4xl">
            🚨
          </span>
          <T>{screenTexts.colonoscopy.danger}</T>
        </Link>
      </nav>
      <CheckWithStaff />
    </>
  );
}
