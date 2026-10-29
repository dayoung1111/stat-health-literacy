'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  advancesByItself,
  currentStep,
  flatIndex,
  getFallbackDuration,
  getMinDuration,
  getSubtitle,
  initialLessonState,
  reduceLesson,
  splitKeys,
  totalSteps,
  type LessonAction,
  type LessonState,
} from './lesson-state';
import { CardScene } from './card-scene';
import { getPhoto, photoLessons, type FoodPhoto } from './photo-lesson';
import { PrepScene } from './prep-scene';
import { Ttobak, type LessonPose } from './ttobak';
import './photo-lesson.css';

// 또박이 선생님 대장내시경 수업(1~8교시): 사진·카드·약 만들기 그림·또박이(SVG)·브라우저 음성으로 만든 영상.
// 외부 영상·유료 서비스를 쓰지 않는다. 음성이 안 되는 기기에서는 자막이 시간에 맞춰 넘어간다.

const lessons = photoLessons;
const total = totalSteps(lessons);

type Orientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang.toLowerCase().startsWith('ko'));
  // 목소리 목록은 있는데 한국어가 없으면 자막만 시간에 맞춰 넘긴다.
  if (voices.length > 0 && !voice) return null;
  return { synth: window.speechSynthesis, voice };
}

// iOS 등은 버튼을 누른 순간에 음성을 한 번 시작해야 이후 음성이 나온다.
function unlockSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}

const subscribeNothing = () => () => {};
// 휴대폰(손가락으로 누르는 작은 화면)이면 재생할 때 가로 전체 화면으로 바꾼다.
const isPhoneScreen = () =>
  window.matchMedia('(pointer: coarse)').matches &&
  Math.min(window.screen.width, window.screen.height) < 600;

const controlClass =
  'flex h-13 items-center justify-center rounded-2xl border-[1.5px] border-[#CAD6D6] bg-white px-5 text-lg font-semibold text-[#15262B] hover:border-[#0F6670] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670] disabled:cursor-not-allowed disabled:opacity-40';

