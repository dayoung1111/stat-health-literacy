// 시연용 대장내시경 안내문. 간호학과 검수자의 대본(실제 병원 안내문 기준)으로 작성했다.
// 안내문·"헷갈려요"·티치백·또박이 영상이 모두 이 파일 하나를 쓴다. 내용을 고칠 때는 여기만 고친다.
// 시간·양·약 이름은 바꾸지 않고, 원본 안내문에 없는 내용은 넣지 않는다.
// DB 단계에서 의료진이 발급한 코드별 안내문 조회로 바꾼다.

export const hospital = { name: '○○병원', phone: '02-0000-0000' };

// 화면에 그리는 그림. SVG 그림(시계·약봉지·물병·컵·달력) 또는 큰 이모지.
export type Visual =
  | { kind: 'clock'; hour: number }
  | { kind: 'pouch' }
  | { kind: 'bottle' }
  | { kind: 'cups'; count: number }
  | { kind: 'calendar'; text: string }
  | { kind: 'emoji'; emoji: string };

// label: 그림 아래 짧은 말. no: 하면 안 되는 것(빨간 ✕ 표시).
// lines: 또박이 영상에서 이 그림을 강조할 문장 번호(1부터).
export type Picture = {
  visual: Visual;
  label: string;
  no?: boolean;
  lines?: number[];
};

// 또박이 동작: 손 흔들기 / 지시봉 / 알람 시계 / 두 팔 들고 기뻐하기 / 손바닥 내밀며 멈춤
export type TtobakAction = 'wave' | 'point' | 'alarm' | 'cheer' | 'stop';

export type Paragraph = {
  id: string;
  pictures: Picture[];
  /** 한 줄에 한 문장. 안내문에 보이고, 영상에서는 자막·음성으로 한 줄씩 나온다. */
  lines: string[];
  term?: string;
  easier: Picture[];
  action: TtobakAction;
};

export type Section = { title: string; paragraphs: Paragraph[] };

export type Choice = { visual: Visual; text: string; correct?: boolean };

export type Question = {
  topic: string;
  question: string;
  choices: Choice[];
  explain: { pictures: Picture[]; lines: string[] };
  retry: { question: string; choices: Choice[] };
};

const emoji = (e: string): Visual => ({ kind: 'emoji', emoji: e });

