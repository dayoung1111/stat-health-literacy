import { photoLessons } from '../app/p/ttobak/photo-lesson';
import * as demoGuideModule from './demo-guide';
import { dayBeforeLessonKo } from './day-before-lesson';
import { gastroLessonKo } from './gastro-lesson';
import { guideCatalog } from './guide-catalog';
import { homeSourceTexts } from './home-texts';
import { medications, verdictLabels } from './medication-guide';
import { screenFunctionTexts, screenTexts } from './screen-texts';
import { ttobagiSays } from './ttobagi-says';

// 미리 번역할 한국어 문장 목록. 안내문·약·환자 홈의 문구를 코드에서 그대로 모은다.
// 팀원이 한국어를 고치면 이 목록도 자동으로 바뀌고, 바뀐 문장만 다시 번역하면 된다(npm run translate:build).
const hangul = /[가-힣]/;

export function collectKorean(value: unknown, found = new Set<string>()) {
  if (typeof value === 'string') {
    if (hangul.test(value)) found.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectKorean(item, found);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectKorean(item, found);
  }
  return found;
}

export function presetSourceTexts() {
  const { getTodo, ...guideData } = demoGuideModule;
  // "지금 할 일"은 검사까지 남은 날에 따라 문장이 달라진다(2일 이상·1일·당일·끝난 뒤).
  const todos = [2, 1, 0, -1].map((daysLeft) => getTodo(daysLeft));
  return [
    ...collectKorean({
      guideData,
      photoLessons,
      todos,
      medications,
      verdictLabels,
      guideCatalog,
      ttobagiSays,
      dayBeforeLesson: dayBeforeLessonKo,
      gastroLesson: gastroLessonKo,
      home: homeSourceTexts,
      screenTexts,
      screenFunctionTexts,
    }),
  ];
}
