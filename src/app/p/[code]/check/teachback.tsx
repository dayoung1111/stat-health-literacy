'use client';

import { useState, type ReactNode } from 'react';

import type { Choice, Question } from '@/lib/demo-guide';

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
        <Result tone="good" onNext={next}>
          맞아요! 👏
        </Result>
      )}

      {step.kind === 'wrong' && (
        <>
          <p
            role="status"
            className="mt-6 text-3xl leading-snug font-bold break-keep"
          >
            괜찮아요,
            <br />
            같이 다시 볼게요 🙂
          </p>
          <div className="mt-5 rounded-3xl bg-amber-100 p-6">
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
        <Result tone={step.correct ? 'good' : 'soft'} onNext={next}>
          {step.correct ? (
            '맞아요! 👏'
          ) : (
            <>
              정답은
              <br />「{q.retry.choices.find((c) => c.correct)?.text}」예요.
              <br />
              간호사 선생님께 한 번 더 여쭤봐요 🙂
            </>
          )}
        </Result>
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
        className="text-2xl tracking-widest text-blue-700"
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
            className="flex min-h-24 items-center gap-5 rounded-3xl border-2 border-sky-200 bg-white px-5 py-4 text-left shadow-sm hover:border-blue-700 hover:bg-sky-50 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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

function Result({
  tone,
  onNext,
  children,
}: {
  tone: 'good' | 'soft';
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <p
        role="status"
        className={`mt-6 rounded-3xl p-8 text-center text-3xl leading-snug font-bold break-keep ${
          tone === 'good'
            ? 'bg-green-100 text-green-900'
            : 'bg-amber-100 text-amber-900'
        }`}
      >
        {children}
      </p>
      <button
        type="button"
        onClick={onNext}
        className={`mt-8 ${buttonClass.primary}`}
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
      <p aria-hidden="true" className="mt-8 text-7xl">
        🎉
      </p>
      <h1 className="mt-4 text-3xl font-bold">
        {needHelp.length === 0 ? '모두 잘 이해하셨어요!' : '끝까지 잘하셨어요!'}
      </h1>
      <ul className="mt-6 flex flex-col gap-2 rounded-3xl bg-green-100 p-6 text-left text-2xl leading-relaxed">
        {questions.map((q) => (
          <li key={q.topic}>
            {needHelp.includes(q.topic) ? '❓' : '✅'} {q.topic}
          </li>
        ))}
      </ul>
      {needHelp.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xl">❓ 표시는 간호사 선생님께 다시 여쭤봐요 🙂</p>
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
