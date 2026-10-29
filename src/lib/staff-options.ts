// 의료진이 코드를 발급할 때 고르는 선택지. 화면과 서버 검사가 함께 쓴다.

export const exams = [
  { id: 'colonoscopy', name: '대장내시경', icon: '🩺' },
  { id: 'gastroscopy', name: '위내시경', icon: '🔍' },
  { id: 'discharge', name: '퇴원 교육', icon: '🏠' },
  { id: 'consent', name: '수술 동의서', icon: '📝' },
] as const;

export const levels = [
  { id: 'normal', label: '보통', short: '보통' },
  { id: 'easy', label: '쉬움', short: '쉬움' },
  { id: 'very-easy', label: '아주 쉬움(그림·소리)', short: '아주쉬움' },
] as const;

// 나이대를 고르면 설명 단계를 자동으로 추천한다.
export const ages = [
  { id: '10-50', label: '10~50대', level: 'normal' },
  { id: '60', label: '60대', level: 'easy' },
  { id: '70', label: '70대 이상', level: 'very-easy' },
] as const;

export const languages = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
  { id: 'vi', label: 'Tiếng Việt' },
] as const;

export const extras = [
  { id: 'large-text', label: '큰 글씨' },
  { id: 'guardian', label: '보호자 함께' },
  { id: 'developmental', label: '발달장애' },
] as const;

export type Exam = (typeof exams)[number];

export function findExam(id: string) {
  return exams.find((exam) => exam.id === id);
}
