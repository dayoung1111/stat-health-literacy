// 시연용 가짜 안내문. 실제 의료 안내가 아니며, 내용은 간호사 검수가 필요하다.
// DB 단계에서 의료진이 발급한 코드별 안내문 조회로 바꾼다.
// 말투는 간호사가 말 걸듯 부드럽게, 시간·양·약 이름은 바꾸지 않는다.

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

export const demoGuide = {
  examName: '대장내시경',
  sections: [
    {
      title: '음식 조심',
      paragraphs: [
        {
          id: 'food-1',
          pictures: [
            { visual: emoji('🍉'), label: '씨 있는 과일', no: true },
            { visual: emoji('🥬'), label: '김치·나물', no: true },
            { visual: emoji('🌾'), label: '잡곡밥', no: true },
          ],
          lines: [
            '검사 3일 전부터는',
            '씨 있는 과일(수박, 참외, 포도)과',
            '김치, 나물, 잡곡밥은 잠깐 쉬어요.',
          ],
          term: '저잔사식',
          easier: [
            { visual: emoji('🍉'), label: '씨 있는 과일은 안 돼요', no: true },
            { visual: emoji('🥬'), label: '김치·나물도 안 돼요', no: true },
            { visual: emoji('🍚'), label: '흰밥은 괜찮아요' },
          ],
        },
        {
          id: 'food-2',
          pictures: [
            { visual: { kind: 'calendar', text: '전날' }, label: '검사 전날' },
            { visual: emoji('🥣'), label: '점심은 흰죽' },
          ],
          lines: ['검사 전날 점심은', '흰죽만 드시면 돼요.'],
          easier: [
            {
              visual: { kind: 'calendar', text: '전날' },
              label: '검사 전날 점심',
            },
            { visual: emoji('🥣'), label: '흰죽만 드세요' },
          ],
        },
      ],
    },
    {
      title: '장 비우는 약',
      paragraphs: [
        {
          id: 'prep-1',
          pictures: [
            { visual: { kind: 'clock', hour: 8 }, label: '전날 저녁 8시' },
            { visual: { kind: 'pouch' }, label: '약 1봉지' },
            { visual: { kind: 'bottle' }, label: '물 1L' },
          ],
          lines: [
            '① 검사 전날 저녁 8시에',
            '② 약 1봉지를 물 1L에 타서',
            '③ 15분마다 한 컵씩 드시면 돼요.',
          ],
          term: '장정결제 · 분할 복용',
          easier: [
            { visual: { kind: 'clock', hour: 8 }, label: '저녁 8시' },
            { visual: { kind: 'pouch' }, label: '약 1봉지' },
            { visual: { kind: 'bottle' }, label: '큰 물병 1개 (1L)' },
            { visual: { kind: 'cups', count: 4 }, label: '컵 4잔' },
            { visual: emoji('⏱️'), label: '15분에 1잔씩' },
          ],
        },
        {
          id: 'prep-2',
          pictures: [{ visual: emoji('🚽'), label: '노란 맑은 물' }],
          lines: ['④ 노란 맑은 물이 나오면', '준비 끝이에요. 잘하셨어요 🙂'],
          easier: [
            { visual: emoji('💛'), label: '물처럼 맑은 변이 나오면' },
            { visual: emoji('👍'), label: '준비 끝이에요' },
          ],
        },
      ],
    },
    {
      title: '먹는 약',
      paragraphs: [
        {
          id: 'med-1',
          pictures: [
            { visual: emoji('🌅'), label: '검사 날 아침' },
            { visual: emoji('💊'), label: '당뇨약', no: true },
          ],
          lines: ['검사 날 아침에는', '당뇨약을 드시지 마세요.'],
          term: '경구 혈당강하제',
          easier: [
            {
              visual: emoji('💊'),
              label: '검사 날 아침 당뇨약은 쉬어요',
              no: true,
            },
            { visual: emoji('🩸'), label: '혈당이 너무 떨어질 수 있어요' },
          ],
        },
        {
          id: 'med-2',
          pictures: [
            { visual: emoji('💊'), label: '피를 묽게 하는 약' },
            { visual: emoji('📞'), label: '병원에 미리 알리기' },
          ],
          lines: ['피를 묽게 하는 약을 드시면', '미리 병원에 알려 주세요.'],
          term: '항응고제',
          easier: [
            { visual: emoji('💊'), label: '피 묽게 하는 약을 드시나요?' },
            { visual: emoji('📞'), label: '병원에 먼저 말해 주세요' },
          ],
        },
      ],
    },
    {
      title: '검사 날',
      paragraphs: [
        {
          id: 'day-1',
          pictures: [
            { visual: emoji('🍚'), label: '밥', no: true },
            { visual: emoji('🍪'), label: '간식', no: true },
          ],
          lines: ['검사 날에는', '아무것도 드시지 마세요.'],
          term: '금식',
          easier: [
            { visual: emoji('🍚'), label: '밥은 안 돼요', no: true },
            { visual: emoji('🍪'), label: '간식도 안 돼요', no: true },
          ],
        },
        {
          id: 'day-2',
          pictures: [
            { visual: emoji('👨‍👩‍👧'), label: '보호자와 함께' },
            { visual: emoji('🚗'), label: '운전', no: true },
          ],
          lines: ['보호자와 함께 오세요.', '검사 후에는 운전하지 마세요.'],
          term: '수면 내시경 후 주의',
          easier: [
            { visual: emoji('👨‍👩‍👧'), label: '가족과 함께 오기' },
            { visual: emoji('🚗'), label: '검사 후 운전은 안 돼요', no: true },
          ],
        },
      ],
    },
  ] satisfies Section[],
  questions: [
    {
      topic: '약 먹는 시간',
      question: '장 비우는 약은\n언제 드시면 될까요?',
      choices: [
        { visual: emoji('🌅'), text: '검사 날 아침' },
        { visual: emoji('🌙'), text: '전날 저녁 8시', correct: true },
        { visual: emoji('🍚'), text: '밥 먹을 때' },
      ],
      explain: {
        pictures: [
          { visual: { kind: 'clock', hour: 8 }, label: '전날 저녁 8시' },
          { visual: { kind: 'pouch' }, label: '약 1봉지' },
        ],
        lines: ['장 비우는 약은', '검사 전날 저녁 8시에 드시면 돼요.'],
      },
      retry: {
        question: '검사 전날이에요.\n약은 몇 시에 드실까요?',
        choices: [
          { visual: { kind: 'clock', hour: 6 }, text: '저녁 6시' },
          {
            visual: { kind: 'clock', hour: 8 },
            text: '저녁 8시',
            correct: true,
          },
          { visual: { kind: 'clock', hour: 12 }, text: '밤 12시' },
        ],
      },
    },
    {
      topic: '피할 음식',
      question: '검사 3일 전부터\n쉬어야 하는 음식은?',
      choices: [
        { visual: emoji('🍚'), text: '흰밥' },
        {
          visual: emoji('🍉'),
          text: '수박·포도 같은 씨 있는 과일',
          correct: true,
        },
        { visual: emoji('💧'), text: '맑은 물' },
      ],
      explain: {
        pictures: [
          { visual: emoji('🍉'), label: '씨 있는 과일', no: true },
          { visual: emoji('🥬'), label: '김치·나물', no: true },
        ],
        lines: ['검사 3일 전부터는', '씨 있는 과일, 김치, 나물을 쉬어요.'],
      },
      retry: {
        question:
          '검사 2일 전이에요.\n간식으로 참외가 나왔어요.\n어떻게 할까요?',
        choices: [
          { visual: emoji('🍈'), text: '먹는다' },
          { visual: emoji('🙅'), text: '먹지 않는다', correct: true },
        ],
      },
    },
    {
      topic: '당일 아침 당뇨약',
      question: '검사 날 아침,\n당뇨약은 어떻게 할까요?',
      choices: [
        { visual: emoji('💊'), text: '평소처럼 먹어요' },
        { visual: emoji('🙅'), text: '먹지 않아요', correct: true },
      ],
      explain: {
        pictures: [
          { visual: emoji('🌅'), label: '검사 날 아침' },
          { visual: emoji('💊'), label: '당뇨약', no: true },
        ],
        lines: [
          '검사 날 아침에는 당뇨약을 드시지 마세요.',
          '(혈당이 너무 떨어질 수 있어요)',
        ],
      },
      retry: {
        question: '검사 날 아침 7시예요.\n당뇨약이 보여요.\n어떻게 하실까요?',
        choices: [
          { visual: emoji('💊'), text: '먹는다' },
          {
            visual: emoji('👜'),
            text: '먹지 않고 병원에 가져간다',
            correct: true,
          },
        ],
      },
    },
  ] satisfies Question[],
  dangerSigns: [
    { emoji: '😣', text: '배가 아주 많이 아파요' },
    { emoji: '🩸', text: '피가 많이 나와요' },
    { emoji: '🌡️', text: '열이 38도 넘어요' },
    { emoji: '🤮', text: '토를 계속 해요' },
  ],
};

