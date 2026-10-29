import { notFound } from 'next/navigation';

import { requireDemoPatient } from '@/lib/demo-patient';

import { Ttobagi } from '../../../ttobagi';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';
import { MedicationCheck } from './medication-check';

// 복용약·영양제 안내(틀만). 나이대와 상관없이 항상 전체 목록을 보여 준다.
export default function MedicationPage({
  params,
}: PageProps<'/p/[code]/medication'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <Medication code={code} />}
    />
  );
}

async function Medication({ code }: { code: string }) {
  const issued = await requireDemoPatient(code);
  if (!issued.guides.includes('medication')) notFound();

  return (
    <>
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
        복용약·영양제 안내
      </h1>
      <Ttobagi pose="explain" message="드시는 약에 체크해 주세요." />
      <MedicationCheck
        code={code}
        initial={issued.medicationCheck?.medications ?? []}
      />
      <CheckWithStaff />
    </>
  );
}
