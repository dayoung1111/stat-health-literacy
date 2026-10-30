'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

import { screenTexts } from '@/lib/screen-texts';

import { T, useTranslatedTexts } from '../translated';
import { inAppBrowser, kakaoOpenExternal, type InAppBrowser } from './in-app';
import { createFrameController, type FrameEnv } from './video-frame-control';
import './video-frame.css';

// 전체 화면 영상 틀: 앱 안에서 재생되는 모든 영상 화면이 쓰는 공통 부품.
// (대장내시경 수업, 위내시경 수업, 건강검진 전날 수업, 약 만들기 따라하기. 새 영상 화면도 이 부품을 쓴다.)
//
// 쓰는 법
//   const frame = useFullscreenFrame({ onClose: 일시정지 });
//   <VideoFrame frame={frame} shape="video">…영상과 버튼…</VideoFrame>
//   재생 버튼: frame.play()  (휴대폰이면 누를 때마다 전체 화면)
//   "크게 보기": <BigViewButton frame={frame} />
//
// 전체 화면이 되면 이 틀을 화면 맨 위 층에 고정한다(검은 바탕, 100dvw·100dvh, 노치·홈바 피하기, 뒤 화면 스크롤 막기).
// 화면을 옮기지 않고 그 자리에서 꺼내므로, 안의 영상(수업 액자 포함)은 다시 불러오지 않고 이어서 재생된다.
// 휴대폰 세로면 90도 돌려 꽉 채우고, 안드로이드 크롬은 기기 전체 화면 + 가로 고정을 먼저 해 본다.
//
// shape
//   video: 16:9 영상 + 아래 버튼 줄. 안의 .vf-fit 요소(영상·버튼 줄)가 가장 큰 16:9 너비가 된다(below = 버튼 줄 높이).
//   frame: 수업 액자(iframe). .vf-fill 액자가 남은 칸을 채우고, 수업 파일이 그 안에서 16:9로 맞춘다.
//   card:  세로 카드 모양 화면. 내용을 그대로 16:9 틀 안에 맞게 줄여 넣는다.

type Orientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const subscribeNothing = () => () => {};
// 휴대폰(손가락으로 누르는 작은 화면)이면 재생할 때 전체 화면으로 연다.
const isPhoneScreen = () =>
  window.matchMedia('(pointer: coarse)').matches &&
  Math.min(window.screen.width, window.screen.height) < 600;

// 위쪽 틀 중 transform·filter·contain 등이 있으면 position: fixed가 화면이 아니라 그 틀에 붙는다.
// 전체 화면 동안만 그런 속성을 꺼 두고, 닫으면 원래 style로 되돌린다.
const trapping = (style: CSSStyleDeclaration) =>
  style.transform !== 'none' ||
  // Tailwind의 -translate-x-1/2 등은 transform이 아니라 translate·rotate·scale 속성을 쓴다.
  (style.translate ?? 'none') !== 'none' ||
  (style.rotate ?? 'none') !== 'none' ||
  (style.scale ?? 'none') !== 'none' ||
  style.filter !== 'none' ||
  style.perspective !== 'none' ||
  (style.backdropFilter ?? 'none') !== 'none' ||
  /layout|paint|strict|content/.test(style.contain) ||
  (style.containerType ?? 'normal') !== 'normal' ||
  /transform|filter|perspective/.test(style.willChange);

function liftOut(el: HTMLElement) {
  const saved: [HTMLElement, string | null][] = [];
  for (
    let node = el.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    if (!trapping(getComputedStyle(node))) continue;
    saved.push([node, node.getAttribute('style')]);
    for (const [name, value] of [
      ['transform', 'none'],
      ['translate', 'none'],
      ['rotate', 'none'],
      ['scale', 'none'],
      ['filter', 'none'],
      ['perspective', 'none'],
      ['backdrop-filter', 'none'],
      ['contain', 'none'],
      ['container-type', 'normal'],
      ['will-change', 'auto'],
    ]) {
      node.style.setProperty(name, value, 'important');
    }
  }
  // 뒤 화면 스크롤 막기
  const page = document.documentElement;
  const overflow = [page.style.overflow, document.body.style.overflow];
  page.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  return () => {
    [page.style.overflow, document.body.style.overflow] = overflow;
    for (const [node, style] of saved) {
      if (style === null) node.removeAttribute('style');
      else node.setAttribute('style', style);
    }
  };
}

