import { endoscopyMenu } from '@/lib/staff-options';

import { Panel, StaffBack } from '../../../ui';
import { StaffPage } from '../../../staff-page';
import { ExamTiles } from '../exam-tiles';

// ① 내시경을 고른 뒤: 대장내시경 / 위내시경
export default function ChooseEndoscopyPage() {
  return (
    <StaffPage>
      <StaffBack href="/staff/new" />
      <Panel title="① 검사 고르기 — 내시경">
        <h2 className="mb-6 text-2xl font-bold">어떤 내시경인가요?</h2>
        <ExamTiles tiles={endoscopyMenu} />
      </Panel>
    </StaffPage>
  );
}
