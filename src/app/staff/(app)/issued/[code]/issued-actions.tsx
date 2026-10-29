'use client';

import Link from 'next/link';
import { useState } from 'react';

import { staffButton } from '../../../ui';

export function IssuedActions({ code }: { code: string }) {
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/p/${code}`,
      );
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 print:hidden">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={copyLink}
          className={staffButton.outline}
        >
          🔗 링크 복사
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className={staffButton.outline}
        >
          🖨 종이 출력
        </button>
      </div>
      <p role="status" className="min-h-6 text-center text-base">
        {copied === 'done' && '링크를 복사했어요. 문자에 붙여 넣으세요.'}
        {copied === 'failed' &&
          `복사하지 못했어요. 주소를 직접 알려 주세요: /p/${code}`}
      </p>
      <Link href="/staff/new" className={staffButton.primary}>
        + 다음 환자
      </Link>
    </div>
  );
}
