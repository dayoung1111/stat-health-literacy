import { guideSteps } from './demo-guide';

// 환자 화면 파일에 직접 쓰는 한국어 문구. 화면에서는 <T>(src/app/translated.tsx)로 보여 주고,
// 여기 모은 문구는 미리 번역 목록(translation-sources.ts)에 자동으로 들어간다.
// 이모지·화살표(🏠 ← ▶)는 번역하지 않도록 화면에 남기고, 글자만 여기에 둔다.
export const screenTexts = {
  common: {
    back: '뒤로',
    home: '처음으로',
    callHospital: '병원에 전화하기',
    loading: '불러오는 중…',
    checkWithStaff: '정확한 내용은 의료진에게 확인하세요.',
    mustNot: '하면 안 돼요: ',
  },
  colonoscopy: {
    today: '오늘이 검사 날이에요',
    tomorrow: '내일이 검사 날이에요',
    done: '검사 잘 받으셨어요',
    daysLeft: (days: number) => `검사까지 ${days}일 남았어요`,
    video: '또박이 선생님 수업 보기',
    guide: '안내문 같이 보기',
    check: '잘 이해했는지 확인해요',
    danger: '이럴 땐 바로 병원에',
  },
  guide: {
    confused: '헷갈려요',
    previous: '이전',
    next: '다음',
    toCheck: '이해 확인',
    count: (total: number) => `안내문 ${total}개 중 `,
    easierTitle: '더 쉽게 볼까요?',
    gotIt: '이제 알겠어요',
    stillHard: '아직 어려워요 → 병원에 전화',
  },
};

// 숫자가 들어가는 문구는 나올 수 있는 값을 모두 적어 미리 번역한다.
export const screenFunctionTexts = [
  ...Array.from({ length: 13 }, (_, i) =>
    screenTexts.colonoscopy.daysLeft(i + 2),
  ),
  screenTexts.guide.count(guideSteps.length),
];
