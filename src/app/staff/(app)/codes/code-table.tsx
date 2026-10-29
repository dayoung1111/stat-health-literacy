'use client';

import Link from 'next/link';
import { useState } from 'react';

type Row = {
  code: string;
  guides: string;
  examDate: string;
  setting: string;
  passed: number;
  total: number;
};

export function CodeTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState('');
  const shown = rows.filter((row) => row.code.includes(query.trim()));

  return (
    <>
      <label className="mb-4 flex max-w-xs items-center gap-2">
        <span aria-hidden="true">🔍</span>
        <span className="sr-only">코드 검색</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="numeric"
          placeholder="코드 검색"
          className="w-full rounded-lg border-2 border-zinc-300 px-3 py-2 text-base focus-visible:border-blue-700 focus-visible:outline-none"
        />
      </label>
      <table className="w-full text-left text-base">
        <thead className="bg-zinc-100">
          <tr>
            <th className="px-3 py-3">코드</th>
            <th className="px-3 py-3">묶은 안내</th>
            <th className="px-3 py-3">검사일</th>
            <th className="px-3 py-3">설정</th>
            <th className="px-3 py-3">이해 확인</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row) => {
            const ok = row.passed === row.total;
            return (
              <tr key={row.code} className="border-b border-zinc-200">
                <td className="px-3 py-3">
                  <Link
                    href={`/staff/codes/${row.code}`}
                    className="font-mono font-semibold text-blue-700 underline-offset-4 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-3 py-3">{row.guides}</td>
                <td className="px-3 py-3">{row.examDate}</td>
                <td className="px-3 py-3">{row.setting}</td>
                <td
                  className={`px-3 py-3 font-bold ${
                    row.total === 0
                      ? 'font-normal text-zinc-500'
                      : ok
                        ? 'text-green-700'
                        : 'text-red-700'
                  }`}
                >
                  {row.total === 0
                    ? '아직 없음'
                    : `${row.passed}/${row.total} ${ok ? '✓' : '⚠ 재교육'}`}
                </td>
              </tr>
            );
          })}
          {shown.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-zinc-600">
                맞는 코드가 없어요
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
