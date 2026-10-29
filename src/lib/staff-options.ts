// 의료진이 코드를 발급할 때 고르는 선택지. 화면과 서버 검사가 함께 쓴다.

// 검사 고르기 화면의 타일. href가 없으면 아직 내용이 없어 "내용 준비 중이에요"만 보여 준다.
export type StaffIcon = 'checkup' | 'endoscope' | 'pill' | 'colon' | 'stomach';

export type MenuTile = {
  id: string;
  name: string;
  hint?: string;
  icon: StaffIcon;
  href?: string;
};

// ① 첫 화면
export const examMenu: MenuTile[] = [
  { id: 'checkup', name: '건강검진 기본 확인사항', icon: 'checkup' },
  {
    id: 'endoscopy',
    name: '내시경',
    icon: 'endoscope',
    href: '/staff/new/endoscopy',
  },
  {
    id: 'medication',
    name: '복용약 안내',
    hint: '드시는 약, 드셔도 되는지 확인',
    icon: 'pill',
  },
];

// ① 내시경을 고른 뒤
export const endoscopyMenu: MenuTile[] = [
  {
    id: 'colonoscopy',
    name: '대장내시경',
    icon: 'colon',
    href: '/staff/new/colonoscopy',
  },
  { id: 'gastroscopy', name: '위내시경', icon: 'stomach' },
];

// 안내문이 준비되어 코드를 발급할 수 있는 검사. back은 ②에서 "← 뒤로"로 돌아갈 화면.
export const exams = [
  { id: 'colonoscopy', name: '대장내시경', back: '/staff/new/endoscopy' },
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
