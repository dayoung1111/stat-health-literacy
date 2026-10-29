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
import { screenTexts } from '@/lib/screen-texts';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { useLanguageOr } from '../../../language-provider';
import { DateTemplate, T, TranslatedTtobagi } from '../../../translated';
import { Ttobagi } from '../../../ttobagi';
import { Drawing } from '../../pictures';
import {
  completeGuide,
  recordMedicationQuiz,
  saveMyMedications,
} from '../../records';
import { buttonClass, ButtonLink, CallButton } from '../../ui';
import { MedIcon, VerdictMark } from './med-icons';

// 처음: 드시는 약 고르기 → 고른 약마다 1) 판정 2) 자세히 3) 확인 질문 → 📋 내 약 정리.
// 한 번 저장한 뒤에는 정리 화면부터 시작하고, 고치기에서 새로 고른 약만 3화면을 다시 본다.
// 고른 약과 확인 질문 결과는 저장되어 의료진 코드 상세에 보인다.
// 약을 다 확인하고 정리 화면에 오면(finished) 이 안내를 마친 것으로 저장하고,
// 아직 안 마친 다른 안내(예: 대장내시경)로 가는 버튼을 보여 준다.
type Phase =
  | { kind: 'select'; editing: boolean }
  | { kind: 'verdict'; i: number }
  | { kind: 'detail'; i: number; retry: boolean }
  | { kind: 'quiz'; i: number; attempt: 1 | 2 }
  | { kind: 'result'; i: number; correct: boolean }
  | { kind: 'summary'; cheer: boolean; finished?: boolean };

type StopDate = { date: string | null; short: string };

// 목록 순서대로 정리한다.
const inOrder = (ids: MedicationId[]) =>
  medications.filter((m) => ids.includes(m.id));

const firstPhase = (saved: MedicationId[] | null): Phase =>
  saved
    ? { kind: 'summary', cheer: false }
    : { kind: 'select', editing: false };

// 이 화면이 맡은 안내
const thisGuide: GuideKind = 'medication';

export function MedicationFlow({
  code,
  saved,
  stopDate,
  language,
  guides,
  completed,
}: {
  code: string;
  /** 저장된 내 약. 한 번도 저장하지 않았으면 null */
  saved: MedicationId[] | null;
  /** 의료진이 고른 언어. 환자가 언어를 고른 적이 없을 때 안내 사이 이동 문구에 쓴다. */
  language: string;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이미 마친 안내 */
  completed: GuideKind[];
  /** 피를 묽게 하는 약 중단 시작일. date 예: "2026-11-03"(없으면 null), short 예: "11/3" / "?" */
  stopDate: StopDate;
}) {
  const [stored, setStored] = useState(saved);
  const savedRef = useRef(saved);
  const [mine, setMine] = useState<MedicationId[]>(saved ?? []);
  const [queue, setQueue] = useState<MedicationId[]>([]);
  const [phase, setPhase] = useState<Phase>(() => firstPhase(saved));
  const [saving, startSaving] = useTransition();
  // 환자가 고른 언어(없으면 의료진이 고른 언어). 안내 사이 이동 문구에 쓴다.
  const { language: shown, t } = useLanguageOr(language);
  // 이 안내를 마치면 아직 안 마친 다른 안내가 다음에 볼 곳이다.
  const nextKind = nextGuide(guides, [...completed, thisGuide], thisGuide);
  const nextHref = nextKind ? guideLessonHref(code, nextKind) : null;

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

  const chosen = inOrder(mine);
  const steps = inOrder(queue);
  const before = stored ?? [];
  const added = chosen.filter((m) => !before.includes(m.id));
  const toggle = (id: MedicationId) =>
    setMine((list) =>
      list.includes(id) ? list.filter((m) => m !== id) : [...list, id],
    );
  // 약 확인을 마치고 정리 화면으로. 이 안내를 마친 것으로 저장한다.
  const finish = (cheer: boolean) => {
    setPhase({ kind: 'summary', cheer, finished: true });
    void completeGuide(code, thisGuide);
  };
  // 저장하고, 새로 고른 약만 3화면으로 본다. 없으면 바로 정리 화면.
  const save = (ids: MedicationId[], toCheck: MedicationId[]) =>
    startSaving(async () => {
      await saveMyMedications(code, ids);
      savedRef.current = ids;
      setStored(ids);
      setMine(ids);
      setQueue(toCheck);
      if (toCheck.length > 0) setPhase({ kind: 'verdict', i: 0 });
      else finish(false);
    });
  const next = (i: number) =>
    i + 1 < steps.length
      ? setPhase({ kind: 'verdict', i: i + 1 })
      : finish(true);
  // "처음부터 다시": 내 약 전부를 처음부터 하나씩 다시 본다.
  const restart = () => {
    const all = chosen.map((m) => m.id);
    setQueue(all);
    setPhase(
      all.length > 0
        ? { kind: 'verdict', i: 0 }
        : { kind: 'select', editing: true },
    );
  };

  if (phase.kind === 'select') {
    const ids = chosen.map((m) => m.id);
    return (
      <section aria-labelledby="select-title">
        <h1
          id="select-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          <T>{screenTexts.medication.pickAll}</T>
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
                <T>{m.name}</T>
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
          <T>
            {saving
              ? screenTexts.medication.saving
              : chosen.length === 0
                ? screenTexts.medication.pickOne
                : !phase.editing
                  ? screenTexts.medication.pickedCount(chosen.length)
                  : added.length > 0
                    ? screenTexts.medication.newCount(added.length)
                    : screenTexts.medication.saveAsIs}
          </T>
          {!saving && chosen.length > 0 && ' ▶'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save([], [])}
          className={`mt-3 ${buttonClass.outline}`}
        >
          <T>{screenTexts.medication.none}</T>
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
            ← <T>{screenTexts.medication.cancelEdit}</T>
          </button>
        )}
      </section>
    );
  }

  if (phase.kind === 'summary') {
    return (
      <section aria-labelledby="summary-title">
        {phase.finished ? (
          <Ttobagi
            pose="cheer"
            language={shown}
            message={
              nextKind
                ? t.guideDoneNext(t.guides[thisGuide], t.guides[nextKind])
                : t.allDone
            }
          />
        ) : (
          phase.cheer && (
            <TranslatedTtobagi
              pose="cheer"
              message={screenTexts.medication.well}
            />
          )
        )}
        <h1
          id="summary-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          📋 <T>{screenTexts.medication.summaryTitle}</T>
        </h1>
        {chosen.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {chosen.map((m) => (
              <SummaryRow key={m.id} med={m} stopDate={stopDate} />
            ))}
          </ul>
        ) : (
          <p className="text-2xl">
            <T>{screenTexts.medication.noneToldYou}</T>
          </p>
        )}
        {phase.finished && (
          <div className="mt-8">
            {nextKind && nextHref ? (
              <ButtonLink href={nextHref}>
                {t.nextButton(t.guides[nextKind])}
              </ButtonLink>
            ) : (
              <button
                type="button"
                onClick={restart}
                className={buttonClass.primary}
              >
                {t.restart}
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setPhase({ kind: 'select', editing: true })}
          className={`${phase.finished ? 'mt-4' : 'mt-8'} ${
            phase.finished ? buttonClass.outline : buttonClass.primary
          }`}
        >
          <T>{screenTexts.medication.edit}</T>
        </button>
      </section>
    );
  }

  const med = steps[phase.i];

  return (
    <section aria-labelledby="med-title">
      <p className="text-xl text-zinc-700">
        <T>{screenTexts.medication.med}</T> {phase.i + 1} / {steps.length}
      </p>
      <h1
        id="med-title"
        className="mt-1 flex items-center gap-3 text-3xl font-bold break-keep"
      >
        <MedIcon name={med.icon} className="size-12 shrink-0" />
        <T>{med.name}</T>
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
            <T>{screenTexts.medication.seeDetails}</T> ▶
          </button>
        </>
      )}

      {phase.kind === 'detail' && (
        <>
          {phase.retry && (
            <div role="status" className="mt-4">
              <TranslatedTtobagi pose="explain" message={ttobagiSays.retry} />
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
            <T>
              {phase.retry
                ? screenTexts.medication.askAgain
                : screenTexts.medication.quiz}
            </T>{' '}
            ▶
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
              <TranslatedTtobagi pose="cheer" message={ttobagiSays.cheer} />
            ) : (
              <TranslatedTtobagi
                pose="explain"
                message={screenTexts.medication.answerIs(
                  med.quiz.options.find((o) => o.correct)?.text ?? '',
                )}
              />
            )}
          </div>
          {!phase.correct && <CallButton variant="outline" />}
          <button
            type="button"
            onClick={() => next(phase.i)}
            className={`mt-4 ${buttonClass.primary}`}
          >
            <T>
              {phase.i + 1 < steps.length
                ? screenTexts.medication.nextMed
                : screenTexts.medication.allChecked}
            </T>{' '}
            ▶
          </button>
        </>
      )}
    </section>
  );
}

