import type { MedIconName, Verdict } from '@/lib/medication-guide';

// 복용약 화면 그림. 외부 이미지 없이 직접 그린 SVG. 그림 뜻은 옆 글자로 함께 보여 주므로
// 화면 읽기 프로그램에는 숨긴다. 색은 또박이 색(초록 #0F6670, 선 #15262B, 주의 #C2410C)을 쓴다.

const ink = '#15262B';
const green = '#0F6670';
const alert = '#C2410C';
const line = {
  fill: 'none',
  stroke: ink,
  strokeWidth: 4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Shape({ name }: { name: MedIconName }) {
  switch (name) {
    case 'pill':
      return (
        <>
          <rect
            x="18"
            y="38"
            width="64"
            height="26"
            rx="13"
            transform="rotate(-30 50 51)"
            {...line}
            fill="#fff"
          />
          <path d="M40 34 L58 66" {...line} transform="rotate(0)" />
          <path d="M28 57 L42 49 L50 63 L36 71 Z" fill={green} opacity="0.85" />
        </>
      );
    case 'syringe':
      return (
        <>
          <rect
            x="30"
            y="30"
            width="44"
            height="18"
            rx="4"
            transform="rotate(-40 52 39)"
            {...line}
            fill="#DCEDEE"
          />
          <path d="M68 18 L82 30 M75 24 L84 14" {...line} />
          <path d="M33 62 L18 80" {...line} />
          <path d="M42 46 L48 52 M50 39 L56 45" {...line} strokeWidth={3} />
        </>
      );
    case 'drop':
      return (
        <path
          d="M50 14 C38 34 26 48 26 62 A24 24 0 0 0 74 62 C74 48 62 34 50 14 Z"
          fill={alert}
          stroke={ink}
          strokeWidth={4}
        />
      );
    case 'leaf':
      return (
        <>
          <path
            d="M22 78 C22 40 46 20 80 20 C80 56 58 78 22 78 Z"
            {...line}
            fill="#9FD3A8"
          />
          <path d="M22 78 L60 40" {...line} />
        </>
      );
    case 'clipboard':
      return (
        <>
          <rect
            x="24"
            y="18"
            width="52"
            height="66"
            rx="6"
            {...line}
            fill="#fff"
          />
          <rect
            x="38"
            y="12"
            width="24"
            height="12"
            rx="3"
            {...line}
            fill="#DCEDEE"
          />
          <path d="M34 40 H66 M34 52 H66 M34 64 H54" {...line} />
        </>
      );
    case 'half-cup':
      return (
        <>
          <path d="M26 22 L74 22 L68 84 L32 84 Z" {...line} fill="#fff" />
          <path d="M29 54 L71 54 L68 84 L32 84 Z" fill="#9FD3D6" />
          <path d="M26 22 L74 22 L68 84 L32 84 Z" {...line} />
        </>
      );
    case 'bag':
      return (
        <>
          <rect
            x="22"
            y="32"
            width="56"
            height="50"
            rx="10"
            {...line}
            fill="#F6B8A0"
          />
          <path d="M38 32 V24 A12 12 0 0 1 62 24 V32" {...line} />
          <rect
            x="36"
            y="50"
            width="28"
            height="16"
            rx="4"
            {...line}
            fill="#fff"
          />
        </>
      );
    case 'candy':
      return (
        <>
          <circle cx="50" cy="50" r="18" {...line} fill="#F6B8A0" />
          <path
            d="M32 50 L16 40 L16 60 Z M68 50 L84 40 L84 60 Z"
            {...line}
            fill="#FFF6D6"
          />
          <path d="M42 44 Q50 52 58 44" {...line} strokeWidth={3} />
        </>
      );
    case 'hand':
      return (
        <path
          d="M34 84 C24 74 22 62 22 54 L22 40 A5 5 0 0 1 32 40 L32 54 L32 24 A5 5 0 0 1 42 24 L42 50 L42 18 A5 5 0 0 1 52 18 L52 50 L52 22 A5 5 0 0 1 62 22 L62 56 L68 46 A5 5 0 0 1 77 51 L66 76 C62 84 56 86 48 86 Z"
          {...line}
          fill="#FFE3D6"
        />
      );
    case 'doctor':
    case 'nurse':
    case 'person':
      return (
        <>
          <circle cx="50" cy="34" r="16" {...line} fill="#FFE3D6" />
          <path
            d="M20 86 C20 64 34 54 50 54 C66 54 80 64 80 86 Z"
            {...line}
            fill={name === 'person' ? '#DCEDEE' : '#fff'}
          />
          {name === 'doctor' && (
            <path
              d="M40 58 V70 A8 8 0 0 0 56 70 V64 M56 64 A4 4 0 1 0 56.1 64"
              {...line}
              strokeWidth={3}
            />
          )}
          {name === 'nurse' && (
            <>
              <path
                d="M36 22 L36 14 L64 14 L64 22 Z"
                {...line}
                fill="#fff"
                strokeWidth={3}
              />
              <path
                d="M50 15 V21 M47 18 H53"
                stroke={alert}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <path
                d="M44 66 H56 M50 60 V72"
                stroke={green}
                strokeWidth={4}
                strokeLinecap="round"
              />
            </>
          )}
        </>
      );
    case 'phone':
      return (
        <path
          d="M30 16 L42 16 L48 34 L40 40 C44 52 50 58 62 62 L68 54 L86 60 L86 72 C86 78 80 84 72 84 C42 82 18 58 16 28 C16 22 22 16 30 16 Z"
          fill={green}
          stroke={ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      );
    case 'ok':
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="#2E9E5B"
            stroke={ink}
            strokeWidth={4}
          />
          <path
            d="M32 51 L45 64 L69 38"
            fill="none"
            stroke="#fff"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case 'stop':
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={alert}
            stroke={ink}
            strokeWidth={4}
          />
          <path
            d="M35 35 L65 65 M65 35 L35 65"
            stroke="#fff"
            strokeWidth={9}
            strokeLinecap="round"
          />
        </>
      );
  }
}

export function MedIcon({
  name,
  no = false,
  className = 'size-20',
}: {
  name: MedIconName;
  no?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <Shape name={name} />
      {no && (
        <>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={alert}
            strokeWidth="7"
          />
          <path
            d="M20 80 L80 20"
            stroke={alert}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

// 판정 그림: 🟢 드세요 / ❌ 드시지 마세요 / 📞 간호사에게 물어보세요
export function VerdictMark({
  verdict,
  className = 'size-28',
}: {
  verdict: Verdict;
  className?: string;
}) {
  const name: MedIconName =
    verdict === 'ok' ? 'ok' : verdict === 'stop' ? 'stop' : 'phone';
  if (verdict !== 'ask') return <MedIcon name={name} className={className} />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="#DCEDEE"
        stroke={ink}
        strokeWidth="4"
      />
      <g transform="translate(18 18) scale(0.64)">
        <Shape name="phone" />
      </g>
    </svg>
  );
}
