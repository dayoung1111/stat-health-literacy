import { guideKinds } from './guide-catalog';

// 환자 홈 화면에 직접 쓰는 한국어 문구. 화면과 미리 번역 목록이 같은 문구를 쓰도록 여기에 모았다.
export const homeTexts = {
  greeting: '안녕하세요 🙂',
  guidesCame: (count: number) => `${count}개 안내가 왔어요.`,
  notReady: '준비 중이에요',
};

// 홈에서 나올 수 있는 모든 문구(받은 안내 개수 1~전체 종류 수).
export const homeSourceTexts = [
  homeTexts.greeting,
  homeTexts.notReady,
  ...guideKinds.map((_, i) => homeTexts.guidesCame(i + 1)),
];
