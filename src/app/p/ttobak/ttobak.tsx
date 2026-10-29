import type { TtobakAction } from '@/lib/demo-guide';

import './ttobak.css';

// 또박이: 접힌 종이 안내문 모양 캐릭터. 동작(action)에 따라 팔과 소품이 바뀐다.

const LINE = '#334155';
const PAPER = '#ffffff';

const actionLabels: Record<TtobakAction, string> = {
  wave: '손을 흔들고 있어요',
  point: '지시봉으로 카드를 가리키고 있어요',
  alarm: '알람 시계를 흔들고 있어요',
  cheer: '두 팔을 들고 기뻐하고 있어요',
  stop: '손바닥을 내밀며 멈추라고 하고 있어요',
};

type TtobakProps = {
  action: TtobakAction;
  /** 입을 움직일지 */
  talking: boolean;
  /** false면 동작을 멈춘 그림으로 보여 준다. */
  animated: boolean;
  className?: string;
};

function Hand({ x, y }: { x: number; y: number }) {
  return (
    <circle cx={x} cy={y} r="7" fill={PAPER} stroke={LINE} strokeWidth="3" />
  );
}

function Arm({
  x2,
  y2,
  from = 158,
}: {
  x2: number;
  y2: number;
  from?: number;
}) {
  return (
    <line
      x1={from}
      y1="130"
      x2={x2}
      y2={y2}
      stroke={LINE}
      strokeWidth="6"
      strokeLinecap="round"
    />
  );
}

function LeftArm({ action }: { action: TtobakAction }) {
  const [x, y] = action === 'cheer' ? [16, 96] : [20, 158];
  return (
    <g className="ttobak__arm-left">
      <Arm from={42} x2={x} y2={y} />
      <Hand x={x} y={y} />
    </g>
  );
}

function RightArm({ action }: { action: TtobakAction }) {
  switch (action) {
    case 'wave':
      return (
        <g className="ttobak__wave">
          <Arm x2={186} y2={98} />
          <Hand x={186} y={98} />
        </g>
      );
    case 'point':
      return (
        <g className="ttobak__point">
          <line
            x1="186"
            y1="118"
            x2="228"
            y2="72"
            stroke="#92400e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="228" cy="72" r="4" fill="#ef4444" />
          <Arm x2={186} y2={118} />
          <Hand x={186} y={118} />
        </g>
      );
    case 'alarm':
      return (
        <g>
          <Arm x2={184} y2={114} />
          <g className="ttobak__clock">
            <circle
              cx="189"
              cy="81"
              r="6"
              fill="#f59e0b"
              stroke={LINE}
              strokeWidth="2"
            />
            <circle
              cx="211"
              cy="81"
              r="6"
              fill="#f59e0b"
              stroke={LINE}
              strokeWidth="2"
            />
            <circle
              cx="200"
              cy="98"
              r="16"
              fill="#fef3c7"
              stroke={LINE}
              strokeWidth="3"
            />
            <g stroke={LINE} strokeWidth="2.5" strokeLinecap="round">
              <line x1="200" y1="98" x2="200" y2="88" />
              <line x1="200" y1="98" x2="207" y2="101" />
            </g>
          </g>
          <Hand x={184} y={114} />
        </g>
      );
    case 'cheer':
      return (
        <g>
          <Arm x2={184} y2={96} />
          <Hand x={184} y={96} />
        </g>
      );
    case 'stop':
      return (
        <g className="ttobak__palm">
          <Arm x2={186} y2={124} />
          {[186, 192, 198, 204].map((x) => (
            <rect
              key={x}
              x={x - 2}
              y="100"
              width="6"
              height="16"
              rx="3"
              fill={PAPER}
              stroke={LINE}
              strokeWidth="2"
            />
          ))}
          <ellipse
            cx="197"
            cy="122"
            rx="12"
            ry="11"
            fill={PAPER}
            stroke={LINE}
            strokeWidth="3"
          />
        </g>
      );
  }
}

export function Ttobak({ action, talking, animated, className }: TtobakProps) {
  return (
    <svg
      viewBox="0 20 240 220"
      role="img"
      aria-label={`또박이가 ${actionLabels[action]}`}
      className={`ttobak ttobak--${action} ${animated ? '' : 'ttobak--still'} ${className ?? ''}`}
    >
      <g className="ttobak__body">
        {/* 다리 */}
        <g stroke={LINE} strokeWidth="6" strokeLinecap="round">
          <line x1="78" y1="198" x2="76" y2="220" />
          <line x1="122" y1="198" x2="124" y2="220" />
        </g>
        <ellipse cx="72" cy="223" rx="9" ry="5" fill={LINE} />
        <ellipse cx="128" cy="223" rx="9" ry="5" fill={LINE} />

        {/* 접힌 종이 몸통과 민트색 귀퉁이 */}
        <path
          d="M50 30 H130 L160 60 V190 Q160 200 150 200 H50 Q40 200 40 190 V40 Q40 30 50 30 Z"
          fill={PAPER}
          stroke={LINE}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M130 30 V60 H160 Z"
          fill="#7dd3c0"
          stroke={LINE}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* 초록 원 안의 흰 십자 */}
        <circle cx="66" cy="56" r="14" fill="#22c55e" />
        <rect x="62.5" y="47" width="7" height="18" rx="1.5" fill={PAPER} />
        <rect x="57" y="52.5" width="18" height="7" rx="1.5" fill={PAPER} />

        {/* 안내문 글줄 */}
        <g stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round">
          <line x1="66" y1="160" x2="134" y2="160" />
          <line x1="66" y1="174" x2="118" y2="174" />
        </g>

        {/* 눈 */}
        <g className="ttobak__eyes">
          <circle cx="82" cy="100" r="7" fill="#1e293b" />
          <circle cx="118" cy="100" r="7" fill="#1e293b" />
          <circle cx="84.5" cy="97.5" r="2" fill={PAPER} />
          <circle cx="120.5" cy="97.5" r="2" fill={PAPER} />
        </g>

        {/* 볼터치 */}
        <ellipse cx="70" cy="118" rx="8" ry="5" fill="#f9a8d4" />
        <ellipse cx="130" cy="118" rx="8" ry="5" fill="#f9a8d4" />

        {/* 입 */}
        {talking ? (
          <ellipse
            className="ttobak__mouth-talk"
            cx="100"
            cy="125"
            rx="8"
            ry="6"
            fill="#9f1239"
          />
        ) : (
          <path
            d="M90 121 Q100 131 110 121"
            fill="none"
            stroke={LINE}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        <LeftArm action={action} />
        <RightArm action={action} />
      </g>
    </svg>
  );
}
