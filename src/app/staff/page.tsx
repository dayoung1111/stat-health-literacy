import Link from 'next/link';

import { LoginForm } from './login-form';
import { Panel } from './ui';

export default function StaffLoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Panel title="S.T.A.T 의료진 로그인">
        <LoginForm />
      </Panel>
      <Link
        href="/"
        className="mt-6 inline-block text-base text-zinc-600 hover:underline"
      >
        ← 처음 화면으로
      </Link>
    </main>
  );
}
