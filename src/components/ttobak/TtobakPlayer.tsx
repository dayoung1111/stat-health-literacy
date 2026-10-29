'use client';

import {
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Ttobak } from './Ttobak';
import {
  getLineDuration,
  initialPlayerState,
  LINE_GAP_MS,
  reducePlayer,
  type PlayerAction,
  type PlayerState,
} from './player-state';
import type { CardKind, Scene } from './types';

const cardKinds: Record<
  CardKind,
  { label: string; symbol: string; card: string; badge: string }
> = {
  avoid: {
    label: '먹지 마세요',
    symbol: '✕',
    card: 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-50',
    badge: 'bg-red-700 text-white',
  },
  ok: {
    label: '드셔도 돼요',
    symbol: '○',
    card: 'border-green-300 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-50',
    badge: 'bg-green-700 text-white',
  },
  info: {
    label: '기억하세요',
    symbol: '!',
    card: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-50',
    badge: 'bg-sky-700 text-white',
  },
};

const cardKindOrder: readonly CardKind[] = ['avoid', 'ok', 'info'];

// ◀ ▶ 기호가 일부 휴대폰에서 이모지로 바뀌지 않도록 글자 모양(FE0E)으로 고정한다.
const icons = {
  prev: '◀︎',
  play: '▶︎',
  pause: '❚❚',
  next: '▶︎',
  list: '☰',
};

