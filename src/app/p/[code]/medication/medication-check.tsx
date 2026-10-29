'use client';

import { useLayoutEffect, useRef, useState, useTransition } from 'react';

import type { GuideKind } from '@/lib/guide-catalog';
import { guideLessonHref, nextGuide } from '@/lib/guide-progress';
import {
  medications,
  verdictLabels,
  type MedDetail,
  type Medication,
  type MedicationId,
  type Verdict,
} from '@/lib/medication-guide';
import { getMessages } from '@/lib/messages';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { Ttobagi } from '../../../ttobagi';
import { Drawing } from '../../pictures';
<<<<<<< HEAD
import { recordMedicationQuiz, saveMyMedications } from '../../records';
import { buttonClass, CallButton } from '../../ui';
=======
import {
  completeGuide,
  recordMedicationQuiz,
  saveMyMedications,
} from '../../records';
import { buttonClass, ButtonLink, CallButton } from '../../ui';
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd
import { MedIcon, VerdictMark } from './med-icons';

// 처음: 드시는 약 고르기 → 고른 약마다 1) 판정 2) 자세히 3) 확인 질문 → 📋 내 약 정리.
// 한 번 저장한 뒤에는 정리 화면부터 시작하고, 고치기에서 새로 고른 약만 3화면을 다시 본다.
// 고른 약과 확인 질문 결과는 저장되어 의료진 코드 상세에 보인다.
type Phase =
  | { kind: 'select'; editing: boolean }
  | { kind: 'verdict'; i: number }
  | { kind: 'detail'; i: number; retry: boolean }
  | { kind: 'quiz'; i: number; attempt: 1 | 2 }
  | { kind: 'result'; i: number; correct: boolean }
  | { kind: 'summary'; cheer: boolean };

type StopDate = { text: string; short: string };

// 목록 순서대로 정리한다.
const inOrder = (ids: MedicationId[]) =>
  medications.filter((m) => ids.includes(m.id));

<<<<<<< HEAD
const firstPhase = (saved: MedicationId[] | null): Phase =>
  saved
    ? { kind: 'summary', cheer: false }
    : { kind: 'select', editing: false };
=======
// 이 화면이 맡은 안내
const thisGuide: GuideKind = 'medication';
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd

