'use client';

import { useState, useTransition } from 'react';

import {
  discardCodeAction,
  resetDemoRecordsAction,
  unlockCodeAction,
  type CodeActionResult,
} from './actions';

// 관리자 화면·내 코드 목록의 코드 관리 버튼. 권한은 서버(actions.ts)가 누를 때마다 다시 확인한다.
// 지우는 버튼(초기화·폐기)은 누르기 전에 한 번 묻는다. 누르는 동안에는 다시 누를 수 없다.

const smallButton =
  'inline-flex min-h-10 items-center rounded-lg border-2 px-3 text-base font-semibold whitespace-nowrap focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50';

function useCodeAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const run = (action: () => Promise<CodeActionResult>, ask?: string) => {
    if (ask && !window.confirm(ask)) return;
    setMessage('');
    start(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.message);
    });
  };
  return { pending, message, run };
}

/** 🔄 시연 기록 초기화(관리자 통계 칸) */
export function ResetDemoButton() {
  const { pending, message, run } = useCodeAction();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            resetDemoRecordsAction,
            '정말 지울까요?\n시연 코드(000000·482917·777777·DEMO)의 약 체크·이해 확인·헷갈려요·안내 완료 기록과 틀린 횟수·잠금을 지워요. 코드와 실제 발급 코드는 그대로예요.',
          )
        }
        className={`${smallButton} border-amber-700 bg-white text-amber-900 hover:bg-amber-50`}
      >
        {pending ? '지우는 중…' : '🔄 시연 기록 초기화'}
      </button>
      <span role="status" className="text-base text-red-700">
        {message}
      </span>
    </div>
  );
}

/** 코드 표 한 줄의 🔓 잠금 풀기 / 🗑️ 폐기 */
export function CodeRowActions({
  code,
  locked,
  demo,
}: {
  code: string;
  locked: boolean;
  /** 시연 코드는 폐기 버튼 대신 "시연 코드"로 보인다. */
  demo: boolean;
}) {
  const { pending, message, run } = useCodeAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {locked && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unlockCodeAction(code))}
          aria-label={`${code} 잠금 풀기`}
          className={`${smallButton} border-blue-700 bg-white text-blue-700 hover:bg-blue-50`}
        >
          🔓 잠금 풀기
        </button>
      )}
      {demo ? (
        <span className="text-sm text-zinc-500">시연 코드</span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => discardCodeAction(code),
              `정말 지울까요?\n코드 ${code}와 이 코드의 모든 기록을 지워요. 되돌릴 수 없어요.`,
            )
          }
          aria-label={`${code} 폐기`}
          className={`${smallButton} border-red-700 bg-white text-red-700 hover:bg-red-50`}
        >
          🗑️ 폐기
        </button>
      )}
      {message && (
        <span role="status" className="text-sm text-red-700">
          {message}
        </span>
      )}
    </div>
  );
}
