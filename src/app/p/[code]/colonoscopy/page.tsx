import Link from 'next/link';
import { notFound } from 'next/navigation';

import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule, requireDemoPatient } from '@/lib/demo-patient';
import { screenTexts } from '@/lib/screen-texts';
import { designTexts } from '@/lib/design-screen-texts';

import { LabeledBox, LocalDate, T } from '../../../translated';
import {
  DesignTopBar,
  LineIcon,
  TealTtobagi,
  WideFrame,
  type LineIconName,
} from '../../screen-design';
import { CheckWithStaff } from '../../ui';
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

// 검사까지 남은 날. 검사가 지났으면 보여 주지 않는다.
function dDay(daysLeft: number) {
  if (daysLeft > 0) return `D-${daysLeft}`;
  if (daysLeft === 0) return 'D-DAY';
  return null;
}

const cardClass =
  'sd-card flex min-h-20 items-center gap-4 px-5 py-4 text-2xl font-bold';

// 아래 카드 3개. 가는 곳은 이전 메뉴와 같다.
const menus: {
  href: (code: string) => string;
  icon: LineIconName;
  text: string;
  danger?: boolean;
}[] = [
  {
    href: (code) => `/p/${code}/guide/1`,
    icon: 'book',
    text: screenTexts.colonoscopy.guide,
  },
  {
    href: (code) => `/p/${code}/check`,
    icon: 'check',
    text: screenTexts.colonoscopy.check,
  },
  {
    href: (code) => `/p/${code}/danger`,
    icon: 'alert',
    text: screenTexts.colonoscopy.danger,
    danger: true,
  },
];

async function ColonoscopyHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('colonoscopy')) notFound();
  const { examDate, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);
  const dLabel = dDay(daysLeft);

  // 휴대폰은 한 줄(D-N → 또박이·오늘 할 일 → 수업 → 카드 3개).
  // PC는 왼쪽 D-N·수업 버튼·카드 3개, 오른쪽 또박이 말풍선과 오늘 할 일.
  return (
    <WideFrame>
      <DesignTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-x-6">
        <section className="rounded-[1.25rem] bg-[#0F6670] px-6 py-5 text-white lg:col-start-1 lg:row-start-1">
          {dLabel && <p className="text-4xl font-bold">{dLabel}</p>}
          <h1 className="mt-1 text-2xl leading-snug font-bold break-keep">
            <T>{demoGuide.examName}</T>
          </h1>
          <p className="mt-1 text-lg text-[#DCEDEE]">
            <T>{hospital.name}</T>
            {examDate && (
              <>
                {' · '}
                <LocalDate date={examDate} />
              </>
            )}
          </p>
          <p className="mt-2 text-xl font-bold break-keep">
            <T>{greeting(daysLeft)}</T>
          </p>
        </section>

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <TealTtobagi pose="time" message={todo.speech} />
          <section className="sd-card p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F6670]">
              <LineIcon name="clock" className="size-6" />
              <T>{designTexts.todayTodo}</T>
            </h2>
            <p className="mt-2 text-2xl font-bold break-keep">
              <T>{todo.title}</T>
            </p>
            <ol className="mt-3 flex flex-col gap-2">
              {todo.pictures.map((picture, i) => (
                <li
                  key={picture.label}
                  className="flex items-center gap-3 rounded-xl bg-[#F3F6F5] px-3 py-2.5 text-xl break-keep"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${picture.no ? 'bg-[#D9363E]' : 'bg-[#0F6670]'}`}
                  >
                    {i + 1}
                  </span>
                  <T>{picture.label}</T>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-lg leading-snug break-keep text-zinc-700">
              <T>{todo.line}</T>
            </p>
          </section>
        </div>

        <Link
          href={`/p/${code}/video`}
          className="sd-primary sd-focus flex min-h-28 items-center gap-4 px-6 py-5 lg:col-start-1 lg:row-start-2"
        >
          <LineIcon name="play" className="size-12 shrink-0" />
          <span className="flex flex-col">
            <span className="text-2xl font-bold break-keep">
              <T>{designTexts.lesson}</T>
            </span>
            <span className="text-lg text-[#DCEDEE]">
              <T>{designTexts.fromStart}</T>
            </span>
          </span>
        </Link>

        <LabeledBox
          as="nav"
          label={screenTexts.common.navPatientMenu}
          className="flex flex-col gap-3 lg:col-start-1 lg:row-start-3"
        >
          {menus.map((menu) => (
            <Link
              key={menu.icon}
              href={menu.href(code)}
              className={`${cardClass} ${menu.danger ? 'sd-card-danger' : 'text-[#15262B]'}`}
            >
              <LineIcon
                name={menu.icon}
                className={`size-8 shrink-0 ${menu.danger ? '' : 'text-[#0F6670]'}`}
              />
              <span className="flex-1 break-keep">
                <T>{menu.text}</T>
              </span>
              <LineIcon name="chevron" className="size-6 shrink-0 opacity-60" />
            </Link>
          ))}
        </LabeledBox>
      </div>
      <CheckWithStaff />
    </WideFrame>
  );
}
