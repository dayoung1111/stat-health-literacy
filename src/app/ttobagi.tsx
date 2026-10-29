'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

// S.T.A.T 캐릭터 "또박이". 그림은 docs/reference/ttobagi.html의 포즈 5개를 그대로 옮겼다.
// 말투: 짧은 존댓말, 한 번에 한 가지만.

export type Pose = 'hello' | 'explain' | 'time' | 'cheer' | 'stop';

const ink = '#15262B';
const green = '#0F6670';
const mint = '#DCEDEE';
const blush = '#F6B8A0';
const alert = '#C2410C';

export function Arm({ d }: { d: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth="5"
      strokeLinecap="round"
    />
  );
}

export function Hand({
  cx,
  cy,
  r = 8,
}: {
  cx: number;
  cy: number;
  r?: number;
}) {
  return (
    <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke={ink} strokeWidth="4" />
  );
}

export const leftArm = 'M44 120 Q24 132 24 150';

// 모든 포즈에 공통인 몸(그림자·다리·종이 몸·접힌 귀퉁이·초록 십자·줄글·볼터치).
// 사진 수업 플레이어(src/components/ttobak)도 같은 몸을 쓴다.
export function Body() {
  return (
    <>
      <ellipse cx="100" cy="210" rx="54" ry="8" fill="#DCE5E4" />
      <rect x="74" y="180" width="16" height="24" rx="8" fill="#2E4A50" />
      <rect x="110" y="180" width="16" height="24" rx="8" fill="#2E4A50" />
      <path
        d="M50 24 H128 L160 56 V170 A16 16 0 0 1 144 186 H50 A16 16 0 0 1 34 170 V40 A16 16 0 0 1 50 24 Z"
        fill="#FFFFFF"
        stroke={ink}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M128 24 V48 A8 8 0 0 0 136 56 H160 Z"
        fill={mint}
        stroke={ink}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="48" r="10" fill={green} />
      <path
        d="M58 42 V54 M52 48 H64"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M62 150 H134 M62 164 H110"
        stroke="#CAD6D6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="68" cy="110" rx="9" ry="5.5" fill={blush} />
      <ellipse cx="128" cy="110" rx="9" ry="5.5" fill={blush} />
    </>
  );
}

export function Eyes({ y = 94, rx = 5.5, ry = 7.5, shine = 1.8, shineY = 91 }) {
  return (
    <>
      <ellipse cx="80" cy={y} rx={rx} ry={ry} fill={ink} />
      <ellipse cx="116" cy={y} rx={rx} ry={ry} fill={ink} />
      <circle cx="82" cy={shineY} r={shine} fill="#FFFFFF" />
      <circle cx="118" cy={shineY} r={shine} fill="#FFFFFF" />
    </>
  );
}

// 포즈마다 몸 뒤(팔·소품), 얼굴, 몸 앞(손)을 나눠 그린다.
const poses: Record<
  Pose,
  { behind: ReactNode; face: ReactNode; front: ReactNode }
> = {
  // 안녕하세요: 손을 흔든다.
  hello: {
    behind: (
      <>
        <g className="ttobagi-wave">
          <Arm d="M150 116 Q176 104 182 80" />
        </g>
        <Arm d={leftArm} />
      </>
    ),
    face: (
      <>
        <Eyes />
        <path
          d="M88 110 Q98 120 108 110"
          fill="none"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    ),
    front: (
      <>
        <g className="ttobagi-wave">
          <Hand cx={183} cy={74} />
          <path
            d="M198 60 Q205 70 200 80 M208 54 Q216 70 210 86"
            fill="none"
            stroke={green}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <Hand cx={24} cy={154} />
      </>
    ),
  },
  // 설명할게요: 지시봉을 든다.
  explain: {
    behind: (
      <>
        <Arm d="M150 118 Q172 114 180 98" />
        <Arm d={leftArm} />
        <path
          d="M186 86 L212 46"
          stroke={green}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="214" cy="42" r="5" fill={green} />
      </>
    ),
    face: (
      <>
        <Eyes />
        <path
          d="M88 108 Q98 122 108 108 Z"
          fill={ink}
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </>
    ),
    front: (
      <>
        <Hand cx={182} cy={92} />
        <Hand cx={24} cy={154} />
      </>
    ),
  },
  // 시간 됐어요: 알람 시계를 든다.
  time: {
    behind: (
      <>
        <Arm d="M150 122 Q168 128 176 124" />
        <Arm d={leftArm} />
        <g className="ttobagi-ring">
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
        </g>
        <path
          d="M222 102 L230 98 M224 118 H232"
          stroke={alert}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    ),
    face: (
      <>
        <Eyes rx={6.5} ry={9} shine={2} shineY={90} />
        <ellipse cx="98" cy="114" rx="5" ry="6" fill={ink} />
      </>
    ),
    front: (
      <>
        <Hand cx={176} cy={124} />
        <Hand cx={24} cy={154} />
      </>
    ),
  },
  // 잘하셨어요: 두 팔을 들고 기뻐한다.
  cheer: {
    behind: (
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
    ),
    face: (
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
      </>
    ),
    front: (
      <>
        <Hand cx={176} cy={58} />
        <Hand cx={20} cy={58} />
      </>
    ),
  },
  // 잠깐만요: 손바닥을 내밀며 멈추라고 알린다.
  stop: {
    behind: (
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
    ),
    face: (
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
      </>
    ),
    front: (
      <>
        <Hand cx={194} cy={100} r={11} />
        <Hand cx={24} cy={154} />
      </>
    ),
  },
};

