import { demoGuide } from '@/lib/demo-guide';

import { CallButton, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

export default function DangerPage({ params }: PageProps<'/p/[code]/danger'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          <h1 className="text-3xl leading-snug font-bold text-red-700">
            🚨 이럴 땐 참지 마시고
            <br />
            바로 병원에 전화하세요
          </h1>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {demoGuide.dangerSigns.map((sign) => (
              <li
                key={sign.text}
                className="flex flex-col items-center gap-2 rounded-3xl bg-red-50 p-4 text-center"
              >
                <span aria-hidden="true" className="text-6xl">
                  {sign.emoji}
                </span>
                <span className="text-xl leading-snug font-bold break-keep">
                  {sign.text}
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
