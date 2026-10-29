'use client';

import {
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import type { VideoScene } from '@/lib/demo-guide';

import { PictureCard } from '../pictures';
import { buttonClass } from '../ui';
import {
  getLineDuration,
  initialPlayerState,
  LINE_GAP_MS,
  reducePlayer,
  type PlayerAction,
  type PlayerState,
} from './player-state';
import { Ttobak } from './ttobak';

// 또박이 안내 영상: 그림(SVG)·움직임(CSS)·브라우저 음성으로 만든 "움직이는 그림책".
// 외부 영상·유료 서비스를 쓰지 않는다. 음성이 안 되는 기기에서는 자막이 시간에 맞춰 넘어간다.

const focus =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700';
const controlClass = `flex min-h-18 flex-col items-center justify-center rounded-3xl border-2 border-blue-700 bg-white px-2 text-xl font-bold text-blue-700 hover:bg-blue-50 disabled:border-zinc-200 disabled:text-zinc-400 disabled:hover:bg-white ${focus}`;

// ◀ ▶ 기호가 일부 휴대폰에서 이모지로 바뀌지 않도록 글자 모양(FE0E)으로 고정한다.
const icons = {
  prev: '◀︎',
  play: '▶︎',
  pause: '❚❚',
  next: '▶︎',
  list: '☰',
};

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

export function TtobakPlayer({
  title,
  scenes,
}: {
  /** 화면 읽기 프로그램에 알려 줄 영상 제목 */
  title: string;
  scenes: VideoScene[];
}) {
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
  const highlighted = isEnded ? [] : line.highlight;
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
      ? '재생 버튼을 누르면 또박이가 설명해 드려요.'
      : isEnded
        ? '설명이 모두 끝났어요. 잘 보셨어요 🙂'
        : line.text;

  return (
    <section
      aria-label={`또박이 안내 영상: ${title}`}
      onKeyDown={handleKeyDown}
      className="rounded-3xl bg-white p-4 shadow-sm"
    >
      <p className="inline-block rounded-full bg-sky-100 px-4 py-1 text-xl font-bold text-sky-900">
        <span className="sr-only">장면 {scenes.length}개 중 </span>
        {state.sceneIndex + 1} / {scenes.length} · {scene.title}
      </p>

      <div className="relative mt-3 flex flex-col items-center gap-3 rounded-3xl bg-sky-50 p-4">
        <Ttobak
          action={isEnded ? 'cheer' : scene.action}
          talking={isPlaying}
          animated={isPlaying || isEnded}
          className="w-44"
        />
        <p
          aria-live="polite"
          className="min-h-24 w-full text-center text-2xl leading-relaxed font-bold break-keep"
        >
          {subtitle}
        </p>

        {state.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60">
            <button
              type="button"
              onClick={play}
              aria-label="또박이 안내 영상 재생하기. 소리가 나와요."
              className={`flex size-36 flex-col items-center justify-center gap-1 rounded-full bg-blue-700 text-white shadow-xl hover:bg-blue-800 ${focus}`}
            >
              <span aria-hidden="true" className="text-5xl leading-none">
                {icons.play}
              </span>
              <span className="text-2xl font-bold">설명 듣기</span>
            </button>
          </div>
        )}
      </div>

      {scene.pictures.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-3">
          {scene.pictures.map((picture, index) => {
            const active = highlighted.includes(index);
            const dimmed = highlighted.length > 0 && !active;
            return (
              <li
                key={picture.label}
                aria-current={active ? 'true' : undefined}
                className={`rounded-3xl p-2 motion-safe:transition ${active ? 'bg-amber-100 ring-4 ring-amber-400 motion-safe:scale-105' : ''} ${dimmed ? 'opacity-60' : ''}`}
              >
                <PictureCard picture={picture} />
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={togglePlay}
        aria-label={
          isPlaying ? '일시정지' : isEnded ? '처음부터 다시 보기' : '재생'
        }
        className={`mt-5 gap-2 ${buttonClass.primary}`}
      >
        <span aria-hidden="true">{isPlaying ? icons.pause : icons.play}</span>
        {isPlaying ? '잠깐 멈춤' : isEnded ? '처음부터 다시' : '재생'}
      </button>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => goToScene(state.sceneIndex - 1)}
          disabled={!prevScene}
          aria-label={
            prevScene ? `이전 장면: ${prevScene.title}` : '이전 장면 없음'
          }
          className={controlClass}
        >
          <span aria-hidden="true">{icons.prev}</span>
          이전
        </button>
        <button
          type="button"
<<<<<<< Updated upstream:src/components/ttobak/TtobakPlayer.tsx
          onClick={togglePlay}
          aria-label={
            isPlaying ? '일시정지' : isEnded ? '처음부터 다시 재생' : '재생'
          }
          className={`${controlClass} border-teal-700 bg-teal-700 text-white hover:bg-teal-800`}
        >
          <span aria-hidden="true">{isPlaying ? icons.pause : icons.play}</span>
          {isPlaying ? '멈춤' : '재생'}
        </button>
        <button
          type="button"
=======
>>>>>>> Stashed changes:src/app/p/ttobak/ttobak-player.tsx
          onClick={() => goToScene(state.sceneIndex + 1)}
          disabled={!nextScene}
          aria-label={
            nextScene ? `다음 장면: ${nextScene.title}` : '다음 장면 없음'
          }
          className={controlClass}
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
          className={controlClass}
        >
          <span aria-hidden="true">{icons.list}</span>
          목록
        </button>
      </div>

      <ol
        id={listId}
        hidden={!listOpen}
        aria-label="장면 목록"
        className="mt-3 space-y-2"
      >
        {scenes.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => selectFromList(index)}
              aria-current={index === state.sceneIndex ? 'step' : undefined}
              className={`flex min-h-16 w-full items-center gap-3 rounded-3xl border-2 px-5 py-2 text-left text-xl break-keep ${focus} ${
                index === state.sceneIndex
                  ? 'border-blue-700 bg-sky-50 font-bold'
                  : 'border-sky-200 bg-white hover:border-blue-700'
              }`}
            >
              <span className="w-7 shrink-0 font-bold text-blue-700">
                {index + 1}
              </span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
