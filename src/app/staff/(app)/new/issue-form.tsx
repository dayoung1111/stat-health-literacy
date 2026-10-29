'use client';

import {
  startTransition,
  useActionState,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { guideCatalog, guideNames, type GuideKind } from '@/lib/guide-catalog';
import { ages, extras, languages, levels } from '@/lib/staff-options';

import { GuideIconSvg } from '../../../guide-icon';
import { issueCode, type IssueState } from '../../actions';
import { Notice, Panel, StaffBack, staffButton } from '../../ui';

type AgeId = (typeof ages)[number]['id'];
type LevelId = (typeof levels)[number]['id'];
type Step = 'guides' | 'patient' | 'date';

// ① 보낼 안내 고르기(여러 개) → ② 환자 맞춤 설정(한 번만, 고른 안내 전체에 적용) → ③ 검사일·생년월일.
// 세 단계를 한 폼에서 단계만 바꿔 보여 준다. 숨긴 단계의 선택값도 함께 제출된다.
// 오류가 나도 입력값이 지워지지 않도록 폼 자동 초기화 없이 직접 제출한다.
export function IssueForm() {
  const [step, setStep] = useState<Step>('guides');
  const [guides, setGuides] = useState<GuideKind[]>([]);
  const [age, setAge] = useState<AgeId | null>(null);
  const [level, setLevel] = useState<LevelId>('normal');
  const [state, formAction, pending] = useActionState<IssueState, FormData>(
    issueCode,
    {},
  );

  const toggle = (kind: GuideKind) =>
    setGuides((list) =>
      list.includes(kind) ? list.filter((k) => k !== kind) : [...list, kind],
    );
  // 화면에 보여 줄 순서는 목록 순서를 따른다.
  const chosen = (Object.keys(guideCatalog) as GuideKind[]).filter((k) =>
    guides.includes(k),
  );
  const recommended = ages.find((a) => a.id === age)?.level;
  const summary = [
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
      {step === 'guides' && <StaffBack href="/" />}
      {step === 'patient' && <StaffBack onClick={() => setStep('guides')} />}
      {step === 'date' && <StaffBack onClick={() => setStep('patient')} />}

      <div hidden={step !== 'guides'}>
        <Panel title="① 보낼 안내 고르기">
          <h2 className="mb-2 text-2xl font-bold">어떤 안내를 보낼까요?</h2>
          <p className="mb-6 text-base text-zinc-600">
            여러 개를 고를 수 있어요. 고른 안내는 코드 1개·QR 1개·링크 1개로
            함께 보내요.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <GuideCheck kind="checkup" checked={guides} onToggle={toggle} />
            <fieldset className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 bg-white p-4">
              <legend className="flex items-center gap-2 px-1 text-xl font-bold">
                <span className="text-blue-700">
                  <GuideIconSvg name="endoscope" className="size-9" />
                </span>
                내시경
              </legend>
              <GuideCheck
                kind="colonoscopy"
                checked={guides}
                onToggle={toggle}
                compact
              />
              <GuideCheck
                kind="gastroscopy"
                checked={guides}
                onToggle={toggle}
                compact
              />
            </fieldset>
            <GuideCheck kind="medication" checked={guides} onToggle={toggle} />
          </div>
          <Notice>
            「환자 화면 준비 중」 안내도 보낼 수 있어요. 환자에게는 &quot;안내
            내용 준비 중이에요&quot;로 보여요.
          </Notice>
          <button
            type="button"
            disabled={guides.length === 0}
            onClick={() => setStep('patient')}
            className={`mt-6 ${staffButton.primary}`}
          >
            {guides.length === 0
              ? '안내를 하나 이상 골라 주세요'
              : `${guides.length}개 고름 · 다음 ▶`}
          </button>
        </Panel>
      </div>

      <div hidden={step !== 'patient'}>
        <Panel title={`② 환자 맞춤 설정 — ${guideNames(chosen).join(' + ')}`}>
          <p className="mb-5 text-base text-zinc-600">
            한 번만 고르면 고른 안내 전체에 똑같이 적용돼요.
          </p>
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

          {guides.includes('medication') && (
            <Notice>
              💊 복용약·영양제 안내는 나이대와 상관없이{' '}
              <strong>항상 전체 목록</strong>을 보내요. 언어·큰 글씨만 적용돼요.
            </Notice>
          )}
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
        <Panel title={`③ ${guideNames(chosen).join(' + ')} · ${summary}`}>
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

// 안내 하나를 체크하는 큰 타일. 아이콘은 SVG.
function GuideCheck({
  kind,
  checked,
  onToggle,
  compact = false,
}: {
  kind: GuideKind;
  checked: GuideKind[];
  onToggle: (kind: GuideKind) => void;
  compact?: boolean;
}) {
  const guide = guideCatalog[kind];
  const isChecked = checked.includes(kind);
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border-2 bg-white hover:border-blue-400 has-checked:border-blue-700 has-checked:bg-blue-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-700 ${
        compact
          ? 'items-center border-zinc-200 px-3 py-3'
          : 'h-full min-h-40 flex-col items-center justify-center border-zinc-300 px-4 py-5 text-center'
      }`}
    >
      <input
        type="checkbox"
        name="guides"
        value={kind}
        checked={isChecked}
        onChange={() => onToggle(kind)}
        className="size-6 shrink-0 accent-blue-700"
      />
      {!compact && (
        <span className="text-blue-700">
          <GuideIconSvg name={guide.icon} />
        </span>
      )}
      {compact && (
        <span className="text-blue-700">
          <GuideIconSvg name={guide.icon} className="size-8" />
        </span>
      )}
      <span className="flex flex-col gap-1">
        <span className="text-xl font-bold break-keep">{guide.name}</span>
        {guide.hint && (
          <span className="text-base break-keep text-zinc-600">
            {guide.hint}
          </span>
        )}
        {!guide.ready && (
          <span className="text-sm font-semibold text-amber-800">
            환자 화면 준비 중
          </span>
        )}
      </span>
    </label>
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
