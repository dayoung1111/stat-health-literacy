'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { MenuTile, StaffIcon } from '@/lib/staff-options';

// 검사 고르기 타일 아이콘. 외부 이미지 없이 선으로 그린 SVG.
function Icon({ name }: { name: StaffIcon }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12">
      {name === 'checkup' && (
        <>
          <rect x="10" y="8" width="28" height="34" rx="4" {...common} />
          <path d="M18 8 V5 H30 V8" {...common} />
          <path d="M16 22 L21 27 L32 16" {...common} />
          <path d="M16 34 H32" {...common} />
        </>
      )}
      {name === 'endoscope' && (
        <>
          <rect x="6" y="6" width="12" height="16" rx="3" {...common} />
          <path d="M12 22 V28 Q12 40 24 40 Q36 40 36 30 V20" {...common} />
          <circle cx="36" cy="16" r="4" {...common} />
          <path d="M42 10 L44 8 M42 22 L44 24" {...common} />
        </>
      )}
      {name === 'pill' && (
        <>
          <rect
            x="6"
            y="17"
            width="36"
            height="14"
            rx="7"
            transform="rotate(-35 24 24)"
            {...common}
          />
          <path d="M20 14 L28 34" transform="rotate(-10 24 24)" {...common} />
        </>
      )}
      {name === 'colon' && (
        <>
          {/* 대장: 굵은 관 모양에 마디(주름) 선을 그어 장처럼 보이게 한다. */}
          <path
            d="M15 44 V17 Q15 10 22 10 H27 Q34 10 34 17 V33 Q34 38 29 38 H25 V44"
            {...common}
            strokeWidth={6}
          />
          <path
            d="M12 24 H18 M12 34 H18 M22 7 V13 M28 7 V13 M31 24 H37"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'stomach' && (
        <path
          d="M18 6 V14 Q10 18 12 30 Q14 42 28 42 Q40 42 40 32 Q40 24 32 24 Q26 24 26 18 V6"
          {...common}
          strokeWidth={5}
        />
      )}
    </svg>
  );
}

const tileClass =
  'flex h-full min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-5 text-center text-xl font-bold hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

// 내용이 준비된 타일은 다음 화면으로, 아직 없는 타일은 "내용 준비 중이에요"만 보여 준다.
export function ExamTiles({ tiles }: { tiles: MenuTile[] }) {
  const [notReady, setNotReady] = useState<string | null>(null);

  return (
    <>
      <ul
        className={`grid gap-4 ${tiles.length === 3 ? 'sm:grid-cols-3' : 'grid-cols-2'}`}
      >
        {tiles.map((tile) => {
          const content = (
            <>
              <span className="text-blue-700">
                <Icon name={tile.icon} />
              </span>
              <span className="break-keep">{tile.name}</span>
              {tile.hint && (
                <span className="text-base font-normal break-keep text-zinc-600">
                  {tile.hint}
                </span>
              )}
            </>
          );
          return (
            <li key={tile.id}>
              {tile.href ? (
                <Link href={tile.href} className={tileClass}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotReady(tile.name)}
                  className={tileClass}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p
        role="status"
        className="mt-4 min-h-8 text-lg font-bold text-amber-800"
      >
        {notReady && `「${notReady}」 내용 준비 중이에요.`}
      </p>
    </>
  );
}