export const demoGuide = {
  examName: '대장내시경',
  sections: [
    {
      title: '음식 조심',
      paragraphs: [
        {
          id: 'food-no',
          action: 'point',
          pictures: [
            { visual: emoji('🌾'), label: '잡곡밥', no: true, lines: [2] },
            { visual: emoji('🥬'), label: '김치', no: true, lines: [2] },
            { visual: emoji('🍙'), label: '김', no: true, lines: [2] },
            {
              visual: emoji('🍉'),
              label: '씨 있는 과일',
              no: true,
              lines: [2],
            },
          ],
          lines: [
            '검사 3일 전부터는 음식을 골라 드세요.',
            '잡곡밥, 김치, 김, 씨 있는 과일은 드시지 마세요.',
          ],
          easier: [
            { visual: emoji('🌾'), label: '잡곡밥은 안 돼요', no: true },
            { visual: emoji('🥬'), label: '김치도 안 돼요', no: true },
            { visual: emoji('🍙'), label: '김도 안 돼요', no: true },
            { visual: emoji('🍉'), label: '씨 있는 과일도 안 돼요', no: true },
          ],
        },
        {
          id: 'food-ok',
          action: 'point',
          pictures: [
            { visual: emoji('🍚'), label: '흰쌀밥', lines: [1] },
            { visual: emoji('🥣'), label: '흰죽', lines: [1] },
            { visual: emoji('🥚'), label: '계란', lines: [1] },
            { visual: emoji('⬜'), label: '두부', lines: [1] },
            { visual: emoji('🍌'), label: '바나나', lines: [1] },
          ],
          lines: ['흰쌀밥, 흰죽, 계란, 두부, 바나나는 드셔도 돼요.'],
          easier: [
            { visual: emoji('🍚'), label: '흰쌀밥, 흰죽은 괜찮아요' },
            { visual: emoji('🥚'), label: '계란, 두부도 괜찮아요' },
            { visual: emoji('🍌'), label: '바나나도 괜찮아요' },
          ],
        },
      ],
    },
    {
      title: '전날 저녁',
      paragraphs: [
        {
          id: 'evening-porridge',
          action: 'alarm',
          pictures: [
            {
              visual: { kind: 'clock', hour: 7 },
              label: '저녁 7시 전',
              lines: [1],
            },
            { visual: emoji('🥣'), label: '흰죽만', lines: [2] },
            { visual: emoji('🥢'), label: '반찬', no: true, lines: [2] },
          ],
          lines: [
            '검사 전날 저녁은 7시 전에 드세요.',
            '반찬 없이 흰죽만 드세요.',
          ],
          easier: [
            { visual: { kind: 'clock', hour: 7 }, label: '저녁은 7시 전에' },
            { visual: emoji('🥣'), label: '흰죽만 드세요' },
            { visual: emoji('🥢'), label: '반찬은 안 돼요', no: true },
          ],
        },
        {
          id: 'evening-fasting',
          action: 'stop',
          pictures: [
            {
              visual: { kind: 'clock', hour: 12 },
              label: '밤 12시부터',
              lines: [1],
            },
            { visual: emoji('🍚'), label: '음식', no: true, lines: [1] },
            {
              visual: emoji('💊'),
              label: '약과 물은 안내 시간대로',
              lines: [2],
            },
          ],
          // 새벽 약과 헷갈리지 않도록 음식과 약·물을 나눠 말한다.
          lines: [
            '음식은 밤 12시부터 드시지 마세요.',
            '약과 물은 안내한 시간대로 드세요.',
          ],
          term: '금식',
          easier: [
            {
              visual: { kind: 'clock', hour: 12 },
              label: '밤 12시부터 음식은 그만',
              no: true,
            },
            { visual: emoji('💊'), label: '약과 물은 안내 시간대로 드세요' },
          ],
        },
      ],
    },
    {
      title: '대변 검사',
      paragraphs: [
        {
          id: 'stool',
          action: 'point',
          pictures: [
            {
              visual: emoji('🧪'),
              label: '약 먹기 전에 대변 받기',
              lines: [1],
            },
            {
              visual: { kind: 'pouch' },
              label: '못 받아도 약은 그대로',
              lines: [2],
            },
          ],
          lines: [
            '약을 드시기 전에 대변을 받아 주세요.',
            '대변을 못 받아도 약은 그대로 드세요.',
          ],
          easier: [
            { visual: emoji('🧪'), label: '약 먹기 전에 대변을 받아요' },
            { visual: { kind: 'pouch' }, label: '못 받아도 약은 드세요' },
          ],
        },
      ],
    },
    {
      title: '장 비우는 약',
      paragraphs: [
        {
          id: 'prep-mix',
          action: 'point',
          pictures: [
            { visual: { kind: 'pouch' }, label: 'A제 1포', lines: [1] },
            { visual: { kind: 'pouch' }, label: 'B제 1포', lines: [1] },
            {
              visual: { kind: 'bottle' },
              label: '표시선까지 생수',
              lines: [1, 2],
            },
            { visual: emoji('🔄'), label: '흔들어 녹이기', lines: [3] },
          ],
          lines: [
            'A제 1포와 B제 1포를 1L 통에 넣어요.',
            '표시선까지 생수를 부어요.',
            '흔들어서 잘 녹여요.',
          ],
          easier: [
            { visual: { kind: 'pouch' }, label: 'A제 1포 + B제 1포' },
            { visual: { kind: 'bottle' }, label: '1L 통 표시선까지 생수' },
            { visual: emoji('🔄'), label: '흔들어서 녹여요' },
          ],
        },
        {
          id: 'prep-first',
          action: 'alarm',
          pictures: [
            {
              visual: { kind: 'clock', hour: 9 },
              label: '전날 밤 9~10시',
              lines: [1],
            },
            {
              visual: { kind: 'cups', count: 4 },
              label: '15분마다 4번',
              lines: [2],
            },
            { visual: emoji('💧'), label: '생수 500mL', lines: [3] },
          ],
          lines: [
            '첫 번째 약은 전날 밤 9시~10시에 드세요.',
            '15분마다 4번에 나눠서, 1시간 동안 드세요.',
            '생수 500mL도 드세요.',
          ],
          easier: [
            { visual: { kind: 'clock', hour: 9 }, label: '전날 밤 9~10시' },
            {
              visual: { kind: 'cups', count: 4 },
              label: '15분마다 1번, 모두 4번',
            },
            { visual: emoji('💧'), label: '생수 500mL 더' },
          ],
        },
        {
          id: 'prep-second',
          action: 'alarm',
          pictures: [
            {
              visual: { kind: 'clock', hour: 4 },
              label: '당일 새벽 4~5시',
              lines: [1],
            },
            {
              visual: { kind: 'cups', count: 4 },
              label: '첫 번째와 같은 방법',
              lines: [2],
            },
            { visual: emoji('🧴'), label: '가소콜액 1포', lines: [3] },
            { visual: emoji('💧'), label: '생수 500mL', lines: [4] },
          ],
          // 검수 필요: 가소콜액 복용 방법(시점·섞는 법)은 확인 중이다. 확정 전까지 아래 문구만 쓴다.
          lines: [
            '두 번째 약은 검사 당일 새벽 4시~5시에 드세요.',
            '첫 번째 약과 같은 방법으로 드세요.',
            '가소콜액 1포도 함께 드세요.',
            '생수 500mL도 드세요.',
          ],
          easier: [
            { visual: { kind: 'clock', hour: 4 }, label: '당일 새벽 4~5시' },
            { visual: { kind: 'cups', count: 4 }, label: '첫 번째와 똑같이' },
            // 검수 필요: 가소콜액
            { visual: emoji('🧴'), label: '가소콜액 1포도 함께' },
            { visual: emoji('💧'), label: '생수 500mL 더' },
          ],
        },
      ],
    },
    {
      title: '검사 당일',
      paragraphs: [
        {
          id: 'day-fasting',
          action: 'stop',
          pictures: [
            {
              visual: { kind: 'clock', hour: 5 },
              label: '새벽 5시부터',
              lines: [1],
            },
            { visual: emoji('💧'), label: '물', no: true, lines: [2] },
            { visual: emoji('💊'), label: '약', no: true, lines: [2] },
            { visual: emoji('🍬'), label: '껌', no: true, lines: [2] },
            { visual: emoji('🚬'), label: '담배', no: true, lines: [2] },
            { visual: emoji('🩺'), label: '혈압약은 괜찮아요', lines: [3] },
          ],
          lines: [
            '검사 당일 새벽 5시부터는 완전히 금식해요.',
            '물, 약, 껌, 담배 모두 안 돼요.',
            '혈압약만 드셔도 돼요.',
          ],
          term: '금식',
          easier: [
            {
              visual: { kind: 'clock', hour: 5 },
              label: '새벽 5시부터 아무것도 안 돼요',
              no: true,
            },
            { visual: emoji('🚬'), label: '껌, 담배도 안 돼요', no: true },
            { visual: emoji('🩺'), label: '혈압약만 괜찮아요' },
          ],
        },
        {
          id: 'day-companion',
          action: 'cheer',
          pictures: [
            { visual: emoji('👨‍👩‍👧'), label: '보호자와 함께', lines: [1] },
          ],
          lines: ['검사 날에는 보호자와 함께 오세요.'],
          easier: [{ visual: emoji('👨‍👩‍👧'), label: '가족과 함께 오세요' }],
        },
      ],
    },
  ] satisfies Section[],
  questions: [
    {
      topic: '첫 번째 약 시간',
      question: '장 비우는 첫 번째 약은\n언제 드시면 될까요?',
      choices: [
        { visual: emoji('🌅'), text: '검사 날 아침' },
        { visual: emoji('🌙'), text: '전날 밤 9~10시', correct: true },
        { visual: emoji('🍚'), text: '밥 먹을 때' },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'clock', hour: 9 }, label: '전날 밤 9~10시' },
          { visual: { kind: 'cups', count: 4 }, label: '15분마다 4번' },
        ],
        lines: ['첫 번째 약은', '전날 밤 9시~10시에 드시면 돼요.'],
      },
      retry: {
        question: '검사 전날이에요.\n첫 번째 약은 몇 시에 드실까요?',
        choices: [
          { visual: { kind: 'clock', hour: 6 }, text: '저녁 6시' },
          { visual: { kind: 'clock', hour: 9 }, text: '밤 9시', correct: true },
          { visual: { kind: 'clock', hour: 12 }, text: '밤 12시' },
        ],
      },
    },
    {
      topic: '피할 음식',
      question: '검사 3일 전부터\n드시지 말아야 하는 음식은?',
      choices: [
        { visual: emoji('🍚'), text: '흰쌀밥' },
        { visual: emoji('🍉'), text: '씨 있는 과일', correct: true },
        { visual: emoji('🍌'), text: '바나나' },
      ],
      explain: {
        pictures: [
          { visual: emoji('🌾'), label: '잡곡밥', no: true },
          { visual: emoji('🥬'), label: '김치', no: true },
          { visual: emoji('🍙'), label: '김', no: true },
          { visual: emoji('🍉'), label: '씨 있는 과일', no: true },
        ],
        lines: [
          '검사 3일 전부터는',
          '잡곡밥, 김치, 김, 씨 있는 과일을 드시지 마세요.',
        ],
      },
      retry: {
        question:
          '검사 2일 전이에요.\n반찬으로 김치가 나왔어요.\n어떻게 할까요?',
        choices: [
          { visual: emoji('🥬'), text: '먹는다' },
          { visual: emoji('🙅'), text: '먹지 않는다', correct: true },
        ],
      },
    },
    {
      topic: '검사 당일 새벽 5시 금식',
      question: '검사 날 새벽 5시가 지났어요.\n물을 마셔도 될까요?',
      choices: [
        { visual: emoji('💧'), text: '마셔도 돼요' },
        { visual: emoji('🙅'), text: '마시면 안 돼요', correct: true },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'clock', hour: 5 }, label: '새벽 5시부터' },
          { visual: emoji('💧'), label: '물', no: true },
          { visual: emoji('🩺'), label: '혈압약은 괜찮아요' },
        ],
        lines: [
          '새벽 5시부터는',
          '물, 약, 껌, 담배 모두 안 돼요.',
          '혈압약만 드셔도 돼요.',
        ],
      },
      retry: {
        question: '검사 날 새벽 6시예요.\n먹어도 되는 것은?',
        choices: [
          { visual: emoji('💧'), text: '물 한 컵' },
          { visual: emoji('🩺'), text: '혈압약', correct: true },
          { visual: emoji('🍬'), text: '껌' },
        ],
      },
    },
  ] satisfies Question[],
  // 검수 필요: 위험 신호는 원본 대본에 없는 팀 기획 화면의 예시다. 원본 안내문과 대조해야 한다.
  dangerSigns: [
    { emoji: '😣', text: '배가 아주 많이 아파요' },
    { emoji: '🩸', text: '피가 많이 나와요' },
    { emoji: '🌡️', text: '열이 38도 넘어요' },
    { emoji: '🤮', text: '토를 계속 해요' },
  ],
};

