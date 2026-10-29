import { StaffPage } from '../../staff-page';
import { IssueForm } from './issue-form';

// 코드 발급: ① 보낼 안내 고르기 → ② 환자 맞춤 설정 → ③ 검사일·생년월일 → 코드·QR·링크 1개
export default function NewCodePage() {
  return (
    <StaffPage>
      <IssueForm />
    </StaffPage>
  );
}
