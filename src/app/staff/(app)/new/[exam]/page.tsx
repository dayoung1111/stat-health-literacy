import { notFound } from 'next/navigation';

import { findExam } from '@/lib/staff-options';

import { StaffPage } from '../../../staff-page';
import { IssueForm } from './issue-form';

// ② 환자 고르기 → ③ 검사일·생년월일 → 코드 발급
export default function IssuePage({ params }: PageProps<'/staff/new/[exam]'>) {
  return (
    <StaffPage>
      {params.then(({ exam: examId }) => {
        const exam = findExam(examId);
        if (!exam) notFound();
        return <IssueForm exam={exam} />;
      })}
    </StaffPage>
  );
}
