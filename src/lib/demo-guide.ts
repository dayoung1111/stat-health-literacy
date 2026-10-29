// 시연용 가짜 안내문. 실제 의료 안내가 아니며, 내용은 간호사 검수가 필요하다.
// DB 단계에서 의료진이 발급한 코드별 안내문 조회로 바꾼다.

export const hospital = { name: '○○병원', phone: '02-0000-0000' };

export type Paragraph = {
  id: string;
  lines: string[];
  term?: string;
  easier: { icon: string; text: string }[];
};

export type Section = { title: string; paragraphs: Paragraph[] };

export type Choice = { text: string; correct?: boolean };

export type Question = {
  topic: string;
  question: string;
  choices: Choice[];
  explain: string[];
  retry: { question: string; choices: Choice[] };
};

export const demoGuide = {
  examName: '대장내시경',
  sections: [
    {
      title: '음식 조심',
      paragraphs: [
        {
          id: 'food-1',
          lines: [
            '검사 3일 전부터 씨 있는 과일(수박, 참외, 포도)을 먹지 마세요.',
            '김치, 나물, 잡곡밥도 먹지 마세요.',
          ],
          term: '저잔사식',
          easier: [
            { icon: '🍉', text: '씨 있는 과일 ✕' },
            { icon: '🥬', text: '김치·나물 ✕' },
            { icon: '🍚', text: '흰밥은 괜찮아요' },
          ],
        },
        {
          id: 'food-2',
          lines: ['검사 전날 점심은 흰죽만 드세요.'],
          easier: [{ icon: '🥣', text: '전날 점심 = 흰죽' }],
        },
      ],
    },
    {
      title: '장 비우는 약 먹기',
      paragraphs: [
        {
          id: 'prep-1',
          lines: [
            '① 검사 전날 저녁 8시',
            '② 약 1봉지를 물 1L에 타요',
            '③ 15분마다 한 컵씩 마셔요',
          ],
          term: '장정결제 · 분할 복용',
          easier: [
            { icon: '🕗', text: '저녁 8시' },
            { icon: '📦', text: '약 1봉지' },
            { icon: '💧', text: '큰 물병 1개 (1L)' },
            { icon: '🥤', text: '컵 4잔' },
            { icon: '⏱️', text: '15분에 1잔씩' },
          ],
        },
        {
          id: 'prep-2',
          lines: ['④ 노란 맑은 물이 나오면 준비 끝'],
          easier: [{ icon: '🚽', text: '물처럼 맑은 변 = 준비 끝' }],
        },
      ],
    },
    {
      title: '먹는 약',
      paragraphs: [
        {
          id: 'med-1',
          lines: ['검사 날 아침에는 당뇨약을 드시지 마세요.'],
          term: '경구 혈당강하제',
          easier: [
            { icon: '💊', text: '당뇨약 ✕ (검사 날 아침)' },
            { icon: '🩸', text: '혈당이 너무 떨어질 수 있어요' },
          ],
        },
        {
          id: 'med-2',
          lines: ['피를 묽게 하는 약을 드시면 미리 병원에 알려 주세요.'],
          term: '항응고제',
          easier: [
            { icon: '📞', text: '피 묽게 하는 약 → 병원에 먼저 말하기' },
          ],
        },
      ],
    },
    {
      title: '검사 날',
      paragraphs: [
        {
          id: 'day-1',
          lines: ['검사 날에는 아무것도 드시지 마세요.'],
          term: '금식',
          easier: [{ icon: '🚫', text: '밥 ✕ · 간식 ✕' }],
        },
        {
          id: 'day-2',
          lines: ['보호자와 함께 오세요. 검사 후에는 운전하지 마세요.'],
          term: '수면 내시경 후 주의',
          easier: [
            { icon: '👨‍👩‍👧', text: '가족과 함께 오기' },
            { icon: '🚗', text: '운전 ✕' },
          ],
        },
      ],
    },
  ] satisfies Section[],
  questions: [
    {
      topic: '약 먹는 시간',
      question: '장 비우는 약은\n언제부터 드시나요?',
      choices: [
        { text: '검사 당일 아침' },
        { text: '검사 3일 전' },
        { text: '검사 전날 저녁 8시', correct: true },
        { text: '아무 때나' },
      ],
      explain: ['장 비우는 약은', '검사 전날 저녁 8시에 드세요.'],
      retry: {
        question: '검사 전날이에요.\n약은 몇 시에 드시나요?',
        choices: [
          { text: '저녁 6시' },
          { text: '저녁 8시', correct: true },
          { text: '밤 12시' },
        ],
      },
    },
    {
      topic: '피할 음식',
      question: '검사 3일 전부터\n먹지 말아야 할 것은?',
      choices: [
        { text: '흰밥' },
        { text: '수박·포도 같은 씨 있는 과일', correct: true },
        { text: '맑은 물' },
      ],
      explain: ['검사 3일 전부터', '씨 있는 과일, 김치, 나물을 드시지 마세요.'],
      retry: {
        question:
          '검사 2일 전이에요.\n간식으로 참외가 나왔어요.\n어떻게 하실까요?',
        choices: [{ text: '먹는다' }, { text: '먹지 않는다', correct: true }],
      },
    },
    {
      topic: '당일 아침 당뇨약',
      question: '검사 날 아침,\n당뇨약을 드시나요?',
      choices: [
        { text: '평소처럼 먹어요' },
        { text: '먹지 않아요', correct: true },
      ],
      explain: [
        '검사 날 아침에는',
        '당뇨약을 드시지 마세요.',
        '(혈당이 너무 떨어질 수 있어요)',
      ],
      retry: {
        question: '검사 날 아침 7시예요.\n당뇨약을 보셨어요.\n어떻게 하실까요?',
        choices: [
          { text: '먹는다' },
          { text: '먹지 않고 병원에 가져간다', correct: true },
        ],
      },
    },
  ] satisfies Question[],
  dangerSigns: [
    '배가 아주 많이 아파요',
    '피가 많이 나와요',
    '열이 38도 넘어요',
    '토를 계속 해요',
  ],
};

// 검사일까지 남은 날에 맞는 "지금 할 일".
export function getTodo(daysLeft: number) {
  if (daysLeft > 1) {
    return {
      title: '음식 조심',
      lines: ['씨 있는 과일, 김치, 나물을', '먹지 마세요'],
    };
  }
  if (daysLeft === 1) {
    return {
      title: '오늘 저녁 8시',
      lines: ['장 비우는 약 1봉지 + 물 1L'],
    };
  }
  if (daysLeft === 0) {
    return {
      title: '오늘 검사 날',
      lines: ['아무것도 드시지 마세요', '보호자와 함께 오세요'],
    };
  }
  return {
    title: '검사가 끝났어요',
    lines: ['몸이 이상하면 바로 병원에 전화하세요'],
  };
}
