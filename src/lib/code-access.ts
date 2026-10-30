import { DEMO_CODE } from './code-shape';

// 의료진은 자기가 발급한 코드만 볼 수 있다. 목록과 상세 조회가 같은 규칙을 쓴다.
export const isOwnedBy = (row: { staffId: string }, staffId: string) =>
  row.staffId === staffId;

// 시연 코드: 기록 초기화 대상이고, 폐기할 수 없다(education-store.ts가 늘 남겨 둔다).
// 시연용 예시 코드(305566·771204·550031)는 여기에 넣지 않는다. 실제 코드처럼 다룬다.
export const DEMO_CODES: readonly string[] = [
  '000000',
  '482917',
  '777777',
  DEMO_CODE,
];

export const isDemoCode = (code: string) => DEMO_CODES.includes(code);

/** 시연 기록 초기화가 고르는 코드(DB 조건). 이 조건 밖의 코드는 초기화가 건드리지 않는다. */
export const demoResetWhere = () => ({ code: { in: [...DEMO_CODES] } });

/** 코드를 관리(잠금 풀기·폐기)하는 사람. 역할은 서버가 계정 정보에서 다시 찾은 값이다. */
export type CodeManager = { id: string; role: 'nurse' | 'admin' };

// 관리자는 모든 코드, 간호사는 자기가 발급한 코드만 잠금 풀기·폐기할 수 있다.
export const canManageCode = (staff: CodeManager, row: { staffId: string }) =>
  staff.role === 'admin' || isOwnedBy(row, staff.id);

// 폐기는 관리할 수 있는 코드 중 시연 코드가 아닌 것만
export const canDiscardCode = (
  staff: CodeManager,
  row: { staffId: string; code: string },
) => canManageCode(staff, row) && !isDemoCode(row.code);
