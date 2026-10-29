import Link from 'next/link';
import type { ReactNode } from 'react';

// 의료진 화면 공통 모양. 그림(docs/design/2_의료진_화면_간단버전.png)의 남색 머리띠 카드.
export const navy = 'bg-[#1f3a5f]';

const focus =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export const staffButton = {
  primary: `flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-700 px-5 text-lg font-bold text-white hover:bg-blue-800 disabled:bg-zinc-400 ${focus}`,
  outline: `flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-blue-700 bg-white px-5 text-lg font-bold text-blue-700 hover:bg-blue-50 ${focus}`,
};

export function Panel({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm">
      <header
        className={`flex items-center justify-between gap-4 px-5 py-3 text-white ${navy}`}
      >
        <h1 className="text-lg font-semibold">{title}</h1>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function PanelLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-base text-white hover:underline">
      {children}
    </Link>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-base leading-relaxed text-amber-900">
      {children}
    </div>
  );
}
