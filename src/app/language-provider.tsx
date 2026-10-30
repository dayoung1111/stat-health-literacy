'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { isCodeShape } from '@/lib/code-shape';
import {
  getMessages,
  isLanguage,
  type Language,
  type Messages,
} from '@/lib/messages';

// 환자가 고른 화면 언어를 앱 전체가 함께 쓴다.
// 그 기기(localStorage)에 저장해 다른 화면으로 가도, 새로고침해도 유지하고 <html lang>도 맞춘다.
// 교육 코드 화면(/p/코드/…)에서 고른 언어는 그 코드에만 저장한다. 같은 환자에게 다른 언어로 새 코드를 보내면
// 새 코드는 처음 열 때 발급 언어로 나온다(순서: 그 코드에서 환자가 고른 언어 > 그 코드의 발급 언어 > 한국어).
// 코드 밖 화면(처음 화면 등)에서 고른 언어는 코드 화면에 쓰지 않는다.

const LANGUAGE_KEY = 'stat-language';
const LANGUAGE_EVENT = 'stat-language-change';

// 주소(/p/123456/home 등)에서 교육 코드를 찾는다. 코드 화면이 아니면 null.
function codeOf(pathname: string | null) {
  const code = pathname?.match(/^\/p\/([^/]+)/)?.[1] ?? '';
  return isCodeShape(code) ? code : null;
}

const keyFor = (code: string | null) =>
  code ? `${LANGUAGE_KEY}:${code}` : LANGUAGE_KEY;

function readChosen(code: string | null): Language | null {
  try {
    const saved = window.localStorage.getItem(keyFor(code));
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

function saveLanguage(language: Language, code: string | null) {
  try {
    window.localStorage.setItem(keyFor(code), language);
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

// 주소는 요청마다 달라 Suspense 안에서 읽는다. 읽기 전(서버에서 처음 그릴 때)에는 코드 밖 화면으로 본다.
export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LanguageBase code={null}>{children}</LanguageBase>}>
      <WithPath>{children}</WithPath>
    </Suspense>
  );
}

function WithPath({ children }: { children: ReactNode }) {
  return <LanguageBase code={codeOf(usePathname())}>{children}</LanguageBase>;
}

function LanguageBase({
  code,
  children,
}: {
  code: string | null;
  children: ReactNode;
}) {
  // 서버에서 그릴 때는 저장된 값을 모르므로 한국어로 그리고, 브라우저에서 저장된 언어로 바꾼다.
  const chosen = useSyncExternalStore(
    subscribe,
    () => readChosen(code),
    () => null,
  );
  const language = chosen ?? 'ko';

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext
      value={{
        language,
        chosen: chosen !== null,
        setLanguage: (next) => saveLanguage(next, code),
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
