'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getStaff } from '@/lib/demo-staff';
import { cleanPlace, errorKinds } from '@/lib/error-log';
import { resolveErrorLogs } from '@/lib/error-log-store';

import type { CodeActionResult } from './actions';

// "오류 기록" 화면의 ✅ 해결함 버튼. 누를 때마다 서버가 로그인과 볼 수 있는 기록인지 다시 확인한다
// (관리자: 전체, 간호사: 자기가 발급한 코드의 기록만).

async function signedIn() {
  const staff = await getStaff();
  if (!staff) redirect('/staff');
  return staff;
}

const notFound: CodeActionResult = {
  ok: false,
  message: '바꿀 기록이 없어요(이미 해결했거나 볼 수 없는 기록이에요)',
};

/** 기록 1건 해결함 */
export async function resolveErrorAction(
  id: string,
): Promise<CodeActionResult> {
  const staff = await signedIn();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return notFound;
  const count = await resolveErrorLogs(staff, { id: parsed.data });
  refresh();
  return count > 0 ? { ok: true } : notFound;
}

/** 같은 화면·같은 오류 묶음 전체 해결함 */
export async function resolveErrorGroupAction(
  place: string,
  kind: string,
): Promise<CodeActionResult> {
  const staff = await signedIn();
  const parsed = z.enum(errorKinds).safeParse(kind);
  if (!parsed.success || cleanPlace(place) !== place) return notFound;
  const count = await resolveErrorLogs(staff, { place, kind: parsed.data });
  refresh();
  return count > 0 ? { ok: true } : notFound;
}