export function PhotoLesson({ code }: { code: string }) {
  const [state, dispatch] = useReducer(
    (current: LessonState, action: LessonAction) =>
      reduceLesson(lessons, current, action),
    initialLessonState,
  );
  const [immersive, setImmersive] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isPhone = useSyncExternalStore(
    subscribeNothing,
    isPhoneScreen,
    () => false,
  );

  const lesson = lessons[state.lesson];
  const step = currentStep(lessons, state);
  const subtitle = getSubtitle(lessons, state);
  const minMs = getMinDuration(lessons, state);
  const autoNext = advancesByItself(state.mode);
  const here = flatIndex(lessons, state.lesson, state.step);

  // 말하기: 음성이 끝나고 최소 시간이 지나면 다음으로. 음성이 없으면 시간에 맞춰 넘어간다.
  useEffect(() => {
    if (!state.playing) return;

    let finished = false;
    let spoke = false;
    let minDone = false;
    const timers: number[] = [];
    const later = (run: () => void, ms: number) => {
      timers.push(window.setTimeout(run, ms));
    };
    const finish = () => {
      if (finished || !autoNext) return;
      finished = true;
      dispatch({ type: 'lineEnded' });
    };
    const tryFinish = () => {
      if (spoke && minDone) finish();
    };
    const fallback = getFallbackDuration(subtitle.text, minMs);

    later(() => {
      minDone = true;
      tryFinish();
    }, minMs);

    const speech = getSpeech();
    if (speech) {
      const utterance = new SpeechSynthesisUtterance(subtitle.text);
      utterance.lang = 'ko-KR';
      utterance.pitch = 1.3;
      utterance.rate = 0.88;
      if (speech.voice) utterance.voice = speech.voice;
      utterance.onend = () =>
        later(() => {
          spoke = true;
          tryFinish();
        }, 600);
      utterance.onerror = () => later(finish, fallback);
      speech.synth.cancel();
      speech.synth.speak(utterance);
      // 음성 종료 알림이 오지 않는 기기를 위한 안전장치
      later(finish, fallback * 2);
    } else {
      later(finish, fallback);
    }

    return () => {
      finished = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      speech?.synth.cancel();
    };
  }, [state.playing, state.cue, subtitle.text, minMs, autoNext]);

  // 전체 화면 동안 뒤 화면이 움직이지 않게 하고, 닫기 버튼에 초점을 둔다.
  // 키보드 Esc로도 닫을 수 있다.
  useEffect(() => {
    if (!immersive) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [immersive]);

  // 다른 화면으로 나가면 음성을 멈춘다.
  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function enterImmersive() {
    setImmersive(true);
    const shell = shellRef.current as WebkitElement | null;
    // 안드로이드: 전체 화면 + 가로 고정. 아이폰은 둘 다 안 되므로 CSS로 돌려서 보여 준다.
    try {
      const request = shell?.requestFullscreen
        ? shell.requestFullscreen()
        : shell?.webkitRequestFullscreen?.();
      Promise.resolve(request)
        .then(() => (screen.orientation as Orientation).lock?.('landscape'))
        .catch(() => {
          // 방향 고정을 못 하는 기기: 세로면 CSS로 90도 돌려 보여 준다.
        });
    } catch {
      // 전체 화면을 지원하지 않는 기기: 화면 전체 고정만 쓴다.
    }
  }

  function exitImmersive() {
    setImmersive(false);
    dispatch({ type: 'pause' });
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // 이미 전체 화면이 아니면 할 일이 없다.
      });
    }
    try {
      (screen.orientation as Orientation).unlock?.();
    } catch {
      // 방향 고정을 지원하지 않는 기기
    }
  }

  function play() {
    unlockSpeech();
    if (isPhone && !immersive) enterImmersive();
    dispatch({ type: 'play' });
  }

  function togglePlay() {
    if (state.playing) dispatch({ type: 'pause' });
    else play();
  }

  function move(type: 'next' | 'prev') {
    unlockSpeech();
    dispatch({ type });
  }

  function answer(index: number) {
    unlockSpeech();
    dispatch({ type: 'answer', index });
  }

  function goLesson(index: number) {
    unlockSpeech();
    if (isPhone && !immersive) enterImmersive();
    dispatch({ type: 'goLesson', lesson: index });
  }

  // 퀴즈·칭찬 중에는 그 교시의 마지막(또는 다시 볼) 장면을 그대로 둔다.
  const isPhotoLesson = lesson.format === 'photo';
  const showPhoto =
    state.started && state.mode === 'step' && step.kind === 'photo';
  const showGrid = state.started && isPhotoLesson && !showPhoto;
  const marked = state.mode !== 'step' || step.kind === 'summary';
  const card = step.kind === 'card' ? lesson.cards[step.card] : null;
  const lessonPhotos = lesson.steps.flatMap((item) =>
    item.kind === 'photo' ? [getPhoto(item.photo)] : [],
  );
  const photo = step.kind === 'photo' ? getPhoto(step.photo) : null;
  const prevStep = lesson.steps[state.step - 1];
  const prevPhoto =
    !state.reviewing && prevStep?.kind === 'photo'
      ? getPhoto(prevStep.photo)
      : null;
  const sceneKey = `${state.lesson}-${state.step}-${state.reviewing}`;

  const pose: LessonPose =
    state.mode === 'praise' || state.mode === 'done'
      ? 'cheer'
      : !state.started || (state.mode === 'step' && step.kind === 'intro')
        ? 'wave'
        : 'point';

  const parts = splitKeys(subtitle.text, subtitle.keys);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div ref={shellRef} className={immersive ? 'pl-immersive' : ''}>
        <div className={immersive ? 'pl-rotor' : 'flex flex-col gap-3.5'}>
          {immersive && (
            <button
              ref={closeRef}
              type="button"
              onClick={exitImmersive}
              aria-label="전체 화면 닫기"
              className="pl-close"
            >
              ✕
            </button>
          )}

          <section
            aria-label="또박이 선생님 사진 수업 영상"
            className="pl-stage pl-fit"
          >
            {showPhoto && prevPhoto && (
              <PhotoLayer
                photo={prevPhoto}
                className={`is-prev ${photoAlt(lessonPhotos, prevPhoto)}`}
              />
            )}
            {showPhoto && photo && (
              <div key={sceneKey}>
                <PhotoLayer
                  photo={photo}
                  className={`is-current ${photoAlt(lessonPhotos, photo)}`}
                />
                <Mark tone={photo.tone} />
                <div className="pl-label">
                  <span className={`pl-pill ${photo.tone}`}>
                    {photo.tone === 'no' ? '✕ 먹으면 안 돼요' : '○ 드셔도 돼요'}
                  </span>
                  <span className="pl-name">{photo.name}</span>
                </div>
              </div>
            )}

            {showGrid && (
              <div className="pl-grid" key={`grid-${state.lesson}-${marked}`}>
                <div className="pl-grid-inner">
                  <p className="pl-grid-title">
                    {marked ? lesson.summaryTitle : lesson.introTitle}
                  </p>
                  <ul className="pl-grid-list">
                    {lessonPhotos.map((item, index) => (
                      <li
                        key={item.id}
                        className={`pl-thumb ${item.tone} ${marked ? 'marked' : ''}`}
                      >
                        <Image
                          src={item.src}
                          alt={item.alt}
                          fill
                          sizes="(max-width: 900px) 33vw, 280px"
                        />
                        {marked && (
                          <ThumbMark
                            tone={item.tone}
                            delay={0.3 + index * 0.35}
                          />
                        )}
                        <span className="pl-thumb-name">
                          {marked && (
                            <span className="sr-only">
                              {item.tone === 'no'
                                ? '먹으면 안 돼요: '
                                : '드셔도 돼요: '}
                            </span>
                          )}
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {state.started && card && (
              <CardScene
                key={`card-${state.lesson}-${step.kind === 'card' ? step.card : 0}-${state.reviewing}`}
                card={card}
              />
            )}

            {state.started && step.kind === 'prep' && (
              <div key={sceneKey}>
                <p className="pp-badge">{step.badge}</p>
                <div className="pp-stage-scene">
                  <PrepScene scene={step.scene} hour={lesson.hour} />
                </div>
              </div>
            )}

            <div className="pl-ttobak-box">
              <Ttobak
                pose={pose}
                talking={state.playing && state.mode !== 'done'}
                moving={state.playing || state.mode === 'praise'}
              />
            </div>

            <div className="pl-bubble">
              <p aria-live="polite" className="pl-sub">
                {parts.map((part, index) =>
                  part.tone ? (
                    <span key={index} className={`pl-key ${part.tone}`}>
                      {part.text}
                    </span>
                  ) : (
                    part.text
                  ),
                )}
              </p>
              {state.mode === 'quiz' && lesson.quiz && (
                <div className="pl-choices" role="group" aria-label="답 고르기">
                  {lesson.quiz.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answer(index)}
                      className={`pl-choice ${state.wrong === index ? 'wrong' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {state.mode === 'done' && (
                <button type="button" onClick={play} className="pl-replay">
                  처음부터 다시
                </button>
              )}
            </div>

            {!state.started && (
              <div className="pl-start">
                <button
                  type="button"
                  onClick={play}
                  aria-label="수업 시작. 소리가 나와요."
                  className="pl-start-button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8 5 L19 12 L8 19 Z" fill="#FFFFFF" />
                  </svg>
                </button>
                <span className="pl-start-title">눌러서 수업 시작</span>
                <span className="pl-start-sub">소리를 켜 주세요</span>
              </div>
            )}
          </section>

          <div className="pl-fit flex w-full items-center gap-3.5">
            <button
              type="button"
              onClick={() => move('prev')}
              disabled={here === 0}
              className={controlClass}
            >
              이전
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-13 items-center justify-center rounded-2xl bg-[#0F6670] px-6 text-lg font-bold text-white hover:bg-[#0B4E56] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]"
            >
              {state.playing
                ? '일시정지'
                : state.mode === 'done'
                  ? '처음부터'
                  : '재생'}
            </button>
            <button
              type="button"
              onClick={() => move('next')}
              disabled={here === total - 1}
              className={controlClass}
            >
              다음
            </button>
            <div
              role="progressbar"
              aria-label="수업 진행"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={here + 1}
              className="flex flex-1 gap-1.5"
            >
              {Array.from({ length: total }, (_, index) => (
                <span
                  key={index}
                  className={`h-2 flex-1 rounded ${state.started && index <= state.reached ? 'bg-[#0F6670]' : 'bg-[#CAD6D6]'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4 text-[#15262B]">
        <section className="flex flex-col gap-2.5 rounded-2xl border border-[#CAD6D6] bg-white p-4">
          <h2 className="text-lg font-bold">대장내시경 수업</h2>
          <ol className="flex flex-col gap-1.5">
            {lessons.map((item, index) => {
              const done = index < state.lesson || state.mode === 'done';
              const now = state.started && index === state.lesson && !done;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => goLesson(index)}
                    aria-current={now ? 'step' : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left hover:border-[#0F6670] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670] ${now ? 'border-[#0F6670] bg-[#DCEDEE] text-[#0B4E56]' : 'border-[#CAD6D6] text-[#4A5D63]'}`}
                  >
                    <span className="text-base font-bold break-keep">
                      {item.title}
                    </span>
                    <span className="flex-none text-sm font-semibold">
                      {now ? (
                        '지금'
                      ) : done ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#2E9E6B] text-white">
                          <span aria-hidden="true">✓</span>
                          <span className="sr-only">끝난 교시</span>
                        </span>
                      ) : (
                        ''
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {lesson.format === 'prep' && (
          <Link
            href={`/p/${code}/prep`}
            className="flex min-h-14 items-center justify-center rounded-2xl bg-[#0F6670] px-4 text-center text-lg font-bold text-white hover:bg-[#0B4E56] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]"
          >
            따라하기로 직접 해보기
          </Link>
        )}
      </aside>
    </div>
  );
}

// 사진마다 확대 방향을 번갈아 바꾼다.
function photoAlt(list: FoodPhoto[], photo: FoodPhoto) {
  return list.indexOf(photo) % 2 === 1 ? 'alt' : '';
}

function PhotoLayer({
  photo,
  className,
}: {
  photo: FoodPhoto;
  className: string;
}) {
  return (
    <div className={`pl-photo ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 1000px) 100vw, 900px"
      />
    </div>
  );
}

// 사진 위 큰 X(\ 다음 /) 또는 동그라미
function Mark({ tone }: { tone: FoodPhoto['tone'] }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 300" className="pl-mark">
      {tone === 'no' ? (
        <>
          <path
            d="M40 40 L260 260"
            stroke="#D9363E"
            strokeWidth="22"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: '1.1s' }}
          />
          <path
            d="M260 40 L40 260"
            stroke="#D9363E"
            strokeWidth="22"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: '1.55s' }}
          />
        </>
      ) : (
        <circle
          cx="150"
          cy="150"
          r="112"
          fill="none"
          stroke="#2E9E6B"
          strokeWidth="20"
          strokeLinecap="round"
          transform="rotate(-90 150 150)"
          className="pl-draw-circle"
          style={{ animationDelay: '1.1s' }}
        />
      )}
    </svg>
  );
}

function ThumbMark({
  tone,
  delay,
}: {
  tone: FoodPhoto['tone'];
  delay: number;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className="pl-thumb-mark">
      {tone === 'no' ? (
        <>
          <path
            d="M14 14 L106 106"
            stroke="#D9363E"
            strokeWidth="12"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay}s` }}
          />
          <path
            d="M106 14 L14 106"
            stroke="#D9363E"
            strokeWidth="12"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay + 0.2}s` }}
          />
        </>
      ) : (
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#2E9E6B"
          strokeWidth="11"
          strokeLinecap="round"
          className="pl-draw-circle"
          style={{ animationDelay: `${delay}s` }}
        />
      )}
    </svg>
  );
}
