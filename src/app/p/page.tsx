import { PatientEntryForm } from './patient-entry-form';
import { BackLink, CallButton } from './ui';

export default function PatientEntryPage() {
  return (
    <>
      <BackLink href="/">처음으로</BackLink>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold break-keep">
        번호와 생년월일을
        <br />
        넣어 주세요
      </h1>
      <PatientEntryForm />
      <div className="mt-6">
        <CallButton variant="outline">📞 잘 안 되면 병원에 전화</CallButton>
      </div>
    </>
  );
}
