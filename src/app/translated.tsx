'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { useLanguage } from './language-provider';
import { translateForPatient } from './p/translate-actions';
import { getMessages } from '@/lib/messages';

import { Ttobagi } from './ttobagi';

// 한국어 문구를 환자가 고른 언어로 보여 준다. 흐름은 이렇다.
//  1) 먼저 한국어를 보여 준다(기다리지 않는다).
//  2) 같은 화면의 문구를 모아 서버에 한 번에 요청한다. 서버는 미리 번역 파일 → 저장된 번역 → AI 순서로 찾는다.
//  3) 번역이 오면 그 자리의 글자만 바꾼다. 실패하거나 느리면 한국어가 그대로 남는다.
// 한 번 받은 번역은 이 브라우저 탭 안에서 다시 쓰므로, 같은 문구는 다시 요청하지 않는다.

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
    const key = keyOf(language, text);
    if (done.has(key) || waiting.get(language)?.has(text)) continue;
    const failed = failedAt.get(key);
    if (failed !== undefined && now - failed < RETRY_AFTER_MS) continue;
    waiting.set(language, (waiting.get(language) ?? new Set()).add(text));
  }
  // 같은 화면의 문구를 한 번에 보내려고 잠깐 모은다.
  if (waiting.size > 0 && timer === null) timer = setTimeout(flush, 15);
}

// 환자가 직접 고른 적이 없으면 의료진이 코드를 발급할 때 고른 언어를 쓴다(patient-page.tsx에서 넣어 준다).
const IssuedLanguageContext = createContext('ko');

export function IssuedLanguage({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  const { language: picked, chosen } = useLanguage();
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

  return {
    language,
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
