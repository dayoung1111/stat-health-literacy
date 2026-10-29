'use client';

import Image from 'next/image';
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
  groupRange,
  keyTone,
  reduceLesson,
  startAt,
  totalSteps,
  type LessonAction,
  type LessonState,
  type Subtitle,
} from './lesson-state';
import {
  foodPhotos,
  getPhoto,
  sceneState,
  type FoodPhoto,
  type Lesson,
  type Scene,
} from './photo-lesson';
import { Ttobak, type LessonPose } from './ttobak';
import './photo-lesson.css';

import { speechLang, subtitleKey, type Lang } from '@/lib/i18n';

import { findVoice, useText } from '../../language';

// 또박이 선생님 사진 수업: 음식 사진·또박이(SVG)·브라우저 음성으로 만든 영상.
// 외부 영상·유료 서비스를 쓰지 않는다. 음성이 안 되는 기기에서는 자막이 시간에 맞춰 넘어간다.
// 자막·글자는 고른 언어(한국어/영어)로 보여 주고, 음성도 그 언어(ko-KR / en-US)로 읽는다.
// 수업 목록(lessons)을 받아 보여 준다. 수업 모양은 두 가지다.
// - 사진 수업(대장내시경): 사진 한 장이 화면 가득, 정리 격자, 말풍선 안 퀴즈
// - 장면 수업(검진 전날 준비, lesson.scenes): 접시 그림 1~4개, 장면 제목, 깜짝 퀴즈 화면

type Orientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getSpeech(lang: Lang) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const voice = findVoice(voices, lang);
  // 목소리 목록은 있는데 고른 언어 목소리가 없으면 자막만 시간에 맞춰 넘긴다.
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

