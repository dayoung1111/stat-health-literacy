import type { PrepScene as SceneName } from '@/lib/demo-guide';
import { screenTexts } from '@/lib/screen-texts';

import { FittedSvgText, LabeledSvg } from '../../translated';

// 약 만들기 그림 애니메이션(5·6교시와 따라하기 화면). 외부 그림 없이 SVG로 그린다.
// 애니메이션은 photo-lesson.css의 pp- 클래스. 움직임 줄이기 설정이면 마지막 모습만 보인다.

const ink = '#15262B';
const teal = '#0F6670';
const water = '#9FD3D6';

const delay = (s: number) => ({ animationDelay: `${s}s` });

const labels: Record<SceneName, string> = {
  supplies: screenTexts.lessonLabels.sceneSupplies,
  add: screenTexts.lessonLabels.sceneAdd,
  fill: screenTexts.lessonLabels.sceneFill,
  shake: screenTexts.lessonLabels.sceneShake,
  dissolved: screenTexts.lessonLabels.sceneDissolved,
  cups: screenTexts.lessonLabels.sceneCups,
  gasocol: screenTexts.lessonLabels.sceneGasocol,
  water: screenTexts.lessonLabels.sceneWater,
};

// 약 봉지(시안 C): 큰 동그라미 배지 + 무늬. A제는 초록 줄무늬, B제는 노랑 물방울.
const pouchStyle = {
  A: { fill: '#D6EFE3', ink: '#2E9E6B' },
  B: { fill: '#FCEBB4', ink: '#C98A00' },
} as const;

export function Pouch({
  x,
  y,
  letter,
  tilt = 0,
}: {
  x: number;
  y: number;
  letter: 'A' | 'B';
  tilt?: number;
}) {
  const style = pouchStyle[letter];
  const body =
    'M4 14 L12 4 L20 14 L28 4 L36 14 L44 4 L52 14 L60 4 L68 14 L76 4 L84 14 L92 4 L96 14 L96 132 Q96 140 88 140 L12 140 Q4 140 4 132 Z';
  const clip = `pp-pouch-${letter}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt} 50 70)`}>
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={style.fill} />
      <g clipPath={`url(#${clip})`} fill="none" stroke={style.ink}>
        {letter === 'A'
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line
                key={i}
                x1={-40 + i * 24}
                y1="150"
                x2={40 + i * 24}
                y2="0"
                strokeWidth="6"
                opacity="0.35"
              />
            ))
          : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <circle
                key={i}
                cx={16 + (i % 4) * 23 + (Math.floor(i / 4) % 2) * 11}
                cy={28 + Math.floor(i / 4) * 44}
                r="6"
                fill={style.ink}
                stroke="none"
                opacity="0.35"
              />
            ))}
      </g>
      <path
        d={body}
        fill="none"
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle
        cx="50"
        cy="78"
        r="34"
        fill="#FFFFFF"
        stroke={style.ink}
        strokeWidth="6"
      />
      <text
        x="50"
        y="97"
        textAnchor="middle"
        fontSize="52"
        fontWeight="900"
        fill={style.ink}
      >
        {letter}
      </text>
    </g>
  );
}

