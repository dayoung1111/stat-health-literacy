'use client';

import Link from 'next/link';
import {
  startTransition,
  useActionState,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import {
  ages,
  extras,
  languages,
  levels,
  type Exam,
} from '@/lib/staff-options';

import { issueCode, type IssueState } from '../../../actions';
import { Notice, Panel, staffButton } from '../../../ui';

type AgeId = (typeof ages)[number]['id'];
type LevelId = (typeof levels)[number]['id'];

// ②와 ③을 한 폼에서 단계만 바꿔 보여 준다. 숨긴 단계의 선택값도 함께 제출된다.
// 오류가 나도 입력값이 지워지지 않도록 폼 자동 초기화 없이 직접 제출한다.
export function IssueForm({ exam }: { exam: Exam }) {
  const [step, setStep] = useState<'patient' | 'date'>('patient');
  const [age, setAge] = useState<AgeId | null>(null);
  const [level, setLevel] = useState<LevelId>('normal');
  const [state, formAction, pending] = useActionState<IssueState, FormData>(
    issueCode,
    {},
  );

  const recommended = ages.find((a) => a.id === age)?.level;
  const summary = [
    exam.name,
    ages.find((a) => a.id === age)?.label,
    levels.find((l) => l.id === level)?.short,
  ].join(' · ');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="exam" value={exam.id} />

      <div hidden={step !== 'patient'}>
        <Panel
          title={`② 환자 고르기 — ${exam.name}`}
          action={
            <Link href="/staff/new" className="text-white hover:underline">
              ← 뒤로
            </Link>
          }
        >
          <ChipGroup legend="나이대">
            {ages.map((a) => (
              <Chip
                key={a.id}
                type="radio"
                name="age"
                value={a.id}
                checked={age === a.id}
                onChange={() => {
                  setAge(a.id);
                  setLevel(a.level);
                }}
              >
                {a.label}
              </Chip>
            ))}
          </ChipGroup>

          <ChipGroup legend="언어">
            {languages.map((l) => (
              <Chip
                key={l.id}
                type="radio"
                name="language"
                value={l.id}
                defaultChecked={l.id === 'ko'}
              >
                {l.label}
              </Chip>
            ))}
          </ChipGroup>

          <ChipGroup
            legend="설명 단계"
            badge={
              recommended && recommended === level ? '자동 추천' : undefined
            }
          >
            {levels.map((l) => (
              <Chip
                key={l.id}
                type="radio"
                name="level"
                value={l.id}
                checked={level === l.id}
                onChange={() => setLevel(l.id)}
              >
                {l.label}
              </Chip>
            ))}
          </ChipGroup>

          <ChipGroup legend="필요하면 체크">
            {extras.map((e) => (
              <Chip key={e.id} type="checkbox" name="extras" value={e.id}>
                {e.label}
              </Chip>
            ))}
          </ChipGroup>

          <Notice>
            간호사가 보고 바꿀 수 있음 · 기본값 그대로면 바로 다음
          </Notice>
          <button
            type="button"
            disabled={!age}
            onClick={() => setStep('date')}
            className={`mt-6 ${staffButton.primary}`}
          >
            {age ? '다음 ▶' : '나이대를 먼저 골라 주세요'}
          </button>
        </Panel>
      </div>

      <div hidden={step !== 'date'}>
        <Panel
          title={`③ ${summary}`}
          action={
            <button
              type="button"
              onClick={() => setStep('patient')}
              className="text-white hover:underline"
            >
              ← 뒤로
            </button>
          }
        >
          <div className="flex flex-col gap-5">
            <Field
              id="examDate"
              label="검사일"
              error={state.fieldErrors?.examDate}
            >
              <input
                id="examDate"
                name="examDate"
                type="date"
                aria-invalid={state.fieldErrors?.examDate ? true : undefined}
                aria-describedby={
                  state.fieldErrors?.examDate ? 'examDate-error' : undefined
                }
                className={inputClass}
              />
            </Field>
            <Field
              id="birthDate"
              label="환자 생년월일 (본인 확인용)"
              error={state.fieldErrors?.birthDate}
            >
              <input
                id="birthDate"
                name="birthDate"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                placeholder="예: 590312"
                aria-invalid={state.fieldErrors?.birthDate ? true : undefined}
                aria-describedby={
                  state.fieldErrors?.birthDate ? 'birthDate-error' : undefined
                }
                className={inputClass}
              />
            </Field>
            {state.message && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 font-semibold text-red-700"
              >
                {state.message}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={staffButton.primary}
            >
              {pending ? '발급 중…' : '코드 발급 ▶'}
            </button>
          </div>
          <Notice>
            🔒 이름·등록번호·전화번호 <strong>받지 않음</strong>
            <br />
            생년월일은 암호화 저장 · EMR 연결 필요 없음
          </Notice>
        </Panel>
      </div>
    </form>
  );
}

const inputClass =
  'mt-1 block w-full rounded-lg border-2 border-zinc-300 px-4 py-3 text-lg focus-visible:border-blue-700 focus-visible:outline-none aria-invalid:border-red-600';

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-base text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function ChipGroup({
  legend,
  badge,
  children,
}: {
  legend: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 flex items-center gap-2 text-base font-semibold text-zinc-700">
        {legend}
        {badge && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-bold text-green-800">
            {badge}
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({
  children,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input {...input} className="peer sr-only" />
      <span className="inline-flex min-h-11 items-center rounded-full border-2 border-zinc-300 bg-white px-4 text-base font-bold peer-checked:border-blue-700 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700 hover:border-blue-400">
        {children}
      </span>
    </label>
  );
}
