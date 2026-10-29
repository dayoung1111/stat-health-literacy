import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { hasDemoSession } from '@/lib/demo-patient';

import { PatientEntryForm } from '../patient-entry-form';
import { CallButton, Loading } from '../ui';

export default function BirthDatePage({ params }: PageProps<'/p/[code]'>) {
  return (
    <>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold break-keep">
        안녕하세요 👋
        <br />
        본인 확인을 위해
        <br />
        생년월일 6자리를 넣어 주세요
      </h1>
      <Suspense fallback={<Loading />}>
        {params.then(({ code }) => (
          <BirthDateStep code={code} />
        ))}
      </Suspense>
      <div className="mt-6 flex flex-col gap-4">
        <CallButton variant="outline">📞 잘 안 되면 병원에 전화</CallButton>
        <Link
          href="/p"
          className="py-2 text-center text-lg text-zinc-600 underline underline-offset-4"
        >
          교육 번호를 직접 넣을게요
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