export function MedicationFlow({
  code,
  saved,
  stopDate,
  language,
  guides,
  completed,
}: {
  code: string;
<<<<<<< HEAD
  /** 저장된 내 약. 한 번도 저장하지 않았으면 null */
  saved: MedicationId[] | null;
=======
  /** 의료진이 고른 언어. 안내 사이 이동 문구에 쓴다. */
  language: string;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이미 마친 안내 */
  completed: GuideKind[];
  initial: MedicationId[];
  /** 전에 한 번이라도 저장했는지("약이 없어요" 포함). 그렇다면 정리 화면부터 연다. */
  hasSaved: boolean;
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd
  /** 피를 묽게 하는 약 중단 시작일. text 예: "11월 3일부터" / "의사 선생님과 정한 날짜부터", short 예: "11/3" / "?" */
  stopDate: StopDate;
}) {
  const [stored, setStored] = useState(saved);
  const savedRef = useRef(saved);
  const [mine, setMine] = useState<MedicationId[]>(saved ?? []);
  const [queue, setQueue] = useState<MedicationId[]>([]);
  const [phase, setPhase] = useState<Phase>(() => firstPhase(saved));
  const [saving, startSaving] = useTransition();
  const t = getMessages(language);
  // "확인했어요"를 누르면 이 안내는 마친 것. 아직 안 마친 다른 안내가 다음에 볼 곳이다.
  const next = nextGuide(guides, [...completed, thisGuide], thisGuide);
  const nextHref = next ? guideLessonHref(code, next) : null;

<<<<<<< HEAD
  // Next.js는 다녀간 화면을 숨겨 두고 상태를 되살린다. 숨겨질 때 처음 상태로 돌려 두어
  // 💊를 다시 누르면 언제나 정리 화면(아직 안 골랐으면 고르기)부터 새로 시작한다.
  useLayoutEffect(
    () => () => {
      setMine(savedRef.current ?? []);
      setQueue([]);
      setPhase(firstPhase(savedRef.current));
    },
    [],
  );
=======
  // "확인했어요" 뒤 또박이가 칭찬하고, 남은 안내가 있으면 잠시 뒤 그 안내로 간다.
  useEffect(() => {
    if (phase.kind !== 'done' || !nextHref) return;
    const timer = setTimeout(() => router.push(nextHref), 3500);
    return () => clearTimeout(timer);
  }, [phase.kind, router, nextHref]);
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd

  const chosen = inOrder(mine);
  const steps = inOrder(queue);
  const before = stored ?? [];
  const added = chosen.filter((m) => !before.includes(m.id));
  const toggle = (id: MedicationId) =>
    setMine((list) =>
      list.includes(id) ? list.filter((m) => m !== id) : [...list, id],
    );
  // 저장하고, 새로 고른 약만 3화면으로 본다. 없으면 바로 정리 화면.
  const save = (ids: MedicationId[], toCheck: MedicationId[]) =>
    startSaving(async () => {
      await saveMyMedications(code, ids);
      savedRef.current = ids;
      setStored(ids);
      setMine(ids);
      setQueue(toCheck);
      setPhase(
        toCheck.length > 0
          ? { kind: 'verdict', i: 0 }
          : { kind: 'summary', cheer: false },
      );
    });
  const next = (i: number) =>
    setPhase(
      i + 1 < steps.length
        ? { kind: 'verdict', i: i + 1 }
        : { kind: 'summary', cheer: true },
    );

  if (phase.kind === 'select') {
    const ids = chosen.map((m) => m.id);
    return (
      <section aria-labelledby="select-title">
        <h1
          id="select-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          드시는 약을 모두 눌러 주세요
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {medications.map((m) => {
            const on = mine.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(m.id)}
                className={`relative flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border-4 px-3 py-4 text-center text-2xl font-bold break-keep focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green ${
                  on
                    ? 'border-stat-green bg-stat-mint text-stat-green'
                    : 'border-zinc-200 bg-white text-stat-ink'
                }`}
              >
                {on && (
                  <span aria-hidden="true" className="absolute top-2 right-2">
                    <MedIcon name="ok" className="size-8" />
                  </span>
                )}
                <MedIcon name={m.icon} className="size-16" />
                {m.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={chosen.length === 0 || saving}
          onClick={() =>
            save(
              ids,
              added.map((m) => m.id),
            )
          }
          className={`mt-6 ${buttonClass.primary}`}
        >
          {saving
            ? '저장하는 중…'
            : chosen.length === 0
              ? '약을 하나 이상 눌러 주세요'
              : !phase.editing
                ? `${chosen.length}개 골랐어요 · 하나씩 볼게요 ▶`
                : added.length > 0
                  ? `새 약 ${added.length}개 · 하나씩 볼게요 ▶`
                  : '이대로 저장할게요 ▶'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save([], [])}
          className={`mt-3 ${buttonClass.outline}`}
        >
          드시는 약이 없어요
        </button>
        {phase.editing && (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setMine(before);
              setPhase({ kind: 'summary', cheer: false });
            }}
            className={`mt-3 ${buttonClass.outline}`}
          >
            ← 고치지 않고 돌아가기
          </button>
        )}
      </section>
    );
  }

  if (phase.kind === 'summary') {
    return (
      <section aria-labelledby="summary-title">
        {phase.cheer && <Ttobagi pose="cheer" message="잘하셨어요." />}
        <h1
          id="summary-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          📋 내 약 정리
        </h1>
        {chosen.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {chosen.map((m) => (
              <SummaryRow key={m.id} med={m} stopDate={stopDate} />
            ))}
          </ul>
        ) : (
          <p className="text-2xl">드시는 약이 없다고 알려 주셨어요.</p>
        )}
        <button
          type="button"
<<<<<<< HEAD
          onClick={() => setPhase({ kind: 'select', editing: true })}
          className={`mt-8 ${buttonClass.primary}`}
=======
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setPhase({ kind: 'done' });
            void completeGuide(code, thisGuide);
          }}
          className={`mt-4 ${confirmButton}`}
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd
        >
          약 다시 선택하기·수정하기
        </button>
      </section>
    );
  }

<<<<<<< HEAD
  const med = steps[phase.i];
=======
  if (phase.kind === 'done') {
    return (
      <section aria-labelledby="done-title">
        <h1 id="done-title" className="sr-only">
          약 확인을 마쳤어요
        </h1>
        <Ttobagi
          pose="cheer"
          message={
            next
              ? t.guideDoneNext(t.guides[thisGuide], t.guides[next])
              : t.allDone
          }
        />
        <div className="mt-6 flex flex-col gap-3">
          {next && nextHref ? (
            <ButtonLink href={nextHref}>
              {t.nextButton(t.guides[next])}
            </ButtonLink>
          ) : (
            <button
              type="button"
              onClick={() => setPhase({ kind: 'summary' })}
              className={buttonClass.primary}
            >
              {t.restart}
            </button>
          )}
          <ButtonLink href={`/p/${code}/home`} variant="outline">
            🏠 홈으로
          </ButtonLink>
        </div>
      </section>
    );
  }

  const med = inOrder(queue)[phase.i];
