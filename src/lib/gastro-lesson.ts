// 위내시경 수업(public/lessons/gastroscopy.html)에 들어가는 한국어 글자 모음.
// 수업 파일에는 글자를 두지 않고, 앱이 고른 언어로 바꾼 이 모양 그대로 수업에 넘긴다(gastroscopy-frame.tsx).
// 여기 있는 글자는 translation-sources.ts가 미리 번역 목록에 모은다(npm run translate:build).
// **…**로 감싼 부분은 말풍선에서 색으로 강조한다. 번역에서도 같은 자리에 ** 가 있어야 강조가 보인다.
// 수업 이름은 "N교시 · 이름"으로 써서 대장내시경과 같은 번역 규칙(Lesson N / N時間目 / 第N节课 / Tiết N)을 따른다.

export type LineTone = 'r' | 'g' | 'y';

export const gastroLessonKo = {
  ui: {
    frameTitle: '위내시경 준비 수업',
    back: '← 뒤로',
    title: '위내시경 준비',
    crumb: '또박이 선생님 수업',
    sample: '병원 안내문 확인 전 예시',
    firstSay: '재생을 누르면 수업이 시작돼요.',
    start: '눌러서 수업 시작',
    startHint: '소리를 켜 주세요',
    startLabel: '수업 시작',
    prev: '이전',
    play: '재생',
    pause: '일시정지',
    next: '다음',
    soundOn: '🔊 소리 켬',
    soundOff: '🔈 소리 끔',
    todayLessons: '오늘의 수업',
    legendTitle: '표시 읽는 법',
    legendX: '하면 안 돼요',
    legendO: '해도 돼요, 꼭 하세요',
    legendQ: '병원 안내문대로',
    note: '시간과 물·약 기준은 병원 위내시경 안내문을 받으면 그 내용으로 바뀌어요.',
    sceneLabel: '위내시경 준비 그림',
    now: '지금',
    done: '완료',
    again: '처음부터 다시',
    retry: '다시 볼까요?',
  },
  lessonNames: [
    '1교시 · 전날 저녁',
    '2교시 · 검사 날 아침',
    '3교시 · 수면 내시경이라면',
    '4교시 · 검사 끝난 뒤',
  ],
  scene: {
    intro: {
      title: '위내시경 수업',
      items: ['전날 저녁', '검사 날 아침', '수면 내시경', '검사 끝난 뒤'],
    },
    dinner: {
      title: '검사 전날 저녁',
      sub: '가볍고 소화 잘 되는 음식으로',
      porridge: '죽',
      rice: '흰쌀밥',
    },
    night: {
      title: '밤 12시부터',
      sub: '아무것도 먹지 않기',
      clock: '밤 12시',
      bed: '잠자기 전',
      meal: '밥·간식',
      water: '물',
    },
    morningA: {
      title: '검사 날 아침',
      sub: '먹지 말고 그대로 오기',
      rice: '밥',
      gum: '껌',
      cigarette: '담배',
      coffee: '커피',
    },
    morningB: {
      title: '물과 약은',
      sub: '병원 안내문에 적힌 대로',
      water: '물',
      pills: '먹는 약',
    },
    car: {
      title: '수면 내시경 받은 날',
      sub: '직접 운전하지 않기',
      car: '내 차',
      bus: '대중교통',
    },
    guardian: {
      title: '보호자와 함께',
      sub: '같이 오고 같이 집에 가기',
      guardian: '보호자',
      me: '나',
      caption: '보호자와 함께',
    },
    after: {
      title: '검사 끝난 뒤',
      sub: '목 마취가 풀릴 때까지 기다리기',
      water: '물',
      food: '음식',
      wait: '기다리기',
    },
    warn: {
      title: '이럴 땐 바로 연락',
      sub: '병원에 전화하세요',
      stool: '검은 변',
      vomit: '피를 토함',
      pain: '심한 배 통증',
    },
  },
  lines: [
    {
      view: 'intro',
      lesson: 0,
      tone: 'r',
      text: '이번에는 **위내시경** 준비를 배워요.',
    },
    {
      view: 'dinner',
      lesson: 1,
      tone: 'g',
      text: '검사 전날 저녁은 **가볍고** 소화가 잘 되는 음식으로 드세요.',
    },
    {
      view: 'night',
      lesson: 1,
      tone: 'r',
      text: '**밤 12시부터**는 아무것도 드시면 안 돼요.',
    },
    {
      view: 'morningA',
      lesson: 2,
      tone: 'r',
      text: '검사 날 아침에는 밥, 껌, 담배, 커피 모두 **안 돼요**.',
    },
    {
      view: 'morningB',
      lesson: 2,
      tone: 'y',
      text: '물과 약은 병원 **안내문에 적힌 대로**만 드세요.',
    },
    {
      view: 'car',
      lesson: 3,
      tone: 'r',
      text: '수면 내시경을 받은 날은 **직접 운전하시면 안 돼요**. 보호자와 함께 대중교통을 타세요.',
    },
    {
      view: 'guardian',
      lesson: 3,
      tone: 'g',
      text: '**보호자와 함께** 오셔서 같이 집에 가세요.',
    },
    {
      view: 'after',
      lesson: 4,
      tone: 'g',
      text: '검사가 끝나면 목 마취가 풀릴 때까지 물과 음식을 **기다려 주세요**.',
    },
    {
      view: 'warn',
      lesson: 4,
      tone: 'r',
      text: '검은 변이 나오거나, 피를 토하거나, 배가 많이 아프면 **바로 병원에 연락**하세요.',
    },
  ],
  quiz: {
    question: '수면 내시경을 받은 날, **운전해도** 될까요?',
    options: ['운전해도 돼요', '안 돼요'],
  },
  cheer: '**잘하셨어요!** 위내시경 준비 수업 끝이에요.',
};

export type GastroLessonTexts = typeof gastroLessonKo;

/** 수업 글자 중 번역할 글자 전부(중복 없이) */
export function gastroLessonSources() {
  const found = new Set<string>();
  mapLessonStrings(gastroLessonKo, (text) => {
    found.add(text);
    return text;
  });
  return [...found];
}

/** 모든 글자를 f로 바꾼 같은 모양의 복사본. 글자가 아닌 값(교시 번호·강조 색)은 그대로 둔다. */
export function mapLessonStrings<T>(value: T, f: (text: string) => string): T {
  if (typeof value === 'string') return f(value) as T;
  if (Array.isArray(value))
    return value.map((v) => mapLessonStrings(v, f)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        // 장면 이름(view)·강조 색(tone) 같은 코드 값은 번역하지 않는다.
        k === 'view' || k === 'tone' ? v : mapLessonStrings(v, f),
      ]),
    ) as T;
  }
  return value;
}
