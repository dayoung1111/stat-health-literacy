import 'server-only';

import { getDb } from './db';
import type { StaffAccountRow } from './staff-accounts';

// 관리자가 만든 간호사 계정의 저장소(Supabase staff_accounts 표). 규칙은 staff-accounts.ts에 있다.

// 사용 중인 계정만 찾는다(사용 중지 계정은 없는 것과 같다).
export async function findActiveStaffAccount(
  id: string,
): Promise<StaffAccountRow | null> {
  const row = await getDb().staffAccount.findFirst({
    where: { id, active: true },
    select: { id: true, name: true, passwordHash: true },
  });
  return row ? { ...row, role: 'nurse' } : null;
}

export async function listDbStaffAccounts() {
  return getDb().staffAccount.findMany({
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, name: true, active: true },
  });
}

/** 같은 아이디가 이미 있으면 false */
export async function insertStaffAccount(row: StaffAccountRow) {
  try {
    await getDb().staffAccount.create({
      data: { ...row, role: 'nurse' },
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return false;
    throw error;
  }
}

export async function deactivateStaffAccount(id: string) {
  const result = await getDb().staffAccount.updateMany({
    where: { id },
    data: { active: false },
  });
  return result.count > 0;
}
