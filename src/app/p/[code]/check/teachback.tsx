'use client';

import { useState } from 'react';

import type { Choice, Question } from '@/lib/demo-guide';
import { screenTexts } from '@/lib/screen-texts';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { T, TranslatedTtobagi } from '../../../translated';
import type { Pose } from '../../../ttobagi';
import { Drawing, PictureRow } from '../../pictures';
import { recordTeachback } from '../../records';
import { buttonClass, ButtonLink, CallButton } from '../../ui';

// 질문 → (틀리면) 그림으로 다시 설명 → 다른 질문으로 재확인 → 다음 질문.
// 결과는 질문마다 저장되어 의료진 코드 상세에 보인다(지금은 시연용 임시 저장소).
type Step =
  | { kind: 'ask' }
  | { kind: 'correct' }
  | { kind: 'wrong' }
  | { kind: 'retry' }
  | { kind: 'retryResult'; correct: boolean };

export function Teachback({
  code,
  questions,
}: {
  code: string;
  questions: Question[];
}) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>({ kind: 'ask' });
  const [needHelp, setNeedHelp] = useState<string[]>([]);

  if (index >= questions.length) {
    return <Done code={code} questions={questions} needHelp={needHelp} />;
  }

  const q = questions[index];
  const next = () => {
    setIndex(index + 1);
    setStep({ kind: 'ask' });
  };

  return (
    <>
      <Progress index={index} total={questions.length} />

      {step.kind === 'ask' && (
        <Ask
          question={q.question}
          choices={q.choices}
          onPick={(choice) => {
            // 처음에 맞히면 바로 저장하고, 틀리면 다시 확인 결과를 보고 저장한다.
            if (choice.correct) void recordTeachback(code, q.topic, 'correct');
            setStep({ kind: choice.correct ? 'correct' : 'wrong' });
          }}
        />
      )}

      {step.kind === 'correct' && (
        <Result pose="cheer" message={ttobagiSays.cheer} onNext={next} />
      )}

      {step.kind === 'wrong' && (
        <>
          <div role="status" className="mt-4">
            <TranslatedTtobagi pose="explain" message={ttobagiSays.retry} />
          </div>
          <div className="mt-2 rounded-3xl bg-stat-sun p-6">
            <PictureRow pictures={q.explain.pictures} />
            <div className="mt-5 text-center">
              {q.explain.lines.map((line) => (
                <p
                  key={line}
                  className="text-2xl leading-relaxed font-bold break-keep"
                >
                  <T>{line}</T>
                </p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep({ kind: 'retry' })}
            className={`mt-8 ${buttonClass.primary}`}
          >
            <T>{screenTexts.teachback.seeAgain}</T> ▶
          </button>
        </>
      )}

      {step.kind === 'retry' && (
        <Ask
          intro={screenTexts.teachback.retryIntro}
          question={q.retry.question}
          choices={q.retry.choices}
          onPick={(choice) => {
            const correct = Boolean(choice.correct);
            void recordTeachback(
              code,
              q.topic,
              correct ? 'retry_correct' : 'wrong',
            );
            if (!correct) setNeedHelp([...needHelp, q.topic]);
            setStep({ kind: 'retryResult', correct });
          }}
        />
      )}

      {step.kind === 'retryResult' && (
        <Result
          pose={step.correct ? 'cheer' : 'explain'}
          message={
            step.correct
              ? ttobagiSays.cheer
              : screenTexts.teachback.answerIs(
                  q.retry.choices.find((c) => c.correct)?.text ?? '',
                )
          }
          onNext={next}
        />
      )}
    </>
  );
}

// 위쪽 동그라미 진행 표시: ● ○ ○
function Progress({ index, total }: { index: number; total: number }) {
  return (
    <p className="flex items-center gap-3 text-xl font-bold">
      <span
        aria-hidden="true"
        className="text-2xl tracking-widest text-stat-green"
      >
        {Array.from({ length: total }, (_, i) => (i <= index ? '●' : '○')).join(
          ' ',
        )}
      </span>
      <span>
        <span className="sr-only">
          <T>{screenTexts.teachback.count(total)}</T>
        </span>
        {index + 1} / {total}
      </span>
    </p>
  );
}

function Ask({
  intro,
  question,
  choices,
  onPick,
}: {
  intro?: string;
  question: string;
  choices: Choice[];
  onPick: (choice: Choice) => void;
}) {
  return (
    <>
      {intro && (
        <p className="mt-4 text-xl text-zinc-700">
          <T>{intro}</T> 🙂
        </p>
      )}
      <h1 className="mt-4 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
        <T>{question}</T>
      </h1>
      <div className="mt-6 flex flex-col gap-4">
        {choices.map((choice) => (
          <button
            key={choice.text}
            type="button"
            onClick={() => onPick(choice)}
            className="flex min-h-24 items-center gap-5 rounded-3xl border-2 border-stat-green/30 bg-white px-5 py-4 text-left shadow-sm hover:border-stat-green hover:bg-stat-mint focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
          >
            <span
              aria-hidden="true"
              className="flex size-24 shrink-0 items-center justify-center [&_.text-7xl]:text-6xl"
            >
              <Drawing visual={choice.visual} />
            </span>
            <span className="text-2xl leading-snug font-bold break-keep">
              <T>{choice.text}</T>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-xl text-zinc-600">
        <T>{screenTexts.teachback.slowly}</T>
      </p>
    </>
  );
}

// 맞힘·틀림 결과를 또박이가 말해 준다.
function Result({
  pose,
  message,
  onNext,
}: {
  pose: Pose;
  message: string;
  onNext: () => void;
}) {
  return (
    <>
      <div role="status" className="mt-6">
        <TranslatedTtobagi pose={pose} message={message} />
      </div>
      <button
        type="button"
        onClick={onNext}
        className={`mt-4 ${buttonClass.primary}`}
      >
        <T>{screenTexts.teachback.next}</T> ▶
      </button>
    </>
  );
}

function Done({
  code,
  questions,
  needHelp,
}: {
  code: string;
  questions: Question[];
  needHelp: string[];
}) {
  return (
    <div className="text-center">
      <div role="status" className="mt-4 text-left">
        {needHelp.length === 0 ? (
          <TranslatedTtobagi pose="cheer" message={ttobagiSays.cheer} />
        ) : (
          <TranslatedTtobagi
            pose="explain"
            message={screenTexts.teachback.askNurse}
          />
        )}
      </div>
      <h1 className="text-3xl font-bold">
        <T>
          {needHelp.length === 0
            ? screenTexts.teachback.allGood
            : screenTexts.teachback.wellDone}
        </T>
      </h1>
      <ul className="mt-6 flex flex-col gap-2 rounded-3xl bg-stat-mint p-6 text-left text-2xl leading-relaxed">
        {questions.map((q) => (
          <li key={q.topic}>
            {needHelp.includes(q.topic) ? '❓' : '✅'} <T>{q.topic}</T>
          </li>
        ))}
      </ul>
      {needHelp.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <CallButton variant="outline" />
        </div>
      )}
      <div className="mt-8">
        <ButtonLink href={`/p/${code}/home`}>
          🏠 <T>{screenTexts.teachback.toHome}</T>
        </ButtonLink>
      </div>
      <p className="mt-4 text-xl text-zinc-600">
        <T>{screenTexts.teachback.reviewAnytime}</T>
      </p>
    </div>
  );
}
