'use client';

import {
  useContext,
  useEffect,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';

import {
  IssuedLanguageContext,
  rememberIssuedLanguage,
} from './issued-language';
import { useLanguage } from './language-provider';
import { translateForPatient } from './p/translate-actions';
import { getMessages } from '@/lib/messages';

import { Ttobagi } from './ttobagi';

// 한국어 문구를 환자가 고른 언어로 보여 준다. 흐름은 이렇다.
//  1) 먼저 한국어를 보여 준다(기다리지 않는다).
//  2) 같은 화면의 문구를 모아 서버에 한 번에 요청한다. 서버는 미리 번역 파일 → 저장된 번역 → AI 순서로 찾는다.
//  3) 번역이 오면 그 자리의 글자만 바꾼다. 실패하거나 느리면 한국어가 그대로 남는다.
// 한 번 받은 번역은 이 브라우저 탭 안에서 다시 쓰므로, 같은 문구는 다시 요청하지 않는다.

const hangul = /[가-힣]/;
const RETRY_AFTER_MS = 60_000;
const CHUNK = 40;

const done = new Map<string, string>(); // `${언어}\0${한국어}` → 번역
const failedAt = new Map<string, number>(); // 번역이 안 온 문구(잠시 뒤 다시 요청)
const waiting = new Map<string, Set<string>>(); // 언어 → 서버에 보낼 한국어 문구
const listeners = new Set<() => void>();
let version = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const keyOf = (language: string, text: string) => `${language}\0${text}`;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

async function flush() {
  timer = null;
  const batch = [...waiting];
  waiting.clear();
  await Promise.all(
    batch.map(async ([language, set]) => {
      const texts = [...set];
      for (let start = 0; start < texts.length; start += CHUNK) {
        const chunk = texts.slice(start, start + CHUNK);
        try {
          const out = await translateForPatient(language, chunk);
          chunk.forEach((text, i) => {
            const key = keyOf(language, text);
            if (out[i] && out[i] !== text) done.set(key, out[i]);
            else failedAt.set(key, Date.now());
          });
        } catch {
          for (const text of chunk)
            failedAt.set(keyOf(language, text), Date.now());
        }
      }
    }),
  );
  version += 1;
  for (const listener of listeners) listener();
}

function request(language: string, texts: string[]) {
  const now = Date.now();
  for (const text of texts) {
    if (!hangul.test(text)) continue; // 한글이 없는 글자(숫자·기호)는 번역하지 않는다.
    const key = keyOf(language, text);
    if (done.has(key) || waiting.get(language)?.has(text)) continue;
    const failed = failedAt.get(key);
    if (failed !== undefined && now - failed < RETRY_AFTER_MS) continue;
    waiting.set(language, (waiting.get(language) ?? new Set()).add(text));
  }
  // 같은 화면의 문구를 한 번에 보내려고 잠깐 모은다.
  if (waiting.size > 0 && timer === null) timer = setTimeout(flush, 15);
}

export function IssuedLanguage({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  const { language: picked, chosen } = useLanguage();
  useEffect(() => {
    rememberIssuedLanguage(language);
  }, [language]);
  return (
    <IssuedLanguageContext value={language}>
      {/* 화면 글자의 언어 표시(lang). 일본어·중국어의 줄바꿈과 글꼴이 맞게 되고 화면 읽기 프로그램도 언어를 안다. */}
      <div lang={chosen ? picked : language} className="contents">
        {children}
      </div>
    </IssuedLanguageContext>
  );
}

export function useTranslatedTexts(texts: readonly string[]) {
  const issued = useContext(IssuedLanguageContext);
  const { language: picked, chosen } = useLanguage();
  const language = chosen ? picked : issued;
  const joined = texts.join('\0');

  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  useEffect(() => {
    if (language !== 'ko') request(language, joined.split('\0'));
  }, [language, joined]);

  // pending: 번역이 아직 오는 중이다(소리 내어 읽기 전에 기다릴 때 쓴다). 실패하면 끝난 것으로 본다.
  const pending =
    language !== 'ko' &&
    texts.some((text) => {
      const key = keyOf(language, text);
      return hangul.test(text) && !done.has(key) && !failedAt.has(key);
    });

  return {
    language,
    pending,
    texts: texts.map((text) =>
      language === 'ko' ? text : (done.get(keyOf(language, text)) ?? text),
    ),
  };
}

/** 한국어 문구 하나를 고른 언어로. 예: <T>{guide.name}</T> */
export function T({ children }: { children: string }) {
  const { texts } = useTranslatedTexts([children]);
  return texts[0];
}

/** 또박이 말풍선. 번역된 말이면 그 언어 목소리로 읽는다. */
export function TranslatedTtobagi({
  message,
  ...props
}: ComponentProps<typeof Ttobagi>) {
  const { language, texts } = useTranslatedTexts([message]);
  return (
    <Ttobagi
      {...props}
      message={texts[0]}
      language={texts[0] === message ? 'ko' : language}
    />
  );
}

/** 날짜(YYYY-MM-DD)를 고른 언어의 월·일·요일로. 예: 10월 30일 (금) / Fri, Oct 30 */
export function LocalDate({ date }: { date: string }) {
  const issued = useContext(IssuedLanguageContext);
  const { language: picked, chosen } = useLanguage();
  const locale = getMessages(chosen ? picked : issued).speechLang;
  const text = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00Z`));
  // 서버와 브라우저의 날짜 모양이 조금 다를 수 있어 경고만 끈다.
  return <span suppressHydrationWarning>{text}</span>;
}

/** 그림(SVG) 안의 짧은 글자. 번역해서 길어지면 칸 안에 들어가게 글자 크기를 줄인다. */
export function FittedSvgText({
  children,
  fontSize,
  width,
  ...props
}: Omit<ComponentProps<'text'>, 'children' | 'fontSize' | 'width'> & {
  children: string;
  fontSize: number;
  width: number;
}) {
  const {
    texts: [text],
  } = useTranslatedTexts([children]);
  // 글자 폭 어림: 한자·한글은 글자 크기만큼, 영문·숫자는 절반쯤.
  const em = [...text].reduce(
    (sum, char) =>
      sum + (/[\u1100-\u11ff\u3000-\u9fff\uac00-\ud7af]/.test(char) ? 1 : 0.55),
    0,
  );
  const size = Math.min(fontSize, width / Math.max(em, 1));
  return (
    <text {...props} fontSize={size}>
      {text}
    </text>
  );
}

/** "다음 컵까지 {time}"처럼 자리 표시가 있는 문장. 문장은 번역하고 {time} 같은 자리에는 값을 넣는다. */
export function Fill({
  template,
  values,
}: {
  template: string;
  values: Record<string, string | number>;
}) {
  const { texts } = useTranslatedTexts([template]);
  return (
    <>
      {texts[0].replace(/\{(\w+)\}/g, (token, name: string) =>
        name in values ? String(values[name]) : token,
      )}
    </>
  );
}

/** "{date}부터 중단": {date}에는 고른 언어의 날짜(월·일)를 넣는다. */
export function DateTemplate({
  template,
  date,
}: {
  template: string;
  date: string;
}) {
  const { language } = useTranslatedTexts([]);
  const day = new Intl.DateTimeFormat(getMessages(language).speechLang, {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
  return (
    <span suppressHydrationWarning>
      <Fill template={template} values={{ date: day }} />
    </span>
  );
}

/** 화면 읽기 프로그램용 이름(aria-label)을 고른 언어로 바꿔 붙인 상자. 보이는 모양은 그대로다. */
export function LabeledBox({
  as: Tag = 'div',
  label,
  ...props
}: Omit<ComponentProps<'div'>, 'aria-label'> & {
  as?: 'div' | 'nav' | 'span';
  /** 한국어 원문 이름(screen-texts.ts에 있어야 미리 번역된다) */
  label: string;
}) {
  const {
    texts: [translated],
  } = useTranslatedTexts([label]);
  return <Tag {...props} aria-label={translated} />;
}

/** 그림(SVG)의 화면 읽기 프로그램용 설명을 고른 언어로 바꿔 붙인 그림 상자. */
export function LabeledSvg({
  label,
  ...props
}: Omit<ComponentProps<'svg'>, 'aria-label' | 'role'> & { label: string }) {
  const {
    texts: [translated],
  } = useTranslatedTexts([label]);
  return <svg {...props} role="img" aria-label={translated} />;
}
