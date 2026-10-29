/** 늘 남겨 두는 시연용 코드(/p/DEMO). DB에 한 번 넣어 두고, 결과도 DB에 쌓인다. */
export const DEMO_CODE = 'DEMO';

/** 주소·입력의 교육 코드 모양: 6자리 번호 또는 시연 코드 */
export const isCodeShape = (value: string) =>
  /^\d{6}$/.test(value) || value === DEMO_CODE;
