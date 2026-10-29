import { demoGuide } from '@/lib/demo-guide';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { Source, T } from '../../../language';
import { Ttobagi } from '../../../ttobagi';

import { CallButton, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

export default function DangerPage({ params }: PageProps<'/p/[code]/danger'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          <h1 className="sr-only">
            <T id="danger.title" />
          </h1>
          <Ttobagi pose="stop" message={ttobagiSays.danger} />
          <ul className="mt-2 grid grid-cols-2 gap-3">
            {demoGuide.dangerSigns.map((sign) => (
              <li
                key={sign.text}
                className="flex flex-col items-center gap-2 rounded-3xl bg-stat-alert-soft p-4 text-center"
              >
                <span aria-hidden="true" className="text-6xl">
                  {sign.emoji}
                </span>
                <span className="text-xl leading-snug font-bold break-keep">
                  <Source text={sign.text} />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <CallButton />
          </div>
        </>
      )}
    />
  );
}
