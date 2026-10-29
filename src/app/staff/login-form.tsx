'use client';

import { useActionState } from 'react';

import { loginStaff, type LoginState } from './actions';
import { staffButton } from './ui';

const inputClass =
  'mt-1 block w-full rounded-lg border-2 border-zinc-300 px-4 py-3 text-lg focus-visible:border-blue-700 focus-visible:outline-none';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginStaff,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="staff-id" className="text-base font-semibold">
          아이디
        </label>
        <input
          id="staff-id"
          name="id"
          autoComplete="username"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="staff-password" className="text-base font-semibold">
          비밀번호
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-base font-semibold text-red-700"
        >
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={staffButton.primary}>
        {pending ? '확인 중…' : '로그인'}
      </button>
    </form>
  );
}
