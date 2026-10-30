import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { screenTexts } from '@/lib/screen-texts';

import { BackButton } from '../back-button';
import { T, TranslatedTtobagi } from '../translated';
import { SoundToggle } from '../ttobagi';

import './screen-design.css';

// 환자 화면(번호 넣기·받은 안내 목록·검사별 안내 홈)의 새 겉모양 부품.
// 버튼이 하는 일은 공통 부품(BackButton·SoundToggle)이 그대로 하고, 모양만 screen-design.css로 바꾼다.

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type LineIconName =
  'home' | 'play' | 'book' | 'check' | 'alert' | 'lock' | 'clock' | 'chevron';

/** 이모지 대신 쓰는 선 아이콘 */
export function LineIcon({
  name,
  className = 'size-6',
}: {
  name: LineIconName;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {name === 'home' && (
        <>
          <path d="M4 11 12 4l8 7" {...line} />
          <path d="M6 9.5V20h12V9.5" {...line} />
          <path d="M10 20v-5h4v5" {...line} />
        </>
      )}
      {name === 'play' && (
        <>
          <circle cx="12" cy="12" r="9" {...line} />
          <path d="M10 8.5v7l6-3.5z" {...line} />
        </>
      )}
      {name === 'book' && (
        <>
          <path
            d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"
            {...line}
          />
          <path d="M12 6v13.5" {...line} />
        </>
      )}
      {name === 'check' && (
        <>
          <circle cx="12" cy="12" r="9" {...line} />
          <path d="m8 12.5 3 3 5-6" {...line} />
        </>
      )}
      {name === 'alert' && (
        <>
          <path d="M12 3.5 21 19H3z" {...line} />
          <path d="M12 10v4M12 16.5v.5" {...line} />
        </>
      )}
      {name === 'lock' && (
        <>
          <rect x="5" y="10.5" width="14" height="9.5" rx="2" {...line} />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...line} />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" {...line} />
          <path d="M12 7v5l3 2" {...line} />
        </>
      )}
      {name === 'chevron' && <path d="m9 5 7 7-7 7" {...line} />}
    </svg>
  );
}

/** 위쪽 버튼 줄: 왼쪽 뒤로, 오른쪽 소리·처음으로(환자 홈). 가는 곳은 PatientTopBar와 같다. */
export function DesignTopBar({
  code,
  back,
  showHome = true,
}: {
  code?: string;
  back: { href?: string; fallback?: string };
  showHome?: boolean;
}) {
  return (
    <nav
      aria-label="화면 이동"
      className="sd sd-top mb-5 flex items-center justify-between gap-2"
    >
      <BackButton {...back} label={<T>{screenTexts.common.back}</T>} />
      <div className="flex items-center gap-2">
        <SoundToggle />
        {showHome && code && (
          <Link href={`/p/${code}/home`}>
            <LineIcon name="home" className="size-5" />
            <T>{screenTexts.common.home}</T>
          </Link>
        )}
      </div>
    </nav>
  );
}

/** 또박이(기존 캐릭터 그대로) + 청록 말풍선 */
export function TealTtobagi(props: ComponentProps<typeof TranslatedTtobagi>) {
  return (
    <div className="sd sd-bubble">
      <TranslatedTtobagi {...props} />
    </div>
  );
}

/** PC에서 휴대폰 너비 틀 밖으로 넓혀 두 칸으로 보여 줄 때 쓰는 바깥 틀 */
export function WideFrame({ children }: { children: ReactNode }) {
  return (
    <div className="sd relative left-1/2 w-[min(calc(100vw-2rem),1040px)] -translate-x-1/2">
      {children}
    </div>
  );
}
