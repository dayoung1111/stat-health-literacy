'use client';

import { useLayoutEffect, useRef } from 'react';

import { useTranslatedTexts } from '../../translated';

// 번역해서 글자가 길어져도 칸 안에 들어가게 글자 크기만 줄이는 글자.
// 단어 중간에서 자르지 않고(띄어쓰기에서만 줄바꿈), 가장 긴 단어가 칸보다 넓거나 줄 수가 maxLines보다 많으면
// 맞을 때까지 글자 크기를 줄인다. 한국어·일본어·중국어는 글자 사이에서 줄이 바뀐다.
const STEP = 0.04;
const MIN_SCALE = 0.3;

export function FitText({
  children,
  maxLines = 2,
  className,
}: {
  /** 한국어 원문(번역은 이 글자가 알아서 한다) */
  children: string;
  maxLines?: number;
  className?: string;
}) {
  const {
    texts: [text],
  } = useTranslatedTexts([children]);
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      if (el.clientWidth === 0) return;
      const base = parseFloat(getComputedStyle(el).fontSize);
      let scale = 1;
      const tooBig = () =>
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight >
          maxLines * parseFloat(getComputedStyle(el).lineHeight) + 1;
      while (tooBig() && scale > MIN_SCALE) {
        scale -= STEP;
        el.style.fontSize = `${base * scale}px`;
      }
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, [text, maxLines]);

  return (
    <span ref={ref} className={`fit-text ${className ?? ''}`}>
      {text}
    </span>
  );
}