// 안내문을 한 화면에 문단 하나씩 보여 주기 위한 순서 목록.
export const guideSteps = demoGuide.sections.flatMap((section, i) =>
  section.paragraphs.map((paragraph: Paragraph) => ({
    sectionNo: i + 1,
    sectionTitle: section.title,
    ...paragraph,
  })),
);

// 또박이 영상 장면. 인사 장면만 영상 전용이고, 나머지는 안내문 화면과 같은 내용이다.
export type VideoScene = {
  id: string;
  title: string;
  action: TtobakAction;
  pictures: Picture[];
  lines: { text: string; highlight: number[] }[];
};

export const videoScenes: VideoScene[] = [
  {
    id: 'greeting',
    title: '인사',
    action: 'wave',
    pictures: [],
    lines: [
      { text: '안녕하세요, 저는 또박이예요.', highlight: [] },
      { text: '대장내시경 준비를 같이 해볼게요.', highlight: [] },
    ],
  },
  ...guideSteps.map((step) => ({
    id: step.id,
    title: step.sectionTitle,
    action: step.action,
    pictures: step.pictures,
    lines: step.lines.map((text, i) => ({
      text,
      highlight: step.pictures.flatMap((picture, index) =>
        picture.lines?.includes(i + 1) ? [index] : [],
      ),
    })),
  })),
];

