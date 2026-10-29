import { useText } from '@/app/language';
import { Arm, Body, Eyes, Hand, leftArm } from '@/app/ttobagi';
import type { TextId } from '@/lib/i18n';

// 사진 수업의 또박이. 모양은 docs/reference/ttobagi.html 그대로이고,
// 사진 오른쪽에 서서 왼쪽 음식을 가리키도록 좌우를 뒤집어 그린다.

// clock(알람 시계 들기)·palm(손바닥 내밀며 주의)은 src/app/ttobagi.tsx의 time·stop 포즈와 같은 그림이다.
export type LessonPose = 'wave' | 'point' | 'cheer' | 'clock' | 'palm';

const ink = '#15262B';
const green = '#0F6670';
const alert = '#C2410C';

// 그림 설명(화면 읽기 프로그램용). 문장은 locales/ko.json·en.json에 있다.
const labels: Record<LessonPose, TextId> = {
  wave: 'lesson.wave',
  point: 'lesson.point',
  cheer: 'lesson.cheer',
  clock: 'lesson.clock',
  palm: 'lesson.palm',
};

export function Ttobak({
  pose,
  talking,
  moving,
  className,
}: {
  pose: LessonPose;
  /** 말하는 중이면 입이 움직인다. */
  talking: boolean;
  /** 재생 중이면 몸과 팔이 움직인다. */
  moving: boolean;
  className?: string;
}) {
  const { t } = useText();
  return (
    <svg
      role="img"
      aria-label={t(labels[pose])}
      viewBox="-24 -16 248 236"
      className={`pl-ttobak ${moving ? '' : 'pl-still'} ${className ?? ''}`}
    >
      <g className="pl-bob">
        {pose === 'wave' && (
          <>
            <g className="pl-wave">
              <Arm d="M150 116 Q176 104 182 80" />
              <Hand cx={183} cy={74} />
            </g>
            <Arm d={leftArm} />
          </>
        )}
        {pose === 'point' && (
          <>
            <g className="pl-point">
              <Arm d="M150 118 Q172 114 180 98" />
              <path
                d="M186 86 L212 46"
                stroke={green}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="214" cy="42" r="5" fill={green} />
              <Hand cx={182} cy={92} />
            </g>
            <Arm d={leftArm} />
          </>
        )}
        {pose === 'cheer' && (
          <>
            <Arm d="M150 108 Q174 92 176 64" />
            <Arm d="M46 108 Q22 92 20 64" />
            <polygon
              points="98,-12 101.5,-4.8 109.4,-3.7 103.7,1.9 105,9.7 98,6 91,9.7 92.3,1.9 86.6,-3.7 94.5,-4.8"
              fill="#F2B94B"
              stroke={ink}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </>
        )}
        {pose === 'clock' && (
          <>
            <Arm d="M150 122 Q168 128 176 124" />
            <Arm d={leftArm} />
            <path
              d="M181 99 L187 93 M211 99 L205 93"
              stroke={ink}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="196"
              cy="118"
              r="20"
              fill="#FFF6D6"
              stroke={ink}
              strokeWidth="4"
            />
            <path
              d="M196 118 V106 M196 118 H205"
              stroke={ink}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M222 102 L230 98 M224 118 H232"
              stroke={alert}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}
        {pose === 'palm' && (
          <>
            <Arm d="M150 114 Q176 112 186 104" />
            <Arm d={leftArm} />
            <circle cx="2" cy="26" r="15" fill={alert} />
            <path
              d="M2 18 V29"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="2" cy="35" r="2.4" fill="#FFFFFF" />
          </>
        )}

        <Body />

        {pose === 'clock' && (
          <>
            <Eyes rx={6.5} ry={9} shine={2} shineY={90} />
            <ellipse cx="98" cy="114" rx="5" ry="6" fill={ink} />
            <Hand cx={176} cy={124} />
            <Hand cx={24} cy={154} />
          </>
        )}
        {pose === 'palm' && (
          <>
            <path
              d="M72 84 L86 79 M124 84 L110 79"
              stroke={ink}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <Eyes y={96} shineY={93} />
            <path
              d="M90 114 H106"
              stroke={ink}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {talking && (
              <ellipse
                className="pl-talk"
                cx="98"
                cy="114"
                rx="7"
                ry="6"
                fill={ink}
              />
            )}
            <Hand cx={194} cy={100} r={11} />
            <Hand cx={24} cy={154} />
          </>
        )}
        {pose === 'clock' || pose === 'palm' ? null : pose === 'cheer' ? (
          <>
            <path
              d="M73 96 Q80 88 87 96 M109 96 Q116 88 123 96"
              fill="none"
              stroke={ink}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M86 108 Q98 124 110 108 Z"
              fill={ink}
              stroke={ink}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Hand cx={176} cy={58} />
            <Hand cx={20} cy={58} />
          </>
        ) : (
          <>
            <Eyes />
            <path
              d="M88 110 Q98 120 108 110"
              fill="none"
              stroke={ink}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {talking && (
              <ellipse
                className="pl-talk"
                cx="98"
                cy="114"
                rx="7"
                ry="6"
                fill={ink}
              />
            )}
            <Hand cx={24} cy={154} />
          </>
        )}
      </g>
    </svg>
  );
}
