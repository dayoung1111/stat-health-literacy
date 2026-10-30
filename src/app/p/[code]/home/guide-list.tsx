'use client';

import Link from 'next/link';

import { designTexts } from '@/lib/design-screen-texts';
import type { GuideIcon, GuideKind } from '@/lib/guide-catalog';
import { screenTexts } from '@/lib/screen-texts';

import { GuideIconSvg } from '../../../guide-icon';
import { useLanguageOr } from '../../../language-provider';
import { LabeledBox, T } from '../../../translated';
import { useCompletedGuides } from '../../guide-done';
import { LineIcon } from '../../screen-design';

export type GuideListItem = {
  kind: GuideKind;
  href: string;
  name: string;
  hint?: string;
  icon: GuideIcon;
  /** 내용이 아직 없어 "준비 중" 화면으로 가는 안내 */
  notReady?: string;
};

// 받은 안내 카드 목록. 카드마다 순서 번호 + 아이콘 + 이름 + 상태 칩.
// 마친 안내는 서버 기록 + 이 브라우저 기록(useCompletedGuides)으로 정한다. 준비 중인 안내는 칩을 숨긴다.
export function GuideList({
  code,
  items,
  completed: fromServer,
  language,
}: {
  code: string;
  items: GuideListItem[];
  completed: GuideKind[];
  /** 의료진이 고른 언어. 환자가 고른 언어가 있으면 그것을 쓴다. */
  language: string;
}) {
  const { t } = useLanguageOr(language);
  const progressLabel = t.progressCount;
  const completed = useCompletedGuides(code, fromServer);
  const ready = items.filter((item) => !item.notReady);
  const doneCount = ready.filter((item) =>
    completed.includes(item.kind),
  ).length;

  return (
    <>
      {ready.length > 0 && (
        <div className="sd-card mb-4 p-4">
          <p className="mb-2 text-lg font-bold text-[#0F6670]">
            {progressLabel(doneCount, ready.length)}
          </p>
          <div
            className="sd-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={ready.length}
            aria-valuenow={doneCount}
            aria-label={progressLabel(doneCount, ready.length)}
          >
            <span style={{ width: `${(doneCount / ready.length) * 100}%` }} />
          </div>
        </div>
      )}
      <LabeledBox
        as="nav"
        label={screenTexts.common.navReceivedGuides}
        className="grid gap-4 lg:grid-cols-2"
      >
        {items.map((item, i) => {
          const done = completed.includes(item.kind);
          return (
            <Link
              key={item.kind}
              href={item.href}
              className="sd-card flex min-h-28 items-center gap-4 px-5 py-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0F6670] text-lg font-bold text-white">
                {i + 1}
              </span>
              <GuideIconSvg
                name={item.icon}
                className="size-11 shrink-0 text-[#0F6670]"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-2xl font-bold break-keep">
                  <T>{item.name}</T>
                </span>
                {item.hint && (
                  <span className="text-lg break-keep text-zinc-600">
                    <T>{item.hint}</T>
                  </span>
                )}
                {item.notReady && (
                  <span className="text-lg text-zinc-600">
                    <T>{item.notReady}</T>
                  </span>
                )}
              </span>
              {!item.notReady && (
                <span
                  className={`sd-chip ${done ? 'sd-chip-done' : 'sd-chip-left'}`}
                >
                  <T>
                    {done ? designTexts.statusDone : designTexts.statusLeft}
                  </T>
                </span>
              )}
              <LineIcon
                name="chevron"
                className="size-6 shrink-0 text-zinc-400"
              />
            </Link>
          );
        })}
      </LabeledBox>
    </>
  );
}
