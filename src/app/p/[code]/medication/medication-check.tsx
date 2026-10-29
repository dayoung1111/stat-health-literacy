'use client';

import { useState, useTransition } from 'react';

import {
  medications,
  verdictLabels,
  type MedDetail,
  type Medication,
  type MedicationId,
  type Verdict,
} from '@/lib/medication-guide';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { useText } from '../../../language';
import { Ttobagi } from '../../../ttobagi';
import { Drawing } from '../../pictures';
import { recordMedicationQuiz, saveMyMedications } from '../../records';
import { buttonClass, ButtonLink, CallButton } from '../../ui';
import { MedIcon, VerdictMark } from './med-icons';

// 드시는 약 고르기 → 고른 약마다 1) 판정 2) 자세히 3) 확인 질문 → 끝나면 또박이 "잘하셨어요".
// 약 이름·판정·자세히·질문은 medication-guide.ts 원문을 고른 언어로 보여 준다.
// 고른 약과 확인 질문 결과는 저장되어 의료진 코드 상세에 보인다.
type StopDate = { month: number; day: number } | null;

type Phase =
  | { kind: 'select' }
  | { kind: 'verdict'; i: number }
  | { kind: 'detail'; i: number; retry: boolean }
  | { kind: 'quiz'; i: number; attempt: 1 | 2 }
  | { kind: 'result'; i: number; correct: boolean }
  | { kind: 'done' };

export function MedicationFlow({
  code,
  initial,
  stopDate,
}: {
  code: string;
  initial: MedicationId[];
  /** 피를 묽게 하는 약 중단 시작일(의료진 입력). 없으면 null → "의사 선생님과 정한 날짜부터" */
  stopDate: StopDate;
}) {
  const { t, src } = useText();
  const [mine, setMine] = useState<MedicationId[]>(initial);
  const [phase, setPhase] = useState<Phase>({ kind: 'select' });
  const [saving, startSaving] = useTransition();

  const chosen = medications.filter((m) => mine.includes(m.id));
  const toggle = (id: MedicationId) =>
    setMine((list) =>
      list.includes(id) ? list.filter((m) => m !== id) : [...list, id],
    );
  const start = (ids: MedicationId[]) =>
    startSaving(async () => {
      await saveMyMedications(code, ids);
      setPhase(ids.length > 0 ? { kind: 'verdict', i: 0 } : { kind: 'done' });
    });
  const next = (i: number) =>
    setPhase(
      i + 1 < chosen.length ? { kind: 'verdict', i: i + 1 } : { kind: 'done' },
    );

  if (phase.kind === 'select') {
    return (
      <section aria-labelledby="select-title">
        <h1
          id="select-title"
          className="mb-4 text-3xl leading-snug font-bold break-keep"
        >
          {t('med.selectTitle')}
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
                {src(m.name)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={chosen.length === 0 || saving}
          onClick={() => start(chosen.map((m) => m.id))}
          className={`mt-6 ${buttonClass.primary}`}
        >
          {saving
            ? t('med.saving')
            : chosen.length === 0
              ? t('med.pickOne')
              : t('med.picked', { count: chosen.length })}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setMine([]);
            start([]);
          }}
          className={`mt-3 ${buttonClass.outline}`}
        >
          {t('med.none')}
        </button>
      </section>
    );
  }

  if (phase.kind === 'done') {
    return (
      <section aria-labelledby="done-title">
        <h1 id="done-title" className="sr-only">
          {t('med.doneTitle')}
        </h1>
        <Ttobagi pose="cheer" message={{ id: 'med.doneSay' }} />
        {chosen.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-3">
            {chosen.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm"
              >
                <VerdictMark verdict={m.verdict} className="size-14 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-2xl font-bold">{src(m.name)}</span>
                  <span className="text-xl">
                    {src(verdictLabels[m.verdict])}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-2xl">{t('med.noneTold')}</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <ButtonLink href={`/p/${code}/home`}>{t('common.goHome')}</ButtonLink>
          <button
            type="button"
            onClick={() => setPhase({ kind: 'select' })}
            className={buttonClass.outline}
          >
            {t('med.pickAgain')}
          </button>
        </div>
      </section>
    );
  }

  const med = chosen[phase.i];

  return (
    <section aria-labelledby="med-title">
      <p className="text-xl text-zinc-700">
        {t('med.count', { n: phase.i + 1, total: chosen.length })}
      </p>
      <h1
        id="med-title"
        className="mt-1 flex items-center gap-3 text-3xl font-bold break-keep"
      >
        <MedIcon name={med.icon} className="size-12 shrink-0" />
        {src(med.name)}
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
            {t('med.details')}
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
            {t(phase.retry ? 'med.tryAgain' : 'med.quiz')}
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
                message={{
                  id: 'med.answerWas',
                  vars: {
                    answer: {
                      source:
                        med.quiz.options.find((o) => o.correct)?.text ?? '',
                    },
                  },
                }}
              />
            )}
          </div>
          {!phase.correct && <CallButton variant="outline" />}
          <button
            type="button"
            onClick={() => next(phase.i)}
            className={`mt-4 ${buttonClass.primary}`}
          >
            {t(phase.i + 1 < chosen.length ? 'med.nextMed' : 'med.allChecked')}
          </button>
        </>
      )}
    </section>
  );
}

// 3화면 중 지금 어디인지: 판정 · 자세히 · 확인
function ScreenDots({ current }: { current: number }) {
  const { t } = useText();
  const names = [t('med.stepVerdict'), t('med.stepDetail'), t('med.stepQuiz')];
  return (
    <ol aria-label={t('med.steps')} className="mt-3 flex gap-2 text-lg">
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
  const { src } = useText();
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
        {src(verdictLabels[verdict])}
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
  const { t, src } = useText();
  const text =
    detail.kind !== 'stop-date'
      ? src(detail.text)
      : stopDate
        ? t('med.stopOnDate', stopDate)
        : t('med.stopDoctorDate');
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
            <Drawing
              visual={{
                kind: 'calendar',
                text: stopDate ? `${stopDate.month}/${stopDate.day}` : '?',
              }}
            />
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
        {no && <span className="sr-only">{t('common.no')}</span>}
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
  const { src } = useText();
  return (
    <>
      <h2 className="mt-5 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
        {src(med.quiz.question)}
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
            {src(option.text)}
          </button>
        ))}
      </div>
    </>
  );
}
