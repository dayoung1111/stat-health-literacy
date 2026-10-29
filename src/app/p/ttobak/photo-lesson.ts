// 또박이 선생님 사진 수업의 장면 목록. 이 파일은 수업 내용을 영상 장면 순서로 바꾸기만 한다.
// - 대장내시경(사진 수업): src/lib/demo-guide.ts (안내문·티치백과 같은 데이터). 사진 속 음식은 화면 왼쪽 33%·위 46% 지점에 있다.
// - 기본 검진 "검진 전날 준비"(장면 수업): src/lib/basic-checkup-guide.ts. 한 장면에 접시 그림 1~4개.

import {
  dayBeforeLesson,
  type Scene,
  type ScenePose,
} from '@/lib/basic-checkup-guide';
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

/** 장면 수업 자막 조각. tone: r 빨강(하면 안 되는 것), g 초록(해도 되는 것), k 청록(시간·숫자 등) */
export type SubtitlePart = { text: string; tone?: 'r' | 'g' | 'k' };

/** key: 자막에서 색 배경으로 강조할 단어(자막 안에 그대로 있어야 한다) */
export type LessonStep =
  | { kind: 'intro'; text: string; key: string }
  | { kind: 'photo'; photo: string; text: string; key: string }
  | { kind: 'summary'; text: string; key: string }
  /** 장면 수업의 자막 한 줄. scene·line은 lesson.scenes 안의 번호 */
  | {
      kind: 'scene';
      scene: number;
      line: number;
      text: string;
      key: '';
      parts: SubtitlePart[];
    };

export type LessonQuiz = {
  question: string;
  key: string;
  options: [string, string];
  answer: number;
  /** 틀리면 다시 볼 장면(step 번호, from부터 to까지) */
  review: { from: number; to: number };
  /** 맞혔을 때 또박이 말과 강조 단어 */
  praise: string;
  praiseKey: string;
};

export type Lesson = {
  id: string;
  title: string;
  /** 같은 group의 교시끼리만 이어서 재생한다. 다 끝나면 멈춘다. */
  group: string;
  introTitle: string;
  summaryTitle: string;
  steps: LessonStep[];
  /** 교시 끝 퀴즈. 차례로 낸다. */
  quizzes: LessonQuiz[];
  /** 장면 수업에만 있는 내용 */
  scenes?: Scene[];
  start?: { title: string; sub: string };
  quizTag?: string;
  /** 틀렸을 때 또박이 말(없으면 "다시 볼까요?") */
  retry?: string;
  /** 퀴즈를 다 맞힌 뒤 마지막 말 */
  finish?: { title: string; text: string; parts: SubtitlePart[] };
  learnedEmpty?: string;
};

export type { Scene, ScenePose };

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
  const steps: LessonStep[] = [
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
  ];
  // 틀리면 그 음식 사진 한 장면만 다시 본다.
  const review = steps.findIndex(
    (step) => step.kind === 'photo' && step.photo === lesson.quiz.review,
  );
  return {
    id: lesson.id,
    title: lesson.title,
    group: 'colonoscopy',
    introTitle: lesson.introTitle,
    summaryTitle: lesson.summaryTitle,
    steps,
    quizzes: [
      {
        question: lesson.quiz.question,
        key: lesson.quiz.key,
        options: lesson.quiz.options,
        answer: lesson.quiz.answer,
        review: { from: review, to: review },
        praise: lesson.quiz.praise,
        praiseKey: '잘하셨어요',
      },
    ],
  };
});

/** "<r>기름진 음식</r>은 피하세요." → 색칠한 조각들 */
export function parseParts(marked: string): SubtitlePart[] {
  return marked
    .split(/(<[rgk]>.*?<\/[rgk]>)/)
    .filter(Boolean)
    .map((piece) => {
      const found = piece.match(/^<([rgk])>(.*)<\/\1>$/);
      return found
        ? { text: found[2], tone: found[1] as SubtitlePart['tone'] }
        : { text: piece };
    });
}

const plain = (parts: SubtitlePart[]) => parts.map((p) => p.text).join('');

// 장면 수업: 장면마다 자막 줄을 하나씩 장면(step)으로 만든다. 틀리면 그 장면 전체를 다시 본다.
function sceneLesson(lesson: typeof dayBeforeLesson): Lesson {
  const steps: LessonStep[] = lesson.scenes.flatMap((scene, s) =>
    scene.lines.map((line, l) => {
      const parts = parseParts(line.text);
      return {
        kind: 'scene' as const,
        scene: s,
        line: l,
        text: plain(parts),
        key: '' as const,
        parts,
      };
    }),
  );
  const sceneRange = (scene: number) => ({
    from: steps.findIndex((s) => s.kind === 'scene' && s.scene === scene),
    to: steps.findLastIndex((s) => s.kind === 'scene' && s.scene === scene),
  });
  const finish = parseParts(lesson.finish);
  return {
    id: lesson.id,
    title: lesson.title,
    group: lesson.id,
    introTitle: '',
    summaryTitle: '',
    steps,
    scenes: lesson.scenes,
    quizzes: lesson.quizzes.map((quiz) => ({
      question: quiz.question,
      key: '',
      options: quiz.options,
      answer: quiz.answer,
      review: sceneRange(quiz.back),
      praise: quiz.ok,
      praiseKey: '',
    })),
    start: { title: lesson.startTitle, sub: lesson.startSub },
    quizTag: lesson.quizTag,
    retry: lesson.retry,
    finish: { title: lesson.finishTitle, text: plain(finish), parts: finish },
    learnedEmpty: lesson.learnedEmpty,
  };
}

export const dayBeforeLessons: Lesson[] = [sceneLesson(dayBeforeLesson)];

/** 영상 화면(/p/[code]/video)의 수업 목록. 검진 전날 준비가 대장내시경보다 앞이다. */
export const allLessons: Lesson[] = [...dayBeforeLessons, ...photoLessons];

/** 장면 수업에서 이 step까지 나타난 그림과 그려진 표시 */
export function sceneState(scene: Scene, line: number) {
  const shown = new Set<number>();
  const marks = new Map<number, 'x' | 'o'>();
  scene.lines.slice(0, line + 1).forEach((item) => {
    item.show?.forEach((index) => shown.add(index));
    Object.entries(item.mark ?? {}).forEach(([index, mark]) => {
      if (mark) marks.set(Number(index), mark);
    });
  });
  const pose: ScenePose = scene.lines[line]?.pose ?? scene.pose;
  return { shown, marks, pose };
}
