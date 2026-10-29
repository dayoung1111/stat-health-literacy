import Link from 'next/link';
import { notFound } from 'next/navigation';

import { demoGuide } from '@/lib/demo-guide';

import { BackLink, CheckWithStaff } from '../../../ui';
import { PatientPage } from '../../patient-page';

export default function GuidePage({
  params,
}: PageProps<'/p/[code]/guide/[section]'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <GuideSection code={code} section={params.then((p) => p.section)} />
      )}
    />
  );
}

async function GuideSection({
  code,
  section: sectionParam,
}: {
  code: string;
  section: Promise<string>;
}) {
  const number = Number(await sectionParam);
  const sections = demoGuide.sections;
  const section = sections[number - 1];
  if (!Number.isInteger(number) || !section) notFound();

  const prev = sections[number - 2];
  const next = sections[number];

  return (
    <>
      <BackLink href={`/p/${code}/home`}>홈</BackLink>
      <p className="mt-4 text-lg text-zinc-600">
        {demoGuide.examName} 안내 {number} / {sections.length}
      </p>
      <h1 className="mt-1 text-3xl font-bold">
        {number}. {section.title}
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {section.paragraphs.map((paragraph) => (
          <section key={paragraph.id} className="rounded-2xl bg-blue-50 p-5">
            {paragraph.lines.map((line) => (
              <p key={line} className="text-xl leading-relaxed">
                {line}
              </p>
            ))}
            {paragraph.term && (
              <p className="mt-1 text-lg text-zinc-600">({paragraph.term})</p>
            )}
            <Link
              href={`/p/${code}/guide/${number}/${paragraph.id}`}
              className="mt-3 inline-flex min-h-12 items-center rounded-full border-2 border-blue-700 bg-white px-4 text-lg font-bold text-blue-700 hover:bg-blue-100"
            >
              🤔 헷갈려요
            </Link>
          </section>
        ))}
      </div>

      <nav
        aria-label="안내문 단계 이동"
        className="mt-8 flex justify-between gap-4 text-lg"
      >
        {prev ? (
          <Link
            href={`/p/${code}/guide/${number - 1}`}
            className="py-2 underline"
          >
            ◀ {number - 1}. {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/p/${code}/guide/${number + 1}`}
            className="py-2 underline"
          >
            {number + 1}. {next.title} ▶
          </Link>
        ) : (
          <Link href={`/p/${code}/check`} className="py-2 font-bold underline">
            이해 확인하기 ▶
          </Link>
        )}
      </nav>
      <CheckWithStaff />
    </>
  );
}
