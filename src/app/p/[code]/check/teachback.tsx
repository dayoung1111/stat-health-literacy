'use client';

import { useState } from 'react';

import type { Choice, Question } from '@/lib/demo-guide';
import { ttobagiSays } from '@/lib/ttobagi-says';

import { Ttobagi, type Pose } from '../../../ttobagi';

import { Drawing, PictureRow } from '../../pictures';
import { buttonClass, ButtonLink, CallButton } from '../../ui';

// 질문 → (틀리면) 그림으로 다시 설명 → 다른 질문으로 재확인 → 다음 질문.
// 시연 단계에서는 결과를 저장하지 않는다. DB 단계에서 의료진 화면으로 보낸다.
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
          onPick={(choice) =>
            setStep({ kind: choice.correct ? 'correct' : 'wrong' })
          }
        />
      )}

      {step.kind === 'correct' && (
        <Result pose="cheer" message={ttobagiSays.cheer} onNext={next} />
      )}

      {step.kind === 'wrong' && (
        <>
          <div role="status" className="mt-4">
            <Ttobagi pose="explain" message={ttobagiSays.retry} />
          </div>
          <div className="mt-2 rounded-3xl bg-stat-sun p-6">
            <PictureRow pictures={q.explain.pictures} />
            <div className="mt-5 text-center">
              {q.explain.lines.map((line) => (
                <p
                  key={line}
                  className="text-2xl leading-relaxed font-bold break-keep"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep({ kind: 'retry' })}
            className={`mt-8 ${buttonClass.primary}`}
          >
            한 번 더 볼까요? ▶
          </button>
        </>
      )}

      {step.kind === 'retry' && (
        <Ask
          intro="다른 질문으로 한 번 더 볼게요"
          question={q.retry.question}
          choices={q.retry.choices}
          onPick={(choice) => {
            const correct = Boolean(choice.correct);
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
              : `정답은 「${q.retry.choices.find((c) => c.correct)?.text}」예요. 간호사 선생님께 한 번 더 여쭤봐요.`
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
        <span className="sr-only">질문 {total}개 중 </span>
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
      {intro && <p className="mt-4 text-xl text-zinc-700">{intro} 🙂</p>}
      <h1 className="mt-4 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
        {question}
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
              {choice.text}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-xl text-zinc-600">
        천천히 골라 주세요
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
        <Ttobagi pose={pose} message={message} />
      </div>
      <button
        type="button"
        onClick={onNext}
        className={`mt-4 ${buttonClass.primary}`}
      >
        다음 ▶
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
          <Ttobagi pose="cheer" message={ttobagiSays.cheer} />
        ) : (
          <Ttobagi
            pose="explain"
            message="❓ 표시는 간호사 선생님께 여쭤봐요."
          />
        )}
      </div>
      <h1 className="text-3xl font-bold">
        {needHelp.length === 0 ? '모두 잘 이해하셨어요!' : '끝까지 잘하셨어요!'}
      </h1>
      <ul className="mt-6 flex flex-col gap-2 rounded-3xl bg-stat-mint p-6 text-left text-2xl leading-relaxed">
        {questions.map((q) => (
          <li key={q.topic}>
            {needHelp.includes(q.topic) ? '❓' : '✅'} {q.topic}
          </li>
        ))}
      </ul>
      {needHelp.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <CallButton variant="outline" />
        </div>
      )}
      <div className="mt-8">
        <ButtonLink href={`/p/${code}/home`}>🏠 홈으로</ButtonLink>
      </div>
      <p className="mt-4 text-xl text-zinc-600">헷갈리면 언제든 다시 보세요</p>
    </div>
  );
}
