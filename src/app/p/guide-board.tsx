'use client';

import Link from 'next/link';

import type { GuideKind } from '@/lib/guide-catalog';
import { guideLessonHref } from '@/lib/guide-progress';

import { useLanguageOr } from '../language-provider';
import { useCompletedGuides } from './guide-done';

// '받은 안내' 현황판. 대장내시경 수업·드시는 약·검진 전날·위내시경 화면이 함께 쓴다.
// 글씨 크기·색은 대장내시경 수업 옆 칸 그대로다.
export function GuideBoard({
  code,
  current,
  guides,
  completed: fromServer,
  language,
}: {
  code: string;
  /** 지금 보고 있는 안내 */
  current: GuideKind;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: readonly GuideKind[];
  /** 서버가 알려 준 마친 안내. 이 브라우저 기록(useCompletedGuides)을 더해 보여 준다. */
  completed: readonly GuideKind[];
  /** 의료진이 고른 언어. 환자가 고른 언어가 있으면 그것을 쓴다. */
  language: string;
}) {
  const { t } = useLanguageOr(language);
  const completed = useCompletedGuides(code, fromServer);
  // 안내가 하나뿐이면 옮겨 갈 곳이 없으므로 보여 주지 않는다.
  if (guides.length < 2) return null;
  const doneCount = guides.filter((kind) => completed.includes(kind)).length;

  return (
    <section
      aria-labelledby="guide-board-title"
      className="flex flex-col gap-2 rounded-2xl border border-[#CAD6D6] bg-white p-4 text-[#15262B]"
    >
      <h2 id="guide-board-title" className="text-lg font-bold">
        {t.progressTitle}
      </h2>
      <p className="text-base font-bold text-[#0F6670]">
        {t.progressCount(doneCount, guides.length)}
      </p>
      <ul className="flex flex-col gap-1.5">
        {guides.map((kind) => {
          const done = completed.includes(kind);
          const now = kind === current;
          const status = done ? t.statusDone : now ? t.statusNow : t.statusLeft;
          const label = (
            <>
              <span className="text-base font-bold break-keep">
                {t.guides[kind]}
              </span>
              <span
                className={`flex-none text-sm font-bold ${done ? 'text-[#1D6E47]' : 'text-[#0F6670]'}`}
              >
                {status}
              </span>
            </>
          );
          // 지금 보는 안내는 굵은 청록 테두리로 강조한다(다 마쳤어도 테두리는 남는다).
          const border = now
            ? 'border-[2.5px] border-[#0F6670]'
            : done
              ? 'border-[1.5px] border-[#2E9E6B]'
              : 'border-[1.5px] border-[#CAD6D6]';
          const fill = done ? 'bg-[#DDF3E8]' : now ? 'bg-[#DCEDEE]' : '';
          const rowClass = `flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${border} ${fill}`;
          // 지금 보는 안내 말고는 눌러서 바로 갈 수 있다(마친 안내는 다시 보기).
          return (
            <li key={kind}>
              {now ? (
                <div aria-current="page" className={rowClass}>
                  {label}
                </div>
              ) : (
                <Link
                  href={guideLessonHref(code, kind)}
                  className={`${rowClass} hover:border-[#0F6670] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]`}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
