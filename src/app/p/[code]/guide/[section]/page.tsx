import Link from 'next/link';
import { notFound } from 'next/navigation';

import { guideSteps } from '@/lib/demo-guide';

import { PictureRow } from '../../../pictures';
import { buttonClass, CheckWithStaff, PatientTopBar } from '../../../ui';
import { PatientPage } from '../../patient-page';

// 안내문을 한 화면에 내용 하나씩 보여 준다. 주소의 [section]은 몇 번째 화면인지(1부터).
export default function GuidePage({
  params,
}: PageProps<'/p/[code]/guide/[section]'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <GuideStep code={code} step={params.then((p) => p.section)} />
      )}
    />
  );
}

async function GuideStep({
  code,
  step: stepParam,
}: {
  code: string;
  step: Promise<string>;
}) {
  const number = Number(await stepParam);
  const step = guideSteps[number - 1];
  if (!Number.isInteger(number) || !step) notFound();

  const total = guideSteps.length;

  return (
    // 아래 고정 막대에 마지막 내용이 가리지 않도록 아래 여백을 둔다.
    <div className="pb-48">
      <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
      {number === 1 && (
        <p className="mb-3 text-2xl font-bold">같이 볼까요? 🙂</p>
      )}
      <p className="inline-block rounded-full bg-sky-100 px-4 py-1 text-xl font-bold text-sky-900">
        {step.sectionNo}. {step.sectionTitle}
      </p>

      <section className="mt-4 rounded-3xl bg-sky-50 p-6">
        <PictureRow pictures={step.pictures} />
        <div className="mt-6 border-t-2 border-dashed border-sky-200 pt-5">
          {step.lines.map((line) => (
            <p key={line} className="text-2xl leading-relaxed break-keep">
              {line}
            </p>
          ))}
          {step.term && (
            <p className="mt-2 text-xl text-zinc-600">({step.term})</p>
          )}
        </div>
      </section>

      <Link
        href={`/p/${code}/guide/${number}/${step.id}`}
        className="mt-5 flex min-h-16 items-center justify-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 px-6 text-2xl font-bold text-amber-900 hover:bg-amber-100 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
      >
        🤔 헷갈려요
      </Link>
      <CheckWithStaff />

      <nav
        aria-label="안내문 넘기기"
        className="fixed inset-x-0 bottom-0 rounded-t-3xl border-t border-amber-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        <div className="mx-auto max-w-md">
          <p className="flex items-center justify-center gap-3 text-xl font-bold">
            <span aria-hidden="true" className="tracking-wider text-blue-700">
              {guideSteps.map((_, i) => (i < number ? '●' : '○')).join(' ')}
            </span>
            <span>
              <span className="sr-only">안내문 {total}개 중 </span>
              {number} / {total}
            </span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {number > 1 ? (
              <Link
                href={`/p/${code}/guide/${number - 1}`}
                className={buttonClass.outline}
              >
                ◀ 이전
              </Link>
            ) : (
              <span aria-disabled="true" className={buttonClass.disabled}>
                ◀ 이전
              </span>
            )}
            <Link
              href={
                number < total
                  ? `/p/${code}/guide/${number + 1}`
                  : `/p/${code}/check`
              }
              className={buttonClass.primary}
            >
              {number < total ? '다음 ▶' : '이해 확인 ▶'}
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
