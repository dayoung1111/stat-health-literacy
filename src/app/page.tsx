'use client';

import Link from 'next/link';
import { useState } from 'react';

import { hospital } from '@/lib/demo-guide';

import { ttobagiSays } from '@/lib/ttobagi-says';

import { SoundToggle, Ttobagi } from './ttobagi';

const texts = {
  ko: {
    label: '한국어',
    headline: '어려운 병원 안내문,\n쉽게 알려 드릴게요',
    enter: '환자로 들어가기',
    enterHint: '병원에서 받은 번호가 있어요',
    call: '번호를 모르면 병원에 전화',
    staff: '의료진 로그인',
  },
  en: {
    label: 'English',
    headline: 'Hard hospital instructions,\nmade easy',
    enter: 'Enter as a patient',
    enterHint: 'I have a number from the hospital',
    call: 'No number? Call the hospital',
    staff: 'Staff login',
  },
  zh: {
    label: '中文',
    headline: '难懂的医院说明，\n简单讲给您听',
    enter: '患者入口',
    enterHint: '我有医院给的号码',
    call: '不知道号码请致电医院',
    staff: '医护人员登录',
  },
  vi: {
    label: 'Tiếng Việt',
    headline: 'Hướng dẫn bệnh viện khó hiểu,\nnay thật dễ hiểu',
    enter: 'Vào dành cho bệnh nhân',
    enterHint: 'Tôi có mã số từ bệnh viện',
    call: 'Không có mã số? Gọi bệnh viện',
    staff: 'Đăng nhập nhân viên y tế',
  },
} as const;

type Lang = keyof typeof texts;

export default function Home() {
  const [lang, setLang] = useState<Lang>('ko');
  const t = texts[lang];

  return (
    <div
      lang={lang}
      className="flex min-h-screen flex-col bg-stat-paper px-4 text-stat-ink"
    >
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-4">
        <p className="text-lg font-bold text-stat-green">S.T.A.T</p>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <label className="flex items-center gap-1">
            <span aria-hidden="true">🌐</span>
            <span className="sr-only">언어 선택 / Language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-lg"
            >
              {Object.entries(texts).map(([code, { label }]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-6">
        <Ttobagi pose="hello" message={ttobagiSays.hello} />
        <h1 className="text-4xl leading-tight font-bold whitespace-pre-line break-keep">
          {t.headline}
        </h1>
        <div className="flex flex-col gap-5">
          <Link
            href="/p"
            className="flex min-h-24 flex-col justify-center rounded-2xl bg-stat-green px-6 py-5 text-white hover:bg-stat-green-dark focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green"
          >
            <span className="text-2xl font-bold">{t.enter}</span>
            <span className="mt-1 text-lg text-stat-mint">{t.enterHint}</span>
          </Link>
          <a
            href={`tel:${hospital.phone}`}
            className="py-2 text-center text-lg text-zinc-700 underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">📞 </span>
            {t.call}
          </a>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
        <p>© {hospital.name} · S.T.A.T</p>
        <Link
          href="/staff"
          className="mt-1 inline-block py-2 underline underline-offset-4"
        >
          {t.staff}
        </Link>
      </footer>
    </div>
  );
}
