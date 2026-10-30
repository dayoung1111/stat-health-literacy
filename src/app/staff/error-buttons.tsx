'use client';

import { useState, useTransition } from 'react';

import { resolveErrorAction, resolveErrorGroupAction } from './error-actions';

// 오류 기록의 ✅ 해결함 버튼. 권한은 서버(error-actions.ts)가 누를 때마다 다시 확인한다.
export function ResolveButton(
  props: { id: string } | { place: string; kind: string; count: number },
) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const isGroup = 'place' in props;

  function run() {
    if (
      isGroup &&
      !window.confirm(
        `"${props.place}"의 해결 안 된 오류 ${props.count}건을 모두 해결함으로 바꿀까요?`,
      )
    ) {
      return;
    }
    setMessage('');
    start(async () => {
      const result = isGroup
        ? await resolveErrorGroupAction(props.place, props.kind)
        : await resolveErrorAction(props.id);
      if (!result.ok) setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={run}
        className="inline-flex min-h-10 items-center rounded-lg border-2 border-green-700 bg-white px-3 text-base font-semibold whitespace-nowrap text-green-800 hover:bg-green-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? '바꾸는 중…' : isGroup ? '✅ 모두 해결함' : '✅ 해결함'}
      </button>
      {message && (
        <span role="status" className="text-sm text-red-700">
          {message}
        </span>
      )}
    </div>
  );
}
