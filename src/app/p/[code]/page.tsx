import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { hasDemoSession, isOpenableCode } from '@/lib/demo-patient';

import { EntryText } from '../entry-text';
import { PatientEntryForm } from '../patient-entry-form';
import { CallButton, Loading } from '../ui';

export default function BirthDatePage({ params }: PageProps<'/p/[code]'>) {
  return (
    <>
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
// 링크의 코드가 위조·변조·만료됐으면 생년월일을 묻지 않고 "코드를 다시 확인해 주세요"를 보여 준다.
async function BirthDateStep({ code }: { code: string }) {
  if (!(await isOpenableCode(code))) {
    return (
      <div role="alert">
        <h1 className="mt-4 mb-4 text-3xl leading-snug font-bold break-keep">
          <EntryText name="badCode" />
        </h1>
        <p className="text-xl leading-relaxed break-keep text-zinc-700">
          <EntryText name="badCodeHint" />
        </p>
      </div>
    );
  }
  if (await hasDemoSession(code)) {
    redirect(`/p/${code}/home`);
  }
  return (
    <>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold break-keep">
        <EntryText name="birthOnlyTitle" />
      </h1>
      <PatientEntryForm code={code} />
    </>
  );
}
