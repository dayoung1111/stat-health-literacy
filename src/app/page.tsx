'use client';

import Link from 'next/link';

import { hospital } from '@/lib/demo-guide';
import { getMessages, languages, type Language } from '@/lib/messages';

import {
  ArrowIcon,
  GlobeIcon,
  KeypadIcon,
  LessonIcon,
  PhoneIcon,
  QuizIcon,
  SoundOffIcon,
  SoundOnIcon,
  StaffIcon,
} from './home-icons';
import { useLanguage } from './language-provider';
import { SoundToggle, Ttobagi } from './ttobagi';
import './home.css';

const howIcons = [KeypadIcon, LessonIcon, QuizIcon];

// 첫 화면. 고른 언어는 LanguageProvider가 저장해 다음 화면(번호 입력 등)에서도 그대로 쓴다.
// 문구는 src/lib/messages/의 언어 파일에 있다.
// 휴대폰은 한 줄로(또박이 → 제목 → 버튼 → 카드 → 전화 → 의료진 로그인), PC는 왼쪽 글·버튼, 오른쪽 또박이.
export default function Home() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-stat-paper px-4 text-stat-ink lg:px-10">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 py-4 lg:max-w-6xl">
        <p className="flex items-center gap-2 text-2xl font-extrabold tracking-wide text-stat-green">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-stat-green text-white"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path
                d="M12 6v12M6 12h12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          S.T.A.T
        </p>
        <div className="flex items-center gap-2">
          <div className="stat-home-sound relative">
            <SoundToggle />
            <SoundOnIcon className="stat-home-sound-on size-6" />
            <SoundOffIcon className="stat-home-sound-off size-6" />
          </div>
          <label className="relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-stat-green/30 bg-white text-stat-green focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-stat-green hover:border-stat-green">
            <GlobeIcon />
            <span className="sr-only">{t.languagePicker}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
            >
              {languages.map((code) => (
                <option key={code} value={code} lang={code}>
                  {getMessages(code).languageName}
                </option>
              ))}
            </select>
          </label>
          <StaffLogin label={t.home.staff} className="ml-2 hidden lg:flex" />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-md flex-1 content-center gap-8 py-6 lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="stat-home-ttobagi flex justify-center lg:order-last">
          <Ttobagi pose="hello" message={t.home.hello} language={language} />
        </div>

        <div className="flex flex-col gap-7">
          <h1 className="text-4xl leading-tight font-bold whitespace-pre-line break-keep lg:text-5xl">
            {t.home.headline}
          </h1>

          <Link
            href="/p"
            className="flex min-h-24 items-center justify-between gap-4 rounded-3xl bg-stat-green px-6 py-5 text-white shadow-md hover:bg-stat-green-dark focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green"
          >
            <span className="flex flex-col">
              <span className="text-2xl font-bold lg:text-3xl">
                {t.home.enter}
              </span>
              <span className="mt-1 text-lg break-keep text-stat-mint">
                {t.home.enterHint}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <ArrowIcon className="size-7" />
            </span>
          </Link>

          <section aria-labelledby="home-how">
            <h2 id="home-how" className="text-xl font-bold">
              {t.home.howTitle}
            </h2>
            <ol className="mt-3 grid grid-cols-3 gap-3">
              {t.home.how.map((step, i) => {
                const StepIcon = howIcons[i];
                return (
                  <li
                    key={step}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-stat-green/15 bg-white px-2 py-4 text-center shadow-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-7 items-center justify-center rounded-full bg-stat-green text-base font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-2xl bg-stat-mint text-stat-green"
                    >
                      {StepIcon && <StepIcon className="size-7" />}
                    </span>
                    <span className="text-lg leading-snug font-bold break-keep">
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <a
            href={`tel:${hospital.phone}`}
            className="flex items-center gap-4 rounded-2xl border border-stat-green/15 bg-white px-5 py-4 shadow-sm hover:border-stat-green focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green"
          >
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-stat-mint text-stat-green"
            >
              <PhoneIcon className="size-7" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-lg break-keep text-zinc-700">
                {t.home.call}
              </span>
              <span className="text-3xl font-bold tracking-wide text-stat-green">
                {hospital.phone}
              </span>
            </span>
          </a>
        </div>
      </main>

      <div className="mx-auto w-full max-w-md pt-2 pb-4 lg:hidden">
        <StaffLogin label={t.home.staff} className="flex w-full" />
      </div>

      <footer className="mx-auto w-full max-w-md border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 lg:max-w-6xl">
        <p>© {hospital.name} · S.T.A.T</p>
      </footer>
    </div>
  );
}

// 의료진 로그인: 휴대폰은 아래, PC는 오른쪽 위. 가는 곳은 같다.
function StaffLogin({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <Link
      href="/staff"
      className={`${className} min-h-12 items-center justify-center gap-2 rounded-full border-2 border-stat-green bg-white px-5 text-lg font-bold text-stat-green hover:bg-stat-mint focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-stat-green`}
    >
      <StaffIcon />
      {label}
    </Link>
  );
}
