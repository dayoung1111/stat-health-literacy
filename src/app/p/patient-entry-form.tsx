'use client';

import { useActionState, useRef, useState } from 'react';

import { enterPatient, type EntryState } from './actions';
import { buttonClass } from './ui';

// 코드가 주어지면(문자 링크) 생년월일 칸만 보여 준다.
export function PatientEntryForm({ code }: { code?: string }) {
  const [state, formAction, pending] = useActionState<EntryState, FormData>(
    enterPatient,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {code ? (
        <input type="hidden" name="code" value={code} />
      ) : (
        <DigitBoxes
          name="code"
          label="교육 번호 6자리"
          hint="병원에서 받은 종이에 적혀 있어요"
          error={state.fieldErrors?.code}
        />
      )}
      <DigitBoxes
        name="birthDate"
        label="생년월일 6자리"
        hint="예: 1985년 7월 4일 → 850704"
        error={state.fieldErrors?.birthDate}
      />
      {state.message && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-lg font-semibold text-red-700"
        >
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? '확인 중…' : '확인 ▶'}
      </button>
    </form>
  );
}

const length = 6;

// 숫자 한 칸씩 6칸. 입력하면 다음 칸으로, 지우면 앞 칸으로 이동하고 붙여 넣기도 나눠 채운다.
function DigitBoxes({
  name,
  label,
  hint,
  error,
}: {
  name: string;
  label: string;
  hint: string;
  error?: string;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const labelId = `${name}-label`;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  function fill(start: number, text: string) {
    const typed = text
      .replace(/\D/g, '')
      .slice(0, length - start)
      .split('');
    if (typed.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      typed.forEach((digit, i) => (next[start + i] = digit));
      return next;
    });
    boxes.current[Math.min(start + typed.length, length - 1)]?.focus();
  }

  function clear(index: number) {
    setDigits((prev) => prev.map((digit, i) => (i === index ? '' : digit)));
  }

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId}>
      <p id={labelId} className="text-xl font-bold">
        {label}
      </p>
      <p id={hintId} className="mt-1 text-lg text-zinc-600">
        {hint}
      </p>
      <input type="hidden" name={name} value={digits.join('')} />
      <div className="mt-3 flex gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${label} ${i + 1}번째 숫자`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) =>
              e.target.value === ''
                ? clear(i)
                : fill(i, e.target.value.slice(-1))
            }
            onPaste={(e) => {
              e.preventDefault();
              fill(i, e.clipboardData.getData('text'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && digit === '' && i > 0) {
                clear(i - 1);
                boxes.current[i - 1]?.focus();
              }
            }}
            className="h-16 w-full min-w-0 flex-1 rounded-xl border-2 border-blue-700 bg-white text-center font-mono text-3xl font-bold focus-visible:outline-4 focus-visible:outline-blue-200 aria-invalid:border-red-600"
          />
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-lg text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
