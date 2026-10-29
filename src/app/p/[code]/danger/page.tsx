import { demoGuide } from '@/lib/demo-guide';

import { BackLink, CallButton } from '../../ui';
import { PatientPage } from '../patient-page';

export default function DangerPage({ params }: PageProps<'/p/[code]/danger'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <BackLink href={`/p/${code}/home`}>홈</BackLink>
          <h1 className="mt-4 text-3xl leading-snug font-bold text-red-700">
            🚨 이럴 땐
            <br />
            바로 병원에 오세요
          </h1>
          <ul className="mt-6 flex list-disc flex-col gap-2 rounded-2xl bg-red-50 py-5 pr-5 pl-10">
            {demoGuide.dangerSigns.map((sign) => (
              <li key={sign} className="text-2xl leading-relaxed">
                {sign}
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
