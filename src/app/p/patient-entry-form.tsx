'use client';

import {
  Fragment,
  useActionState,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';

import { useLanguageOr } from '../language-provider';
import { enterPatient, type EntryState } from './actions';
import { LineIcon } from './screen-design';

// 코드가 주어지면(문자 링크) 생년월일 칸만 보여 준다.
// 교육 번호 6칸과 생년월일 6칸은 하나로 이어진다: 다 채우면 다음 묶음으로, 빈 첫 칸에서 지우면 앞 묶음으로.
// 생년월일까지 다 채우면 [확인] 버튼으로 옮겨 가기만 하고, 제출은 환자가 직접 누른다.
export function PatientEntryForm({
  code,
  language = 'ko',
}: {
  code?: string;
  /** 의료진이 코드를 발급할 때 고른 언어. 환자가 직접 고른 언어가 있으면 그게 먼저다. */
  language?: string;
}) {
  const [state, formAction, pending] = useActionState<EntryState, FormData>(
    enterPatient,
    {},
  );
  const { t } = useLanguageOr(language);
  const codeBoxes = useRef<DigitBoxesHandle>(null);
  const birthBoxes = useRef<DigitBoxesHandle>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const error = state.error;
  const message =
    error?.kind === 'locked'
      ? t.entry.locked
      : error?.kind === 'wrong'
        ? t.entry.wrong(error.remaining)
        : null;

  return (
    <form
      action={formAction}
      className="sd sd-card flex flex-col gap-7 p-5 sm:p-6"
    >
      {code ? (
        <input type="hidden" name="code" value={code} />
      ) : (
        <DigitBoxes
          ref={codeBoxes}
          name="code"
          groups={[3]}
          label={t.entry.codeLabel}
          hint={t.entry.codeHint}
          boxLabel={t.entry.codeDigit}
          error={state.fieldErrors?.code ? t.entry.sixDigits : undefined}
          onFull={(rest) => birthBoxes.current?.enter(rest)}
          onAfterLast={() => birthBoxes.current?.focusFirst()}
        />
      )}
      <DigitBoxes
        ref={birthBoxes}
        name="birthDate"
        groups={[2, 4]}
        label={t.entry.birthLabel}
        hint={t.entry.birthHint}
        boxLabel={t.entry.birthDigit}
        error={state.fieldErrors?.birthDate ? t.entry.sixDigits : undefined}
        onFull={() => submit.current?.focus()}
        onBeforeFirst={() => codeBoxes.current?.focusLast()}
        onEraseBeforeFirst={() => codeBoxes.current?.eraseLast()}
      />
      {message && (
        <p
          role="alert"
          className="rounded-2xl border-[1.5px] border-[#F1C4C6] bg-[#FBECED] p-5 text-xl font-semibold text-[#D9363E]"
        >
          {message}
        </p>
      )}
      <button
        ref={submit}
        type="submit"
        disabled={pending}
        className="sd-primary sd-focus flex min-h-18 w-full items-center justify-center text-2xl font-bold"
      >
        {pending ? t.entry.checking : t.entry.submit}
      </button>
      <p className="flex items-start gap-2 text-lg leading-snug break-keep text-zinc-600">
        <LineIcon name="lock" className="mt-0.5 size-5 shrink-0" />
        {t.entry.privacy}
      </p>
    </form>
  );
}

const length = 6;

/** 앞·뒤 묶음이 이 묶음의 칸을 움직일 때 쓰는 손잡이 */
type DigitBoxesHandle = {
  /** 첫 칸부터 숫자를 채운다(앞 묶음에서 넘친 붙여 넣기). 숫자가 없으면 첫 칸으로만 간다. */
  enter: (text: string) => void;
  focusFirst: () => void;
  focusLast: () => void;
  /** 마지막 칸의 숫자를 지우고 그 칸으로 간다(뒤 묶음 첫 칸에서 백스페이스). */
  eraseLast: () => void;
};

// 숫자 한 칸씩 6칸(groups 자리 앞에 줄표만 보여 준다. 예: [3] → 123-456). 숫자를 넣으면 다음 칸으로, 빈 칸에서 지우면 앞 칸으로, 화살표로 좌우 이동,
// 붙여 넣으면 나눠 채운다. 숫자가 아닌 글자는 받지 않는다.
function DigitBoxes({
  ref,
  name,
  groups = [],
  label,
  hint,
  boxLabel,
  error,
  onFull,
  onAfterLast,
  onBeforeFirst,
  onEraseBeforeFirst,
}: {
  ref: Ref<DigitBoxesHandle>;
  name: string;
  /** 이 자리 앞에 줄표를 보여 준다(보이기만 하고 입력에는 영향 없음). */
  groups?: number[];
  label: string;
  hint: string;
  /** 칸마다 읽어 줄 이름(예: "교육 번호 1번째 자리") */
  boxLabel: (n: number) => string;
  error?: string;
  /** 마지막 칸까지 찼을 때. 붙여 넣기에서 남은 숫자를 함께 넘긴다. */
  onFull?: (rest: string) => void;
  /** 마지막 칸에서 → */
  onAfterLast?: () => void;
  /** 첫 칸에서 ← */
  onBeforeFirst?: () => void;
  /** 비어 있는 첫 칸에서 백스페이스 */
  onEraseBeforeFirst?: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const labelId = `${name}-label`;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const focusBox = (i: number) => boxes.current[i]?.focus();

  // start 칸부터 숫자를 채운다. 칸이 다 차면 onFull로 다음 묶음에 넘기고, 남은 숫자도 넘긴다.
  function fill(start: number, text: string) {
    const typed = text.replace(/\D/g, '');
    if (typed.length === 0) return;
    // 6자리 이상을 붙여 넣으면 어느 칸에 붙였든 첫 칸부터 채운다.
    const from = typed.length >= length ? 0 : start;
    const used = typed.slice(0, length - from).split('');
    setDigits((prev) => {
      const next = [...prev];
      used.forEach((digit, i) => (next[from + i] = digit));
      return next;
    });
    const end = from + used.length;
    if (end >= length) onFull?.(typed.slice(used.length));
    else focusBox(end);
  }

  function clear(index: number) {
    setDigits((prev) => prev.map((digit, i) => (i === index ? '' : digit)));
  }

  useImperativeHandle(ref, () => ({
    enter: (text) => {
      if (text.replace(/\D/g, '')) fill(0, text);
      else focusBox(0);
    },
    focusFirst: () => focusBox(0),
    focusLast: () => focusBox(length - 1),
    eraseLast: () => {
      clear(length - 1);
      focusBox(length - 1);
    },
  }));

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId}>
      <p id={labelId} className="text-2xl font-bold">
        {label}
      </p>
      <p id={hintId} className="mt-1 text-xl text-zinc-600">
        {hint}
      </p>
      <input type="hidden" name={name} value={digits.join('')} />
      <div className="mt-3 flex gap-1.5">
        {digits.map((digit, i) => (
          <Fragment key={i}>
            {groups.includes(i) && (
              <span aria-hidden="true" className="sd-dash">
                -
              </span>
            )}
            <input
              ref={(el) => {
                boxes.current[i] = el;
              }}
              value={digit}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-label={boxLabel(i + 1)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              // 칸에 들어가면 있던 숫자를 골라 두어, 새 숫자를 넣으면 바로 바뀐다.
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return clear(i);
                // 숫자가 아닌 글자는 무시한다(칸은 그대로).
                const typed = value.replace(/\D/g, '');
                if (typed) fill(i, typed.slice(-1));
              }}
              onPaste={(e) => {
                e.preventDefault();
                fill(i, e.clipboardData.getData('text'));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && digit === '') {
                  e.preventDefault();
                  if (i > 0) {
                    clear(i - 1);
                    focusBox(i - 1);
                  } else {
                    onEraseBeforeFirst?.();
                  }
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  if (i > 0) focusBox(i - 1);
                  else onBeforeFirst?.();
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  if (i < length - 1) focusBox(i + 1);
                  else onAfterLast?.();
                }
              }}
              className="h-16 w-full min-w-0 flex-1 rounded-xl border-[1.5px] border-[#CAD6D6] bg-[#F3F6F5] text-center font-mono text-3xl font-bold focus-visible:border-[#0F6670] focus-visible:bg-white focus-visible:outline-4 focus-visible:outline-[#DCEDEE] aria-invalid:border-[#D9363E]"
            />
          </Fragment>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xl text-[#D9363E]">
          {error}
        </p>
      )}
    </div>
  );
}
