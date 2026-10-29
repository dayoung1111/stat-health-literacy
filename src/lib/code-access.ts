// 의료진은 자기가 발급한 코드만 볼 수 있다. 목록과 상세 조회가 같은 규칙을 쓴다.
export const isOwnedBy = (row: { staffId: string }, staffId: string) =>
  row.staffId === staffId;
