// 사진 수업의 진행 계산. 화면·음성과 분리해 테스트하기 쉽게 둔다.
// 흐름: 인사 → 사진 → 정리 → 퀴즈 → (틀리면 "다시 볼까요?" → 그 사진 → 퀴즈) → 칭찬 → 다음 교시

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
  /** 퀴즈를 틀려서 사진을 다시 보는 중 */
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
  | { type: 'prev' };

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
          if (state.reviewing || state.step === lesson.steps.length - 1) {
            return {
              ...state,
              mode: 'quiz',
              reviewing: false,
              wrong: null,
              cue: state.cue + 1,
            };
          }
          return goTo(lessons, state, state.lesson, state.step + 1);
        case 'retry': {
          const review = lesson.steps.findIndex(
            (step) =>
              step.kind === 'photo' && step.photo === lesson.quiz.review,
          );
          return goTo(lessons, state, state.lesson, review, {
            reviewing: true,
          });
        }
        case 'praise':
          if (state.lesson + 1 < lessons.length) {
            return goTo(lessons, state, state.lesson + 1, 0);
          }
          return { ...state, mode: 'done', playing: false };
        default:
          return state;
      }

    case 'answer':
      if (state.mode !== 'quiz') return state;
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
  }
}

export function currentStep(lessons: Lesson[], state: LessonState): LessonStep {
  return lessons[state.lesson].steps[state.step];
}

/** 지금 자막(=읽을 말)과 강조할 단어 */
export function getSubtitle(lessons: Lesson[], state: LessonState) {
  const { quiz } = lessons[state.lesson];
  if (!state.started) {
    return { text: '재생을 누르면 수업이 시작돼요.', key: '' };
  }
  switch (state.mode) {
    case 'quiz':
      return { text: quiz.question, key: quiz.key };
    case 'retry':
      return { text: '다시 볼까요?', key: '' };
    case 'praise':
    case 'done':
      return { text: quiz.praise, key: '잘하셨어요' };
    case 'step': {
      const step = currentStep(lessons, state);
      return { text: step.text, key: step.key };
    }
  }
}

/** 강조 단어 색: 괜찮은 말은 초록, 안 되는 말은 빨강 */
export function keyTone(key: string): 'ok' | 'no' {
  return /드셔도|괜찮|잘하셨/.test(key) ? 'ok' : 'no';
}

/** 한 장면을 최소한 보여 주는 시간. 사진은 X·O가 다 그려질 때까지 기다린다. */
export function getMinDuration(lessons: Lesson[], state: LessonState) {
  switch (state.mode) {
    case 'retry':
      return 900;
    case 'praise':
      return 1500;
    case 'step':
      return currentStep(lessons, state).kind === 'photo' ? 3600 : 2400;
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
