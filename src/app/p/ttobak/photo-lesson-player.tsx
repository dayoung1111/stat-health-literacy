'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

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
import { lessonPlace } from '@/lib/error-log';
import type { GuideKind } from '@/lib/guide-catalog';
import { guideFinish } from '@/lib/guide-progress';

import { screenTexts } from '@/lib/screen-texts';
import { forSpeech } from '@/lib/speech-names';

import { useLanguageOr } from '../../language-provider';
import { T, useTranslatedTexts } from '../../translated';

import { setLessonPlace } from '../error-report';
import { GuideBoard } from '../guide-board';
import { markGuideDone, useCompletedGuides } from '../guide-done';
import { CardScene } from './card-scene';
import { inAppBrowser, kakaoOpenExternal } from './in-app';
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
  // 마친 안내: 서버 기록 + 이 브라우저 기록(새로고침·서버 재시작에도 남음)
  const completed = useCompletedGuides(code, initialCompleted);
  // 아직 안 마친 다른 안내와 끝 인사. 모든 안내가 같은 guideFinish로 정한다.
  const {
    next,
    nextHref,
    message: finish,
  } = guideFinish(t, code, thisGuide, guides, completed);
  const [state, dispatch] = useReducer(
    (current: LessonState, action: LessonAction) =>
      reduceLesson(lessons, current, action),
    initialLessonState,
  );
  const [immersive, setImmersive] = useState(false);
  // 전체 화면일 때 플레이어를 옮겨 둘 자리(<body> 바로 아래).
  // 페이지 안에 두면 위쪽 틀의 transform 때문에 position: fixed가 화면이 아니라 그 틀에 붙어 버린다.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isPhone = useSyncExternalStore(
    subscribeNothing,
    isPhoneScreen,
    () => false,
  );
  const inApp = useSyncExternalStore(
    subscribeNothing,
    () => inAppBrowser(navigator.userAgent),
    () => null,
  );

  const lesson = lessons[state.lesson];
  const step = currentStep(lessons, state);
  const subtitle = getSubtitle(lessons, state, finish);
  // 수업 글자(자막·강조 말)는 한국어 원문을 고른 언어로 번역해 보여 주고 읽는다.
  // 번역이 올 때까지는 한국어를 보여 주고, 소리 내어 읽는 것은 번역이 온 뒤에 시작한다.
  const spoken = useTranslatedTexts([
    subtitle.text,
    ...subtitle.keys.map((key) => key.word),
  ]);
  const [lineText, ...keyWords] = spoken.texts;
  const lineKeys = subtitle.keys.map((key, i) => ({
    ...key,
    word: keyWords[i],
  }));
  // 수업 본문은 한국어, 마지막 교시 뒤 이동 문구만 번역된 말이다. 말의 언어에 맞는 목소리로 읽는다.
  const translatedLine =
    (state.mode === 'praise' || state.mode === 'done') &&
    state.lesson === lessons.length - 1;
  const speechLang =
    translatedLine || lineText !== subtitle.text ? t.speechLang : 'ko-KR';
  const minMs = getMinDuration(lessons, state);
  const autoNext = advancesByItself(state.mode);
  const here = flatIndex(lessons, state.lesson, state.step);

  // 오류가 나면 "몇 교시 몇 단계"였는지 기록할 수 있게 지금 위치를 알려 둔다(화면에는 영향 없음).
  useEffect(() => {
    setLessonPlace(
      lessonPlace(state.lesson, state.step, state.mode === 'quiz'),
    );
    return () => setLessonPlace(null);
  }, [state.lesson, state.step, state.mode]);

  // 말하기: 음성이 끝나고 최소 시간이 지나면 다음으로. 음성이 없으면 시간에 맞춰 넘어간다.
  useEffect(() => {
    if (!state.playing || spoken.pending) return;

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
    const fallback = getFallbackDuration(lineText, minMs);

    later(() => {
      minDone = true;
      tryFinish();
    }, minMs);

    const speech = getSpeech(speechLang);
    if (speech) {
      const utterance = new SpeechSynthesisUtterance(
        forSpeech(lineText, speechLang),
      );
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
  }, [
    state.playing,
    state.cue,
    lineText,
    spoken.pending,
    minMs,
    autoNext,
    speechLang,
  ]);

  // 전체 화면 동안 뒤 화면이 움직이지 않게 하고, 닫기 버튼에 초점을 둔다.
  // 키보드 Esc로도 닫을 수 있다.
  useEffect(() => {
    if (!immersive) return;
    const page = document.documentElement;
    const before = [page.style.overflow, document.body.style.overflow];
    page.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      [page.style.overflow, document.body.style.overflow] = before;
      window.removeEventListener('keydown', onKey);
    };
  }, [immersive]);

  // 수업 화면을 떠나면 옮겨 둘 자리도 지운다.
  useEffect(() => () => host?.remove(), [host]);

  // 마지막 교시까지 마치면 이 안내를 "완료"로 저장한다(브라우저 + 서버).
  const finished = state.mode === 'done';
  useEffect(() => {
    if (finished) markGuideDone(code, thisGuide);
  }, [finished, code]);

  // 다른 화면으로 나가면 음성을 멈춘다.
  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function enterImmersive() {
    let shell = host as WebkitElement | null;
    if (!shell) {
      shell = document.createElement('div');
      document.body.appendChild(shell);
      setHost(shell);
    }
    setImmersive(true);
    // 안드로이드: 전체 화면 + 가로 고정을 먼저 해 본다(누른 순간에 요청해야 허락된다).
    // 아이폰·앱 안 브라우저는 안 되므로 CSS(화면 전체 고정 + 세로면 90도 돌리기)로 보여 준다.
    try {
      const request = shell.requestFullscreen
        ? shell.requestFullscreen()
        : shell.webkitRequestFullscreen?.();
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

  const parts = splitKeys(lineText, lineKeys);
  // 전체 화면이면 플레이어를 <body> 바로 아래(host)에 그려 화면 맨 위 층을 덮는다.
  const onTop = (player: ReactNode) =>
    immersive && host ? createPortal(player, host) : player;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {onTop(
        <div className={immersive ? 'pl-immersive' : ''}>
          <div
            className={
              immersive
                ? `pl-rotor ${inApp ? 'pl-inapp' : ''}`
                : 'flex flex-col gap-3.5'
            }
          >
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
            {immersive && inApp && <OpenOutside app={inApp} />}

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
                  <div
                    className="pl-choices"
                    role="group"
                    aria-label="답 고르기"
                  >
                    {lesson.quiz.options.map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => answer(index)}
                        className={`pl-choice ${state.wrong === index ? 'wrong' : ''}`}
                      >
                        <T>{option}</T>
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
                  <span className="pl-start-title">
                    <T>{screenTexts.lesson.startTitle}</T>
                  </span>
                  <span className="pl-start-sub">
                    <T>{screenTexts.lesson.startSub}</T>
                  </span>
                </div>
              )}
            </section>

            <div className="pl-fit pl-controls flex w-full flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => move('prev')}
                disabled={here === 0}
                className={controlClass}
              >
                <T>{screenTexts.lesson.prev}</T>
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-13 items-center justify-center rounded-2xl bg-[#0F6670] px-6 text-lg font-bold text-white hover:bg-[#0B4E56] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]"
              >
                <T>
                  {state.playing
                    ? screenTexts.lesson.pause
                    : state.mode === 'done'
                      ? screenTexts.lesson.again
                      : screenTexts.lesson.play}
                </T>
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
                <T>{screenTexts.lesson.next}</T>
              </button>
              <div
                role="progressbar"
                aria-label="수업 진행"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={here + 1}
                className="flex min-w-48 flex-1 gap-1.5"
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
        </div>,
      )}

      <aside className="flex flex-col gap-4 text-[#15262B]">
        <GuideBoard
          code={code}
          current={thisGuide}
          guides={guides}
          completed={completed}
          language={language}
        />

        <section className="flex flex-col gap-2.5 rounded-2xl border border-[#CAD6D6] bg-white p-4">
          <h2 className="text-lg font-bold">
            <T>{screenTexts.lesson.title}</T>
          </h2>
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
                      <T>{item.title}</T>
                    </span>
                    <span className="flex-none text-sm font-semibold">
                      {now ? (
                        <T>{screenTexts.lesson.now}</T>
                      ) : done ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#2E9E6B] text-white">
                          <span aria-hidden="true">✓</span>
                          <span className="sr-only">
                            <T>{screenTexts.lesson.ended}</T>
                          </span>
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
            <T>{screenTexts.lesson.followPrep}</T>
          </Link>
        )}
      </aside>
    </div>
  );
}

// 앱 안 브라우저(카카오톡 등)에서만 보이는 작은 회색 띠.
// 카카오톡은 기기 기본 브라우저로 바로 열고, 다른 앱은 주소를 복사해 붙여 넣도록 안내한다.
function OpenOutside({ app }: { app: 'kakao' | 'other' }) {
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null);

  function open() {
    const url = window.location.href;
    if (app === 'kakao') {
      window.location.href = kakaoOpenExternal(url);
      return;
    }
    if (!navigator.clipboard) {
      setCopied('no');
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => setCopied('yes'),
      () => setCopied('no'),
    );
  }

  return (
    <div className="pl-open-outside" role="note">
      <span>
        <T>
          {copied === 'yes'
            ? '주소를 복사했어요. Safari나 크롬 주소창에 붙여 넣어 주세요.'
            : copied === 'no'
              ? '오른쪽 위 메뉴(⋯)에서 "다른 브라우저로 열기"를 눌러 주세요.'
              : 'Safari나 크롬으로 열면 더 크게 볼 수 있어요'}
        </T>
      </span>
      {copied === null && (
        <button type="button" onClick={open}>
          <T>열기</T>
        </button>
      )}
    </div>
  );
}
