import { demoGuide } from '@/lib/demo-guide';

import { PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';
import { Teachback } from './teachback';

export default function CheckPage({ params }: PageProps<'/p/[code]/check'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          <Teachback code={code} questions={demoGuide.questions} />
        </>
      )}
    />
  );
}