// target: 틀 요소를 돌려준다(버튼을 누를 때만 읽는다).
function frameEnv(target: () => HTMLElement | null): FrameEnv {
  const el = () => target() as WebkitElement | null;
  return {
    liftOut: () => {
      const target = el();
      return target ? liftOut(target) : () => {};
    },
    // 누른 순간에 요청해야 허락되므로, 첫 요청은 기다리지 않고 바로 보낸다.
    enterSystem: async () => {
      const target = el();
      if (!target) return false;
      try {
        if (target.requestFullscreen) {
          await target.requestFullscreen({ navigationUI: 'hide' });
        } else if (target.webkitRequestFullscreen) {
          await target.webkitRequestFullscreen();
        } else {
          return false;
        }
      } catch {
        // 아이폰·앱 안 브라우저 등: 기기 전체 화면이 안 되면 화면 맨 위 층 고정만 쓴다.
        return false;
      }
      try {
        await (screen.orientation as Orientation).lock?.('landscape');
      } catch {
        // 가로 고정이 안 되면 세로일 때 CSS로 90도 돌린다.
      }
      return document.fullscreenElement === target;
    },
    exitSystem: () => {
      if (document.fullscreenElement && document.fullscreenElement === el()) {
        document.exitFullscreen().catch(() => {
          // 이미 꺼졌으면 할 일이 없다.
        });
      }
      try {
        (screen.orientation as Orientation).unlock?.();
      } catch {
        // 가로 고정을 지원하지 않는 기기
      }
    },
    isSystemFullscreen: () =>
      !!document.fullscreenElement && document.fullscreenElement === el(),
  };
}

export type FullscreenFrame = {
  /** 틀 요소를 알려 주는 ref 함수(VideoFrame이 붙인다) */
  attach: (el: HTMLDivElement | null) => void;
  /** 지금 전체 화면인지 */
  fullscreen: boolean;
  /** 휴대폰인지(재생할 때 전체 화면으로 여는 기기) */
  isPhone: boolean;
  open: () => void;
  close: () => void;
  /** 재생 버튼을 눌렀을 때: 휴대폰이면 매번 전체 화면으로 연다. */
  play: () => void;
};

export function useFullscreenFrame({
  onClose,
}: { onClose?: () => void } = {}): FullscreenFrame {
  const [fullscreen, setFullscreen] = useState(false);
  const isPhone = useSyncExternalStore(
    subscribeNothing,
    isPhoneScreen,
    () => false,
  );
  // 틀 요소와 "닫을 때 할 일"은 화면 그리기와 상관없이 버튼을 누를 때만 쓰므로 함수 안에 넣어 둔다.
  const [{ controller, attach, setOnClose }] = useState(() => {
    let el: HTMLDivElement | null = null;
    let whenClosed: (() => void) | undefined;
    return {
      controller: createFrameController(
        frameEnv(() => el),
        {
          onChange: setFullscreen,
          onClose: () => whenClosed?.(),
        },
      ),
      attach: (node: HTMLDivElement | null) => {
        el = node;
      },
      setOnClose: (fn: (() => void) | undefined) => {
        whenClosed = fn;
      },
    };
  });
  useEffect(() => {
    setOnClose(onClose);
  });

  // 뒤로가기·시스템 제스처·Esc로 기기 전체 화면이 꺼지면 우리 화면도 닫는다.
  useEffect(() => {
    const changed = () => controller.systemChanged();
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('webkitfullscreenchange', changed);
    };
  }, [controller]);

  // 기기 전체 화면이 아닐 때(아이폰 등)는 키보드 Esc로 닫는다.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') controller.close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, controller]);

  // 화면을 떠날 때 열려 있으면 되돌린다.
  useEffect(() => () => controller.close(), [controller]);

  return {
    attach,
    fullscreen,
    isPhone,
    open: controller.open,
    close: controller.close,
    play: () => controller.play(isPhone),
  };
}

const useInApp = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => inAppBrowser(navigator.userAgent),
    () => null,
  );

export function VideoFrame({
  frame: { attach, fullscreen: full, close },
  shape,
  below = 0,
  className,
  children,
}: {
  frame: FullscreenFrame;
  shape: 'video' | 'frame' | 'card';
  /** shape="video": 영상 아래 버튼 줄 높이(px) */
  below?: number;
  /** 전체 화면이 아닐 때 이 틀의 모양 */
  className?: string;
  children: ReactNode;
}) {
  const inApp = useInApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [closeLabel] = useTranslatedTexts([text.close]).texts;

  useEffect(() => {
    if (full) closeRef.current?.focus();
  }, [full]);

  // 전체 화면이든 아니든 안쪽 내용의 자리는 그대로 두어(다시 그리지 않음) 재생이 이어진다.
  return (
    <div ref={attach} className={full ? 'vf-full' : className}>
      <div
        className={full ? `vf-rotor ${inApp ? 'vf-inapp' : ''}` : 'vf-pass'}
        style={full ? ({ '--vf-below': `${below}px` } as CSSProperties) : {}}
      >
        {full && (
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="vf-close"
          >
            ✕
          </button>
        )}
        {full && inApp && <OpenOutside app={inApp} />}
        {shape === 'card' ? (
          <CardFit active={full}>{children}</CardFit>
        ) : (
          <div className="vf-pass">{children}</div>
        )}
      </div>
    </div>
  );
}

