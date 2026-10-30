'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

// 수업 화면 배치. 대장내시경 수업처럼, 넓은 화면(PC)에서는 "받은 안내"를 오른쪽 칸 맨 위(수업 목록 위)에 두고
// 좁은 화면(휴대폰)에서는 수업 아래에 둔다.
// 검진 전날·위내시경 수업은 수업 목록이 액자(iframe) 안 오른쪽 칸에 있으므로, 받은 안내를 그 칸 위에 겹쳐 놓고
// 수업에는 "목록을 받은 안내 높이만큼 아래로 내려 달라"고 알려 준다(stat-lesson-offset).

/** 수업 화면(public/lessons/*.html)이 가로 두 칸이 되는 너비. 그 파일들의 @media (max-width:900px)와 같다. */
const TWO_COLUMNS_ABOVE = 900;
/** 수업 화면 오른쪽 칸 너비·바깥 여백, 칸 사이 간격(그 파일들의 css와 같다) */
const SIDE_WIDTH = 300;
const SIDE_MARGIN = 16;
const SIDE_GAP = 14;

export function FrameWithBoard({
  frameRef,
  lesson,
  frame,
  after,
  board,
}: {
  frameRef: RefObject<HTMLIFrameElement | null>;
  /** 수업 이름(수업 파일이 보내는 lesson 값). 예: day-before */
  lesson: string;
  /** 수업 액자(iframe) */
  frame: ReactNode;
  /** 수업을 마쳤을 때 보이는 "다음 안내" 같은, 액자 바로 아래 내용 */
  after?: ReactNode;
  /** 받은 안내 현황판 */
  board: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [boardHeight, setBoardHeight] = useState(0);
  // 수업 화면의 오른쪽 칸이 시작하는 높이(수업이 알려 준다)와, 수업이 열려 말을 걸 수 있는지
  const [sideTop, setSideTop] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const watch = new ResizeObserver(() =>
      setWide(wrap.clientWidth > TWO_COLUMNS_ABOVE),
    );
    watch.observe(wrap);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setBoardHeight(el.offsetHeight));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data !== 'object' || data.lesson !== lesson) return;
      if (data.type === 'stat-lesson-ready') setReady(true);
      if (data.type === 'stat-lesson-height') {
        const top = Number(data.sideTop);
        if (Number.isFinite(top) && top >= 0) setSideTop(top);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frameRef, lesson]);

  const offset = wide && boardHeight > 0 ? boardHeight + SIDE_GAP : 0;
  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: 'stat-lesson-offset', lesson, offset },
      window.location.origin,
    );
  }, [ready, offset, frameRef, lesson]);

  return (
    <div ref={wrapRef} className="relative">
      {frame}
      {after}
      <div
        ref={boardRef}
        style={
          wide
            ? {
                position: 'absolute',
                top: sideTop,
                right: SIDE_MARGIN,
                width: SIDE_WIDTH,
              }
            : undefined
        }
        className={wide ? '' : 'mt-6 max-w-xl'}
      >
        {board}
      </div>
    </div>
  );
}

// 오른쪽 칸이 있는 화면 틀(드시는 약). 휴대폰에서는 내용 아래에 받은 안내가 온다.
export function LessonWithBoard({
  children,
  board,
}: {
  children: ReactNode;
  board: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="mx-auto w-full max-w-xl">{children}</div>
      <aside className="flex flex-col gap-4">{board}</aside>
    </div>
  );
}