// 3화면 중 지금 어디인지: 판정 · 자세히 · 확인
function ScreenDots({ current }: { current: number }) {
  const names = screenTexts.medication.steps;
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
          {i + 1}. <T>{name}</T>
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
        <T>{verdictLabels[verdict]}</T>
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
        {no && (
          <span className="sr-only">
            <T>{screenTexts.common.mustNot}</T>
          </span>
        )}
        {detail.kind === 'stop-date' ? (
          <StopLine stopDate={stopDate} />
        ) : (
          <T>{detail.text}</T>
        )}
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
        <T>{med.quiz.question}</T>
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
            <T>{option.text}</T>
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
        <span className="text-2xl font-bold break-keep">
          <T>{med.name}</T>
        </span>
      </div>
      <p className="mt-2 flex items-center gap-2 text-2xl font-bold break-keep">
        <VerdictMark verdict={med.verdict} className="size-9 shrink-0" />
        <T>{verdictLabels[med.verdict]}</T>
      </p>
      <ul className="mt-3 flex flex-col gap-1 border-t border-zinc-200 pt-3 text-xl leading-snug break-keep">
        {med.details.map((detail, index) => {
          const no = detail.kind !== 'stop-date' && Boolean(detail.no);
          return (
            <li key={index} className={no ? 'font-bold text-stat-alert' : ''}>
              {no ? '✕ ' : '· '}
              {no && (
                <span className="sr-only">
                  <T>{screenTexts.common.mustNot}</T>
                </span>
              )}
              {detail.kind === 'stop-date' ? (
                <StopLine stopDate={stopDate} />
              ) : (
                <T>{detail.text}</T>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

// "○월 ○일부터 중단"(날짜를 정하지 않았으면 "의사 선생님과 정한 날짜부터 중단")
function StopLine({ stopDate }: { stopDate: StopDate }) {
  return stopDate.date ? (
    <DateTemplate
      template={screenTexts.medication.stopTemplate}
      date={stopDate.date}
    />
  ) : (
    <T>{screenTexts.medication.stopUnknownLine}</T>
  );
}
