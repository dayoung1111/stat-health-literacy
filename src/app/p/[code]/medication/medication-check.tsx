'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

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
import {
  completeGuide,
  recordMedicationQuiz,
  saveMyMedications,
} from '../../records';
import { buttonClass, ButtonLink, CallButton } from '../../ui';
import { MedIcon, VerdictMark } from './med-icons';

type StopDate = { text: string; short: string };

// 드시는 약: 고르기 → 고른 약마다 1) 판정 2) 자세히 3) 확인 질문 → 📋 내 약 정리.
// 이미 고른 적이 있으면 정리 화면부터 보여 준다. 정리 화면에서 약 추가·빼기·확인을 한다.
// 고른 약과 확인 질문 결과는 바로 저장되어 의료진 목록·상세에 최신으로 보인다.
type Phase =
  | { kind: 'select'; adding: boolean }
  | { kind: 'verdict'; i: number }
  | { kind: 'detail'; i: number; retry: boolean }
  | { kind: 'quiz'; i: number; attempt: 1 | 2 }
  | { kind: 'result'; i: number; correct: boolean }
  | { kind: 'summary' }
  | { kind: 'done' };

// "확인했어요"는 가장 크게: 기본 버튼에서 높이·글자 크기만 키운다.
const confirmButton = buttonClass.primary
  .replace('min-h-18', 'min-h-24')
  .replace('text-2xl', 'text-3xl');

// 목록 순서대로 정리한다.
const inOrder = (ids: MedicationId[]) =>
  medications.filter((m) => ids.includes(m.id));

// 이 화면이 맡은 안내
const thisGuide: GuideKind = 'medication';

