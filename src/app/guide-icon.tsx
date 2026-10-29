import type { GuideIcon } from '@/lib/guide-catalog';

// 안내 종류 아이콘(의료진 고르기 타일·환자 홈 카드 공통). 외부 이미지 없이 선으로 그린 SVG.
export function GuideIconSvg({
  name,
  className = 'size-12',
}: {
  name: GuideIcon;
  className?: string;
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
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
