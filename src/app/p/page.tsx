import { EntryText } from './entry-text';
import { PatientEntryForm } from './patient-entry-form';
import { BackLink, CallButton } from './ui';

// 번호 입력 화면. 글은 고른 언어(src/lib/messages/)로 보여 준다.
export default function PatientEntryPage() {
  return (
    <>
      <BackLink href="/">
        <EntryText name="back" />
      </BackLink>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold break-keep">
        <EntryText name="title" />
      </h1>
      <PatientEntryForm />
      <div className="mt-6">
        <CallButton variant="outline">
          <EntryText name="callHelp" />
        </CallButton>
      </div>
    </>
  );
}
