import Link from 'next/link';

import { hospital } from '@/lib/demo-guide';
import { requireDemoPatient } from '@/lib/demo-patient';
import { guideCatalog, guideKinds } from '@/lib/guide-catalog';

import { GuideIconSvg } from '../../../guide-icon';
import { Labeled, Source, T } from '../../../language';
import { Ttobagi } from '../../../ttobagi';
import { dayBeforeLessons } from '../../ttobak/photo-lesson';
import { ButtonLink, CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 환자 홈: 의료진이 코드 하나에 묶어 보낸 안내를 큰 카드로 보여 준다.
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

// 안내마다 들어갈 화면. 내용이 아직 없으면 "준비 중" 화면으로 간다.
const guideHref = (code: string, kind: (typeof guideKinds)[number]) => {
  if (kind === 'colonoscopy') return `/p/${code}/colonoscopy`;
  if (kind === 'medication') return `/p/${code}/medication`;
  return `/p/${code}/preparing/${kind}`;
};

const cardColor: Record<(typeof guideKinds)[number], string> = {
  checkup: 'bg-stat-sun text-stat-ink',
  colonoscopy: 'bg-stat-mint text-stat-green',
  gastroscopy: 'bg-stat-mint text-stat-green',
  medication: 'bg-white text-stat-ink border-2 border-stat-green',
};

async function PatientHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  // 화면 순서는 안내 목록 순서를 따른다.
  const guides = guideKinds.filter((kind) => issued.guides.includes(kind));

  return (
    <>
      <PatientTopBar code={code} back={{ href: '/' }} showHome={false} />
      <p className="text-xl text-zinc-700">
        <Source text={hospital.name} />
      </p>
      <h1 className="mt-2 mb-4 text-3xl leading-snug font-bold break-keep">
        <T id="home.hello" />
      </h1>
      <Ttobagi
        pose="hello"
        message={{ id: 'home.guideCount', vars: { count: guides.length } }}
      />

      <Labeled label="home.guides" className="mt-6 flex flex-col gap-4">
        {guides.map((kind) => {
          const guide = guideCatalog[kind];
          return (
            <Link
              key={kind}
              href={guideHref(code, kind)}
              className={`flex min-h-28 items-center gap-5 rounded-3xl px-6 py-5 shadow-sm focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green ${cardColor[kind]}`}
            >
              <GuideIconSvg name={guide.icon} className="size-14 shrink-0" />
              <span className="flex flex-col gap-1">
                <span className="text-2xl font-bold break-keep">
                  <Source text={guide.patientName ?? guide.name} />
                </span>
                {guide.hint && (
                  <span className="text-xl break-keep text-zinc-700">
                    <Source text={guide.hint} />
                  </span>
                )}
                {!guide.ready && (
                  <span className="text-xl text-zinc-600">
                    <T id="home.preparing" />
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="ml-auto text-3xl">
                ›
              </span>
            </Link>
          );
        })}
      </Labeled>
      {/* 기본 검진 "검진 전날 준비" 또박이 수업 */}
      <div className="mt-6">
        <ButtonLink
          href={`/p/${code}/video?lesson=${dayBeforeLessons[0].id}`}
          variant="outline"
        >
          <T id="home.dayBefore" />
        </ButtonLink>
      </div>
      <CheckWithStaff />
    </>
  );
}
