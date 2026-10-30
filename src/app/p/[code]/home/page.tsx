import { hospital } from '@/lib/demo-guide';
import { requireDemoPatient } from '@/lib/demo-patient';
import { designTexts } from '@/lib/design-screen-texts';
import { guideCatalog, guideKinds } from '@/lib/guide-catalog';
import { homeTexts } from '@/lib/home-texts';

import { T } from '../../../translated';
import { DesignTopBar, TealTtobagi, WideFrame } from '../../screen-design';
import { CheckWithStaff } from '../../ui';
import { PatientPage } from '../patient-page';
import { GuideList } from './guide-list';

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

async function PatientHome({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  // 화면 순서는 안내 목록 순서를 따른다.
  const guides = guideKinds.filter((kind) => issued.guides.includes(kind));

  // 휴대폰은 한 줄, PC는 왼쪽 또박이 · 오른쪽 진행 막대와 카드 2×2.
  return (
    <WideFrame>
      <DesignTopBar code={code} back={{ href: '/' }} showHome={false} />
      <p className="text-xl text-zinc-700">
        <T>{hospital.name}</T>
      </p>
      <h1 className="sr-only">
        <T>{homeTexts.greeting}</T>
      </h1>
      <div className="mt-3 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <div className="sd-big-col">
          <TealTtobagi
            pose="hello"
            message={designTexts.guidesCame(guides.length)}
          />
        </div>
        <div>
          <GuideList
            code={code}
            language={issued.language}
            completed={issued.guideCompletions.map((c) => c.guide)}
            items={guides.map((kind) => {
              const guide = guideCatalog[kind];
              return {
                kind,
                href: guideHref(code, kind),
                name: guide.patientName ?? guide.name,
                hint: guide.hint,
                icon: guide.icon,
                notReady: guide.ready ? undefined : homeTexts.notReady,
              };
            })}
          />
        </div>
      </div>
      <CheckWithStaff />
    </WideFrame>
  );
}
