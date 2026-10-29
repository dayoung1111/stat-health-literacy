'use client';

import Link from 'next/link';

import { hospital } from '@/lib/demo-guide';
import { getMessages, languages, type Language } from '@/lib/messages';

import { useLanguage } from './language-provider';
import { SoundToggle, Ttobagi } from './ttobagi';

// 첫 화면. 고른 언어는 LanguageProvider가 저장해 다음 화면(번호 입력 등)에서도 그대로 쓴다.
// 문구는 src/lib/messages/의 언어 파일에 있다.
export default function Home() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-stat-paper px-4 text-stat-ink">
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-4">
        <p className="text-lg font-bold text-stat-green">S.T.A.T</p>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <label className="flex items-center gap-1">
            <span aria-hidden="true">🌐</span>
            <span className="sr-only">{t.languagePicker}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-lg"
            >
              {languages.map((code) => (
                <option key={code} value={code} lang={code}>
                  {getMessages(code).languageName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-6">
        <Ttobagi pose="hello" message={t.home.hello} language={language} />
        <h1 className="text-4xl leading-tight font-bold whitespace-pre-line break-keep">
          {t.home.headline}
        </h1>
        <div className="flex flex-col gap-5">
          <Link
            href="/p"
            className="flex min-h-24 flex-col justify-center rounded-2xl bg-stat-green px-6 py-5 text-white hover:bg-stat-green-dark focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green"
          >
            <span className="text-2xl font-bold">{t.home.enter}</span>
            <span className="mt-1 text-lg text-stat-mint">
              {t.home.enterHint}
            </span>
          </Link>
          <a
            href={`tel:${hospital.phone}`}
            className="py-2 text-center text-lg text-zinc-700 underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">📞 </span>
            {t.home.call}
          </a>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
        <p>© {hospital.name} · S.T.A.T</p>
        <Link
          href="/staff"
          className="mt-1 inline-block py-2 underline underline-offset-4"
        >
          {t.home.staff}
        </Link>
      </footer>
    </div>
  );
}
