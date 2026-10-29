'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import type { GuideKind } from '@/lib/guide-catalog';
import { guideLessonHref, nextGuide } from '@/lib/guide-progress';

import { useLanguageOr } from '../../language-provider';

import { completeGuide } from '../records';
import { CardScene } from './card-scene';
import { designedLessonCount, LessonDesign } from './lesson-design';
import { photoLessons } from './photo-lesson';
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

// speechLang: 읽을 문장의 언어(ko-KR, en-US, ja-JP, zh-CN, vi-VN)
function getSpeech(speechLang: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const prefix = speechLang.slice(0, 2).toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) =>
    item.lang.toLowerCase().startsWith(prefix),
  );
  // 목소리 목록은 있는데 그 언어 목소리가 없으면 자막만 시간에 맞춰 넘긴다.
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

// 이 수업이 맡은 안내
const thisGuide: GuideKind = 'colonoscopy';

export function PhotoLesson({
  code,
  language,
  guides,
  completed: initialCompleted,
}: {
  code: string;
  /** 의료진이 고른 언어. 안내 사이 이동 문구에 쓴다(수업 본문은 한국어). */
  language: string;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이미 마친 안내 */
  completed: GuideKind[];
}) {
  const router = useRouter();
  // 환자가 고른 언어(없으면 의료진이 고른 언어). 안내 사이 이동 문구에 쓴다.
  const { t } = useLanguageOr(language);
  const [completed, setCompleted] = useState(initialCompleted);
  // 아직 안 마친 다른 안내. 순서는 정하지 않고 남은 것으로 간다.
  const next = nextGuide(guides, completed, thisGuide);
  const nextHref = next ? guideLessonHref(code, next) : null;
  const finish = next
    ? t.guideDoneNext(t.guides[thisGuide], t.guides[next])
    : t.allDone;
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
  const subtitle = getSubtitle(lessons, state, finish);
  // 수업 본문은 한국어, 마지막 교시 뒤 이동 문구만 번역된 말이다. 말의 언어에 맞는 목소리로 읽는다.
  const translatedLine =
    (state.mode === 'praise' || state.mode === 'done') &&
    state.lesson === lessons.length - 1;
  const speechLang = translatedLine ? t.speechLang : 'ko-KR';
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

    const speech = getSpeech(speechLang);
    if (speech) {
      const utterance = new SpeechSynthesisUtterance(subtitle.text);
      utterance.lang = speechLang;
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
  }, [state.playing, state.cue, subtitle.text, minMs, autoNext, speechLang]);

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

  // 마지막 교시까지 마치면 이 안내를 "완료"로 저장한다.
  // 화면 표시(완료 목록)는 그리는 중에 바로 바꾸고, 서버 저장은 그린 뒤에 한다.
  const finished = state.mode === 'done';
  if (finished && !completed.includes(thisGuide)) {
    setCompleted([...completed, thisGuide]);
  }
  useEffect(() => {
    if (finished) void completeGuide(code, thisGuide);
  }, [finished, code]);

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
  // 1~7교시는 제목 카드 화면(lesson-design.tsx), 8교시는 안내 카드 화면.
  const designed = state.lesson < designedLessonCount;
  const card = step.kind === 'card' ? lesson.cards[step.card] : null;

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
            className={`pl-stage pl-fit ${designed ? 'pl-designed' : ''} ${designed && state.lesson < 2 ? 'pl-wide' : ''}`}
          >
            {state.started && designed && (
              <LessonDesign
                key={`design-${state.lesson}`}
                lessonIndex={state.lesson}
                lesson={lesson}
                step={step}
                stepIndex={state.step}
              />
            )}

            {state.started && !designed && card && (
              <CardScene
                key={`card-${state.lesson}-${step.kind === 'card' ? step.card : 0}-${state.reviewing}`}
                card={card}
              />
            )}

            <div className="pl-ttobak-box">
              <Ttobak
                pose={pose}
                talking={state.playing && state.mode !== 'done'}
                moving={state.playing || state.mode === 'praise'}
              />
            </div>

            <div className={`pl-bubble ${designed ? 'is-center' : ''}`}>
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
              {state.mode === 'done' &&
                (next && nextHref ? (
                  <Link href={nextHref} className="pl-replay pl-next-link">
                    {t.nextButton(t.guides[next])}
                  </Link>
                ) : (
                  <button type="button" onClick={play} className="pl-replay">
                    {t.restart}
                  </button>
                ))}
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
            {/* 마지막 장면에서는 남은 안내가 있으면 그 안내로 간다. */}
            <button
              type="button"
              onClick={() =>
                here === total - 1 && nextHref
                  ? router.push(nextHref)
                  : move('next')
              }
              disabled={here === total - 1 && !nextHref}
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
        {guides.length > 1 && (
          <section className="flex flex-col gap-2 rounded-2xl border border-[#CAD6D6] bg-white p-4">
            <h2 className="text-lg font-bold">{t.progressTitle}</h2>
            <ul className="flex flex-col gap-1.5">
              {guides.map((kind) => {
                const done = completed.includes(kind);
                const label = (
                  <>
                    <span className="text-base font-bold break-keep">
                      {t.guides[kind]}
                    </span>
                    <span
                      className={`flex-none text-sm font-bold ${done ? 'text-[#1D6E47]' : 'text-[#0F6670]'}`}
                    >
                      {done ? t.statusDone : t.statusLeft}
                    </span>
                  </>
                );
                const rowClass = `flex items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2.5 ${done ? 'border-[#2E9E6B] bg-[#DDF3E8]' : 'border-[#CAD6D6]'}`;
                // 남은 다른 안내는 눌러서 바로 갈 수 있다.
                return (
                  <li key={kind}>
                    {!done && kind !== thisGuide ? (
                      <Link
                        href={guideLessonHref(code, kind)}
                        className={`${rowClass} hover:border-[#0F6670] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <div className={rowClass}>{label}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
