// 또박이 수업의 진행 계산. 화면·음성과 분리해 테스트하기 쉽게 둔다.
// 흐름: 장면들 → 퀴즈 → (틀리면 "다시 볼까요?" → 지정한 장면 → 퀴즈) → 칭찬 → 다음 교시
// 퀴즈가 없는 교시는 마지막 장면 뒤 바로 다음 교시로 간다.

import type { KeyTone, SayKey } from '@/lib/demo-guide';

import type { Lesson, LessonStep } from './photo-lesson';

/**
 * step: 장면 설명 중, quiz: 답을 기다림, retry: "다시 볼까요?",
 * praise: 칭찬, done: 수업 끝
 */
export type LessonMode = 'step' | 'quiz' | 'retry' | 'praise' | 'done';

export type LessonState = {
  started: boolean;
  playing: boolean;
  lesson: number;
  step: number;
  mode: LessonMode;
  /** 퀴즈를 틀려서 장면을 다시 보는 중 */
  reviewing: boolean;
  /** 틀린 보기 번호 */
  wrong: number | null;
  /** 진행 막대에 칠할, 가장 멀리 간 장면(전체 번호) */
  reached: number;
  /** 새로 말할 내용이 생길 때마다 늘어나 음성을 새로 시작하게 한다. */
  cue: number;
};

