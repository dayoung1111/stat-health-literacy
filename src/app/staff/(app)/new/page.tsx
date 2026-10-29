import { examMenu } from '@/lib/staff-options';

import { Notice, Panel, StaffBack } from '../../ui';
import { StaffPage } from '../../staff-page';
import { ExamTiles } from './exam-tiles';

// ① 검사 고르기: 누르면 바로 다음 단계로 간다.
export default function ChooseExamPage() {
  return (
    <StaffPage>
      <StaffBack href="/" />
      <Panel title="① 검사 고르기">
        <h2 className="mb-6 text-2xl font-bold">어떤 안내문을 줄까요?</h2>
        <ExamTiles tiles={examMenu} />
        <Notice>
          병원 공통 안내문은 <strong>미리 저장</strong>되어 있음
          <br />+ 새 안내문은 글·사진으로 추가 (준비 중)
        </Notice>
      </Panel>
    </StaffPage>
  );
}