export function MedicationFlow({
  code,
  initial,
  hasSaved,
  stopDate,
  language,
  guides,
  completed,
}: {
  code: string;
  /** 의료진이 고른 언어. 안내 사이 이동 문구에 쓴다. */
  language: string;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이미 마친 안내 */
  completed: GuideKind[];
  initial: MedicationId[];
  /** 전에 한 번이라도 저장했는지("약이 없어요" 포함). 그렇다면 정리 화면부터 연다. */
  hasSaved: boolean;
  /** 피를 묽게 하는 약 중단 시작일. text 예: "11월 3일부터" / "의사 선생님과 정한 날짜부터", short 예: "11/3" / "?" */
  stopDate: StopDate;
}) {
  const router = useRouter();
  const [mine, setMine] = useState<MedicationId[]>(initial);
  const [picks, setPicks] = useState<MedicationId[]>([]);
  const [queue, setQueue] = useState<MedicationId[]>([]);
  const [editing, setEditing] = useState(false);
  const [phase, setPhase] = useState<Phase>(
    hasSaved ? { kind: 'summary' } : { kind: 'select', adding: false },
  );
  const [saving, startSaving] = useTransition();
  const t = getMessages(language);
  // "확인했어요"를 누르면 이 안내는 마친 것. 아직 안 마친 다른 안내가 다음에 볼 곳이다.
  const next = nextGuide(guides, [...completed, thisGuide], thisGuide);
  const nextHref = next ? guideLessonHref(code, next) : null;

  // "확인했어요" 뒤 또박이가 칭찬하고, 남은 안내가 있으면 잠시 뒤 그 안내로 간다.
  useEffect(() => {
    if (phase.kind !== 'done' || !nextHref) return;
    const timer = setTimeout(() => router.push(nextHref), 3500);
    return () => clearTimeout(timer);
  }, [phase.kind, router, nextHref]);

  const save = (ids: MedicationId[], after: () => void) =>
    startSaving(async () => {
      await saveMyMedications(code, ids);
      setMine(ids);
      after();
    });

  const togglePick = (id: MedicationId) =>
    setPicks((list) =>
      list.includes(id) ? list.filter((m) => m !== id) : [...list, id],
    );

  // 고른 약(또는 추가한 약)만 하나씩 3화면을 본다.
  const startQueue = (adding: boolean) => {
    const ordered = inOrder(picks).map((m) => m.id);
    const next = adding
      ? inOrder([...mine, ...ordered]).map((m) => m.id)
      : ordered;
    save(next, () => {
      setQueue(ordered);
      setPicks([]);
      setPhase({ kind: 'verdict', i: 0 });
    });
  };

  const nextInQueue = (i: number) =>
    setPhase(
      i + 1 < queue.length
        ? { kind: 'verdict', i: i + 1 }
        : { kind: 'summary' },
    );

  if (phase.kind === 'select') {
    const choices = phase.adding
      ? medications.filter((m) => !mine.includes(m.id))
      : medications;
    return (
      <section aria-labelledby="select-title">
        <h1
          id="select-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          {phase.adding
            ? '더 드시는 약을 눌러 주세요'
            : '드시는 약을 모두 눌러 주세요'}
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {choices.map((m) => {
            const on = picks.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() => togglePick(m.id)}
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
          disabled={picks.length === 0 || saving}
          onClick={() => startQueue(phase.adding)}
          className={`mt-6 ${buttonClass.primary}`}
        >
          {saving
            ? '저장하는 중…'
            : picks.length === 0
              ? '약을 하나 이상 눌러 주세요'
              : `${picks.length}개 ${phase.adding ? '추가' : '골랐어요'} · 하나씩 볼게요 ▶`}
        </button>
        {phase.adding ? (
          <button
            type="button"
            onClick={() => {
              setPicks([]);
              setPhase({ kind: 'summary' });
            }}
            className={`mt-3 ${buttonClass.outline}`}
          >
            ← 내 약 정리로 돌아가기
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => save([], () => setPhase({ kind: 'summary' }))}
            className={`mt-3 ${buttonClass.outline}`}
          >
            드시는 약이 없어요
          </button>
        )}
      </section>
    );
  }

  if (phase.kind === 'summary') {
    const list = inOrder(mine);
    const canAdd = list.length < medications.length;
    return (
      <section aria-labelledby="summary-title">
        <h1
          id="summary-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          <span aria-hidden="true">📋 </span>내 약 정리
        </h1>
        {list.length === 0 ? (
          <p className="rounded-3xl bg-white p-5 text-2xl">
            드시는 약이 없다고 알려 주셨어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-3xl bg-white p-4 shadow-sm"
              >
                <MedIcon name={m.icon} className="size-14 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-2xl font-bold break-keep">
                    {m.name}
                  </span>
                  <span className="flex items-center gap-2 text-xl font-bold">
                    <VerdictMark
                      verdict={m.verdict}
                      className="size-8 shrink-0"
                    />
                    {verdictLabels[m.verdict]}
                  </span>
                  <span className="text-xl leading-snug break-keep text-zinc-700">
                    {cautionLine(m, stopDate)}
                  </span>
                </span>
                {editing && (
                  <button
                    type="button"
                    disabled={saving}
                    aria-label={`${m.name} 빼기`}
                    onClick={() =>
                      save(
                        mine.filter((id) => id !== m.id),
                        () => {},
                      )
                    }
                    className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-stat-alert bg-white text-3xl font-bold text-stat-alert focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <p
          role="status"
          className="mt-3 min-h-7 text-xl font-bold text-stat-green"
        >
          {saving ? '저장하는 중…' : ''}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-3">
          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setPicks([]);
                setPhase({ kind: 'select', adding: true });
              }}
              className={buttonClass.outline}
            >
              ➕ 약 추가하기
            </button>
          )}
          {list.length > 0 && (
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => setEditing(!editing)}
              className={buttonClass.outline}
            >
              {editing ? '✔ 다 고쳤어요' : '✏️ 고치기'}
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setPhase({ kind: 'done' });
            void completeGuide(code, thisGuide);
          }}
          className={`mt-4 ${confirmButton}`}
        >
          ✅ 확인했어요
        </button>
      </section>
    );
  }

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

  return (
    <section aria-labelledby="med-title">
      <p className="text-xl text-zinc-700">
        약 {phase.i + 1} / {queue.length}
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
            onClick={() => nextInQueue(phase.i)}
            className={`mt-4 ${buttonClass.primary}`}
          >
            {phase.i + 1 < queue.length ? '다음 약 ▶' : '📋 내 약 정리 보기 ▶'}
          </button>
        </>
      )}
    </section>
  );
}

// 2화면 "자세히" 한 줄의 글자. 중단 시작일은 의료진이 넣은 날짜(없으면 정해 둔 문장)로.
function detailText(detail: MedDetail, stopDate: StopDate) {
  return detail.kind === 'stop-date' ? `${stopDate.text} 중단` : detail.text;
}

// 정리 화면 주의사항 한 줄: 그 약의 "자세히"를 이어 붙인다(새 내용은 넣지 않는다).
function cautionLine(med: Medication, stopDate: StopDate) {
  return med.details.map((d) => detailText(d, stopDate)).join(' · ');
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
  const text = detailText(detail, stopDate);
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
