// 기본 검진 "검진 전날 준비" 또박이 사진 수업 내용. 시안 docs/design/ttobak-day-before.html의
// 장면·자막·그림 이름표·배운 것·깜짝 퀴즈를 글자 그대로 옮겼다. 원문에 없는 의학 내용은 넣지 않는다.
// 검수 필요: 그림(사진)은 이해를 돕는 예시라 간호학과 검수가 필요하다(시안 안내 문구).
// 자막의 <r>…</r>은 빨강(하면 안 되는 것), <g>…</g>은 초록(해도 되는 것), <k>…</k>은 청록(시간·숫자 등)으로 칠한다.

/** 화면 오른쪽 또박이 동작. 모두 왼쪽 팔로 왼쪽 그림을 가리킨다. */
export type ScenePose = 'wave' | 'point' | 'clock' | 'palm' | 'cheer';

/** 접시 위 그림: 사진 또는 시계 그림(사진이 아님) */
export type SceneItem = { label: string } & (
  | { photo: { src: string; alt: string } }
  | { clock: { hour: number; caption: string } }
);

export type SceneLine = {
  text: string;
  /** 자막 아래 작은 글씨 */
  note?: string;
  /** 이 줄에서 나타날 그림 번호(0부터) */
  show?: number[];
  /** 이 줄에서 그릴 표시: x = 빨간 X, o = 초록 동그라미 */
  mark?: Partial<Record<number, 'x' | 'o'>>;
  /** 이 줄만 다른 동작 */
  pose?: ScenePose;
};

export type Scene = {
  title: string;
  pose: ScenePose;
  /** 장면을 다 보면 "이번 시간에 배운 것"에 쌓이는 말 */
  learned?: string;
  items: SceneItem[];
  lines: SceneLine[];
};

export type SceneQuiz = {
  question: string;
  options: [string, string];
  answer: number;
  /** 맞혔을 때 또박이 말 */
  ok: string;
  /** 틀리면 다시 볼 장면 번호(0부터) */
  back: number;
};

const photo = (file: string, alt: string) => ({
  photo: { src: `/images/foods/${file}`, alt },
});

