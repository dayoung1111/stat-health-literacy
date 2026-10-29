'use client';

import { useState, useTransition } from 'react';

import {
  adviceLabels,
  medications,
  type Medication,
  type MedicationAdvice,
  type MedicationId,
} from '@/lib/medication-guide';

import { saveMyMedications } from '../../records';

// "내가 먹는 약"을 체크하면 그 약만 위에 크게 보여 주고, 체크 결과를 저장한다(의료진 코드 상세에 보임).
export function MedicationCheck({
  code,
  initial,
}: {
  code: string;
  initial: MedicationId[];
}) {
  const [mine, setMine] = useState<MedicationId[]>(initial);
  const [saved, setSaved] = useState<'saved' | 'failed' | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: MedicationId) {
    const next = mine.includes(id)
      ? mine.filter((m) => m !== id)
      : [...mine, id];
    setMine(next);
    setSaved(null);
    startTransition(async () => {
      const result = await saveMyMedications(code, next);
      setSaved(result.ok ? 'saved' : 'failed');
    });
  }

  const myList = medications.filter((m) => mine.includes(m.id));

  return (
    <>
      {myList.length > 0 && (
        <section aria-labelledby="mine-title" className="mt-6">
          <h2 id="mine-title" className="mb-3 text-2xl font-bold">
            내가 먹는 약
          </h2>
          <ul className="flex flex-col gap-4">
            {myList.map((m) => (
              <li
                key={m.id}
                className="rounded-3xl border-2 border-stat-green bg-white p-5 shadow-sm"
              >
                <p className="flex items-center gap-3 text-3xl font-bold">
                  <span aria-hidden="true" className="text-5xl">
                    {m.emoji}
                  </span>
                  {m.name}
                </p>
                {m.example && (
                  <p className="mt-1 text-xl text-zinc-600">{m.example}</p>
                )}
                <AdviceSlots medication={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p
        role="status"
        className="mt-4 min-h-7 text-xl font-bold text-stat-green"
      >
        {pending
          ? '저장하는 중…'
          : saved === 'saved'
            ? '✓ 저장했어요. 간호사 선생님도 볼 수 있어요.'
            : saved === 'failed'
              ? '저장하지 못했어요. 다시 눌러 주세요.'
              : ''}
      </p>

      <fieldset className="mt-2">
        <legend className="mb-3 text-2xl font-bold">
          드시는 약에 모두 체크해 주세요
        </legend>
        <div className="flex flex-col gap-3">
          {medications.map((m) => (
            <label
              key={m.id}
              className="flex min-h-20 cursor-pointer items-center gap-4 rounded-3xl border-2 border-zinc-300 bg-white px-5 py-3 has-checked:border-stat-green has-checked:bg-stat-mint has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-stat-green"
            >
              <input
                type="checkbox"
                checked={mine.includes(m.id)}
                onChange={() => toggle(m.id)}
                className="size-8 shrink-0 accent-stat-green"
              />
              <span aria-hidden="true" className="text-4xl">
                {m.emoji}
              </span>
              <span className="flex flex-col">
                <span className="text-2xl font-bold">{m.name}</span>
                {m.example && (
                  <span className="text-xl text-zinc-600">{m.example}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

const slotOrder: MedicationAdvice[] = ['ok', 'stop', 'ask'];

// 약마다 "드셔도 돼요 / 드시면 안 돼요(언제부터) / 의료진과 상의하세요" 칸.
// 검수 필요: 내용이 정해지기 전에는 어느 칸도 고르지 않고 "검수 필요"로 보여 준다.
function AdviceSlots({ medication }: { medication: Medication }) {
  return (
    <ul className="mt-4 grid gap-2">
      {slotOrder.map((slot) => {
        const active = medication.advice === slot;
        return (
          <li
            key={slot}
            className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xl ${
              active ? 'bg-stat-green text-white' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            <span className="font-bold">
              {adviceLabels[slot]}
              {slot === 'stop' && ' (언제부터)'}
            </span>
            <span className="shrink-0 text-lg whitespace-nowrap">
              {medication.advice === null
                ? '검수 필요'
                : active && slot === 'stop'
                  ? medication.when
                  : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
