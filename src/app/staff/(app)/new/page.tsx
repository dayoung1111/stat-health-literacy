import Link from 'next/link';

import { exams } from '@/lib/staff-options';

import { Notice, Panel } from '../../ui';
import { StaffPage } from '../../staff-page';

// ① 검사 고르기: 누르면 바로 다음 단계로 간다.
export default function ChooseExamPage() {
  return (
    <StaffPage>
      <Panel title="① 검사 고르기">
        <h2 className="text-2xl font-bold">어떤 안내문을 줄까요?</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link
                href={`/staff/new/${exam.id}`}
                className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border-2 border-zinc-300 bg-white text-xl font-bold hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <span aria-hidden="true" className="text-4xl">
                  {exam.icon}
                </span>
                {exam.name}
              </Link>
            </li>
          ))}
        </ul>
        <Notice>
          병원 공통 안내문은 <strong>미리 저장</strong>되어 있음
          <br />+ 새 안내문은 글·사진으로 추가 (준비 중)
        </Notice>
      </Panel>
    </StaffPage>
  );
}
