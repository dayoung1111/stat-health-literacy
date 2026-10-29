'use client';

import { useState, type ReactNode } from 'react';

import type { Choice, Question } from '@/lib/demo-guide';

import { ButtonLink, CallButton, buttonClass } from '../../ui';

// 질문 → (틀리면) 다시 설명 → 다른 질문으로 재확인 → 다음 질문.
// 시연 단계에서는 결과를 저장하지 않는다. DB 단계에서 의료진 화면으로 보낸다.
type Step =
  | { kind: 'ask' }
  | { kind: 'correct' }
  | { kind: 'wrong'; picked: number }
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
      <p className="text-lg text-zinc-600">
        {step.kind === 'retry' || step.kind === 'retryResult'
          ? '다시 확인'
          : `질문 ${index + 1} / ${questions.length}`}
      </p>
      <div
        aria-hidden="true"
        className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200"
      >
        <div
          className="h-full bg-blue-700"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      {step.kind === 'ask' && (
        <Ask
          question={q.question}
          choices={q.choices}
          onPick={(i) =>
            setStep(
              q.choices[i].correct
                ? { kind: 'correct' }
                : { kind: 'wrong', picked: i },
            )
          }
        />
      )}

      {step.kind === 'correct' && (
        <Result correct onNext={next}>
          맞아요! 👏
        </Result>
      )}

      {step.kind === 'wrong' && (
        <>
          <Title>{q.question}</Title>
          <p className="mt-6 rounded-xl border-2 border-red-600 bg-red-50 p-4 text-xl font-bold">
            ✕ {q.choices[step.picked].text}
          </p>
          <div className="mt-4 rounded-2xl bg-red-50 p-5 text-xl leading-relaxed">
            <p>괜찮아요, 다시 볼게요 🙂</p>
            {q.explain.map((line) => (
              <p key={line} className="font-bold">
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep({ kind: 'retry' })}
            className={`mt-8 ${buttonClass.primary}`}
          >
            다른 질문으로 다시 확인 ▶
          </button>
        </>
      )}

      {step.kind === 'retry' && (
        <Ask
          question={q.retry.question}
          choices={q.retry.choices}
          onPick={(i) => {
            const correct = Boolean(q.retry.choices[i].correct);
            if (!correct) setNeedHelp([...needHelp, q.topic]);
            setStep({ kind: 'retryResult', correct });
          }}
        />
      )}

      {step.kind === 'retryResult' && (
        <Result correct={step.correct} onNext={next}>
          {step.correct ? (
            '맞아요! 👏'
          ) : (
            <>
              정답은 「{q.retry.choices.find((c) => c.correct)?.text}」예요.
              <br />
              간호사에게 꼭 다시 물어보세요.
            </>
          )}
        </Result>
      )}
    </>
  );
}

function Title({ children }: { children: string }) {
  return (
    <h1 className="mt-6 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
      {children}
    </h1>
  );
}

function Ask({
  question,
  choices,
  onPick,
}: {
  question: string;
  choices: Choice[];
  onPick: (index: number) => void;
}) {
  return (
    <>
      <Title>{question}</Title>
      <div className="mt-6 flex flex-col gap-3">
        {choices.map((choice, i) => (
          <button
            key={choice.text}
            type="button"
            onClick={() => onPick(i)}
            className="min-h-16 rounded-xl border-2 border-zinc-300 bg-white px-5 py-3 text-left text-xl font-bold hover:border-blue-700 focus-visible:outline-4 focus-visible:outline-blue-700"
          >
            {choice.text}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-lg text-zinc-600">
        천천히 골라 주세요
      </p>
    </>
  );
}

function Result({
  correct,
  onNext,
  children,
}: {
  correct: boolean;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <p
        role="status"
        className={`mt-6 rounded-2xl p-6 text-2xl leading-relaxed font-bold ${
          correct ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
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
      <p aria-hidden="true" className="mt-8 text-6xl">
        🎉
      </p>
      <h1 className="mt-4 text-3xl font-bold">
        {needHelp.length === 0 ? '모두 이해하셨어요!' : '끝까지 잘하셨어요!'}
      </h1>
      <ul className="mt-6 rounded-2xl bg-green-50 p-5 text-left text-xl leading-relaxed">
        {questions.map((q) => (
          <li key={q.topic}>
            {needHelp.includes(q.topic) ? '❓' : '✓'} {q.topic}
          </li>
        ))}
      </ul>
      {needHelp.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xl">❓ 표시는 간호사에게 다시 물어보세요.</p>
          <CallButton variant="outline" />
        </div>
      )}
      <div className="mt-8">
        <ButtonLink href={`/p/${code}/home`}>홈으로</ButtonLink>
      </div>
      <p className="mt-4 text-lg text-zinc-600">헷갈리면 언제든 다시 보세요</p>
    </div>
  );
}
