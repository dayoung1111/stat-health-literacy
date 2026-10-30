import Link from 'next/link';

import { EntryText, EntryTtobagi } from './entry-text';
import { PatientEntryForm } from './patient-entry-form';
import { WideFrame } from './screen-design';
import { CallButton } from './ui';

// 번호 입력 화면. 글은 고른 언어(src/lib/messages/)로 보여 준다.
// 휴대폰은 한 줄, PC는 왼쪽 또박이 · 오른쪽 입력 카드.
export default function PatientEntryPage() {
  return (
    <WideFrame>
      <nav aria-label="화면 이동" className="sd-top mb-5">
        <Link href="/">
          ← <EntryText name="back" />
        </Link>
      </nav>
      <h1 className="sr-only">
        <EntryText name="title" />
      </h1>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <EntryTtobagi />
        <div>
          <PatientEntryForm />
          <div className="mt-6">
            <CallButton variant="outline">
              <EntryText name="callHelp" />
            </CallButton>
          </div>
        </div>
      </div>
    </WideFrame>
  );
}
