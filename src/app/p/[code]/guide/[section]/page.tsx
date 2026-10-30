import Link from 'next/link';
import { notFound } from 'next/navigation';

import { guideSteps } from '@/lib/demo-guide';
import { screenTexts } from '@/lib/screen-texts';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { LabeledBox, T, TranslatedTtobagi } from '../../../../translated';
import { PictureRow } from '../../../pictures';
import { buttonClass, CheckWithStaff, PatientTopBar } from '../../../ui';
import { PatientPage } from '../../patient-page';
import { ConfusedLink } from '../confused-link';

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
      <div className="mb-3">
        <TranslatedTtobagi
          pose="explain"
          message={ttobagiSays.explain}
          size="sm"
        />
      </div>
      <p className="inline-block rounded-full bg-stat-mint px-4 py-1 text-xl font-bold text-stat-green">
        {step.sectionNo}. <T>{step.sectionTitle}</T>
      </p>

      <section className="mt-3 rounded-3xl bg-stat-mint p-5">
        <PictureRow pictures={step.pictures} compact />
        <div className="mt-4 border-t-2 border-dashed border-stat-green/30 pt-4">
          {step.lines.map((line) => (
            <p key={line} className="text-2xl leading-relaxed break-keep">
              <T>{line}</T>
            </p>
          ))}
          {step.term && (
            <p className="mt-2 text-xl text-zinc-600">
              (<T>{step.term}</T>)
            </p>
          )}
        </div>
      </section>

      <ConfusedLink
        code={code}
        paragraphId={step.id}
        href={`/p/${code}/guide/${number}/${step.id}`}
        className="mt-5 flex min-h-16 items-center justify-center gap-2 rounded-full border-2 border-stat-blush bg-stat-sun px-6 text-2xl font-bold text-stat-ink hover:bg-stat-sun focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green"
      >
        🤔 <T>{screenTexts.guide.confused}</T>
      </ConfusedLink>
      <CheckWithStaff />

      <LabeledBox
        as="nav"
        label={screenTexts.common.navGuidePager}
        className="fixed inset-x-0 bottom-0 rounded-t-3xl border-t border-stat-mint bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        <div className="mx-auto max-w-md">
          <p className="flex items-center justify-center gap-3 text-xl font-bold">
            <span aria-hidden="true" className="tracking-wider text-stat-green">
              {guideSteps.map((_, i) => (i < number ? '●' : '○')).join(' ')}
            </span>
            <span>
              <span className="sr-only">
                <T>{screenTexts.guide.count(total)}</T>
              </span>
              {number} / {total}
            </span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {number > 1 ? (
              <Link
                href={`/p/${code}/guide/${number - 1}`}
                className={buttonClass.outline}
              >
                ◀ <T>{screenTexts.guide.previous}</T>
              </Link>
            ) : (
              <span aria-disabled="true" className={buttonClass.disabled}>
                ◀ <T>{screenTexts.guide.previous}</T>
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
              {number < total ? (
                <T>{screenTexts.guide.next}</T>
              ) : (
                <T>{screenTexts.guide.toCheck}</T>
              )}{' '}
              ▶
            </Link>
          </div>
        </div>
      </LabeledBox>
    </div>
  );
}