export type LessonAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'lineEnded' }
  | { type: 'answer'; index: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goLesson'; lesson: number };

export const initialLessonState: LessonState = {
  started: false,
  playing: false,
  lesson: 0,
  step: 0,
  mode: 'step',
  reviewing: false,
  wrong: null,
  reached: 0,
  cue: 0,
};

export function totalSteps(lessons: Lesson[]) {
  return lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
}

export function flatIndex(lessons: Lesson[], lesson: number, step: number) {
  return totalSteps(lessons.slice(0, lesson)) + step;
}

function fromFlat(lessons: Lesson[], index: number) {
  if (index < 0) return null;
  let rest = index;
  for (let lesson = 0; lesson < lessons.length; lesson++) {
    if (rest < lessons[lesson].steps.length) return { lesson, step: rest };
    rest -= lessons[lesson].steps.length;
  }
  return null;
}

function goTo(
  lessons: Lesson[],
  state: LessonState,
  lesson: number,
  step: number,
  extra: Partial<LessonState> = {},
): LessonState {
  return {
    ...state,
    lesson,
    step,
    mode: 'step',
    reviewing: false,
    wrong: null,
    reached: Math.max(state.reached, flatIndex(lessons, lesson, step)),
    cue: state.cue + 1,
    ...extra,
  };
}

export function reduceLesson(
  lessons: Lesson[],
  state: LessonState,
  action: LessonAction,
): LessonState {
  const lesson = lessons[state.lesson];

  switch (action.type) {
    case 'play':
      if (!state.started || state.mode === 'done') {
        return {
          ...initialLessonState,
          started: true,
          playing: true,
          cue: state.cue + 1,
        };
      }
      if (state.playing) return state;
      // 일시정지 후에는 지금 말을 처음부터 다시 한다.
      return { ...state, playing: true, cue: state.cue + 1 };

    case 'pause':
      return { ...state, playing: false };

    case 'lineEnded':
      // 멈춘 뒤 늦게 도착한 종료 알림은 무시한다.
      if (!state.playing) return state;
      switch (state.mode) {
        case 'step':
          if (
            lesson.quiz &&
            (state.reviewing || state.step === lesson.steps.length - 1)
          ) {
            return {
              ...state,
              mode: 'quiz',
              reviewing: false,
              wrong: null,
              cue: state.cue + 1,
            };
          }
          if (state.step < lesson.steps.length - 1) {
            return goTo(lessons, state, state.lesson, state.step + 1);
          }
          return nextLesson(lessons, state);
        case 'retry':
          return goTo(lessons, state, state.lesson, reviewStep(lesson), {
            reviewing: true,
          });
        case 'praise':
          return nextLesson(lessons, state);
        default:
          return state;
      }

    case 'answer':
      if (state.mode !== 'quiz' || !lesson.quiz) return state;
      if (action.index === lesson.quiz.answer) {
        return {
          ...state,
          mode: 'praise',
          playing: true,
          wrong: null,
          cue: state.cue + 1,
        };
      }
      return {
        ...state,
        mode: 'retry',
        playing: true,
        wrong: action.index,
        cue: state.cue + 1,
      };

    case 'next':
    case 'prev': {
      const here = flatIndex(lessons, state.lesson, state.step);
      const target = fromFlat(
        lessons,
        action.type === 'next' ? here + 1 : here - 1,
      );
      if (!target) return state;
      return goTo(lessons, state, target.lesson, target.step, {
        started: true,
      });
    }

    case 'goLesson':
      if (!lessons[action.lesson]) return state;
      return goTo(lessons, state, action.lesson, 0, {
        started: true,
        playing: true,
      });
  }
}

function nextLesson(lessons: Lesson[], state: LessonState): LessonState {
  if (state.lesson + 1 < lessons.length) {
    return goTo(lessons, state, state.lesson + 1, 0);
  }
  return { ...state, mode: 'done', playing: false };
}

/** 퀴즈를 틀렸을 때 다시 볼 장면 번호 */
export function reviewStep(lesson: Lesson) {
  return Math.max(
    0,
    lesson.steps.findIndex((step) => step.id === lesson.quiz?.review),
  );
}

export function currentStep(lessons: Lesson[], state: LessonState): LessonStep {
  return lessons[state.lesson].steps[state.step];
}

/**
 * 지금 자막(=읽을 말)과 강조할 말.
 * finish: 마지막 교시를 마쳤을 때 할 말(다음 안내로 가기 / 모든 수업 끝). 없으면 마지막 퀴즈의 칭찬.
 */
export function getSubtitle(
  lessons: Lesson[],
  state: LessonState,
  finish?: string,
): { text: string; keys: SayKey[] } {
  const { quiz } = lessons[state.lesson];
  if (!state.started) {
    return { text: '재생을 누르면 수업이 시작돼요.', keys: [] };
  }
  const praised = { word: '잘하셨어요', tone: 'ok' } as const;
  switch (state.mode) {
    case 'quiz':
      return quiz
        ? { text: quiz.question, keys: [{ word: quiz.key, tone: 'no' }] }
        : { text: '', keys: [] };
    case 'retry':
      return { text: '다시 볼까요?', keys: [] };
    case 'praise':
    case 'done': {
      const last = state.lesson === lessons.length - 1;
      if (last && finish) return { text: finish, keys: [praised] };
      const text = quiz?.praise ?? lessons.at(-1)?.quiz?.praise ?? '';
      return { text, keys: [praised] };
    }
    case 'step': {
      const step = currentStep(lessons, state);
      return { text: step.text, keys: step.keys };
    }
  }
}

/** 자막을 강조할 말과 나머지로 나눈다. 강조할 말은 자막에 처음 나오는 곳 하나만 칠한다. */
export function splitKeys(
  text: string,
  keys: SayKey[],
): { text: string; tone?: KeyTone }[] {
  const found = keys
    .map((key) => ({ ...key, at: text.indexOf(key.word) }))
    .filter((key) => key.word && key.at >= 0)
    .sort((a, b) => a.at - b.at);
  const parts: { text: string; tone?: KeyTone }[] = [];
  let from = 0;
  for (const key of found) {
    if (key.at < from) continue;
    if (key.at > from) parts.push({ text: text.slice(from, key.at) });
    parts.push({ text: key.word, tone: key.tone });
    from = key.at + key.word.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from) });
  return parts;
}

/** 한 장면을 최소한 보여 주는 시간. 사진·카드·약 그림은 표시가 다 그려질 때까지 기다린다. */
export function getMinDuration(lessons: Lesson[], state: LessonState) {
  switch (state.mode) {
    case 'retry':
      return 900;
    case 'praise':
      return 1500;
    case 'step':
      switch (currentStep(lessons, state).kind) {
        case 'photo':
        case 'card':
          return 3600;
        case 'prep':
          return 3200;
        default:
          return 2400;
      }
    default:
      return 0;
  }
}

/** 음성이 없을 때 자막을 넘기는 시간 */
export function getFallbackDuration(text: string, minMs: number) {
  return Math.max(text.length * 280 + 1800, minMs + 800);
}

/** 퀴즈와 수업 끝은 사용자가 누를 때까지 기다린다. */
export function advancesByItself(mode: LessonMode) {
  return mode !== 'quiz' && mode !== 'done';
}