>>>>>>> f3fbd526310436dbbdbd849a565d9c5a3b8836dd

  return (
    <section aria-labelledby="med-title">
      <p className="text-xl text-zinc-700">
        약 {phase.i + 1} / {steps.length}
      </p>
      <h1
        id="med-title"
        className="mt-1 flex items-center gap-3 text-3xl font-bold break-keep"
      >
        <MedIcon name={med.icon} className="size-12 shrink-0" />
        {med.name}
      </h1>
      <ScreenDots
        current={phase.kind === 'verdict' ? 0 : phase.kind === 'detail' ? 1 : 2}
      />

      {phase.kind === 'verdict' && (
        <>
          <VerdictCard verdict={med.verdict} />
          <button
            type="button"
            onClick={() =>
              setPhase({ kind: 'detail', i: phase.i, retry: false })
            }
            className={`mt-6 ${buttonClass.primary}`}
          >
            자세히 보기 ▶
          </button>
        </>
      )}

      {phase.kind === 'detail' && (
        <>
          {phase.retry && (
            <div role="status" className="mt-4">
              <Ttobagi pose="explain" message={ttobagiSays.retry} />
            </div>
          )}
          <Details med={med} stopDate={stopDate} />
          <button
            type="button"
            onClick={() =>
              setPhase({
                kind: 'quiz',
                i: phase.i,
                attempt: phase.retry ? 2 : 1,
              })
            }
            className={`mt-6 ${buttonClass.primary}`}
          >
            {phase.retry ? '다시 풀어 볼까요? ▶' : '확인 질문 ▶'}
          </button>
        </>
      )}

      {phase.kind === 'quiz' && (
        <Quiz
          med={med}
          onPick={(correct) => {
            const { i, attempt } = phase;
            if (correct) {
              void recordMedicationQuiz(
                code,
                med.id,
                attempt === 1 ? 'correct' : 'retry_correct',
              );
              setPhase({ kind: 'result', i, correct: true });
            } else if (attempt === 1) {
              // 틀리면 "괜찮아요" 하고 2화면을 다시 보여 준 뒤 다시 묻는다.
              setPhase({ kind: 'detail', i, retry: true });
            } else {
              void recordMedicationQuiz(code, med.id, 'wrong');
              setPhase({ kind: 'result', i, correct: false });
            }
          }}
        />
      )}

      {phase.kind === 'result' && (
        <>
          <div role="status" className="mt-4">
            {phase.correct ? (
              <Ttobagi pose="cheer" message={ttobagiSays.cheer} />
            ) : (
              <Ttobagi
                pose="explain"
                message={`정답은 「${med.quiz.options.find((o) => o.correct)?.text}」예요. 간호사에게 꼭 물어보세요.`}
              />
            )}
          </div>
          {!phase.correct && <CallButton variant="outline" />}
          <button
            type="button"
            onClick={() => next(phase.i)}
            className={`mt-4 ${buttonClass.primary}`}
          >
            {phase.i + 1 < steps.length ? '다음 약 ▶' : '모두 확인했어요 ▶'}
          </button>
        </>
      )}
    </section>
  );
}

