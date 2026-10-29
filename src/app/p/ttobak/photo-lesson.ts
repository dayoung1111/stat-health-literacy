// 또박이 선생님 사진 수업의 장면 목록. 내용은 src/lib/demo-guide.ts 하나에서 가져온다
// (안내문·티치백과 같은 데이터). 이 파일은 그 내용을 영상 장면 순서로 바꾸기만 한다.
// 사진 속 음식은 화면 왼쪽 33%·위 46% 지점에 있다.

import { foodGroups, videoLessons, type FoodGroup } from '@/lib/demo-guide';

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

/** key: 자막에서 색 배경으로 강조할 단어(자막 안에 그대로 있어야 한다) */
export type LessonStep =
  | { kind: 'intro'; text: string; key: string }
  | { kind: 'photo'; photo: string; text: string; key: string }
  | { kind: 'summary'; text: string; key: string };

export type Lesson = {
  id: string;
  title: string;
  introTitle: string;
  summaryTitle: string;
  steps: LessonStep[];
  quiz: (typeof videoLessons)[number]['quiz'];
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

// 자막에서 강조할 말: 안내문 문장 속 "안 돼요 / 드셔도 돼요 / 괜찮아요"
function keyOf(text: string) {
  return (
    ['안 돼요', '드셔도 돼요', '괜찮아요'].find((key) => text.includes(key)) ??
    ''
  );
}

// 교시마다: 인사 → 사진 있는 음식 하나씩 → 사진 없는 음식은 정리 격자에서 말로 → 정리
export const photoLessons: Lesson[] = videoLessons.map((lesson) => {
  const groups = foodGroups.filter((group) => group.tone === lesson.tone);
  return {
    id: lesson.id,
    title: lesson.title,
    introTitle: lesson.introTitle,
    summaryTitle: lesson.summaryTitle,
    quiz: lesson.quiz,
    steps: [
      { kind: 'intro', text: lesson.intro, key: lesson.introKey },
      ...groups.flatMap((group): LessonStep[] =>
        group.photo
          ? [
              {
                kind: 'photo',
                photo: group.id,
                text: group.say,
                key: keyOf(group.say),
              },
            ]
          : [],
      ),
      ...groups.flatMap((group): LessonStep[] =>
        group.photo
          ? []
          : [{ kind: 'summary', text: group.say, key: keyOf(group.say) }],
      ),
      { kind: 'summary', text: lesson.summary, key: lesson.summaryKey },
    ],
  };
});