export function PhotoLesson({
  lessons,
  startLesson = 0,
}: {
  lessons: Lesson[];
  /** 처음 보여 줄 교시 번호 */
  startLesson?: number;
}) {
  const [state, dispatch] = useReducer(
    (current: LessonState, action: LessonAction) =>
      reduceLesson(lessons, current, action),
    startLesson,
    (start) => startAt(lessons, start),
  );
  const [immersive, setImmersive] = useState(false);
  const { lang, t, src } = useText();
  const shellRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isPhone = useSyncExternalStore(
    subscribeNothing,
    isPhoneScreen,
    () => false,
  );

  const total = totalSteps(lessons);
  const lesson = lessons[state.lesson];
  const scenes = lesson.scenes;
  const step = currentStep(lessons, state);
  const subtitle = getSubtitle(lessons, state);
  // 화면에 보이고 읽을 자막과 색으로 강조할 말(고른 언어)
  const line = subtitle.id ? t(subtitle.id) : src(subtitle.text);
  const lineKey = subtitleKey(lang, subtitle.key);
  const minMs = getMinDuration(lessons, state);
  const autoNext = advancesByItself(state.mode);
  const here = flatIndex(lessons, state.lesson, state.step);
  // 진행 막대는 지금 이어서 보는 교시 묶음만 보여 준다.
  const group = groupRange(lessons, state.lesson);
  const groupStart = flatIndex(lessons, group.first, 0);
  const groupTotal =
    flatIndex(lessons, group.last, lessons[group.last].steps.length) -
    groupStart;

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
    const fallback = getFallbackDuration(line, minMs);

    later(() => {
      minDone = true;
      tryFinish();
    }, minMs);

    const speech = getSpeech(lang);
    if (speech) {
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = speechLang[lang];
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
  }, [state.playing, state.cue, line, lang, minMs, autoNext]);

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

  // 오른쪽 목록에서 교시·장면을 고르면 그곳부터 재생한다.
  function jump(lessonIndex: number, stepIndex: number) {
    unlockSpeech();
    if (isPhone && !immersive) enterImmersive();
    dispatch({ type: 'jump', lesson: lessonIndex, step: stepIndex });
  }

  const showPhoto =
    !scenes && state.started && state.mode === 'step' && step.kind === 'photo';
  const showGrid = !scenes && state.started && !showPhoto;
  const marked = state.mode !== 'step' || step.kind === 'summary';
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

  // 장면 수업: 지금 장면과 그 장면에서 나타난 그림·표시
  const ended = state.mode === 'finish' || state.mode === 'done';
  const sceneNow =
    scenes && step.kind === 'scene' && state.started && !ended
      ? {
          index: step.scene,
          scene: scenes[step.scene],
          ...sceneState(scenes[step.scene], step.line),
        }
      : null;
  const quizOpen =
    Boolean(scenes) &&
    (state.mode === 'quiz' ||
      state.mode === 'retry' ||
      state.mode === 'praise');

  const pose: LessonPose = scenes
    ? ended || state.mode === 'praise'
      ? 'cheer'
      : !state.started
        ? 'wave'
        : state.mode === 'step' && sceneNow
          ? sceneNow.pose
          : 'point'
    : state.mode === 'praise' || state.mode === 'done'
      ? 'cheer'
      : !state.started || (state.mode === 'step' && step.kind === 'intro')
        ? 'wave'
        : 'point';

  const keyAt = lineKey ? line.indexOf(lineKey) : -1;
  const quiz = lesson.quizzes[state.quiz];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div ref={shellRef} className={immersive ? 'pl-immersive' : ''}>
        <div className={immersive ? 'pl-rotor' : 'flex flex-col gap-3.5'}>
          {immersive && (
            <button
              ref={closeRef}
              type="button"
              onClick={exitImmersive}
              aria-label={t('lesson.close')}
              className="pl-close"
            >
              ✕
            </button>
          )}

          <section aria-label={t('lesson.video')} className="pl-stage pl-fit">
            {scenes && (
              <>
                <div className="pl-table" />
                {/* 그림(사진)은 수업을 시작한 뒤에 불러온다. */}
                {sceneNow && (
                  <SceneItems
                    key={`items-${state.lesson}-${sceneNow.index}`}
                    scene={sceneNow.scene}
                    shown={sceneNow.shown}
                    marks={sceneNow.marks}
                  />
                )}
                <p className="pl-chip">
                  {src(
                    ended
                      ? (lesson.finish?.title ?? '')
                      : (sceneNow?.scene ?? scenes[0]).title,
                  )}
                </p>
              </>
            )}

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
                    {t(photo.tone === 'no' ? 'lesson.noPill' : 'lesson.okPill')}
                  </span>
                  <span className="pl-name">{src(photo.name)}</span>
                </div>
              </div>
            )}

            {showGrid && (
              <div className="pl-grid" key={`grid-${state.lesson}-${marked}`}>
                <div className="pl-grid-inner">
                  <p className="pl-grid-title">
                    {src(marked ? lesson.summaryTitle : lesson.introTitle)}
                  </p>
                  <ul className="pl-grid-list">
                    {lessonPhotos.map((item, index) => (
                      <li
                        key={item.id}
                        className={`pl-thumb ${item.tone} ${marked ? 'marked' : ''}`}
                      >
                        <Image
                          src={item.src}
                          alt={src(item.alt)}
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
                              {t(
                                item.tone === 'no'
                                  ? 'lesson.noSr'
                                  : 'lesson.okSr',
                              )}
                            </span>
                          )}
                          {src(item.name)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className={`pl-ttobak-box ${scenes ? 'scene' : ''}`}>
              <Ttobak
                pose={pose}
                talking={state.playing && state.mode !== 'done'}
                moving={state.playing || state.mode === 'praise'}
              />
            </div>

            <div className={`pl-bubble ${scenes ? 'scene' : ''}`}>
              {scenes ? (
                <SceneSubtitle subtitle={subtitle} line={line} />
              ) : (
                <p aria-live="polite" className="pl-sub">
                  {keyAt >= 0 ? (
                    <>
                      {line.slice(0, keyAt)}
                      <span className={`pl-key ${keyTone(subtitle.key)}`}>
                        {lineKey}
                      </span>
                      {line.slice(keyAt + lineKey.length)}
                    </>
                  ) : (
                    line
                  )}
                </p>
              )}
              {!scenes && state.mode === 'quiz' && (
                <div
                  className="pl-choices"
                  role="group"
                  aria-label={t('lesson.choices')}
                >
                  {quiz.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answer(index)}
                      className={`pl-choice ${state.wrong === index ? 'wrong' : ''}`}
                    >
                      {src(option)}
                    </button>
                  ))}
                </div>
              )}
              {state.mode === 'done' && (
                <button type="button" onClick={play} className="pl-replay">
                  {t('lesson.replay')}
                </button>
              )}
            </div>

            {quizOpen && (
              <div
                className="pl-quiz"
                role="group"
                aria-labelledby="pl-quiz-question"
              >
                <span className="pl-qtag">{src(lesson.quizTag ?? '')}</span>
                <h2 id="pl-quiz-question">{src(quiz.question)}</h2>
                <div className="pl-opts">
                  {quiz.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answer(index)}
                      disabled={state.mode !== 'quiz'}
                      className={`pl-opt ${state.wrong === index ? 'wrong' : ''}`}
                    >
                      {src(option)}
                    </button>
                  ))}
                </div>
                <p
                  aria-live="polite"
                  className={`pl-feedback ${state.mode === 'praise' ? 'ok' : state.mode === 'retry' ? 'no' : ''}`}
                >
                  {state.mode === 'quiz' ? '' : line}
                </p>
              </div>
            )}

            {!state.started && (
              <div className="pl-start">
                <button
                  type="button"
                  onClick={play}
                  aria-label={t('lesson.startLabel')}
                  className="pl-start-button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8 5 L19 12 L8 19 Z" fill="#FFFFFF" />
                  </svg>
                </button>
                <span className="pl-start-title whitespace-pre-line">
                  {lesson.start
                    ? src(lesson.start.title)
                    : t('lesson.startTitle')}
                </span>
                <span className="pl-start-sub">
                  {lesson.start ? src(lesson.start.sub) : t('lesson.startSub')}
                </span>
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
              {t('lesson.prev')}
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-13 items-center justify-center rounded-2xl bg-[#0F6670] px-6 text-lg font-bold text-white hover:bg-[#0B4E56] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670]"
            >
              {t(
                state.playing
                  ? 'lesson.pause'
                  : state.mode === 'done'
                    ? 'lesson.fromStart'
                    : 'lesson.play',
              )}
            </button>
            <button
              type="button"
              onClick={() => move('next')}
              disabled={here === total - 1}
              className={controlClass}
            >
              {t('lesson.next')}
            </button>
            <div
              role="progressbar"
              aria-label={t('lesson.progress')}
              aria-valuemin={1}
              aria-valuemax={groupTotal}
              aria-valuenow={here - groupStart + 1}
              className="flex flex-1 gap-1.5"
            >
              {Array.from({ length: groupTotal }, (_, index) => (
                <span
                  key={index}
                  className={`h-2 flex-1 rounded ${state.started && groupStart + index <= state.reached ? 'bg-[#0F6670]' : 'bg-[#CAD6D6]'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4 text-[#15262B]">
        <section className="flex flex-col gap-2.5 rounded-2xl border border-[#CAD6D6] bg-white p-4">
          <h2 className="text-lg font-bold">{t('lesson.today')}</h2>
          <ol className="flex flex-col gap-1.5">
            {lessons.map((item, index) => {
              const sameGroup = item.group === lesson.group;
              const done =
                (sameGroup && index < state.lesson) ||
                (index === state.lesson && state.mode === 'done');
              const now = state.started && index === state.lesson && !done;
              return (
                <li key={item.id} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => jump(index, 0)}
                    aria-current={now ? 'step' : undefined}
                    className={`flex w-full items-center justify-between rounded-xl border-[1.5px] px-3 py-2.5 text-left hover:border-[#0F6670] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670] ${now ? 'border-[#0F6670] bg-[#DCEDEE] text-[#0B4E56]' : 'border-[#CAD6D6] text-[#4A5D63]'}`}
                  >
                    <span className="text-base font-bold">
                      {src(item.title)}
                    </span>
                    <span className="text-sm font-semibold">
                      {now ? t('lesson.now') : done ? t('lesson.done') : ''}
                    </span>
                  </button>
                  {item.scenes && index === state.lesson && (
                    <SceneList
                      lessons={lessons}
                      lessonIndex={index}
                      state={state}
                      onPick={(stepIndex) => jump(index, stepIndex)}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl border border-[#CAD6D6] bg-white p-4">
          <h2 className="text-lg font-bold">{t('lesson.learned')}</h2>
          {scenes ? (
            <SceneLearned lessons={lessons} state={state} />
          ) : (
            <ul className="flex flex-col gap-2">
              {foodPhotos.map((item) => {
                const at = learnedIndex(lessons, item.id);
                const now =
                  showPhoto && photo?.id === item.id && state.mode === 'step';
                const heard = state.started && state.reached >= at && !now;
                const shown = now || heard;
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <span
                      className={`relative h-10 w-15 flex-none overflow-hidden rounded-lg border-2 bg-[#E9D6BC] ${shown ? (item.tone === 'no' ? 'border-[#D9363E]' : 'border-[#2E9E6B]') : 'border-[#CAD6D6] opacity-40'}`}
                    >
                      {/* 사진은 수업을 시작한 뒤에 불러온다. */}
                      {state.started && (
                        <Image
                          src={item.src}
                          alt=""
                          fill
                          sizes="60px"
                          className="object-cover object-[33%_46%]"
                        />
                      )}
                    </span>
                    <span
                      className={`flex-1 text-base font-semibold ${shown ? '' : 'text-[#8FA0A3]'}`}
                    >
                      {src(item.name)}
                    </span>
                    <span
                      className={`text-sm font-bold ${now ? 'text-[#0F6670]' : item.tone === 'no' ? 'text-[#A3262C]' : 'text-[#1D6E47]'}`}
                    >
                      {now
                        ? t('lesson.now')
                        : heard
                          ? t(item.tone === 'no' ? 'lesson.no' : 'lesson.ok')
                          : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

// 사진이 수업에 처음 나오는 전체 장면 번호
function learnedIndex(lessons: Lesson[], photoId: string) {
  for (let l = 0; l < lessons.length; l++) {
    const s = lessons[l].steps.findIndex(
      (step) => step.kind === 'photo' && step.photo === photoId,
    );
    if (s >= 0) return flatIndex(lessons, l, s);
  }
  return Infinity;
}

// 장면 수업에서 장면마다 첫 줄·마지막 줄의 step 번호
function sceneSteps(lesson: Lesson, scene: number) {
  const isThis = (step: Lesson['steps'][number]) =>
    step.kind === 'scene' && step.scene === scene;
  return {
    first: lesson.steps.findIndex(isThis),
    last: lesson.steps.findLastIndex(isThis),
  };
}

// 장면을 끝까지 들었는지
function sceneHeard(
  lessons: Lesson[],
  state: LessonState,
  lessonIndex: number,
  scene: number,
) {
  const { last } = sceneSteps(lessons[lessonIndex], scene);
  return (
    state.started && state.finished >= flatIndex(lessons, lessonIndex, last)
  );
}

// 접시 그림들. 처음부터 모두 자리를 잡고, 자막 줄마다 정해진 그림이 나타나고 표시가 그려진다.
function SceneItems({
  scene,
  shown,
  marks,
}: {
  scene: Scene;
  shown: Set<number>;
  marks: Map<number, 'x' | 'o'>;
}) {
  const { t, src } = useText();
  return (
    <div className="pl-zoom">
      <ul className="pl-items" data-n={scene.items.length}>
        {scene.items.map((item, index) => {
          const mark = marks.get(index);
          return (
            <li
              key={item.label}
              aria-hidden={!shown.has(index)}
              className={`pl-item ${shown.has(index) ? 'in' : ''}`}
            >
              <span className={`pl-plate ${'photo' in item ? 'photo' : ''}`}>
                {'photo' in item ? (
                  <span className="pl-plate-photo">
                    <Image
                      src={item.photo.src}
                      alt={src(item.photo.alt)}
                      fill
                      sizes="(max-width: 900px) 31vw, 300px"
                    />
                  </span>
                ) : (
                  <NightClock
                    hour={item.clock.hour}
                    caption={src(item.clock.caption)}
                  />
                )}
              </span>
              {mark && <ItemMark kind={mark} />}
              <span className="pl-item-label">
                {mark && (
                  <span className="sr-only">
                    {t(mark === 'x' ? 'common.no' : 'lesson.goodSr')}
                  </span>
                )}
                {src(item.label)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// 장면 수업 자막: 한 문장으로 이어서 보여 주고, 색칠한 말도 문장 안에 그대로 둔다.
function SceneSubtitle({
  subtitle,
  line,
}: {
  subtitle: Subtitle;
  line: string;
}) {
  const { src } = useText();
  // 고른 언어로 바꾼 문장이 원문과 다르면(번역됨) 색칠 없이 보여 준다.
  const parts =
    subtitle.parts && line === subtitle.text ? subtitle.parts : null;
  return (
    <p aria-live="polite" className="pl-scene-sub">
      {parts
        ? parts.map((part, index) =>
            part.tone ? (
              <span key={index} className={`pl-part ${part.tone}`}>
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )
        : line}
      {subtitle.note && <small className="pl-note">{src(subtitle.note)}</small>}
    </p>
  );
}

// 오른쪽 교시 목록 아래 장면 목록(지금 보는 장면 수업)
function SceneList({
  lessons,
  lessonIndex,
  state,
  onPick,
}: {
  lessons: Lesson[];
  lessonIndex: number;
  state: LessonState;
  onPick: (step: number) => void;
}) {
  const { t, src } = useText();
  const lesson = lessons[lessonIndex];
  const step = lesson.steps[state.step];
  return (
    <ol aria-label={t('lesson.scenes')} className="flex flex-col gap-1 pl-2">
      {(lesson.scenes ?? []).map((scene, index) => {
        const now =
          state.started &&
          state.mode === 'step' &&
          step?.kind === 'scene' &&
          step.scene === index;
        const done = sceneHeard(lessons, state, lessonIndex, index);
        return (
          <li key={scene.title}>
            <button
              type="button"
              onClick={() => onPick(sceneSteps(lesson, index).first)}
              aria-current={now ? 'step' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[15px] hover:bg-[#DCEDEE] focus-visible:outline-2 focus-visible:outline-[#0F6670] ${now ? 'bg-[#DCEDEE] font-bold' : 'font-medium'}`}
            >
              <span
                className={`grid size-6.5 flex-none place-items-center rounded-full border-[1.5px] text-xs font-bold ${done ? 'border-[#0F6670] bg-[#0F6670] text-white' : now ? 'border-[#0F6670] text-[#0F6670]' : 'border-[#CAD6D6] text-[#5B6E72]'}`}
              >
                {index + 1}
              </span>
              {src(scene.title)}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// "이번 시간에 배운 것": 장면을 끝까지 들으면 하나씩 쌓인다.
function SceneLearned({
  lessons,
  state,
}: {
  lessons: Lesson[];
  state: LessonState;
}) {
  const { src } = useText();
  const lesson = lessons[state.lesson];
  const learned = (lesson.scenes ?? []).flatMap((scene, index) =>
    scene.learned && sceneHeard(lessons, state, state.lesson, index)
      ? [scene.learned]
      : [],
  );
  return (
    <ul className="flex flex-col gap-2">
      {learned.length > 0 ? (
        learned.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-[15px] leading-relaxed before:mt-[0.55em] before:size-2 before:flex-none before:rounded-full before:bg-[#2E9E6B] before:content-['']"
          >
            {src(item)}
          </li>
        ))
      ) : (
        <li className="flex gap-2.5 text-[15px] leading-relaxed text-[#5B6E72] before:mt-[0.55em] before:size-2 before:flex-none before:rounded-full before:bg-[#CAD6D6] before:content-['']">
          {src(lesson.learnedEmpty ?? '')}
        </li>
      )}
    </ul>
  );
}

// "밤 9시" 시계 그림(시안 docs/design/ttobak-day-before.html 그대로)
function NightClock({ hour, caption }: { hour: number; caption: string }) {
  const angle = (hour % 12) * 30 * (Math.PI / 180);
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="pl-clock">
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="#FFFFFF"
        stroke="#15262B"
        strokeWidth="5"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={50 + 38 * Math.sin(a)}
            y1={50 - 38 * Math.cos(a)}
            x2={50 + 42 * Math.sin(a)}
            y2={50 - 42 * Math.cos(a)}
            stroke="#15262B"
            strokeWidth={i % 3 ? 2 : 4}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1="50"
        y1="50"
        x2={50 + 24 * Math.sin(angle)}
        y2={50 - 24 * Math.cos(angle)}
        stroke="#D9363E"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="16"
        stroke="#15262B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="4" fill="#15262B" />
      <text
        x="50"
        y="74"
        textAnchor="middle"
        fontWeight="900"
        fontSize="12"
        fill="#0F6670"
      >
        {caption}
      </text>
    </svg>
  );
}

// 접시 위 빨간 X(#D9363E) 또는 초록 동그라미(#2E9E6B)
function ItemMark({ kind }: { kind: 'x' | 'o' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className={`pl-item-mark ${kind}`}
    >
      {kind === 'x' ? (
        <>
          <path d="M22 22 L98 98" />
          <path d="M98 22 L22 98" />
        </>
      ) : (
        <circle cx="60" cy="60" r="48" transform="rotate(-90 60 60)" />
      )}
    </svg>
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
  const { src } = useText();
  return (
    <div className={`pl-photo ${className}`}>
      <Image
        src={photo.src}
        alt={src(photo.alt)}
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
