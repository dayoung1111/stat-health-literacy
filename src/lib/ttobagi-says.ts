import type { Said } from './i18n';

// 화면별 또박이 말. 문장은 locales/ko.json·en.json의 ttobagi.* 에 있다.
// 홈 "지금 할 일" 말은 검사일에 따라 demo-guide.ts의 getTodo가 정한다.
export const ttobagiSays = {
  hello: { id: 'ttobagi.hello' },
  explain: { id: 'ttobagi.explain' },
  cheer: { id: 'ttobagi.cheer' },
  retry: { id: 'ttobagi.retry' },
  danger: { id: 'ttobagi.danger' },
} satisfies Record<string, Said>;
