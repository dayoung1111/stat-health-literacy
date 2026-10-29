import { useText } from '@/app/language';
import { Arm, Body, Eyes, Hand, leftArm } from '@/app/ttobagi';
import type { TextId } from '@/lib/i18n';

// 사진 수업의 또박이. 모양은 docs/reference/ttobagi.html 그대로이고,
// 사진 오른쪽에 서서 왼쪽 음식을 가리키도록 좌우를 뒤집어 그린다.

export type LessonPose = 'wave' | 'point' | 'cheer';

const ink = '#15262B';
const green = '#0F6670';

// 그림 설명(화면 읽기 프로그램용). 문장은 locales/ko.json·en.json에 있다.
const labels: Record<LessonPose, TextId> = {
  wave: 'lesson.wave',
  point: 'lesson.point',
  cheer: 'lesson.cheer',
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

        <Body />

        {pose === 'cheer' ? (
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
