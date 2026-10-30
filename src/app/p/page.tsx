import Link from 'next/link';

import { screenTexts } from '@/lib/screen-texts';

import { LabeledBox } from '../translated';
import { EntryText, EntryTtobagi } from './entry-text';
import { PatientEntryForm } from './patient-entry-form';
import { LineIcon, WideFrame } from './screen-design';
import { CallButton } from './ui';

// 번호 입력 화면. 글은 고른 언어(src/lib/messages/)로 보여 준다.
// 휴대폰은 한 줄, PC는 왼쪽 또박이 · 오른쪽 입력 카드.
export default function PatientEntryPage() {
  return (
    <WideFrame>
      <LabeledBox
        as="nav"
        label={screenTexts.common.navScreen}
        className="sd-top mb-5"
      >
        <Link href="/">
          ← <EntryText name="back" />
        </Link>
      </LabeledBox>
      <h1 className="sr-only">
        <EntryText name="title" />
      </h1>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="sd-big-col">
          <EntryTtobagi />
        </div>
        <div>
          <PatientEntryForm />
          <div className="mt-6">
            <CallButton variant="outline">
              <LineIcon name="phone" className="mr-2 size-6 text-[#0F6670]" />
              <EntryText name="callHelp" />
            </CallButton>
          </div>
        </div>
      </div>
    </WideFrame>
  );
}
