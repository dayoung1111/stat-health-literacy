import { isDemoCode } from '@/lib/code-access';
import { requireStaff } from '@/lib/demo-staff';
import { listCodesForStaff } from '@/lib/education-store';
import { guideNames } from '@/lib/guide-catalog';
import { medicationCell, teachbackOnly } from '@/lib/medication-summary';
import { settingLabel } from '@/lib/staff-options';

import { Notice, Panel, StaffBack } from '../../ui';
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
  const staff = await requireStaff();
  const codes = await listCodesForStaff(staff.id);
  const rows = codes.map((c) => ({
    code: c.code,
    guides: guideNames(c.guides).join(', '),
    examDate: `${Number(c.examDate.slice(5, 7))}/${Number(c.examDate.slice(8, 10))}`,
    setting: settingLabel(c),
    meds: medicationCell(c),
    passed: teachbackOnly(c).filter((r) => r.result !== 'wrong').length,
    total: teachbackOnly(c).length,
    locked: c.lockedAt !== null,
    demo: isDemoCode(c.code),
  }));

  return (
    <>
      <StaffBack fallback="/staff/new" />
      <Panel title="⑤ 내가 발급한 코드">
        <p className="mb-4 text-base text-zinc-600">
          EMR 아님 · 이 앱에서 내가 발급한 코드만 보여요
        </p>
        <CodeTable rows={rows} />
        <Notice>
          종이에 적힌 코드로 환자를 찾음 → 병원은 자기 전산에서 &quot;이 환자 =
          이 코드&quot;로 기록
        </Notice>
      </Panel>
    </>
  );
}
