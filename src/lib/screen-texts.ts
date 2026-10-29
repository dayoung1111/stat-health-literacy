import { demoGuide, guideSteps } from './demo-guide';
import { medications } from './medication-guide';

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
  medication: {
    pickAll: '드시는 약을 모두 눌러 주세요',
    saving: '저장하는 중…',
    pickOne: '약을 하나 이상 눌러 주세요',
    pickedCount: (count: number) => `${count}개 골랐어요 · 하나씩 볼게요`,
    newCount: (count: number) => `새 약 ${count}개 · 하나씩 볼게요`,
    saveAsIs: '이대로 저장할게요',
    none: '드시는 약이 없어요',
    cancelEdit: '고치지 않고 돌아가기',
    well: '잘하셨어요.',
    summaryTitle: '내 약 정리',
    noneToldYou: '드시는 약이 없다고 알려 주셨어요.',
    edit: '약 다시 선택하기·수정하기',
    med: '약',
    seeDetails: '자세히 보기',
    askAgain: '다시 풀어 볼까요?',
    quiz: '확인 질문',
    nextMed: '다음 약',
    allChecked: '모두 확인했어요',
    steps: ['판정', '자세히', '확인 질문'],
    answerIs: (answer: string) =>
      `정답은 「${answer}」예요. 간호사에게 꼭 물어보세요.`,
    // 피를 묽게 하는 약 중단 시작일(의료진이 고른 날짜). 정하지 않았으면 stopUnknownLine.
    // {date}는 화면이 고른 언어의 날짜(예: 11월 3일 / November 3)로 바꿔 넣는다.
    stopUnknownLine: '의사 선생님과 정한 날짜부터 중단',
    stopTemplate: '{date}부터 중단',
  },
  teachback: {
    count: (total: number) => `질문 ${total}개 중 `,
    slowly: '천천히 골라 주세요',
    retryIntro: '다른 질문으로 한 번 더 볼게요',
    seeAgain: '한 번 더 볼까요?',
    next: '다음',
    answerIs: (answer: string) =>
      `정답은 「${answer}」예요. 간호사 선생님께 한 번 더 여쭤봐요.`,
    askNurse: '❓ 표시는 간호사 선생님께 여쭤봐요.',
    allGood: '모두 잘 이해하셨어요!',
    wellDone: '끝까지 잘하셨어요!',
    toHome: '홈으로',
    reviewAnytime: '헷갈리면 언제든 다시 보세요',
  },
  danger: {
    title: '이럴 땐 바로 병원에 전화하세요',
  },
  // 또박이 선생님 수업(사진·카드·약 만들기 장면)
  lesson: {
    noEat: '먹으면 안 돼요',
    okEat: '드셔도 돼요',
    noEatSr: '먹으면 안 돼요: ',
    okEatSr: '드셔도 돼요: ',
    startTitle: '눌러서 수업 시작',
    startSub: '소리를 켜 주세요',
    prev: '이전',
    next: '다음',
    pause: '일시정지',
    again: '처음부터',
    play: '재생',
    title: '대장내시경 수업',
    now: '지금',
    ended: '끝난 교시',
    followPrep: '따라하기로 직접 해보기',
    beforeStart: '재생을 누르면 수업이 시작돼요.',
    retryLine: '다시 볼까요?',
    praiseWord: '잘하셨어요',
    signNo: '안 돼요',
    signOk: '돼요',
    signCare: '주의',
    // 카드 장면의 그림 설명(상황 / 할 일)
    notes: {
      period: '생리 중',
      periodDo: '약 먹지 않기',
      pregnant: '임신·수유 중',
      pregnantDo: '먼저 확인',
      vomit: '심한 구토',
      vomitDo: '멈추고 전화',
      stool: '변이 맑지 않음',
      stoolDo: '접수 때 말하기',
    },
    // 약 만들기 그림 속 글자
    first: '처음',
    every15: '15분',
    markLine: '← 표시선',
    gasocol: '가소콜액',
    onePack: '1포',
  },
  // 약 만들기 따라하기
  prep: {
    title: '약 만들기 따라하기',
    stepOf: '{n}단계 / {total}',
    allDrunk: '네 컵을 다 드셨어요.',
    untilNext: '다음 컵까지 {time}',
    drinkNow: '{n}번째 컵을 드세요.',
    drank: '{n}번째 컵 마셨어요',
    cupDone: '{n}번째 컵 마심',
    cupNot: '{n}번째 컵 아직',
  },
  video: {
    title: '또박이 선생님 수업',
    prepare: '준비',
  },
  preparing: {
    message: '안내 내용 준비 중이에요.',
    other: '다른 안내 보기',
    callIfCurious: '궁금하면 병원에 전화',
  },
};

// 숫자가 들어가는 문구는 나올 수 있는 값을 모두 적어 미리 번역한다.
export const screenFunctionTexts = [
  ...Array.from({ length: 13 }, (_, i) =>
    screenTexts.colonoscopy.daysLeft(i + 2),
  ),
  screenTexts.guide.count(guideSteps.length),
  screenTexts.teachback.count(demoGuide.questions.length),
  ...demoGuide.questions.flatMap((question) =>
    question.retry.choices
      .filter((choice) => choice.correct)
      .map((choice) => screenTexts.teachback.answerIs(choice.text)),
  ),
  ...Array.from({ length: medications.length }, (_, i) => [
    screenTexts.medication.pickedCount(i + 1),
    screenTexts.medication.newCount(i + 1),
  ]).flat(),
  ...medications.flatMap((med) =>
    med.quiz.options
      .filter((option) => option.correct)
      .map((option) => screenTexts.medication.answerIs(option.text)),
  ),
];
