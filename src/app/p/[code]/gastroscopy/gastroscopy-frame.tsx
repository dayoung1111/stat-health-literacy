'use client';

import { useEffect, useRef, useState } from 'react';

import { guideLessonHref } from '@/lib/guide-progress';
import type { GuideKind } from '@/lib/guide-catalog';

import { useLanguageOr } from '../../../language-provider';
import { completeGuide } from '../../records';
import { ButtonLink } from '../../ui';

// 위내시경 수업 액자. 검진 전날 수업 액자(day-before-frame.tsx)와 같은 방식이다.
// 수업 파일과 앱이 주고받는 말. 수업 파일(public/lessons/gastroscopy.html)은 ?embed=1로 열면
// 자체 "뒤로" 버튼을 숨기고, 앱의 소리 설정(stat-sound)을 따르고, 아래 두 가지를 알려 준다.
// - stat-lesson-height: 수업 화면 높이가 바뀜 → 액자 높이를 맞춘다.
// - stat-lesson-finished: 퀴즈까지 끝남 → "다 봤어요"를 기록하고 다음 안내 버튼을 보여 준다.
type LessonMessage =
  | { type: 'stat-lesson-height'; lesson: 'gastroscopy'; height: number }
  | { type: 'stat-lesson-finished'; lesson: 'gastroscopy' };

function isLessonMessage(data: unknown): data is LessonMessage {
  if (typeof data !== 'object' || data === null) return false;
  const message = data as Record<string, unknown>;
  if (message.lesson !== 'gastroscopy') return false;
  if (message.type === 'stat-lesson-finished') return true;
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
}: {
  code: string;
  /** 의료진이 발급 때 고른 언어. 환자가 고른 언어가 있으면 그것을 쓴다. */
  language: string;
}) {
  const { t } = useLanguageOr(language);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(firstHeight);
  // 다 봤어요를 기록한 뒤 돌려받은 다음 안내. undefined: 아직 안 끝남, null: 남은 안내 없음
  const [next, setNext] = useState<GuideKind | null | undefined>(undefined);
  const recorded = useRef(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // 우리 앱 주소에서, 이 액자 안의 수업이 보낸 말만 믿는다.
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isLessonMessage(event.data)) return;

      if (event.data.type === 'stat-lesson-height') {
        setHeight(Math.ceil(event.data.height));
        return;
      }
      // 다시 보고 또 끝내도 기록은 한 번만 남긴다.
      if (recorded.current) return;
      recorded.current = true;
      // 기록하지 못했으면(확인되지 않은 환자 등) 홈으로 가는 버튼만 보여 준다.
      void completeGuide(code, 'gastroscopy').then((result) =>
        setNext(result.ok ? result.next : null),
      );
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [code]);

  return (
    <>
      <iframe
        ref={frameRef}
        src="/lessons/gastroscopy.html?embed=1"
        title="위내시경 준비 수업"
        allow="fullscreen; autoplay"
        allowFullScreen
        style={{ height }}
        className="block w-full border-0"
      />
      {next !== undefined && (
        <div role="status" className="mt-6 flex flex-col gap-3">
          <p className="text-2xl font-bold break-keep">
            {next
              ? t.guideDoneNext(t.guides.gastroscopy, t.guides[next])
              : t.allDone}
          </p>
          {next ? (
            <ButtonLink href={guideLessonHref(code, next)}>
              {t.nextButton(t.guides[next])}
            </ButtonLink>
          ) : (
            <ButtonLink href={`/p/${code}/home`}>🏠 홈으로</ButtonLink>
          )}
        </div>
      )}
    </>
  );
}