// 1L 통. level: 물 높이(0~1), cap: 뚜껑, cloudy: 가루가 덜 녹은 물
export function Bottle({
  x,
  y,
  level,
  cap = false,
  cloudy = false,
  powder = false,
  rise = false,
}: {
  x: number;
  y: number;
  level: number;
  cap?: boolean;
  cloudy?: boolean;
  powder?: boolean;
  rise?: boolean;
}) {
  const top = 70;
  const bottom = 280;
  const waterTop = bottom - (bottom - top) * level;
  return (
    <g transform={`translate(${x} ${y})`}>
      {cap && <rect x="52" y="0" width="56" height="26" rx="6" fill={teal} />}
      <path
        d="M56 26 L104 26 L104 50 Q140 60 140 96 L140 270 Q140 284 126 284 L34 284 Q20 284 20 270 L20 96 Q20 60 56 50 Z"
        fill="#FFFFFF"
        stroke={teal}
        strokeWidth="6"
      />
      {level > 0 && (
        <rect
          x="24"
          y={waterTop}
          width="112"
          height={bottom - waterTop}
          rx="8"
          fill={cloudy ? '#C9DDD9' : water}
          className={rise ? 'pp-rise' : undefined}
          style={rise ? delay(0.4) : undefined}
        />
      )}
      {powder && (
        <rect
          x="24"
          y="262"
          width="112"
          height="18"
          rx="8"
          fill="#F3EAD3"
          className="pp-pop"
          style={delay(1.4)}
        />
      )}
      {/* 표시선 */}
      <line
        x1="16"
        y1={top + 6}
        x2="144"
        y2={top + 6}
        stroke="#D9363E"
        strokeWidth="4"
        strokeDasharray="10 6"
      />
      <text
        x="80"
        y="190"
        textAnchor="middle"
        fontSize="40"
        fontWeight="800"
        fill={ink}
      >
        1L
      </text>
    </g>
  );
}

export function Cup({ x, y, at }: { x: number; y: number; at: number }) {
  return (
    // 애니메이션(크기)과 위치(transform)가 겹치지 않게 감싼다.
    <g className="pp-pop" style={delay(at)}>
      <g transform={`translate(${x} ${y})`}>
        <path
          d="M6 8 L82 8 L72 116 L16 116 Z"
          fill="#FFFFFF"
          stroke={teal}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M12 34 L76 34 L69 110 L19 110 Z" fill={water} />
      </g>
    </g>
  );
}

function Clock({ x, y, hour }: { x: number; y: number; hour: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="#FFF6D6"
        stroke={teal}
        strokeWidth="7"
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="30"
        stroke={ink}
        strokeWidth="8"
        strokeLinecap="round"
        transform={`rotate(${(hour % 12) * 30} 60 60)`}
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="18"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="6" fill="#C2410C" />
    </g>
  );
}

function Tag({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect
        x={x - 52}
        y={y - 24}
        width="104"
        height="36"
        rx="18"
        fill={ink}
        opacity="0.85"
      />
      <FittedSvgText
        x={x}
        y={y + 2}
        textAnchor="middle"
        fontSize={22}
        width={92}
        fontWeight="700"
        fill="#FFFFFF"
      >
        {text}
      </FittedSvgText>
    </g>
  );
}

function Cups({
  hour,
  animate,
  plain,
}: {
  hour: number;
  animate: boolean;
  plain: boolean;
}) {
  return (
    <>
      <Clock x={10} y={110} hour={hour} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Cup x={160 + i * 110} y={110} at={animate ? 0.5 + i * 0.6 : 0} />
          {!plain && (
            <Tag
              x={204 + i * 110}
              y={268}
              text={
                i === 0 ? screenTexts.lesson.first : screenTexts.lesson.every15
              }
            />
          )}
        </g>
      ))}
    </>
  );
}

// 생수 500mL 병
export function WaterBottle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="40" y="0" width="40" height="30" rx="6" fill="#3B82C4" />
      <path
        d="M36 30 L84 30 L84 54 Q118 66 118 100 L118 280 Q118 296 102 296 L18 296 Q2 296 2 280 L2 100 Q2 66 36 54 Z"
        fill="#E6F4FA"
        stroke="#3B82C4"
        strokeWidth="6"
      />
      <rect x="2" y="150" width="116" height="70" fill="#3B82C4" />
      <text
        x="60"
        y="198"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill="#FFFFFF"
      >
        500mL
      </text>
    </g>
  );
}

