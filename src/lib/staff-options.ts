// 의료진이 코드를 발급할 때 고르는 환자 맞춤 설정. 화면과 서버 검사가 함께 쓴다.
// 고른 설정은 코드 하나에 묶인 모든 검사 안내에 적용한다(복용약 안내는 언어·큰 글씨만).

export const levels = [
  { id: 'normal', label: '보통', short: '보통' },
  { id: 'easy', label: '쉬움', short: '쉬움' },
  { id: 'very-easy', label: '아주 쉬움(그림·소리)', short: '아주쉬움' },
] as const;

// 앱 전체 나이대. 나이대를 고르면 설명 단계를 자동으로 추천한다(의료진이 바꿀 수 있음).
export const ages = [
  { id: '10-40', label: '10~40대', level: 'normal' },
  { id: '50', label: '50대', level: 'normal' },
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

const labelOf = (list: readonly { id: string; label: string }[], id: string) =>
  list.find((item) => item.id === id)?.label ?? id;

// 목록·상세에 보여 줄 설정 한 줄. 예: "60대 · 쉬움 · 한국어"
export function settingLabel(setting: {
  ageGroup: string;
  level: string;
  language: string;
}) {
  const level = levels.find((l) => l.id === setting.level)?.short ?? '';
  return [
    labelOf(ages, setting.ageGroup),
    level,
    labelOf(languages, setting.language),
  ].join(' · ');
}

export function extraLabels(ids: readonly string[]) {
  return ids.map((id) => labelOf(extras, id));
}
