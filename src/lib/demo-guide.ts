// 시연용 대장내시경 안내문. 간호학과 검수자가 실제 병원 안내문 기준으로 정한 내용이다.
// 안내문·"헷갈려요"·티치백·"지금 할 일"·또박이 사진 수업 영상이 모두 이 파일 하나를 쓴다.
// 내용을 고칠 때는 여기만 고친다. 시간·양·약 이름은 바꾸지 않고, 원문에 없는 내용은 넣지 않는다.
// DB 단계에서 의료진이 발급한 코드별 안내문 조회로 바꾼다.

export const hospital = { name: '○○병원', phone: '02-0000-0000' };

// 화면에 그리는 그림. SVG 그림(시계·약봉지·물병·대변 통·컵·달력) 또는 큰 이모지.
export type Visual =
  | { kind: 'clock'; hour: number }
  | { kind: 'pouch' }
  | { kind: 'bottle' }
  | { kind: 'stoolCup' }
  | { kind: 'cups'; count: number }
  | { kind: 'calendar'; text: string }
  | { kind: 'emoji'; emoji: string };

// label: 그림 아래 짧은 말. no: 하면 안 되는 것(빨간 ✕ 표시).
export type Picture = { visual: Visual; label: string; no?: boolean };

export type Paragraph = {
  id: string;
  pictures: Picture[];
  lines: string[];
  term?: string;
  easier: Picture[];
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

// 검사 당일 금식과 혈압약 예외. 혈압약은 물 없이 못 먹으므로 물 한두 모금만 예외다.
// 앱 전체(안내문·헷갈려요·티치백·지금 할 일·또박이 대사·복용약 화면)가 이 문장을 그대로 쓴다.
// 혈압약을 먹는 시각은 검수 예정(2026-10-30)이라 여기에 넣지 않는다.
export const FASTING_FROM_5AM = '새벽 5시부터는 물도 드시지 마세요.';
export const BLOOD_PRESSURE_SIP = '단, 혈압약은 물 한두 모금과 함께 드세요.';
/** 그림 아래 짧은 말 */
export const BLOOD_PRESSURE_SIP_LABEL = '혈압약은 물 한두 모금과 함께';

// 1) 검사 3일 전 음식. 안내문 그림과 사진 수업 영상이 같은 목록을 쓴다.
// say: 안내문 한 줄이자 영상 자막. photo: 사진 수업에 나오는 사진(없으면 영상 정리 장면에서 말로만).
export type FoodGroup = {
  id: string;
  tone: 'no' | 'ok';
  name: string;
  say: string;
  emoji: string;
  photo?: { src: string; alt: string };
};

const foodPhoto = (file: string, alt: string) => ({
  src: `/images/foods/${file}`,
  alt,
});

export const foodGroups: FoodGroup[] = [
  {
    id: 'grain',
    tone: 'no',
    name: '잡곡밥 · 현미 · 검은쌀',
    say: '잡곡밥, 현미, 검은쌀은 드시면 안 돼요.',
    emoji: '🌾',
    photo: foodPhoto('food-01-multigrain.jpg', '그릇에 담긴 잡곡밥 사진'),
  },
  {
    id: 'kimchi',
    tone: 'no',
    name: '김치 · 나물',
    say: '김치, 나물, 콩나물도 안 돼요.',
    emoji: '🥬',
    photo: foodPhoto(
      'food-02-kimchi.jpg',
      '접시에 담긴 김치와 콩나물무침 사진',
    ),
  },
  {
    id: 'seaweed',
    tone: 'no',
    name: '김 · 미역 · 버섯',
    say: '김, 미역, 다시마, 버섯도 안 돼요.',
    emoji: '🍙',
    photo: foodPhoto('food-03-seaweed.jpg', '접시에 담긴 구운 김과 미역 사진'),
  },
  {
    id: 'seed-fruit',
    tone: 'no',
    name: '씨 있는 과일',
    say: '수박, 참외, 딸기, 포도, 키위처럼 씨 있는 과일도 안 돼요.',
    emoji: '🍉',
    photo: foodPhoto('food-04-fruit.jpg', '접시에 담긴 수박, 딸기, 포도 사진'),
  },
  {
    id: 'seeds',
    tone: 'no',
    name: '고추씨 · 옥수수 · 견과류',
    say: '고추씨, 옥수수, 견과류도 안 돼요.',
    emoji: '🌽',
  },
  {
    id: 'white-rice',
    tone: 'ok',
    name: '흰쌀밥 · 흰죽',
    say: '흰쌀밥과 흰죽은 드셔도 돼요.',
    emoji: '🍚',
    photo: foodPhoto('food-05-porridge.jpg', '그릇에 담긴 흰죽 사진'),
  },
  {
    id: 'egg-tofu',
    tone: 'ok',
    name: '계란 · 두부 · 묵',
    say: '계란, 두부, 묵도 괜찮아요.',
    emoji: '🥚',
    photo: foodPhoto(
      'food-06-egg-tofu.jpg',
      '접시에 담긴 삶은 계란과 두부 사진',
    ),
  },
  {
    id: 'ok-fruit',
    tone: 'ok',
    name: '사과 · 배 · 바나나',
    say: '사과, 배, 바나나도 드셔도 돼요.',
    emoji: '🍌',
    photo: foodPhoto(
      'food-07-banana-apple.jpg',
      '접시에 담긴 바나나와 사과 사진',
    ),
  },
  {
    id: 'ok-more',
    tone: 'ok',
    name: '국물 · 빵 · 맑은 음료 · 감자',
    say: '국물, 빵, 맑은 음료, 감자도 괜찮아요.',
    emoji: '🥔',
  },
];

const foodsOf = (tone: FoodGroup['tone']) =>
  foodGroups.filter((group) => group.tone === tone);

const foodPictures = (tone: FoodGroup['tone']): Picture[] =>
  foodsOf(tone).map((group) => ({
    visual: emoji(group.emoji),
    label: group.name,
    no: tone === 'no',
  }));

// 8) 이럴 땐 꼭 말씀하세요. 안내문과 "이럴 땐 바로 병원에" 화면이 같은 목록을 쓴다.
// short: 또박이 수업 8교시 글자 카드
export const tellUs = [
  {
    emoji: '🩸',
    text: '생리 중이면 약을 드시지 마세요',
    short: '생리 중이면 약을 먹지 않기',
  },
  {
    emoji: '🤰',
    text: '임신·수유 중이면 먼저 확인해 주세요',
    short: '임신·수유 중이면 먼저 확인하기',
  },
  {
    emoji: '🤮',
    text: '토를 심하게 하면 약을 멈추고 센터에 전화하세요',
    short: '토를 심하게 하면 약을 멈추고 전화하기',
  },
  {
    emoji: '🚽',
    text: '변을 충분히 못 봤거나 약 시간·양을 못 지켰으면 검사 날 접수 직원에게 말씀해 주세요',
    short: '변이 맑지 않으면 접수 때 말하기',
  },
];

export const demoGuide = {
  examName: '대장내시경',
  sections: [
    {
      title: '검사 3일 전 음식',
      paragraphs: [
        {
          id: 'food-no',
          pictures: foodPictures('no'),
          lines: [
            '검사 3일 전부터는 이 음식을 드시지 마세요.',
            ...foodsOf('no').map((group) => group.say),
          ],
          easier: foodsOf('no').map((group) => ({
            visual: emoji(group.emoji),
            label: `${group.name} — 안 돼요`,
            no: true,
          })),
        },
        {
          id: 'food-ok',
          pictures: foodPictures('ok'),
          lines: foodsOf('ok').map((group) => group.say),
          easier: foodsOf('ok').map((group) => ({
            visual: emoji(group.emoji),
            label: `${group.name} — 괜찮아요`,
          })),
        },
      ],
    },
    {
      title: '검사 전날 저녁',
      paragraphs: [
        {
          id: 'evening-porridge',
          pictures: [
            { visual: { kind: 'clock', hour: 7 }, label: '저녁 7시 전' },
            { visual: emoji('🥣'), label: '흰죽만' },
            { visual: emoji('🥢'), label: '반찬', no: true },
            { visual: emoji('🥜'), label: '잡곡·호두·잣·깨', no: true },
          ],
          lines: [
            '검사 전날 저녁은 7시 전에 드세요.',
            '반찬 없이 흰죽만 드세요.',
            '흰죽에 잡곡, 호두, 잣, 깨는 넣지 마세요.',
          ],
          easier: [
            { visual: { kind: 'clock', hour: 7 }, label: '저녁은 7시 전에' },
            { visual: emoji('🥣'), label: '반찬 없이 흰죽만' },
            { visual: emoji('🥜'), label: '잡곡·호두·잣·깨는 빼요', no: true },
          ],
        },
        {
          id: 'evening-fasting',
          pictures: [
            { visual: { kind: 'clock', hour: 12 }, label: '밤 12시부터' },
            { visual: emoji('🍚'), label: '음식', no: true },
            { visual: emoji('💊'), label: '약과 물은 안내 시간대로' },
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
      title: '대변 검사가 있는 분',
      paragraphs: [
        {
          id: 'stool',
          pictures: [
            { visual: emoji('🧪'), label: '약 먹기 전에 대변 받기' },
            { visual: { kind: 'pouch' }, label: '못 받아도 약은 그대로' },
          ],
          lines: [
            '약을 드시기 전에 대변을 받아 두세요.',
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
      title: '약 만드는 법',
      paragraphs: [
        {
          id: 'prep-mix',
          pictures: [
            { visual: { kind: 'pouch' }, label: 'A제 1포' },
            { visual: { kind: 'pouch' }, label: 'B제 1포' },
            { visual: { kind: 'bottle' }, label: '표시선까지 생수' },
            { visual: emoji('🔄'), label: '흔들어 녹이기' },
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
      ],
    },
    {
      title: '첫 번째 약',
      paragraphs: [
        {
          id: 'prep-first',
          pictures: [
            { visual: { kind: 'clock', hour: 9 }, label: '전날 밤 9~10시' },
            { visual: { kind: 'cups', count: 4 }, label: '15분마다 4번' },
            { visual: emoji('💧'), label: '생수 500mL' },
          ],
          lines: [
            '첫 번째 약은 검사 전날 밤 9시~10시에 드세요.',
            '만든 약 1L를 15분마다 4번 나눠 1시간 동안 드세요.',
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
      ],
    },
    {
      title: '두 번째 약',
      paragraphs: [
        {
          id: 'prep-second',
          pictures: [
            { visual: { kind: 'clock', hour: 4 }, label: '당일 새벽 4~5시' },
            {
              visual: { kind: 'cups', count: 4 },
              label: '첫 번째와 같은 방법',
            },
            { visual: emoji('🧴'), label: '가소콜액 1포' },
            { visual: emoji('💧'), label: '생수 500mL' },
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
            // 검수 필요: 가소콜액 복용 방법
            { visual: emoji('🧴'), label: '가소콜액 1포도 함께' },
            { visual: emoji('💧'), label: '생수 500mL 더' },
          ],
        },
      ],
    },
    {
      title: '새벽 5시부터 금식',
      paragraphs: [
        {
          id: 'day-fasting',
          pictures: [
            { visual: { kind: 'clock', hour: 5 }, label: '새벽 5시부터' },
            { visual: emoji('💧'), label: '물', no: true },
            { visual: emoji('💊'), label: '약', no: true },
            { visual: emoji('🍬'), label: '껌 · 은단', no: true },
            { visual: emoji('🚬'), label: '담배', no: true },
            { visual: emoji('🩺'), label: BLOOD_PRESSURE_SIP_LABEL },
          ],
          lines: [
            '검사 당일 새벽 5시부터는 완전히 금식해요.',
            '물, 약, 껌, 은단, 담배 모두 안 돼요.',
            BLOOD_PRESSURE_SIP,
          ],
          term: '금식',
          easier: [
            {
              visual: { kind: 'clock', hour: 5 },
              label: '새벽 5시부터 아무것도 안 돼요',
              no: true,
            },
            {
              visual: emoji('🍬'),
              label: '껌, 은단, 담배도 안 돼요',
              no: true,
            },
            { visual: emoji('🩺'), label: BLOOD_PRESSURE_SIP_LABEL },
          ],
        },
      ],
    },
    {
      title: '이럴 땐 꼭 말씀하세요',
      paragraphs: [
        {
          id: 'tell-body',
          pictures: tellUs.slice(0, 2).map((item) => ({
            visual: emoji(item.emoji),
            label: item.text,
          })),
          lines: [
            '생리 중이면 약을 드시지 마세요.',
            '임신 중이거나 수유 중이면 먼저 확인해 주세요.',
          ],
          easier: tellUs.slice(0, 2).map((item) => ({
            visual: emoji(item.emoji),
            label: item.text,
          })),
        },
        {
          id: 'tell-trouble',
          pictures: tellUs.slice(2).map((item) => ({
            visual: emoji(item.emoji),
            label: item.text,
          })),
          lines: [
            '토를 심하게 하면 약을 멈추고 센터에 전화하세요.',
            '변을 충분히 못 봤거나 약 시간·양을 못 지켰으면',
            '검사 날 접수 직원에게 말씀해 주세요.',
          ],
          easier: tellUs.slice(2).map((item) => ({
            visual: emoji(item.emoji),
            label: item.text,
          })),
        },
        {
          id: 'companion',
          pictures: [{ visual: emoji('👨‍👩‍👧'), label: '보호자와 함께' }],
          lines: ['검사 날에는 보호자와 함께 오세요.'],
          easier: [{ visual: emoji('👨‍👩‍👧'), label: '가족과 함께 오세요' }],
        },
      ],
    },
  ] satisfies Section[],
  questions: [
    {
      topic: '전날 저녁 흰죽 시간',
      question: '검사 전날 저녁 흰죽은\n몇 시 전에 드실까요?',
      choices: [
        {
          visual: { kind: 'clock', hour: 7 },
          text: '저녁 7시 전',
          correct: true,
        },
        { visual: { kind: 'clock', hour: 9 }, text: '밤 9시 전' },
        { visual: { kind: 'clock', hour: 12 }, text: '밤 12시 전' },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'clock', hour: 7 }, label: '저녁 7시 전' },
          { visual: emoji('🥣'), label: '반찬 없이 흰죽만' },
        ],
        lines: ['검사 전날 저녁은', '7시 전에 반찬 없이 흰죽만 드세요.'],
      },
      retry: {
        question: '검사 전날 저녁이에요.\n드실 수 있는 것은?',
        choices: [
          { visual: emoji('🥣'), text: '반찬 없는 흰죽', correct: true },
          { visual: emoji('🍱'), text: '흰죽과 반찬' },
          { visual: emoji('🥜'), text: '호두 넣은 흰죽' },
        ],
      },
    },
    {
      topic: '약 1L 먹는 방법',
      question: '만든 약 1L는\n어떻게 드실까요?',
      choices: [
        { visual: emoji('🥤'), text: '한 번에' },
        {
          visual: { kind: 'cups', count: 4 },
          text: '15분마다 4번 나눠서',
          correct: true,
        },
        { visual: emoji('🌅'), text: '아침에 한 번' },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'bottle' }, label: '만든 약 1L' },
          { visual: { kind: 'cups', count: 4 }, label: '15분마다 4번' },
        ],
        lines: ['만든 약 1L를', '15분마다 4번 나눠 1시간 동안 드세요.'],
      },
      retry: {
        question: '약을 처음 마시고\n15분이 지났어요. 어떻게 할까요?',
        choices: [
          { visual: emoji('🥤'), text: '다음 한 번을 마셔요', correct: true },
          { visual: emoji('🛑'), text: '그만 마셔요' },
          { visual: { kind: 'bottle' }, text: '남은 약을 한 번에 마셔요' },
        ],
      },
    },
    {
      topic: '새벽 5시 이후 금식',
      question: '검사 날 새벽 5시 이후\n먹어도 되는 것은?',
      choices: [
        { visual: emoji('💧'), text: '물' },
        { visual: emoji('🩺'), text: '혈압약', correct: true },
        { visual: emoji('🍬'), text: '껌' },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'clock', hour: 5 }, label: '새벽 5시부터' },
          { visual: emoji('💧'), label: '물', no: true },
          { visual: emoji('🩺'), label: BLOOD_PRESSURE_SIP_LABEL },
        ],
        lines: [
          '새벽 5시부터는',
          '물, 약, 껌, 은단, 담배 모두 안 돼요.',
          BLOOD_PRESSURE_SIP,
        ],
      },
      retry: {
        question: '검사 날 새벽 6시예요.\n목이 말라요. 물을 마셔도 될까요?',
        choices: [
          { visual: emoji('💧'), text: '마셔요' },
          { visual: emoji('🙅'), text: '마시지 않아요', correct: true },
        ],
      },
    },
    {
      topic: '생리 중일 때',
      question: '약 먹기 전에\n생리를 시작했다면?',
      choices: [
        { visual: emoji('💊'), text: '그대로 먹는다' },
        { visual: emoji('🌗'), text: '반만 먹는다' },
        { visual: emoji('🙅'), text: '먹지 않는다', correct: true },
      ],
      explain: {
        pictures: [
          { visual: emoji('🩸'), label: '생리 중' },
          { visual: emoji('💊'), label: '약', no: true },
        ],
        lines: ['생리 중이면', '약을 드시지 마세요.'],
      },
      retry: {
        question: '두 번째 약 먹을 시간이에요.\n생리 중이에요. 어떻게 할까요?',
        choices: [
          { visual: emoji('💊'), text: '약을 먹는다' },
          { visual: emoji('🙅'), text: '약을 먹지 않는다', correct: true },
        ],
      },
    },
  ] satisfies Question[],
  // "이럴 땐 바로 병원에" 화면. 원문 8) 내용을 그대로 쓴다.
  dangerSigns: tellUs,
};

// 또박이 선생님 대장내시경 수업(1~8교시). 영상 자막·따라하기 화면이 모두 아래 데이터를 쓴다.
// 1·2교시: 음식 사진(foodGroups), 3·4·7·8교시: 안내 카드 + 사진 카드, 5·6교시: 약 만들기 그림.

/** 자막 강조 색. no: 안 되는 말(빨강), ok: 되는 말(초록), care: 주의(노랑) */
export type KeyTone = 'no' | 'ok' | 'care';
/** word: 자막에서 색 배경으로 강조할 말(자막 안에 그대로 있어야 한다) */
export type SayKey = { word: string; tone: KeyTone };
export type LessonLine = { say: string; keys: SayKey[] };

const no = (word: string): SayKey => ({ word, tone: 'no' });
const ok = (word: string): SayKey => ({ word, tone: 'ok' });
const care = (word: string): SayKey => ({ word, tone: 'care' });
const line = (say: string, ...keys: SayKey[]): LessonLine => ({ say, keys });

/** 카드 속 사진·그림 하나. mark: 위에 그리는 X(no) / O(ok) / 노란 !(care) */
export type CardItem = {
  label: string;
  mark?: KeyTone;
  photo?: { src: string; alt: string };
  visual?: Visual;
  /** 사진 속 사람 몸 위 이름표. x·y는 사진 안 위치(%) */
  tags?: { text: string; x: number; y: number }[];
};

/** sign: 왼쪽 동그라미 표시(✕ no / ○ ok / ! care). notes: 빨간 테두리 글자 카드 */
export type LessonCard = {
  id: string;
  sign: KeyTone;
  title: string;
  sub: string;
  items: CardItem[];
  notes?: string[];
  lines: LessonLine[];
};

/** 약 만들기 그림 장면 */
export type PrepScene =
  | 'supplies'
  | 'add'
  | 'fill'
  | 'shake'
  | 'dissolved'
  | 'cups'
  | 'gasocol'
  | 'water';

export type PrepStep = {
  id: string;
  scene: PrepScene;
  /** 왼쪽 위 표시에 쓰는 짧은 이름 */
  name: string;
  line: LessonLine;
};

export type LessonQuiz = {
  question: string;
  key: string;
  options: string[];
  answer: number;
  /** 틀리면 다시 볼 장면(photo: 음식 id, card·prep: 장면 id) */
  review: string;
  praise: string;
};

// 5교시 약 만들기 7단계. 따라하기 화면도 이 목록을 쓴다.
export const prepSteps: PrepStep[] = [
  {
    id: 'supplies',
    scene: 'supplies',
    name: '준비물 확인',
    line: line('A제 1포, B제 1포, 1L 통을 준비해요.', care('준비해요')),
  },
  {
    id: 'add',
    scene: 'add',
    name: 'A제와 B제 넣기',
    line: line('A제 1포와 B제 1포를 1L 통에 넣어요.', ok('A제 1포와 B제 1포')),
  },
  {
    id: 'fill',
    scene: 'fill',
    name: '표시선까지 물',
    line: line('표시선까지 생수를 부어요.', care('표시선까지')),
  },
  {
    id: 'shake',
    scene: 'shake',
    name: '뚜껑 닫고 흔들기',
    line: line('뚜껑을 닫고 흔들어서 잘 녹여요.', ok('흔들어서')),
  },
  {
    id: 'dissolved',
    scene: 'dissolved',
    name: '다 녹았는지 확인',
    line: line('가루가 다 녹았는지 확인해요.', care('다 녹았는지')),
  },
  {
    id: 'cups',
    scene: 'cups',
    name: '15분마다 한 컵씩',
    line: line(
      '전날 밤 9시부터 15분마다 한 컵씩, 네 번에 나눠서 한 시간 동안 다 드세요.',
      care('15분마다 한 컵씩'),
    ),
  },
  {
    id: 'water',
    scene: 'water',
    name: '생수 500mL',
    line: line('생수 500mL도 드세요.', ok('생수 500mL')),
  },
];

// 6교시 두 번째 약
export const secondPrepSteps: PrepStep[] = [
  {
    id: 'second-make',
    scene: 'dissolved',
    name: '약 하나 더 만들기',
    line: line(
      '검사 날 새벽 4시가 되면, 같은 방법으로 약을 하나 더 만들어요.',
      care('새벽 4시'),
    ),
  },
  {
    id: 'second-cups',
    scene: 'cups',
    name: '15분마다 한 컵씩',
    line: line(
      '이번에도 15분마다 한 컵씩, 네 번에 나눠 드세요.',
      care('15분마다 한 컵씩'),
    ),
  },
  // 검수 필요: 가소콜액 복용 방법
  {
    id: 'second-gasocol',
    scene: 'gasocol',
    name: '가소콜액 1포',
    line: line('가소콜액 1포도 함께 드세요.', ok('가소콜액 1포')),
  },
  {
    id: 'second-water',
    scene: 'water',
    name: '생수 500mL',
    line: line('마지막으로 생수 500mL를 더 드세요.', ok('생수 500mL')),
  },
];

const praise = '잘하셨어요!';

type PhotoLessonSpec = {
  kind: 'photo';
  id: string;
  tone: FoodGroup['tone'];
  title: string;
  introTitle: string;
  summaryTitle: string;
  intro: string;
  introKey: string;
  summary: string;
  summaryKey: string;
  quiz: LessonQuiz;
};
type CardLessonSpec = {
  kind: 'card';
  id: string;
  title: string;
  cards: LessonCard[];
  /** null: 퀴즈 없이 바로 다음 교시 */
  quiz: LessonQuiz | null;
};
type PrepLessonSpec = {
  kind: 'prep';
  id: string;
  title: string;
  /** 왼쪽 위 표시. 없으면 "5교시 · 1단계 / 7 · 준비물 확인"처럼 단계마다 */
  badge?: string;
  /** 컵 장면 시계가 가리키는 시각 */
  hour: number;
  steps: PrepStep[];
  quiz: LessonQuiz;
};
export type VideoLessonSpec = PhotoLessonSpec | CardLessonSpec | PrepLessonSpec;

export const videoLessons: VideoLessonSpec[] = [
  {
    kind: 'photo',
    id: 'avoid-3-days',
    tone: 'no',
    title: '1교시 · 3일 전 피할 음식',
    introTitle: '오늘 배울 음식',
    summaryTitle: '검사 3일 전부터 이 음식은 안 돼요',
    intro: '검사 3일 전부터는 먹으면 안 되는 음식이 있어요.',
    introKey: '먹으면 안 되는 음식',
    summary: '이 음식들은 검사 3일 전부터 드시지 마세요.',
    summaryKey: '드시지 마세요',
    quiz: {
      question: '김치는 먹어도 될까요?',
      key: '김치',
      options: ['먹어도 돼요', '안 돼요'],
      answer: 1,
      review: 'kimchi',
      praise: '잘하셨어요! 이제 드셔도 되는 음식을 배워요.',
    },
  },
  {
    kind: 'photo',
    id: 'ok-foods',
    tone: 'ok',
    title: '2교시 · 드셔도 되는 음식',
    introTitle: '드셔도 되는 음식',
    summaryTitle: '이 음식은 드셔도 돼요',
    intro: '이번에는 드셔도 되는 음식을 볼까요?',
    introKey: '드셔도 되는 음식',
    summary: '이 음식들은 검사 전에도 드셔도 괜찮아요.',
    summaryKey: '괜찮아요',
    quiz: {
      question: '바나나는 먹어도 될까요?',
      key: '바나나',
      options: ['먹어도 돼요', '안 돼요'],
      answer: 0,
      review: 'ok-fruit',
      praise,
    },
  },
  {
    kind: 'card',
    id: 'evening-before',
    title: '3교시 · 검사 전날 저녁',
    cards: [
      {
        id: 'evening-porridge',
        sign: 'ok',
        title: '저녁 7시 전',
        sub: '반찬 없이 흰죽만 드세요',
        items: [
          {
            label: '흰죽',
            mark: 'ok',
            photo: foodPhoto('food-05-porridge.jpg', '그릇에 담긴 흰죽 사진'),
          },
          {
            label: '반찬',
            mark: 'no',
            photo: foodPhoto(
              'food-02-kimchi.jpg',
              '접시에 담긴 김치와 콩나물무침 사진',
            ),
          },
          {
            label: '잡곡·견과류',
            mark: 'no',
            photo: foodPhoto(
              'food-01-multigrain.jpg',
              '그릇에 담긴 잡곡밥 사진',
            ),
          },
        ],
        lines: [
          line(
            '검사 전날 저녁은 7시 전에 반찬 없이 흰죽만 드세요.',
            ok('흰죽만'),
          ),
          line(
            '김치 같은 반찬과 잡곡, 호두, 잣, 깨는 빼 주세요.',
            no('빼 주세요'),
          ),
        ],
      },
      {
        id: 'evening-after',
        sign: 'no',
        title: '저녁 먹은 뒤에는',
        sub: '음식은 먹지 않기',
        items: [
          {
            label: '밥·간식',
            mark: 'no',
            photo: foodPhoto(
              'food-08-white-rice.jpg',
              '그릇에 담긴 흰쌀밥 사진',
            ),
          },
          {
            label: '물·약',
            mark: 'care',
            photo: foodPhoto('food-09-water.jpg', '유리컵에 담긴 물 사진'),
          },
        ],
        lines: [
          line(
            '저녁을 드신 뒤에는 음식을 드시면 안 돼요. 약과 물은 안내 시간대로 드세요.',
            no('안 돼요'),
            care('안내 시간대로'),
          ),
        ],
      },
    ],
    quiz: {
      question: '흰죽은 몇 시 전에 드셔야 할까요?',
      key: '몇 시 전',
      options: ['저녁 7시 전', '밤 9시 전', '밤 12시 전'],
      answer: 0,
      review: 'evening-porridge',
      praise,
    },
  },
  {
    kind: 'card',
    id: 'stool-test',
    title: '4교시 · 대변 검사가 있다면',
    cards: [
      {
        id: 'stool-first',
        sign: 'care',
        title: '대변 검사가 있다면',
        sub: '약 먹기 전에 대변 받기',
        items: [
          { label: '① 대변 받기', mark: 'ok', visual: { kind: 'stoolCup' } },
          { label: '② 약 먹기', visual: { kind: 'bottle' } },
        ],
        lines: [
          line(
            '대변 검사가 있는 분은 약을 먹기 전에 대변을 받아 두세요.',
            care('약을 먹기 전에'),
          ),
        ],
      },
      {
        id: 'stool-missed',
        sign: 'ok',
        title: '못 받았어도',
        sub: '약은 그대로 드세요',
        items: [
          { label: '약은 그대로', mark: 'ok', visual: { kind: 'bottle' } },
          { label: '대변은 나중에', visual: { kind: 'stoolCup' } },
        ],
        lines: [
          line(
            '못 받았어도 약은 그대로 드세요. 대변은 나중에 내도 돼요.',
            ok('약은 그대로 드세요'),
          ),
        ],
      },
    ],
    quiz: null,
  },
  {
    kind: 'prep',
    id: 'prep-first',
    title: '5교시 · 약 만들기 + 첫 번째 약',
    hour: 9,
    steps: prepSteps,
    quiz: {
      question: '만든 약 1L는 어떻게 드시나요?',
      key: '만든 약 1L',
      options: ['한 번에 다', '15분마다 한 컵씩 4번'],
      answer: 1,
      review: 'cups',
      praise,
    },
  },
  {
    kind: 'prep',
    id: 'prep-second',
    title: '6교시 · 두 번째 약',
    badge: '6교시 · 검사 날 새벽 4~5시',
    hour: 4,
    steps: secondPrepSteps,
    quiz: {
      question: '두 번째 약은 언제 드시나요?',
      key: '두 번째 약',
      options: ['검사 날 새벽 4~5시', '검사 날 아침 9시'],
      answer: 0,
      review: 'second-make',
      praise,
    },
  },
  {
    kind: 'card',
    id: 'fasting-5am',
    title: '7교시 · 새벽 5시부터 금식',
    cards: [
      {
        id: 'fasting-all',
        sign: 'no',
        title: '새벽 5시부터',
        sub: '아무것도 먹지 않기',
        items: [
          {
            label: '물',
            mark: 'no',
            photo: foodPhoto('food-09-water.jpg', '유리컵에 담긴 물 사진'),
          },
          {
            label: '약',
            mark: 'no',
            photo: foodPhoto('food-10-pills.jpg', '알약과 캡슐 사진'),
          },
          {
            label: '껌',
            mark: 'no',
            photo: foodPhoto('food-13-gum.jpg', '포장을 벗긴 껌 사진'),
          },
          {
            label: '담배',
            mark: 'no',
            photo: foodPhoto(
              'food-11-smoking.jpg',
              '손가락에 든 불 붙은 담배 사진',
            ),
          },
        ],
        lines: [
          line('새벽 5시부터는 물, 약, 껌, 담배 모두 안 돼요.', no('안 돼요')),
          line('물 한 모금도 드시면 안 돼요.', no('안 돼요')),
        ],
      },
      {
        id: 'fasting-bp',
        sign: 'ok',
        title: '혈압약만',
        sub: '드셔도 돼요',
        items: [
          {
            label: '혈압약',
            mark: 'ok',
            photo: foodPhoto('food-10-pills.jpg', '알약과 캡슐 사진'),
          },
        ],
        lines: [line('혈압약만 드실 수 있어요.', ok('혈압약만'))],
      },
    ],
    quiz: {
      question: '새벽 5시 이후에 먹어도 되는 것은?',
      key: '먹어도 되는 것',
      options: ['물', '혈압약', '껌'],
      answer: 1,
      review: 'fasting-bp',
      praise,
    },
  },
  {
    kind: 'card',
    id: 'tell-us',
    title: '8교시 · 이럴 땐 꼭 말씀하세요',
    cards: [
      {
        id: 'tell-us',
        sign: 'care',
        title: '이럴 땐 꼭 말씀하세요',
        sub: '약을 멈추거나 직원에게 알리기',
        items: [],
        notes: tellUs.map((item) => item.short),
        lines: [
          line(
            '생리 중이거나 임신·수유 중이면 약을 먹기 전에 꼭 말씀하세요.',
            care('꼭 말씀하세요'),
          ),
          line(
            '토를 심하게 하거나 변이 맑지 않으면 병원이나 접수 직원에게 알려 주세요.',
            care('알려 주세요'),
          ),
        ],
      },
      {
        id: 'companion',
        sign: 'ok',
        title: '검사 날에는',
        sub: '보호자와 함께 오세요',
        items: [
          {
            label: '보호자와 함께',
            photo: foodPhoto(
              'food-12-guardian.jpg',
              '병원 복도에서 보호자가 어르신의 팔을 잡고 함께 걷는 뒷모습 사진',
            ),
            tags: [
              { text: '보호자', x: 39, y: 45 },
              { text: '나', x: 64, y: 45 },
            ],
          },
        ],
        lines: [line('검사 날에는 보호자와 함께 오세요.', ok('보호자와 함께'))],
      },
    ],
    quiz: {
      question: '약 먹기 전에 생리를 시작했다면?',
      key: '생리',
      options: ['그대로 먹는다', '먹지 않는다'],
      answer: 1,
      review: 'tell-us',
      praise: '대장내시경 준비 수업 끝! 정말 잘하셨어요.',
    },
  },
];

// 안내문을 한 화면에 문단 하나씩 보여 주기 위한 순서 목록.
export const guideSteps = demoGuide.sections.flatMap((section, i) =>
  section.paragraphs.map((paragraph: Paragraph) => ({
    sectionNo: i + 1,
    sectionTitle: section.title,
    ...paragraph,
  })),
);

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
      pictures: foodPictures('no').slice(0, 4),
      line: '잡곡밥, 김치, 김, 씨 있는 과일은 드시지 마세요',
      speech:
        '검사 3일 전부터는 잡곡밥, 김치, 김, 씨 있는 과일을 드시지 마세요.',
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
      line: '음식은 밤 12시부터 금지, 약과 물은 안내 시간대로',
      speech: '저녁은 7시 전에 흰죽만 드세요. 첫 번째 약은 밤 9시예요.',
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
      line: `${FASTING_FROM_5AM} ${BLOOD_PRESSURE_SIP}`,
      speech: `${FASTING_FROM_5AM} ${BLOOD_PRESSURE_SIP}`,
    };
  }
  return {
    title: '검사가 끝났어요',
    pictures: [{ visual: emoji('👍'), label: '수고하셨어요' }],
    line: '궁금한 점은 병원에 물어보세요',
    speech: '수고 많으셨어요.',
  };
}
