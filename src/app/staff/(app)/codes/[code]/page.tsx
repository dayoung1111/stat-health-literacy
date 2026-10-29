import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { guideSteps } from '@/lib/demo-guide';
import { requireStaff } from '@/lib/demo-staff';
import {
  findCodeForStaff,
  MAX_ATTEMPTS,
  type TeachbackOutcome,
} from '@/lib/education-store';
import { guideCatalog, guideNames } from '@/lib/guide-catalog';
import {
  medicationName,
  verdictLabels,
  findMedication,
} from '@/lib/medication-guide';
import { extraLabels, settingLabel } from '@/lib/staff-options';

import { Panel, StaffBack } from '../../../ui';
import { StaffPage } from '../../../staff-page';

const resultLabel: Record<
  TeachbackOutcome,
  { text: string; className: string }
> = {
  correct: { text: '✓ 맞힘', className: 'text-green-700' },
  retry_correct: { text: '✓ 다시 설명 후 맞힘', className: 'text-green-700' },
  wrong: { text: '✕ 틀림', className: 'text-red-700' },
};

// 한국 시간으로 "10/30 21:15"
const kstTime = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

// "헷갈려요" 문단 아이디 → 안내문 단계 이름
const paragraphTitle = (paragraphId: string) =>
  guideSteps.find((step) => step.id === paragraphId)?.sectionTitle ??
  paragraphId;

// ⑥ 코드 상세: 묶은 안내, 티치백 결과, "헷갈려요" 누른 곳, 환자가 체크한 약.
// 다른 간호사의 코드는 "페이지 없음"으로 막는다.
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
  const staff = await requireStaff();
  const item = await findCodeForStaff(staff.id, code);
  if (!item) notFound();

  // 복용약 확인 질문은 아래 "내가 먹는 약"에 약별로 따로 보여 준다.
  const teachback = item.teachbackResults.filter(
    (r) => r.guide !== 'medication',
  );
  const medQuiz = (id: string) =>
    item.teachbackResults.find(
      (r) => r.guide === 'medication' && r.question === id,
    );
  const wrong = teachback.filter((r) => r.result === 'wrong');
  const extras = extraLabels(item.extras);

  return (
    <>
      <StaffBack fallback="/staff/codes" />
      <Panel title={`⑥ ${item.code} · ${guideNames(item.guides).join(' + ')}`}>
        <dl className="grid gap-2 rounded-lg bg-zinc-50 p-4 text-base">
          <Row label="묶은 안내">{guideNames(item.guides).join(', ')}</Row>
          <Row label="설정">
            {settingLabel(item)}
            {extras.length > 0 && ` · ${extras.join(', ')}`}
          </Row>
          <Row label="검사일">{item.examDate}</Row>
          {item.guides.includes('medication') && (
            <Row label="약 중단일">
              피를 묽게 하는 약{' '}
              {item.bloodThinnerStopDate ??
                '날짜 입력 안 함(환자에게 "의사 선생님과 정한 날짜부터")'}
            </Row>
          )}
          <Row label="만료">{kstTime(item.expiresAt)}</Row>
        </dl>
        {item.lockedAt && (
          <p className="mt-4 rounded-lg bg-red-50 px-5 py-3 text-lg font-bold text-red-700">
            🔒 생년월일을 {MAX_ATTEMPTS}번 틀려 잠겼어요 (
            {kstTime(item.lockedAt)}
            ). 새 코드를 발급해 주세요.
          </p>
        )}

        <Section title="이해 확인 (티치백)">
          {teachback.length === 0 ? (
            <Empty>아직 티치백 결과가 없어요.</Empty>
          ) : (
            <>
              {wrong.length > 0 ? (
                <p className="rounded-lg bg-red-50 px-5 py-3 text-lg leading-relaxed">
                  <strong className="text-red-700">재교육 필요:</strong>{' '}
                  {wrong.map((r) => r.question).join(', ')}
                </p>
              ) : (
                <p className="rounded-lg bg-green-50 px-5 py-3 text-lg font-bold text-green-800">
                  이해 완료 · 재교육 필요 없음
                </p>
              )}
              <table className="mt-3 w-full text-left text-lg">
                <thead className="sr-only">
                  <tr>
                    <th>질문</th>
                    <th>결과</th>
                    <th>시간</th>
                  </tr>
                </thead>
                <tbody>
                  {teachback.map((r) => (
                    <tr
                      key={`${r.guide}-${r.question}`}
                      className="border-b border-zinc-200"
                    >
                      <td className="px-2 py-3">
                        <span className="text-zinc-500">
                          {guideCatalog[r.guide].name} ›{' '}
                        </span>
                        {r.question}
                      </td>
                      <td
                        className={`px-2 py-3 font-bold ${resultLabel[r.result].className}`}
                      >
                        {resultLabel[r.result].text}
                      </td>
                      <td className="px-2 py-3 text-base text-zinc-500">
                        {kstTime(r.answeredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Section>

        <Section title="「헷갈려요」 누른 곳">
          {item.confusionMarks.length === 0 ? (
            <Empty>아직 누른 곳이 없어요.</Empty>
          ) : (
            <ul className="flex flex-col gap-2 text-lg">
              {[...item.confusionMarks]
                .sort((a, b) => b.count - a.count)
                .map((m) => (
                  <li
                    key={`${m.guide}-${m.paragraphId}`}
                    className="rounded-lg bg-amber-50 px-4 py-2"
                  >
                    {guideCatalog[m.guide].name} ›{' '}
                    {paragraphTitle(m.paragraphId)} <strong>{m.count}회</strong>
                    <span className="text-base text-zinc-500">
                      {' '}
                      · 마지막 {kstTime(m.lastAt)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Section>

        {item.guides.includes('medication') && (
          <Section title="환자가 체크한 「내가 먹는 약」">
            {!item.medicationCheck ? (
              <Empty>아직 체크하지 않았어요.</Empty>
            ) : item.medicationCheck.medications.length === 0 ? (
              <Empty>
                먹는 약이 없다고 했어요 (
                {kstTime(item.medicationCheck.checkedAt)})
              </Empty>
            ) : (
              <>
                <p className="mb-2 text-base text-zinc-500">
                  체크한 시간 {kstTime(item.medicationCheck.checkedAt)}
                </p>
                <table className="w-full text-left text-lg">
                  <thead className="text-base text-zinc-600">
                    <tr className="border-b border-zinc-200">
                      <th className="px-2 py-2">고른 약</th>
                      <th className="px-2 py-2">판정</th>
                      <th className="px-2 py-2">확인 질문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.medicationCheck.medications.map((id) => {
                      const quiz = medQuiz(id);
                      const verdict = findMedication(id)?.verdict;
                      return (
                        <tr key={id} className="border-b border-zinc-200">
                          <td className="px-2 py-3 font-bold">
                            {medicationName(id)}
                          </td>
                          <td className="px-2 py-3">
                            {verdict ? verdictLabels[verdict] : ''}
                          </td>
                          <td
                            className={`px-2 py-3 font-bold ${
                              quiz
                                ? resultLabel[quiz.result].className
                                : 'font-normal text-zinc-500'
                            }`}
                          >
                            {quiz
                              ? resultLabel[quiz.result].text
                              : '아직 안 풀었어요'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </Section>
        )}
      </Panel>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 font-semibold text-zinc-600">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-lg text-zinc-500">{children}</p>;
}
