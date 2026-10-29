// 또박이 선생님 대장내시경 수업(1~8교시)의 장면 목록. 내용은 src/lib/demo-guide.ts 하나에서 가져온다
// (안내문·티치백과 같은 데이터). 이 파일은 그 내용을 영상 장면 순서로 바꾸기만 한다.
// 1·2교시 사진 속 음식은 화면 왼쪽 33%·위 46% 지점에 있다.

import {
  foodGroups,
  videoLessons,
  type FoodGroup,
  type LessonCard,
  type LessonQuiz,
  type PrepScene,
  type SayKey,
} from '@/lib/demo-guide';

/** no: 먹으면 안 되는 음식(빨간 X), ok: 드셔도 되는 음식(초록 동그라미) */
export type FoodTone = FoodGroup['tone'];

export type FoodPhoto = {
  id: string;
  src: string;
  /** 화면 왼쪽 위·목록에 보이는 짧은 이름 */
  name: string;
  /** 화면 읽기 프로그램용 사진 설명 */
  alt: string;
  tone: FoodTone;
};

/** id: 퀴즈를 틀렸을 때 다시 볼 장면을 찾는 이름. keys: 자막에서 색 배경으로 강조할 말 */
export type LessonStep = { id: string; text: string; keys: SayKey[] } & (
  | { kind: 'intro' }
  | { kind: 'photo'; photo: string }
  | { kind: 'summary' }
  | { kind: 'card'; card: number }
  | { kind: 'prep'; scene: PrepScene; badge: string }
);

/** format: photo(1·2교시 사진), card(안내 카드), prep(약 만들기 그림) */
export type Lesson = {
  id: string;
  title: string;
  format: 'photo' | 'card' | 'prep';
  introTitle: string;
  summaryTitle: string;
  cards: LessonCard[];
  /** 약 만들기 컵 장면 시계 시각(5교시 9시, 6교시 4시) */
  hour: number;
  steps: LessonStep[];
  quiz: LessonQuiz | null;
};

export const foodPhotos: FoodPhoto[] = foodGroups.flatMap((group) =>
  group.photo
    ? [
        {
          id: group.id,
          src: group.photo.src,
          name: group.name,
          alt: group.photo.alt,
          tone: group.tone,
        },
      ]
    : [],
);

export function getPhoto(id: string): FoodPhoto {
  const found = foodPhotos.find((item) => item.id === id);
  if (!found) throw new Error(`사진 수업에 없는 사진: ${id}`);
  return found;
}

/** 강조 단어 색: 괜찮은 말은 초록, 안 되는 말은 빨강 */
export function keyTone(key: string): 'ok' | 'no' {
  return /드셔도|괜찮|잘하셨/.test(key) ? 'ok' : 'no';
}

const keysOf = (word: string): SayKey[] =>
  word ? [{ word, tone: keyTone(word) }] : [];

// 1·2교시 자막에서 강조할 말: 안내문 문장 속 "안 돼요 / 드셔도 돼요 / 괜찮아요"
function keyOf(text: string) {
  return keysOf(
    ['안 돼요', '드셔도 돼요', '괜찮아요'].find((key) => text.includes(key)) ??
      '',
  );
}

export const photoLessons: Lesson[] = videoLessons.map((lesson, index) => {
  const base = {
    id: lesson.id,
    title: lesson.title,
    format: lesson.kind,
    introTitle: '',
    summaryTitle: '',
    cards: [] as LessonCard[],
    hour: 0,
    quiz: lesson.quiz,
  };

  switch (lesson.kind) {
    // 인사 → 사진 있는 음식 하나씩 → 사진 없는 음식은 정리 격자에서 말로 → 정리
    case 'photo': {
      const groups = foodGroups.filter((group) => group.tone === lesson.tone);
      return {
        ...base,
        introTitle: lesson.introTitle,
        summaryTitle: lesson.summaryTitle,
        steps: [
          {
            kind: 'intro',
            id: 'intro',
            text: lesson.intro,
            keys: keysOf(lesson.introKey),
          },
          ...groups.flatMap((group): LessonStep[] =>
            group.photo
              ? [
                  {
                    kind: 'photo',
                    id: group.id,
                    photo: group.id,
                    text: group.say,
                    keys: keyOf(group.say),
                  },
                ]
              : [],
          ),
          ...groups.flatMap((group): LessonStep[] =>
            group.photo
              ? []
              : [
                  {
                    kind: 'summary',
                    id: group.id,
                    text: group.say,
                    keys: keyOf(group.say),
                  },
                ],
          ),
          {
            kind: 'summary',
            id: 'summary',
            text: lesson.summary,
            keys: keysOf(lesson.summaryKey),
          },
        ],
      };
    }
    // 카드마다 말 한두 줄. 첫 줄 장면의 id가 카드 id다.
    case 'card':
      return {
        ...base,
        cards: lesson.cards,
        steps: lesson.cards.flatMap((card, cardIndex) =>
          card.lines.map((line, lineIndex): LessonStep => ({
            kind: 'card',
            id: lineIndex === 0 ? card.id : `${card.id}-${lineIndex + 1}`,
            card: cardIndex,
            text: line.say,
            keys: line.keys,
          })),
        ),
      };
    case 'prep':
      return {
        ...base,
        hour: lesson.hour,
        steps: lesson.steps.map((step, stepIndex): LessonStep => ({
          kind: 'prep',
          id: step.id,
          scene: step.scene,
          badge:
            lesson.badge ??
            `${index + 1}교시 · ${stepIndex + 1}단계 / ${lesson.steps.length} · ${step.name}`,
          text: step.line.say,
          keys: step.line.keys,
        })),
      };
  }
});

/** 카드·사진 수업에 쓰는 모든 사진 파일 */
export const lessonImageSources = [
  ...foodPhotos.map((photo) => photo.src),
  ...photoLessons.flatMap((lesson) =>
    lesson.cards.flatMap((card) =>
      card.items.flatMap((item) => (item.photo ? [item.photo.src] : [])),
    ),
  ),
];