const controlClass =
  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 text-base font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryClass = `${controlClass} border-zinc-300 bg-white text-zinc-900 hover:border-teal-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;

function getKoreanSpeech() {
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

type TtobakPlayerProps = {
  /** 화면 읽기 프로그램에 알려 줄 영상 제목 */
  title: string;
  scenes: readonly Scene[];
};

export function TtobakPlayer({ title, scenes }: TtobakPlayerProps) {
  const [state, dispatch] = useReducer(
    (current: PlayerState, action: PlayerAction) =>
      reducePlayer(scenes, current, action),
    initialPlayerState,
  );
  const [listOpen, setListOpen] = useState(false);
  const listId = useId();
  const listButtonRef = useRef<HTMLButtonElement>(null);

  const scene = scenes[state.sceneIndex];
  const line = scene.lines[state.lineIndex];
  const isPlaying = state.status === 'playing';
  const isEnded = state.status === 'ended';
  const highlighted = isEnded ? [] : (line.highlight ?? []);
  const prevScene = scenes[state.sceneIndex - 1];
  const nextScene = scenes[state.sceneIndex + 1];

  // 자막 한 줄 읽기: 음성이 끝나면, 음성이 없으면 정해진 시간이 지나면 다음 줄로 넘어간다.
  useEffect(() => {
    if (state.status !== 'playing') return;

    let done = false;
    let timer: number | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      dispatch({ type: 'lineEnded' });
    };
    const wait = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(finish, ms);
    };

    const duration = getLineDuration(line.text);
    const speech = getKoreanSpeech();
    if (speech) {
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      if (speech.voice) utterance.voice = speech.voice;
      utterance.onend = () => wait(LINE_GAP_MS);
      utterance.onerror = () => {
        if (!done) wait(duration);
      };
      speech.synth.cancel();
      speech.synth.speak(utterance);
      // 음성 종료 알림이 오지 않는 기기를 위한 안전장치
      wait(duration * 3);
    } else {
      wait(duration);
    }

    return () => {
      done = true;
      window.clearTimeout(timer);
      speech?.synth.cancel();
    };
  }, [state.status, state.cue, line.text]);

  function play() {
    unlockSpeech();
    dispatch({ type: 'play' });
  }

  function togglePlay() {
    if (isPlaying) dispatch({ type: 'pause' });
    else play();
  }

  function goToScene(index: number) {
    unlockSpeech();
    dispatch({ type: 'goToScene', index });
  }

  function selectFromList(index: number) {
    goToScene(index);
    setListOpen(false);
    listButtonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowRight' && nextScene) {
      event.preventDefault();
      goToScene(state.sceneIndex + 1);
    } else if (event.key === 'ArrowLeft' && prevScene) {
      event.preventDefault();
      goToScene(state.sceneIndex - 1);
    } else if (event.key === 'Escape' && listOpen) {
      setListOpen(false);
      listButtonRef.current?.focus();
    }
  }

  const subtitle =
    state.status === 'ready'
      ? '재생 버튼을 누르면 또박이가 설명을 시작해요.'
      : isEnded
        ? '설명이 모두 끝났어요. 다시 보려면 재생 버튼을 누르세요.'
        : line.text;

  const cardGroups = cardKindOrder
    .map((kind) => ({
      kind,
      cards: scene.cards.filter((card) => card.kind === kind),
    }))
    .filter((group) => group.cards.length > 0);

  return (
    <section
      aria-label={`또박이 안내 영상: ${title}`}
      onKeyDown={handleKeyDown}
      className="rounded-3xl border border-zinc-200 bg-white p-4 text-zinc-900 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <p className="text-base font-semibold text-teal-800 dark:text-teal-200">
        장면 {state.sceneIndex + 1} / {scenes.length}
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        {scene.title}
      </p>

      <div className="relative mt-3 flex flex-col items-center gap-4 rounded-2xl bg-teal-50 p-4 sm:flex-row sm:p-6 dark:bg-zinc-800">
        <Ttobak
          action={isEnded ? 'cheer' : scene.action}
          talking={isPlaying}
          animated={isPlaying || isEnded}
          className="w-40 shrink-0 sm:w-52"
        />
        <p
          aria-live="polite"
          className="min-h-22 w-full text-xl leading-relaxed font-semibold break-keep sm:text-2xl"
        >
          {subtitle}
        </p>

        {state.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={play}
              aria-label="또박이 안내 영상 재생하기. 소리가 나와요."
              className="flex size-32 flex-col items-center justify-center gap-1 rounded-full bg-teal-700 text-white shadow-xl hover:bg-teal-800 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              <span aria-hidden="true" className="text-5xl leading-none">
                {icons.play}
              </span>
              <span className="text-lg font-bold">설명 듣기</span>
            </button>
          </div>
        )}
      </div>

      {cardGroups.length > 0 && (
        <div className="mt-4 space-y-4">
          {cardGroups.map(({ kind, cards }) => (
            <div key={kind}>
              <p className="mb-2 flex items-center gap-2 text-lg font-bold">
                <span
                  aria-hidden="true"
                  className={`flex size-7 items-center justify-center rounded-full text-base ${cardKinds[kind].badge}`}
                >
                  {cardKinds[kind].symbol}
                </span>
                {cardKinds[kind].label}
              </p>
              <ul
                aria-label={cardKinds[kind].label}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {cards.map((card) => {
                  const active = highlighted.includes(card.id);
                  const dimmed = highlighted.length > 0 && !active;
                  return (
                    <li
                      key={card.id}
                      aria-current={active ? 'true' : undefined}
                      className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center motion-safe:transition ${cardKinds[kind].card} ${active ? 'shadow-lg ring-4 ring-amber-400 motion-safe:scale-105' : ''} ${dimmed ? 'opacity-75' : ''}`}
                    >
                      <span aria-hidden="true" className="text-4xl">
                        {card.emoji}
                      </span>
                      <span className="text-lg leading-snug font-semibold break-keep">
                        {card.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => goToScene(state.sceneIndex - 1)}
          disabled={!prevScene}
          aria-label={
            prevScene ? `이전 장면: ${prevScene.title}` : '이전 장면 없음'
          }
          className={secondaryClass}
        >
          <span aria-hidden="true">{icons.prev}</span>
          이전
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? '일시정지' : isEnded ? '처음부터 다시 재생' : '재생'}
          className={`${controlClass} border-teal-700 bg-teal-700 text-white hover:bg-teal-800`}
        >
          <span aria-hidden="true">{isPlaying ? icons.pause : icons.play}</span>
          {isPlaying ? '멈춤' : '재생'}
        </button>
        <button
          type="button"
          onClick={() => goToScene(state.sceneIndex + 1)}
          disabled={!nextScene}
          aria-label={
            nextScene ? `다음 장면: ${nextScene.title}` : '다음 장면 없음'
          }
          className={secondaryClass}
        >
          <span aria-hidden="true">{icons.next}</span>
          다음
        </button>
        <button
          ref={listButtonRef}
          type="button"
          onClick={() => setListOpen((open) => !open)}
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-label="장면 목록"
          className={secondaryClass}
        >
          <span aria-hidden="true">{icons.list}</span>
          목록
        </button>
      </div>

      <ol id={listId} hidden={!listOpen} aria-label="장면 목록" className="mt-3 space-y-2">
        {scenes.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => selectFromList(index)}
              aria-current={index === state.sceneIndex ? 'step' : undefined}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-4 py-2 text-left text-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                index === state.sceneIndex
                  ? 'border-teal-700 bg-teal-50 font-bold dark:bg-teal-950'
                  : 'border-zinc-200 hover:border-teal-600 dark:border-zinc-700'
              }`}
            >
              <span className="w-6 shrink-0 text-teal-700 dark:text-teal-300">
                {index + 1}
              </span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        키보드: Tab으로 버튼 이동, ← → 키로 장면 이동
      </p>
    </section>
  );
}
