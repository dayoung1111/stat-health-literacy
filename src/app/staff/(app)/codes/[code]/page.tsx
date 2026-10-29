import { notFound } from 'next/navigation';

import { getMyCode, type QuestionResult } from '@/lib/demo-staff';

import { Panel, StaffBack } from '../../../ui';
import { StaffPage } from '../../../staff-page';

const resultLabel: Record<
  QuestionResult['result'],
  { text: string; className: string }
> = {
  correct: { text: '✓ 맞힘', className: 'text-green-700' },
  'retry-correct': { text: '✓ 다시 설명 후 맞힘', className: 'text-green-700' },
  wrong: { text: '✕ 틀림', className: 'text-red-700' },
};

// ⑥ 코드 상세: 틀린 부분만 재교육한다. 다른 간호사의 코드는 "페이지 없음"으로 막는다.
export default function CodeDetailPage({
  params,
}: PageProps<'/staff/codes/[code]'>) {
  return (
    <StaffPage>
      {params.then(({ code }) => (
        <CodeDetail code={code} />
      ))}
    </StaffPage>
  );
}

async function CodeDetail({ code }: { code: string }) {
  const item = await getMyCode(code);
  if (!item) notFound();

  return (
    <>
      <StaffBack fallback="/staff/codes" />
      <Panel title={`⑥ ${item.code} · ${item.exam} · ${item.setting}`}>
        {item.relearn ? (
          <div className="rounded-lg bg-red-50 px-5 py-4 text-lg leading-relaxed">
            <p>
              <strong className="text-red-700">재교육 필요:</strong>{' '}
              {item.relearn}
            </p>
            {item.confused && <p>「헷갈려요」 누른 곳: {item.confused}</p>}
          </div>
        ) : (
          <p className="rounded-lg bg-green-50 px-5 py-4 text-lg font-bold text-green-800">
            이해 완료 · 재교육 필요 없음
          </p>
        )}
        <table className="mt-6 w-full text-left text-lg">
          <thead className="sr-only">
            <tr>
              <th>질문</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {item.results.map((r) => (
              <tr key={r.question} className="border-b border-zinc-200">
                <td className="px-2 py-3">{r.question}</td>
                <td
                  className={`px-2 py-3 font-bold ${resultLabel[r.result].className}`}
                >
                  {resultLabel[r.result].text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
