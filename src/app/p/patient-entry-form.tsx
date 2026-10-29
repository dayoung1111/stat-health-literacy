'use client';

import { useActionState, useRef, useState } from 'react';

import type { TextId } from '@/lib/i18n';

import { useText } from '../language';
import { enterPatient, type EntryState } from './actions';
import { buttonClass } from './ui';

// 코드가 주어지면(문자 링크) 생년월일 칸만 보여 준다.
export function PatientEntryForm({ code }: { code?: string }) {
  const [state, formAction, pending] = useActionState<EntryState, FormData>(
    enterPatient,
    {},
  );
  const { t } = useText();

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {code ? (
        <input type="hidden" name="code" value={code} />
      ) : (
        <DigitBoxes
          name="code"
          label="entry.codeLabel"
          hint="entry.codeHint"
          error={state.fieldErrors?.code}
        />
      )}
      <DigitBoxes
        name="birthDate"
        label="entry.birthLabel"
        hint="entry.birthHint"
        error={state.fieldErrors?.birthDate}
      />
      {state.message && (
        <p
          role="alert"
          className="rounded-3xl bg-stat-alert-soft p-5 text-xl font-semibold text-stat-alert"
        >
          {t(state.message.id, state.message.vars)}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? t('entry.checking') : t('entry.submit')}
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
  label: TextId;
  hint: TextId;
  error?: TextId;
}) {
  const { t } = useText();
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
      <p id={labelId} className="text-2xl font-bold">
        {t(label)}
      </p>
      <p id={hintId} className="mt-1 text-xl text-zinc-600">
        {t(hint)}
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
            aria-label={t('entry.digit', { label: t(label), n: i + 1 })}
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
            className="h-16 w-full min-w-0 flex-1 rounded-xl border-2 border-stat-green bg-white text-center font-mono text-3xl font-bold focus-visible:outline-4 focus-visible:outline-stat-mint aria-invalid:border-stat-alert"
          />
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xl text-stat-alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
