'use server';

import type { ErrorReport } from '@/lib/error-log';
import { recordPatientError } from '@/lib/error-log-store';

// 환자 화면에서 난 오류를 서버에 남긴다. 로그인 전 화면(코드 입력)에서도 부르므로 로그인은 확인하지 않는다.
// 보내온 값은 믿지 않고 저장 전에 정해진 칸만 다시 검사·선택하며(error-log.ts saveErrorLog),
// 같은 기기에서 너무 자주 오면 저장하지 않는다.
export async function reportPatientError(report: ErrorReport) {
  await recordPatientError(report);
}