// 검사일까지 남은 날에 맞는 "지금 할 일".
export function getTodo(daysLeft: number): {
  title: string;
  pictures: Picture[];
  line: string;
  speech: string;
} {
  if (daysLeft > 1) {
    return {
      title: '음식 조심',
      pictures: [
        { visual: emoji('🌾'), label: '잡곡밥', no: true },
        { visual: emoji('🥬'), label: '김치', no: true },
        { visual: emoji('🍙'), label: '김', no: true },
        { visual: emoji('🍉'), label: '씨 있는 과일', no: true },
      ],
<<<<<<< Updated upstream
      line: '씨 있는 과일, 김치, 나물은 잠깐 쉬어요',
      speech: '씨 있는 과일은 드시지 마세요.',
=======
      line: '잡곡밥, 김치, 김, 씨 있는 과일은 드시지 마세요',
>>>>>>> Stashed changes
    };
  }
  if (daysLeft === 1) {
    return {
      title: '오늘 밤 9~10시 첫 번째 약',
      pictures: [
        { visual: { kind: 'clock', hour: 7 }, label: '저녁 7시 전 흰죽' },
        { visual: { kind: 'clock', hour: 9 }, label: '밤 9~10시 첫 번째 약' },
        { visual: { kind: 'cups', count: 4 }, label: '15분마다 4번' },
      ],
<<<<<<< Updated upstream
      line: '장 비우는 약 1봉지 + 물 1L',
      speech: '저녁 8시예요. 약 드실 시간이에요.',
=======
      line: '음식은 밤 12시부터 금지, 약과 물은 안내 시간대로',
>>>>>>> Stashed changes
    };
  }
  if (daysLeft === 0) {
    return {
      title: '오늘 검사 날',
      pictures: [
        { visual: { kind: 'clock', hour: 4 }, label: '새벽 4~5시 두 번째 약' },
        {
          visual: { kind: 'clock', hour: 5 },
          label: '새벽 5시부터 금식',
          no: true,
        },
        { visual: emoji('👨‍👩‍👧'), label: '보호자와 함께' },
      ],
<<<<<<< Updated upstream
      line: '아무것도 드시지 말고 보호자와 함께 오세요',
      speech: '오늘은 아무것도 드시지 마세요.',
=======
      line: '새벽 5시부터 완전 금식, 혈압약만 드셔도 돼요',
>>>>>>> Stashed changes
    };
  }
  return {
    title: '검사가 끝났어요',
    pictures: [{ visual: emoji('📞'), label: '이상하면 전화' }],
    line: '몸이 이상하면 바로 병원에 전화하세요',
    speech: '몸이 이상하면 바로 전화하세요.',
  };
}