// 몸 전체 움직임. 손 흔들기·알람 흔들기는 그림 안에서 따로 움직인다.
const bodyMotion: Record<Pose, string> = {
  hello: '',
  explain: 'ttobagi-nod',
  time: 'ttobagi-hop',
  cheer: 'ttobagi-hop',
  stop: 'ttobagi-shake',
};

// face: 몸 위쪽(얼굴)만 잘라 작은 얼굴로 보여 준다.
export function TtobagiFigure({
  pose,
  face: faceOnly = false,
}: {
  pose: Pose;
  face?: boolean;
}) {
  const { behind, face, front } = poses[pose];
  return (
    <svg
      viewBox={faceOnly ? '30 20 134 110' : '-24 -16 248 236'}
      aria-hidden="true"
      className="h-auto w-full overflow-visible"
    >
      {behind}
      <Body />
      {face}
      {front}
    </svg>
  );
}

const subscribe = () => () => {};

function speak(text: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9;
  const korean = synth.getVoices().find((v) => v.lang.startsWith('ko'));
  if (korean) utterance.voice = korean;
  synth.speak(utterance);
}

function Sentences({ message }: { message: string }) {
  // 문장마다 줄을 바꿔 한 번에 한 가지씩 읽히게 한다.
  return message.split(/(?<=[.!?])\s+/).map((sentence) => (
    <span key={sentence} className="block">
      {sentence}
    </span>
  ));
}

const bubbleText = 'text-xl leading-snug font-bold break-keep text-stat-ink';
const speakButton =
  'items-center rounded-full bg-stat-mint text-xl font-bold text-stat-green hover:bg-stat-green/20 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green';

// 또박이 + 옆 말풍선 + 🔊 듣기 버튼.
// size="sm"은 작은 얼굴과 한 줄 말풍선으로, 내용이 많은 화면(안내문)에서 공간을 아낀다.
// 화면이 바뀌면 새로 나타나며 짧게 움직인다.
export function Ttobagi({
  pose,
  message,
  size = 'md',
}: {
  pose: Pose;
  message: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const canSpeak = useSyncExternalStore(
    subscribe,
    () => 'speechSynthesis' in window,
    () => false,
  );
  const label = `또박이 말 소리로 듣기: ${message}`;

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-16 shrink-0 ${bodyMotion[pose]}`}>
          <TtobagiFigure pose={pose} face />
        </div>
        <div className="relative flex flex-1 items-center gap-2 rounded-3xl border-2 border-stat-green bg-white py-2 pr-2 pl-4 shadow-sm">
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-[9px] size-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-stat-green bg-white"
          />
          <p className={`flex-1 ${bubbleText}`}>
            <Sentences message={message} />
          </p>
          {canSpeak && (
            <button
              type="button"
              onClick={() => speak(message)}
              aria-label={label}
              className={`flex size-12 shrink-0 justify-center ${speakButton}`}
            >
              🔊
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div
        className={`shrink-0 ${size === 'lg' ? 'w-36' : 'w-28'} ${bodyMotion[pose]}`}
      >
        <TtobagiFigure pose={pose} />
      </div>
      <div className="relative mb-8 flex flex-1 flex-col items-start gap-2 rounded-3xl border-2 border-stat-green bg-white px-4 py-3 shadow-sm">
        <span
          aria-hidden="true"
          className="absolute bottom-5 -left-[9px] size-4 rotate-45 border-b-2 border-l-2 border-stat-green bg-white"
        />
        <p className={bubbleText}>
          <Sentences message={message} />
        </p>
        {canSpeak && (
          <button
            type="button"
            onClick={() => speak(message)}
            aria-label={label}
            className={`flex min-h-12 gap-1 self-end px-4 ${speakButton}`}
          >
            🔊 듣기
          </button>
        )}
      </div>
    </div>
  );
}
