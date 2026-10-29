import { T } from '../language';
import { PatientEntryForm } from './patient-entry-form';
import { BackLink, CallButton } from './ui';

export default function PatientEntryPage() {
  return (
    <>
      <BackLink href="/">
        <T id="entry.back" />
      </BackLink>
      <h1 className="mt-4 mb-8 text-3xl leading-snug font-bold whitespace-pre-line break-keep">
        <T id="entry.titleCode" />
      </h1>
      <PatientEntryForm />
      <div className="mt-6">
        <CallButton variant="outline">
          <T id="common.callIfStuck" />
        </CallButton>
      </div>
    </>
  );
}
