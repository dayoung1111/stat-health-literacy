import { demoGuide } from '@/lib/demo-guide';

import { BackLink } from '../../ui';
import { PatientPage } from '../patient-page';
import { Teachback } from './teachback';

export default function CheckPage({ params }: PageProps<'/p/[code]/check'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <BackLink href={`/p/${code}/home`}>홈</BackLink>
          <div className="mt-4">
            <Teachback code={code} questions={demoGuide.questions} />
          </div>
        </>
      )}
    />
  );
}
