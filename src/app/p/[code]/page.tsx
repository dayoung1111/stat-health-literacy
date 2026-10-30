import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { isCodeShape } from '@/lib/code-shape';
import { hasDemoSession, isOpenableCode } from '@/lib/demo-patient';
import { findActiveCode } from '@/lib/education-store';

import { EntryText, EntryTtobagi } from '../entry-text';
import { ReportOnce } from '../error-report';
import { PatientEntryForm } from '../patient-entry-form';
import { WideFrame } from '../screen-design';
import { CallButton, Loading } from '../ui';

export default function BirthDatePage({ params }: PageProps<'/p/[code]'>) {
  return (
    <WideFrame>
      <Suspense fallback={<Loading />}>
        {params.then(({ code }) => (
          <BirthDateStep code={code} />
        ))}
      </Suspense>
      <Suspense fallback={<EntryLinks />}>
        {params.then(async ({ code }) => (
          <EntryLinks language={await issuedLanguage(code)} />
        ))}
      </Suspense>
    </WideFrame>
  );
}

// 간호사가 코드를 발급할 때 고른 언어. 없는 코드·만료 코드는 한국어로 둔다.
async function issuedLanguage(code: string) {
  return (isCodeShape(code) && (await findActiveCode(code))?.language) || 'ko';
}

function EntryLinks({ language }: { language?: string }) {
  return (
    <div className="mt-6 flex flex-col gap-4 lg:ml-auto lg:w-1/2 lg:pl-3">
      <CallButton variant="outline">
        <EntryText name="callHelp" language={language} />
      </CallButton>
      <Link
        href="/p"
        className="py-2 text-center text-xl text-zinc-600 underline underline-offset-4"
      >
        <EntryText name="typeCode" language={language} />
      </Link>
    </div>
  );
}

// 7일 안에 다시 오면 생년월일 없이 바로 홈으로 보낸다.
// 링크의 코드가 위조·변조·만료됐으면 생년월일을 묻지 않고 "코드를 다시 확인해 주세요"를 보여 준다.
async function BirthDateStep({ code }: { code: string }) {
  if (!(await isOpenableCode(code))) {
    return (
      <div role="alert">
        <ReportOnce kind="code-expired" />
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
  const language = await issuedLanguage(code);
  // 휴대폰은 한 줄, PC는 왼쪽 또박이 · 오른쪽 입력 카드.
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <EntryTtobagi birthOnly language={language} />
      <div>
        <h1 className="sr-only">
          <EntryText name="birthOnlyTitle" language={language} />
        </h1>
        <PatientEntryForm code={code} language={language} />
      </div>
    </div>
  );
}
