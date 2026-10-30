'use client';

import { useEffect, useState } from 'react';

import { prepSteps } from '@/lib/demo-guide';
import { screenTexts } from '@/lib/screen-texts';

import { Fill, T, useTranslatedTexts } from '../../translated';

import { BigViewButton, useFullscreenFrame, VideoFrame } from '../video-frame';
import { PrepScene } from './prep-scene';
import './photo-lesson.css';

// 약 만들기 따라하기: 5교시와 같은 7단계를 한 화면에 하나씩 보며 직접 따라 한다.
// "15분마다 한 컵씩" 단계에서는 컵 4개와 15분 타이머로 다음 컵 시간을 알려 준다.

const CUPS = 4;
const INTERVAL_MS = 15 * 60 * 1000;

const buttonClass =
  'flex min-h-14 items-center justify-center rounded-2xl px-6 text-xl font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F6670] disabled:cursor-not-allowed disabled:opacity-40';
const outline = `${buttonClass} border-[1.5px] border-[#CAD6D6] bg-white text-[#15262B] hover:border-[#0F6670]`;
const filled = `${buttonClass} bg-[#0F6670] text-white hover:bg-[#0B4E56]`;

export function PrepFollow() {
  const [index, setIndex] = useState(0);
  const step = prepSteps[index];
  // 전체 화면 영상 틀(공통 부품). 세로 카드 모양이라 16:9 틀 안에 줄여 넣는다(shape="card").
  const frame = useFullscreenFrame();
  // 전체 화면에서는 같은 내용을 두 칸(왼쪽 그림, 오른쪽 설명·버튼)으로 놓아 16:9에 맞춘다.
  const wide = frame.fullscreen;

  return (
    <VideoFrame frame={frame} shape="card">
      <div
        className={
          wide
            ? 'grid grid-cols-[1.15fr_1fr] items-start gap-x-8 gap-y-5 p-8 text-[#15262B]'
            : 'flex flex-col gap-5 text-[#15262B]'
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-[#0F6670]">
            <Fill
              template={screenTexts.prep.stepOf}
              values={{ n: index + 1, total: prepSteps.length }}
            />{' '}
            · <T>{step.name}</T>
          </p>
          <BigViewButton frame={frame} className={outline} />
        </div>
        <div
          key={step.id}
          className={`aspect-[5/3] w-full rounded-3xl border border-[#CAD6D6] bg-[#F4EFE6] p-4 ${wide ? 'col-start-1 row-span-3 row-start-2' : ''}`}
        >
          <PrepScene scene={step.scene} hour={9} />
        </div>
        <p
          aria-live="polite"
          className={`text-2xl leading-snug font-bold break-keep ${wide ? 'col-start-2 row-start-1 row-span-2' : ''}`}
        >
          <T>{step.line.say}</T>
        </p>

        {step.scene === 'cups' && (
          <div className={wide ? 'col-start-2 row-start-3' : 'contents'}>
            <CupTimer />
          </div>
        )}

        <div
          className={`grid grid-cols-2 gap-3 ${wide ? 'col-start-2 row-start-4' : ''}`}
        >
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
            className={outline}
          >
            <T>{screenTexts.lesson.prev}</T>
          </button>
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            disabled={index === prepSteps.length - 1}
            className={filled}
          >
            <T>{screenTexts.lesson.next}</T>
          </button>
        </div>
      </div>
    </VideoFrame>
  );
}

function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

// 한 컵을 마실 때마다 누르면 다음 컵까지 15분을 잰다.
function CupTimer() {
  const [drunk, setDrunk] = useState(0);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const {
    texts: [timerLabel, cupsLabel],
  } = useTranslatedTexts([
    screenTexts.lessonLabels.timer,
    screenTexts.lessonLabels.drunkCups,
  ]);

  useEffect(() => {
    if (lastAt === null || drunk >= CUPS) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lastAt, drunk]);

  const left = lastAt === null ? 0 : Math.max(0, lastAt + INTERVAL_MS - now);
  const allDone = drunk >= CUPS;
  const waiting = !allDone && lastAt !== null && left > 0;

  function drink() {
    const at = Date.now();
    setDrunk(drunk + 1);
    setLastAt(at);
    setNow(at);
  }

  return (
    <section
      aria-label={timerLabel}
      className="flex flex-col gap-4 rounded-3xl bg-[#FFF6D6] p-5"
    >
      <ol className="flex justify-center gap-3" aria-label={cupsLabel}>
        {Array.from({ length: CUPS }, (_, i) => (
          <li
            key={i}
            className={`flex size-16 items-center justify-center rounded-2xl border-[3px] text-xl font-bold ${i < drunk ? 'border-[#2E9E6B] bg-[#DDF3E8] text-[#1D6E47]' : 'border-[#CAD6D6] bg-white text-[#8FA0A3]'}`}
          >
            <span aria-hidden="true">{i < drunk ? '✓' : i + 1}</span>
            <span className="sr-only">
              <Fill
                template={
                  i < drunk ? screenTexts.prep.cupDone : screenTexts.prep.cupNot
                }
                values={{ n: i + 1 }}
              />
            </span>
          </li>
        ))}
      </ol>
      <p
        aria-live="polite"
        className="text-center text-2xl font-bold break-keep"
      >
        {allDone ? (
          <T>{screenTexts.prep.allDrunk}</T>
        ) : waiting ? (
          <Fill
            template={screenTexts.prep.untilNext}
            values={{ time: format(left) }}
          />
        ) : (
          <Fill
            template={screenTexts.prep.drinkNow}
            values={{ n: drunk + 1 }}
          />
        )}
      </p>
      {!allDone && (
        <button
          type="button"
          onClick={drink}
          disabled={waiting}
          className={filled}
        >
          <Fill template={screenTexts.prep.drank} values={{ n: drunk + 1 }} />
        </button>
      )}
    </section>
  );
}
