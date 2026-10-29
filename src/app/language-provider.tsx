'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  getMessages,
  isLanguage,
  type Language,
  type Messages,
} from '@/lib/messages';

// 환자가 고른 화면 언어를 앱 전체가 함께 쓴다.
// 그 기기(localStorage)에 저장해 다른 화면으로 가도, 새로고침해도 유지하고 <html lang>도 맞춘다.

const LANGUAGE_KEY = 'stat-language';
const LANGUAGE_EVENT = 'stat-language-change';

function readChosen(): Language | null {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    return isLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(LANGUAGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(LANGUAGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function saveLanguage(language: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // 저장할 수 없는 브라우저(사생활 보호 모드 등): 이번 화면에서만 바뀐다.
  }
  // 읽던 음성은 멈춘다. 새 언어 문구는 화면이 바뀌면서 다시 읽는다.
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  window.dispatchEvent(new Event(LANGUAGE_EVENT));
}

type LanguageValue = {
  language: Language;
  /** 환자가 직접 고른 적이 있는지. 없으면 화면마다 기본 언어(의료진이 고른 언어 등)를 쓴다. */
  chosen: boolean;
  setLanguage: (language: Language) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 서버에서 그릴 때는 저장된 값을 모르므로 한국어로 그리고, 브라우저에서 저장된 언어로 바꾼다.
  const chosen = useSyncExternalStore(subscribe, readChosen, () => null);
  const language = chosen ?? 'ko';

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext
      value={{
        language,
        chosen: chosen !== null,
        setLanguage: saveLanguage,
        t: getMessages(language),
      }}
    >
      {children}
    </LanguageContext>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider 안에서만 쓸 수 있어요.');
  return value;
}

/** 환자가 고른 언어. 고른 적이 없으면 fallback(예: 의료진이 발급 때 고른 언어). */
export function useLanguageOr(fallback: string) {
  const { language, chosen } = useLanguage();
  const picked = chosen ? language : fallback;
  return { language: picked, t: getMessages(picked) };
}