// 3화면 중 지금 어디인지: 판정 · 자세히 · 확인
function ScreenDots({ current }: { current: number }) {
  const names = ['판정', '자세히', '확인 질문'];
  return (
    <ol aria-label="이 약의 순서" className="mt-3 flex gap-2 text-lg">
      {names.map((name, i) => (
        <li
          key={name}
          aria-current={i === current ? 'step' : undefined}
          className={`rounded-full px-3 py-1 font-bold ${
            i === current
              ? 'bg-stat-green text-white'
              : i < current
                ? 'bg-stat-mint text-stat-green'
                : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {i + 1}. {name}
        </li>
      ))}
    </ol>
  );
}

// 1화면: 큰 판정 그림과 글자
function VerdictCard({ verdict }: { verdict: Verdict }) {
  const tone: Record<Verdict, string> = {
    ok: 'bg-green-50 text-green-800 border-green-700',
    stop: 'bg-stat-alert-soft text-stat-alert border-stat-alert',
    ask: 'bg-stat-mint text-stat-green border-stat-green',
  };
  return (
    <div
      className={`mt-5 flex flex-col items-center gap-4 rounded-3xl border-4 px-4 py-8 text-center ${tone[verdict]}`}
    >
      <VerdictMark verdict={verdict} className="size-36" />
      <p className="text-4xl leading-snug font-bold break-keep">
        {verdictLabels[verdict]}
      </p>
    </div>
  );
}

// 2화면: 표의 "자세히"를 큰 그림 + 짧은 말로
function Details({ med, stopDate }: { med: Medication; stopDate: StopDate }) {
  return (
    <ul className="mt-4 flex flex-col gap-3 rounded-3xl bg-stat-sun p-4">
      {med.details.map((detail, index) => (
        <DetailRow key={index} detail={detail} stopDate={stopDate} />
      ))}
    </ul>
  );
}

function DetailRow({
  detail,
  stopDate,
}: {
  detail: MedDetail;
  stopDate: StopDate;
}) {
  const text =
    detail.kind === 'stop-date' ? `${stopDate.text} 중단` : detail.text;
  // 중단 시작일은 날짜가 가려지지 않게 달력은 그대로 두고, 구석에 작은 "약 ✕"만 붙인다.
  const no = detail.kind === 'stop-date' ? false : Boolean(detail.no);
  return (
    <li className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
      <span className="relative flex size-20 shrink-0 items-center justify-center [&_.size-24]:size-20 [&_svg]:max-h-20">
        {detail.kind === 'clock' && (
          <Drawing visual={{ kind: 'clock', hour: detail.hour }} />
        )}
        {detail.kind === 'calendar' && (
          <Drawing visual={{ kind: 'calendar', text: detail.label }} />
        )}
        {detail.kind === 'stop-date' && (
          <>
            <Drawing visual={{ kind: 'calendar', text: stopDate.short }} />
            <span className="absolute -right-4 -bottom-3 rounded-full bg-white">
              <MedIcon name="pill" no className="size-9" />
            </span>
          </>
        )}
        {detail.kind === 'icon' && (
          <MedIcon name={detail.icon} className="size-20" />
        )}
        {no && detail.kind !== 'icon' && (
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="absolute inset-0 size-20"
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#C2410C"
              strokeWidth="7"
            />
            <path
              d="M20 80 L80 20"
              stroke="#C2410C"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        )}
        {no && detail.kind === 'icon' && (
          <span className="absolute inset-0">
            <MedIcon name={detail.icon} no className="size-20" />
          </span>
        )}
      </span>
      <span className="text-2xl leading-snug font-bold break-keep">
        {no && <span className="sr-only">하면 안 돼요: </span>}
        {text}
      </span>
    </li>
  );
}

// 3화면: 확인 질문. 정답은 표대로.
function Quiz({
  med,
  onPick,
}: {
  med: Medication;
  onPick: (correct: boolean) => void;
}) {
  return (
    <>
      <h2 className="mt-5 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
        {med.quiz.question}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {med.quiz.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPick(Boolean(option.correct))}
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-4 border-zinc-200 bg-white px-3 py-4 text-2xl font-bold break-keep hover:border-stat-green focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
          >
            <MedIcon name={option.icon} className="size-20" />
            {option.text}
          </button>
        ))}
      </div>
    </>
  );
}

// 📋 정리 화면 한 줄: 약 그림·이름 / 판정 / 주의사항(2화면 "자세히"와 같은 말)
function SummaryRow({
  med,
  stopDate,
}: {
  med: Medication;
  stopDate: StopDate;
}) {
  return (
    <li className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <MedIcon name={med.icon} className="size-12 shrink-0" />
        <span className="text-2xl font-bold break-keep">{med.name}</span>
      </div>
      <p className="mt-2 flex items-center gap-2 text-2xl font-bold break-keep">
        <VerdictMark verdict={med.verdict} className="size-9 shrink-0" />
        {verdictLabels[med.verdict]}
      </p>
      <ul className="mt-3 flex flex-col gap-1 border-t border-zinc-200 pt-3 text-xl leading-snug break-keep">
        {med.details.map((detail, index) => {
          const no = detail.kind !== 'stop-date' && Boolean(detail.no);
          return (
            <li key={index} className={no ? 'font-bold text-stat-alert' : ''}>
              {no ? '✕ ' : '· '}
              {no && <span className="sr-only">하면 안 돼요: </span>}
              {detail.kind === 'stop-date'
                ? `${stopDate.text} 중단`
                : detail.text}
            </li>
          );
        })}
      </ul>
    </li>
  );
}