export function PrepScene({
  scene,
  hour,
  plain = false,
}: {
  scene: SceneName;
  /** 컵 장면 시계가 가리키는 시각 */
  hour: number;
  /** true: 그림 속 글자(표시선 화살표, 컵 아래 시간표)를 빼고 그림만 그린다(수업 화면은 글자를 그림 밖에 쓴다). */
  plain?: boolean;
}) {
  return (
    <LabeledSvg
      label={labels[scene]}
      viewBox="0 0 600 360"
      className="pp-scene"
    >
      {scene === 'supplies' && (
        <>
          <g className="pp-pop" style={delay(0.3)}>
            <Pouch x={40} y={110} letter="A" />
          </g>
          <g className="pp-pop" style={delay(0.8)}>
            <Pouch x={170} y={110} letter="B" />
          </g>
          <g className="pp-pop" style={delay(1.3)}>
            <Bottle x={380} y={50} level={0} />
          </g>
        </>
      )}

      {scene === 'add' && (
        <>
          <Bottle x={220} y={70} level={0} powder />
          <g className="pp-tilt-left">
            <Pouch x={60} y={0} letter="A" tilt={-35} />
          </g>
          <g className="pp-tilt-right">
            <Pouch x={430} y={0} letter="B" tilt={35} />
          </g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={270 + (i % 3) * 30}
              cy={110}
              r="7"
              fill="#E7D8B5"
              className="pp-fall"
              style={delay(0.6 + i * 0.15)}
            />
          ))}
        </>
      )}

      {scene === 'fill' && (
        <>
          <Bottle x={220} y={70} level={1} cloudy rise />
          <path
            d="M300 0 L300 120"
            stroke={water}
            strokeWidth="14"
            strokeLinecap="round"
            className="pp-stream"
          />
          {!plain && (
            <FittedSvgText
              x="400"
              y="152"
              fontSize={30}
              width={180}
              fontWeight="800"
              fill="#D9363E"
              className="pp-pop"
              style={delay(2)}
            >
              {screenTexts.lesson.markLine}
            </FittedSvgText>
          )}
        </>
      )}

      {scene === 'shake' && (
        <>
          <g className="pp-shake">
            <Bottle x={220} y={60} level={1} cap cloudy />
          </g>
          <path
            d="M180 140 Q160 180 180 220 M420 140 Q440 180 420 220"
            fill="none"
            stroke={teal}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}

      {scene === 'dissolved' && (
        <>
          <Bottle x={220} y={60} level={1} cap />
          <circle
            cx="470"
            cy="110"
            r="56"
            fill="none"
            stroke="#2E9E6B"
            strokeWidth="12"
          />
          <path
            d="M444 112 L464 132 L500 92"
            fill="none"
            stroke="#2E9E6B"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pp-draw"
            style={delay(0.8)}
          />
        </>
      )}

      {scene === 'cups' && <Cups hour={hour} animate plain={plain} />}

      {scene === 'gasocol' && (
        <>
          <g opacity="0.45">
            <Cups hour={hour} animate={false} plain={plain} />
          </g>
          <g className="pp-slide" style={delay(0.4)}>
            <path
              d="M200 40 L210 28 L220 40 L230 28 L240 40 L250 28 L260 40 L270 28 L280 40 L290 28 L300 40 L310 28 L320 40 L330 28 L340 40 L350 28 L360 40 L370 28 L380 40 L400 40 L400 300 Q400 312 388 312 L212 312 Q200 312 200 300 Z"
              fill="#D4D9DD"
              stroke="#7C868C"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M214 60 L386 60 L386 120 L214 120 Z"
              fill="#FFFFFF"
              opacity="0.45"
            />
            <FittedSvgText
              x="300"
              y="190"
              textAnchor="middle"
              fontSize={36}
              width={250}
              fontWeight="800"
              fill={ink}
            >
              {screenTexts.lesson.gasocol}
            </FittedSvgText>
            <FittedSvgText
              x="300"
              y="240"
              textAnchor="middle"
              fontSize={34}
              width={150}
              fontWeight="800"
              fill={ink}
            >
              {screenTexts.lesson.onePack}
            </FittedSvgText>
          </g>
        </>
      )}

      {scene === 'water' && (
        <g className="pp-pop" style={delay(0.3)}>
          <WaterBottle x={240} y={40} />
        </g>
      )}
    </LabeledSvg>
  );
}