/** "크게 보기" 버튼. 전체 화면일 때는 숨긴다. */
export function BigViewButton({
  frame,
  className,
}: {
  frame: FullscreenFrame;
  className: string;
}) {
  if (frame.fullscreen) return null;
  return (
    <button type="button" onClick={frame.open} className={className}>
      <span aria-hidden="true">⛶</span> <T>{BIG_VIEW}</T>
    </button>
  );
}

const text = screenTexts.videoFrame;
const BIG_VIEW = text.bigView;

// 세로 카드 모양 화면: 896px 너비로 그린 내용을 16:9 틀에 맞게 줄여 가운데에 놓는다.
const CARD_WIDTH = 896;

function CardFit({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, left: 0, top: 0 });

  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!active || !box || !inner) return;
    const measure = () => {
      const scale = Math.min(
        box.clientWidth / CARD_WIDTH,
        box.clientHeight / Math.max(1, inner.offsetHeight),
      );
      setFit({
        scale,
        left: (box.clientWidth - CARD_WIDTH * scale) / 2,
        top: (box.clientHeight - inner.offsetHeight * scale) / 2,
      });
    };
    const watch = new ResizeObserver(measure);
    watch.observe(box);
    watch.observe(inner);
    return () => watch.disconnect();
  }, [active]);

  return (
    <div ref={boxRef} className={active ? 'vf-fit vf-card' : 'vf-pass'}>
      <div
        ref={innerRef}
        className={active ? 'vf-card-inner' : 'vf-pass'}
        style={
          active
            ? {
                width: CARD_WIDTH,
                transform: `translate(${fit.left}px, ${fit.top}px) scale(${fit.scale})`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

// 앱 안 브라우저(카카오톡 등)에서만 보이는 작은 회색 띠.
// 카카오톡은 기기 기본 브라우저로 바로 열고, 다른 앱은 주소를 복사해 붙여 넣도록 안내한다.
function OpenOutside({ app }: { app: InAppBrowser }) {
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
    <div className="vf-open-outside" role="note">
      <span>
        <T>
          {copied === 'yes'
            ? text.copied
            : copied === 'no'
              ? text.copyFailed
              : text.openOutside}
        </T>
      </span>
      {copied === null && (
        <button type="button" onClick={open}>
          <T>{text.open}</T>
        </button>
      )}
    </div>
  );
}

// 수업 액자(public/lessons/*.html, ?embed=1)와 전체 화면을 잇는다.
// 수업 → 앱: stat-lesson-play(재생을 누름: 휴대폰이면 전체 화면), stat-lesson-bigview(크게 보기)
// 앱 → 수업: stat-lesson-full(전체 화면 켬/끔 + "크게 보기" 글자), stat-lesson-pause(닫을 때 일시정지)
export function useLessonFrame(
  frameRef: RefObject<HTMLIFrameElement | null>,
  lesson: string,
) {
  const post = (message: Record<string, unknown>) =>
    frameRef.current?.contentWindow?.postMessage(
      { ...message, lesson },
      window.location.origin,
    );
  const frame = useFullscreenFrame({
    onClose: () => post({ type: 'stat-lesson-pause' }),
  });
  const [ready, setReady] = useState(false);
  const [bigView] = useTranslatedTexts([BIG_VIEW]).texts;
  const { play, open } = frame;
  const actions = useRef({ play, open });
  useEffect(() => {
    actions.current = { play, open };
  });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data !== 'object' || data.lesson !== lesson) return;
      if (data.type === 'stat-lesson-ready') setReady(true);
      if (data.type === 'stat-lesson-play') actions.current.play();
      if (data.type === 'stat-lesson-bigview') actions.current.open();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frameRef, lesson]);

  // 수업이 열렸다고 알려 오면(ready) 다시 보내고, 그 알림을 놓쳤어도 전체 화면이 바뀔 때마다 보낸다.
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'stat-lesson-full', lesson, on: frame.fullscreen, bigView },
      window.location.origin,
    );
  }, [ready, frame.fullscreen, bigView, frameRef, lesson]);

  return frame;
}
