import { getMyCodes, passedCount } from '@/lib/demo-staff';

import { Notice, Panel } from '../../ui';
import { StaffPage } from '../../staff-page';
import { CodeTable } from './code-table';

// ⑤ 결과 확인: 내가 발급한 코드만 보여 준다.
export default function CodesPage() {
  return (
    <StaffPage>
      <MyCodes />
    </StaffPage>
  );
}

async function MyCodes() {
  const codes = await getMyCodes();
  const rows = codes.map((c) => ({
    code: c.code,
    exam: c.exam,
    examDate: c.examDate,
    setting: c.setting,
    passed: passedCount(c.results),
    total: c.results.length,
  }));

  return (
    <Panel title="⑤ 내가 발급한 코드">
      <p className="mb-4 text-base text-zinc-600">
        EMR 아님 · 이 앱에서 내가 발급한 코드만 보여요
      </p>
      <CodeTable rows={rows} />
      <Notice>
        종이에 적힌 코드로 환자를 찾음 → 병원은 자기 전산에서 &quot;이 환자 = 이
        코드&quot;로 기록
      </Notice>
    </Panel>
  );
}
