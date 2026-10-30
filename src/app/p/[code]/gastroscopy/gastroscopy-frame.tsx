'use client';

import { useEffect, useRef, useState } from 'react';

import {
  gastroLessonKo,
  gastroLessonSources,
  type GastroLessonTexts,
} from '@/lib/gastro-lesson';
import type { GuideKind } from '@/lib/guide-catalog';

import { useLanguageOr } from '../../../language-provider';
import { GuideBoard } from '../../guide-board';
import { markGuideDone, useCompletedGuides } from '../../guide-done';
import { GuideFinish } from '../../guide-finish';
import { translateLesson } from '../../translate-lesson';

// 위내시경 수업 액자. 검진 전날 수업 액자(day-before-frame.tsx)와 같은 방식이다.
// 수업 파일과 앱이 주고받는 말. 수업 파일(public/lessons/gastroscopy.html)은 ?embed=1로 열면
// 자체 "뒤로" 버튼을 숨기고, 앱의 소리 설정(stat-sound)을 따르고, 아래 두 가지를 알려 준다.
// - stat-lesson-ready: 수업 파일이 열림 → 앱이 고른 언어로 번역한 글자(gastro-lesson.ts)를 stat-lesson-texts로 보낸다.
//   수업 파일에는 글자가 없고, 화면 글자·말풍선·읽어 주는 목소리의 언어를 모두 이 글자와 언어에 따른다.
// - stat-lesson-height: 수업 화면 높이가 바뀜 → 액자 높이를 맞춘다.
// - stat-lesson-finished: 퀴즈까지 끝남 → "다 봤어요"를 기록하고 다음 안내 버튼을 보여 준다.
//   다음 안내는 대장내시경 수업처럼 화면이 받은 목록으로 바로 정한다(GuideFinish). 서버 저장은 뒤에서 한다.
type LessonMessage =
  | { type: 'stat-lesson-ready'; lesson: 'gastroscopy' }
  | { type: 'stat-lesson-height'; lesson: 'gastroscopy'; height: number }
  | { type: 'stat-lesson-finished'; lesson: 'gastroscopy' };

function isLessonMessage(data: unknown): data is LessonMessage {
  if (typeof data !== 'object' || data === null) return false;
  const message = data as Record<string, unknown>;
  if (message.lesson !== 'gastroscopy') return false;
  if (
    message.type === 'stat-lesson-finished' ||
    message.type === 'stat-lesson-ready'
  ) {
    return true;
  }
  return (
    message.type === 'stat-lesson-height' &&
    typeof message.height === 'number' &&
    Number.isFinite(message.height) &&
    message.height > 0
  );
}

// 처음 높이(수업이 높이를 알려 주기 전까지)
const firstHeight = 720;

export function GastroscopyFrame({
  code,
  language,
  guides,
  completed: fromServer,
}: {
  code: string;
  /** 의료진이 발급 때 고른 언어. 환자가 고른 언어가 있으면 그것을 쓴다. */
  language: string;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이 화면을 열 때 이미 마친 안내 */
  completed: GuideKind[];
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(firstHeight);
  const [finished, setFinished] = useState(false);
  // 마친 안내: 서버 기록 + 이 브라우저 기록(새로고침·서버 재시작에도 남음)
  const completed = useCompletedGuides(code, fromServer);
  const recorded = useRef(false);
  const { language: shown } = useLanguageOr(language);
  const [texts, setTexts] = useState<GastroLessonTexts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let current = true;
    void translateLesson(shown, gastroLessonKo, gastroLessonSources()).then(
      (next) => {
        if (current) setTexts(next);
      },
    );
    return () => {
      current = false;
    };
  }, [shown]);

  // 수업 파일이 열렸고 글자가 준비되면(언어가 바뀔 때마다 다시) 수업에 보낸다.
  useEffect(() => {
    if (!ready || !texts) return;
    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'stat-lesson-texts',
        lesson: 'gastroscopy',
        language: shown,
        texts,
      },
      window.location.origin,
    );
  }, [ready, texts, shown]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // 우리 앱 주소에서, 이 액자 안의 수업이 보낸 말만 믿는다.
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isLessonMessage(event.data)) return;

      if (event.data.type === 'stat-lesson-ready') {
        setReady(true);
        return;
      }
      if (event.data.type === 'stat-lesson-height') {
        setHeight(Math.ceil(event.data.height));
        return;
      }
      // 다시 보고 또 끝내도 기록은 한 번만 남긴다.
      if (recorded.current) return;
      recorded.current = true;
      setFinished(true);
      markGuideDone(code, 'gastroscopy');
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [code]);

  return (
    <>
      <iframe
        ref={frameRef}
        src="/lessons/gastroscopy.html?embed=1"
        title={texts?.ui.frameTitle ?? gastroLessonKo.ui.frameTitle}
        allow="fullscreen; autoplay"
        allowFullScreen
        style={{ height }}
        className="block w-full border-0"
      />
      {finished && (
        <GuideFinish
          code={code}
          guide="gastroscopy"
          guides={guides}
          completed={completed}
          language={language}
        />
      )}
      {/* 휴대폰에서는 수업 아래, 다 보면 다음 안내 버튼 아래에 보인다. */}
      <div className="mt-6 max-w-xl">
        <GuideBoard
          code={code}
          current="gastroscopy"
          guides={guides}
          completed={completed}
          language={language}
        />
      </div>
    </>
  );
}
