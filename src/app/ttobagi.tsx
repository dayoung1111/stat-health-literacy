'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';

import { getMessages } from '@/lib/messages';

import { useLanguage } from './language-provider';

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
// 사진 수업 플레이어(src/app/p/ttobak)도 같은 몸을 쓴다.
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

// ── 소리 ─────────────────────────────────────────────
// 인터넷 창은 사람이 화면을 한 번도 누르지 않으면 소리를 막는다(광고 소리 막기 규칙).
// 그래서 첫 화면은 또박이를 눌러야 말하고, 한 번이라도 누른 뒤에는 화면이 바뀔 때마다 자동으로 읽는다.
// 화면 이동은 페이지를 새로 불러오지 않으므로 "눌렀는지"를 이 파일 안에 기억해 둔다.
// 🔊/🔇 설정은 그 휴대폰에 저장해 다음에 열어도 유지한다.

const SOUND_KEY = 'stat-sound';
const SOUND_EVENT = 'stat-sound-change';
let hasInteracted = false;
let lastSpoken = { text: '', at: 0 };

function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// fromTap: 또박이를 직접 눌렀을 때는 같은 문장이라도 다시 읽는다.
// 자동 읽기는 같은 문장이 1초 안에 또 오면 건너뛴다(개발 모드에서 화면 준비가 두 번 도는 경우 등).
// speechLang: 문장의 언어 코드(ko-KR, en-US, ja-JP, zh-CN, vi-VN). 그 언어 목소리로 읽는다.
export function speak(text: string, fromTap = false, speechLang = 'ko-KR') {
  if (!canSpeak()) return;
  const now = Date.now();
  if (!fromTap && lastSpoken.text === text && now - lastSpoken.at < 1000) {
    return;
  }
  lastSpoken = { text, at: now };
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang;
  utterance.rate = 0.9;
  const voice = findVoice(speechLang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

/** 그 언어의 목소리(ko-KR → ko로 시작하는 목소리). 없으면 브라우저가 lang을 보고 고른다. */
export function findVoice(speechLang: string) {
  if (!canSpeak()) return undefined;
  const prefix = speechLang.slice(0, 2).toLowerCase();
  return window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith(prefix));
}

// 첫 터치 때 한 번 소리를 "깨워" 둔다(아이폰 사파리는 터치 안에서 한 번 말해야 그 뒤 자동 읽기를 허락한다).
function rememberFirstTouch() {
  if (hasInteracted) return;
  hasInteracted = true;
  if (!canSpeak()) return;
  const wake = new SpeechSynthesisUtterance(' ');
  wake.volume = 0;
  window.speechSynthesis.speak(wake);
}

function useFirstTouch() {
  useEffect(() => {
    if (hasInteracted) return;
    const options = { capture: true } as const;
    const kinds = ['pointerdown', 'click', 'keydown'] as const;
    for (const kind of kinds) {
      window.addEventListener(kind, rememberFirstTouch, options);
    }
    return () => {
      for (const kind of kinds) {
        window.removeEventListener(kind, rememberFirstTouch, options);
      }
    };
  }, []);
}

function readSoundOn() {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

function subscribeSound(onChange: () => void) {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function useSoundOn() {
  return useSyncExternalStore(subscribeSound, readSoundOn, () => true);
}

function setSoundOn(on: boolean) {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // 저장할 수 없어도 이번 화면에서는 아래 알림으로 바뀐다.
  }
  if (!on && canSpeak()) window.speechSynthesis.cancel();
  window.dispatchEvent(new Event(SOUND_EVENT));
}

// 오른쪽 위 작은 🔊/🔇 버튼. 끄면 다시 켤 때까지 자동으로 읽지 않는다.
export function SoundToggle() {
  const on = useSoundOn();
  const { t } = useLanguage();
  useFirstTouch();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t.ttobagi.soundOn : t.ttobagi.soundOff}
      onClick={() => setSoundOn(!on)}
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white text-2xl hover:border-stat-green focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
    >
      <span aria-hidden="true">{on ? '🔊' : '🔇'}</span>
    </button>
  );
}

function Sentences({ message }: { message: string }) {
  // 문장마다 줄을 바꿔 한 번에 한 가지씩 읽히게 한다.
  return message.split(/(?<=[.!?])\s+/).map((sentence) => (
    <span key={sentence} className="block">
      {sentence}
    </span>
  ));
}

// 또박이 + 옆 작은 말풍선(글자에 딱 맞게). 또박이나 말풍선을 누르면 말한다.
// 화면에 처음 나오거나 말이 바뀌면, 사용자가 한 번이라도 누른 뒤이고 소리가 켜져 있을 때 자동으로 읽는다.
// size="sm"은 얼굴만 작게 보여 주어 내용이 많은 화면(안내문)에서 공간을 아낀다.
// language: 말(message)이 어느 언어인지. 번역된 말이면 그 언어 목소리로 읽는다. 기본은 한국어.
export function Ttobagi({
  pose,
  message,
  size = 'md',
  language = 'ko',
}: {
  pose: Pose;
  message: string;
  size?: 'sm' | 'md';
  language?: string;
}) {
  const soundOn = useSoundOn();
  const t = getMessages(language);
  useFirstTouch();

  useEffect(() => {
    if (soundOn && hasInteracted) speak(message, false, t.speechLang);
  }, [message, soundOn, t.speechLang]);

  return (
    <button
      type="button"
      onClick={() => {
        rememberFirstTouch();
        speak(message, true, t.speechLang);
      }}
      aria-label={t.ttobagi.aria(message)}
      className="flex w-full items-center gap-2 rounded-3xl text-left focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
    >
      <span
        aria-hidden="true"
        className={`shrink-0 ${size === 'sm' ? 'w-14' : 'w-20'} ${bodyMotion[pose]}`}
      >
        <TtobagiFigure pose={pose} face={size === 'sm'} />
      </span>
      <span className="relative ml-1 max-w-full rounded-2xl border-2 border-stat-green bg-white px-3 py-2 shadow-sm">
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-[9px] size-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-stat-green bg-white"
        />
        <span className="relative block text-xl leading-snug font-bold break-keep text-stat-ink">
          <Sentences message={message} />
        </span>
      </span>
    </button>
  );
}
