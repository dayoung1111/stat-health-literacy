import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { hasDemoSession } from '@/lib/demo-patient';

import { EntryText } from '../entry-text';
import { PatientEntryForm } from '../patient-entry-form';
import { CallButton, Loading } from '../ui';

export default function BirthDatePage({ params }: PageProps<'/p/[code]'>) {
  return (
    <>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold break-keep">
        <EntryText name="birthOnlyTitle" />
      </h1>
      <Suspense fallback={<Loading />}>
        {params.then(({ code }) => (
          <BirthDateStep code={code} />
        ))}
      </Suspense>
      <div className="mt-6 flex flex-col gap-4">
        <CallButton variant="outline">
          <EntryText name="callHelp" />
        </CallButton>
        <Link
          href="/p"
          className="py-2 text-center text-xl text-zinc-600 underline underline-offset-4"
        >
          <EntryText name="typeCode" />
        </Link>
      </div>
    </>
  );
}

// 7일 안에 다시 오면 생년월일 없이 바로 홈으로 보낸다.
async function BirthDateStep({ code }: { code: string }) {
  if (await hasDemoSession(code)) {
    redirect(`/p/${code}/home`);
  }
  return <PatientEntryForm code={code} />;
}