// 안내문을 한 화면에 문단 하나씩 보여 주기 위한 순서 목록.
export const guideSteps = demoGuide.sections.flatMap((section, i) =>
  section.paragraphs.map((paragraph) => ({
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
      pictures: [
        { visual: emoji('🍉'), label: '씨 있는 과일', no: true },
        { visual: emoji('🥬'), label: '김치·나물', no: true },
      ],
      line: '씨 있는 과일, 김치, 나물은 잠깐 쉬어요',
      speech: '씨 있는 과일은 드시지 마세요.',
    };
  }
  if (daysLeft === 1) {
    return {
      title: '오늘 저녁 8시',
      pictures: [
        { visual: { kind: 'clock', hour: 8 }, label: '저녁 8시' },
        { visual: { kind: 'pouch' }, label: '약 1봉지' },
        { visual: { kind: 'cups', count: 4 }, label: '물 1L (컵 4잔)' },
      ],
      line: '장 비우는 약 1봉지 + 물 1L',
      speech: '저녁 8시예요. 약 드실 시간이에요.',
    };
  }
  if (daysLeft === 0) {
    return {
      title: '오늘 검사 날',
      pictures: [
        { visual: emoji('🍚'), label: '아무것도', no: true },
        { visual: emoji('👨‍👩‍👧'), label: '보호자와 함께' },
      ],
      line: '아무것도 드시지 말고 보호자와 함께 오세요',
      speech: '오늘은 아무것도 드시지 마세요.',
    };
  }
  return {
    title: '검사가 끝났어요',
    pictures: [{ visual: emoji('📞'), label: '이상하면 전화' }],
    line: '몸이 이상하면 바로 병원에 전화하세요',
    speech: '몸이 이상하면 바로 전화하세요.',
  };
}
