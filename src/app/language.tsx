'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

import {
  langs,
  source,
  speechLang,
  text,
  type Lang,
  type TextId,
  type Vars,
} from '@/lib/i18n';

// 환자 화면 언어. 고른 언어는 이 휴대폰 브라우저(localStorage)에만 저장하고 서버로 보내지 않는다.
// 고른 적이 없으면 휴대폰 언어를 따른다(영어면 English, 그 밖에는 한국어).
// 서버가 그린 첫 화면은 한국어이고, 브라우저가 열리면 고른 언어로 바로 바뀐다.

const storageKey = 'stat-lang';
const changeEvent = 'stat-lang-change';
// 저장 공간을 못 쓰는 브라우저(사생활 보호 모드 등)에서도 화면을 닫기 전까지는 고른 언어를 유지한다.
let picked: Lang | null = null;

const isLang = (value: unknown): value is Lang => langs.includes(value as Lang);

function readLang(): Lang {
  if (picked) return picked;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (isLang(saved)) return saved;
  } catch {
    // 저장 공간을 읽을 수 없으면 휴대폰 언어를 따른다.
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ko';
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function setLang(lang: Lang) {
  picked = lang;
  try {
    window.localStorage.setItem(storageKey, lang);
  } catch {
    // 저장하지 못해도 지금 화면에서는 바꾼다.
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => 'ko');
}

/** 화면 문장을 꺼내는 함수(t)와 의료 안내 원문을 바꾸는 함수(src) */
export function useText() {
  const lang = useLang();
  return {
    lang,
    t: (id: TextId, vars?: Vars) => text(lang, id, vars),
    src: (korean: string) => source(lang, korean),
  };
}

/** 서버 화면에서 쓰는 화면 문장 */
export function T({ id, vars }: { id: TextId; vars?: Vars }) {
  return text(useLang(), id, vars);
}

/** 서버 화면에서 쓰는 의료 안내 원문 */
export function Source({ text: korean }: { text: string }) {
  return source(useLang(), korean);
}

/** 언어별로 서버가 미리 만든 글자(날짜 등) */
export function ByLang({ ko, en }: Record<Lang, string>) {
  return useLang() === 'en' ? en : ko;
}

/** 이름표(aria-label)가 있는 영역. 화면 읽기 프로그램이 고른 언어로 읽는다. */
export function Labeled({
  as: Tag = 'nav',
  label,
  role,
  className,
  children,
}: {
  as?: 'nav' | 'div';
  label: TextId;
  role?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag aria-label={text(useLang(), label)} role={role} className={className}>
      {children}
    </Tag>
  );
}

/** 환자 화면 틀. 고른 언어를 lang으로 알려 화면 읽기 프로그램이 맞는 발음으로 읽게 한다. */
export function LangRoot({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div lang={useLang()} className={className}>
      {children}
    </div>
  );
}

const switchLabels: Record<Lang, string> = { ko: '한국어', en: 'English' };

/** 환자 화면 위쪽 "한국어 / English" 바꾸기 버튼 */
export function LanguageSwitch() {
  const current = useLang();
  return (
    <div
      role="group"
      aria-label={text(current, 'lang.group')}
      className="flex rounded-full border-2 border-stat-green bg-white p-1"
    >
      {langs.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={lang === current}
          onClick={() => setLang(lang)}
          className={`min-h-12 rounded-full px-4 text-xl font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green ${
            lang === current
              ? 'bg-stat-green text-white'
              : 'text-stat-green hover:bg-stat-mint'
          }`}
        >
          {switchLabels[lang]}
        </button>
      ))}
    </div>
  );
}

/** 브라우저 목소리 고르기. 영어는 en-US를 먼저 찾고, 없으면 다른 영어 목소리. */
export function findVoice(voices: SpeechSynthesisVoice[], lang: Lang) {
  const exact = speechLang[lang].toLowerCase();
  const normalized = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().replace('_', '-');
  return (
    voices.find((voice) => normalized(voice) === exact) ??
    voices.find((voice) => normalized(voice).startsWith(lang))
  );
}
