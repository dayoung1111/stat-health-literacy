import Link from 'next/link';

import { hospital } from '@/lib/demo-guide';
import { requireDemoPatient } from '@/lib/demo-patient';
import { guideCatalog, guideKinds } from '@/lib/guide-catalog';
import { homeTexts } from '@/lib/home-texts';

import { GuideIconSvg } from '../../../guide-icon';
import { T, TranslatedTtobagi } from '../../../translated';
import { CheckWithStaff, PatientTopBar } from '../../ui';
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
  if (kind === 'checkup') return `/p/${code}/day-before`;
  if (kind === 'gastroscopy') return `/p/${code}/gastroscopy`;
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
        <T>{hospital.name}</T>
      </p>
      <h1 className="mt-2 mb-4 text-3xl leading-snug font-bold break-keep">
        <T>{homeTexts.greeting}</T>
      </h1>
      <TranslatedTtobagi
        pose="hello"
        message={homeTexts.guidesCame(guides.length)}
      />

      <nav aria-label="받은 안내" className="mt-6 flex flex-col gap-4">
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
                  <T>{guide.patientName ?? guide.name}</T>
                </span>
                {guide.hint && (
                  <span className="text-xl break-keep text-zinc-700">
                    <T>{guide.hint}</T>
                  </span>
                )}
                {!guide.ready && (
                  <span className="text-xl text-zinc-600">
                    <T>{homeTexts.notReady}</T>
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="ml-auto text-3xl">
                ›
              </span>
            </Link>
          );
        })}
      </nav>
      <CheckWithStaff />
    </>
  );
}