export const dayBeforeLesson = {
  id: 'basic-day-before',
  title: '검진 전날 준비',
  startTitle: '검진 전날,\n이것만 지키면 돼요',
  startSub: '소리를 켜면 또박이가 읽어 드려요 · 약 2분',
  quizTag: '깜짝 퀴즈',
  retry: '괜찮아요. 그 장면을 한 번 더 볼게요.',
  finishTitle: '수업 완료',
  finish: '참 잘했어요! 검진 전날 준비를 <g>모두 배웠어요</g>.',
  learnedEmpty: '수업을 보면 여기에 하나씩 쌓여요.',
  scenes: [
    {
      title: '인사',
      pose: 'wave',
      items: [],
      lines: [
        { text: '안녕하세요, 저는 <k>또박이</k>예요.' },
        {
          text: '검진 <k>전날</k> 지킬 일 <k>다섯 가지</k>를 알려 드릴게요.',
        },
      ],
    },
    {
      title: '가벼운 저녁',
      pose: 'point',
      learned: '저녁은 가볍고 소화가 잘 되는 음식',
      items: [
        {
          label: '부드러운 죽',
          ...photo(
            'basic-01-porridge.jpg',
            '흰 그릇에 담긴 부드러운 흰죽 사진',
          ),
        },
        {
          label: '맑은 국',
          ...photo('basic-02-clear-soup.jpg', '흰 그릇에 담긴 맑은 무국 사진'),
        },
        {
          label: '기름진 음식',
          ...photo(
            'basic-03-oily-food.jpg',
            '프라이드치킨, 감자튀김, 햄버거, 피자, 삼겹살이 차려진 사진',
          ),
        },
      ],
      lines: [
        {
          text: '전날 저녁은 <g>가볍고 소화가 잘 되는</g> 음식으로 드세요.',
          show: [0, 1],
          mark: { 0: 'o', 1: 'o' },
        },
        { text: '<r>기름진 음식</r>은 피하세요.', show: [2], mark: { 2: 'x' } },
        {
          text: '피 검사와 배 초음파 결과가 달라질 수 있어요.',
          note: '피 속 기름(중성지방) 수치가 높게 나올 수 있어요',
          pose: 'palm',
        },
      ],
    },
    {
      title: '밤 9시 금식',
      pose: 'clock',
      learned: '밤 9시부터 금식 (물·껌·사탕·담배도 안 돼요)',
      items: [
        { label: '밤 9시', clock: { hour: 9, caption: '밤' } },
        {
          label: '물',
          ...photo('basic-04-water.jpg', '유리컵에 담긴 물 사진'),
        },
        {
          label: '껌',
          ...photo('basic-05-gum.jpg', '은박 포장을 반쯤 벗긴 초록색 껌 사진'),
        },
        {
          label: '담배',
          ...photo('basic-06-cigarette.jpg', '손가락에 든 불붙은 담배 사진'),
        },
      ],
      lines: [
        { text: '<r>밤 9시</r>부터는 아무것도 드시면 안 돼요.', show: [0] },
        {
          text: '<r>물</r>도 마시지 않아요.',
          show: [1],
          mark: { 1: 'x' },
          pose: 'palm',
        },
        {
          text: '<r>껌, 사탕, 담배</r>도 안 돼요.',
          show: [2, 3],
          mark: { 2: 'x', 3: 'x' },
        },
        { text: '적어도 <k>8시간</k>은 속을 비워야 해요.', pose: 'point' },
      ],
    },
    {
      title: '술 피하기',
      pose: 'palm',
      learned: '검진 2~3일 전부터 술 피하기',
      items: [
        {
          label: '맥주',
          ...photo('basic-07-beer.jpg', '유리잔에 가득 담긴 맥주 사진'),
        },
        {
          label: '소주',
          ...photo('basic-08-soju.jpg', '초록색 소주병과 소주잔 사진'),
        },
        {
          label: '와인',
          ...photo('basic-09-wine.jpg', '와인잔에 담긴 레드와인과 와인병 사진'),
        },
      ],
      lines: [
        {
          text: '술은 검진 <r>2~3일 전</r>부터 피하는 것이 좋아요.',
          show: [0, 1, 2],
          mark: { 0: 'x', 1: 'x', 2: 'x' },
        },
        {
          text: '간 검사 수치와 피 속 기름 수치가 올라갈 수 있어요.',
          pose: 'point',
        },
      ],
    },
    {
      title: '운동 쉬기',
      pose: 'palm',
      learned: '전날 격한 운동은 쉬기',
      items: [
        {
          label: '무거운 운동',
          ...photo(
            'basic-10-heavy-exercise.jpg',
            '무거운 바벨을 어깨에 메고 힘들게 앉았다 일어서는 사람 사진',
          ),
        },
        {
          label: '오래 달리기',
          ...photo(
            'basic-11-running.jpg',
            '여러 사람이 길에서 달리기를 하는 사진',
          ),
        },
      ],
      lines: [
        {
          text: '전날에는 <r>힘든 운동</r>을 하지 마세요.',
          show: [0, 1],
          mark: { 0: 'x', 1: 'x' },
        },
        {
          text: '근육 검사 수치나 소변 검사 결과가 달라질 수 있어요.',
          pose: 'point',
        },
      ],
    },
    {
      title: '푹 자기',
      pose: 'cheer',
      learned: '일찍 누워 충분히 자기 (혈압에 영향)',
      items: [
        {
          label: '일찍, 푹 자기',
          ...photo(
            'basic-12-sleep.jpg',
            '불을 낮춘 방에서 이불을 덮고 푹 자는 사람 사진',
          ),
        },
      ],
      lines: [
        {
          text: '전날 밤에는 <g>일찍 누워 잠을 충분히</g> 자 두세요.',
          show: [0],
          mark: { 0: 'o' },
        },
        {
          text: '잠이 부족하면 <k>혈압</k>이 높게 나올 수 있어요.',
          pose: 'point',
        },
        {
          text: '다섯 가지 모두 배웠어요! 이제 <k>퀴즈</k>를 풀어 볼까요?',
          pose: 'cheer',
        },
      ],
    },
  ] satisfies Scene[],
  quizzes: [
    {
      question: '밤 9시가 넘었어요. 목이 마르면 물을 마셔도 될까요?',
      options: ['마셔도 돼요', '안 돼요'],
      answer: 1,
      ok: '맞아요! 밤 9시부터는 물도 안 돼요.',
      back: 2,
    },
    {
      question: '술은 언제부터 피하면 좋을까요?',
      options: ['검진 당일 아침', '검진 2~3일 전'],
      answer: 1,
      ok: '맞아요! 2~3일 전부터 피해요.',
      back: 3,
    },
  ] satisfies SceneQuiz[],
};
