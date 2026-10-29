// 사진 수업의 진행 계산. 화면·음성과 분리해 테스트하기 쉽게 둔다.
// 흐름: 장면 → 퀴즈 → (틀리면 "다시 볼까요?" → 그 장면 → 같은 퀴즈) → 칭찬 → 다음 퀴즈 또는 다음 교시
// 대장내시경: 인사 → 사진 → 정리 → 퀴즈 1개 → 칭찬 → 2교시
// 검진 전날 준비: 장면 6개(자막 한 줄씩) → 깜짝 퀴즈 2개 → "참 잘했어요!" → 멈춤

import { text, type TextId } from '@/lib/i18n';

import type { Lesson, LessonStep, SubtitlePart } from './photo-lesson';

/**
 * step: 장면 설명 중, quiz: 답을 기다림, retry: "다시 볼까요?",
 * praise: 칭찬, finish: 퀴즈를 다 맞힌 뒤 마지막 말, done: 수업 끝
 */
export type LessonMode =
  'step' | 'quiz' | 'retry' | 'praise' | 'finish' | 'done';

export type LessonState = {
  started: boolean;
  playing: boolean;
  lesson: number;
  step: number;
  mode: LessonMode;
  /** 지금 교시의 몇 번째 퀴즈인지 */
  quiz: number;
  /** 퀴즈를 틀려서 장면을 다시 보는 중. reviewEnd 장면까지 보고 같은 퀴즈로 돌아간다. */
  reviewing: boolean;
  reviewEnd: number;
  /** 틀린 보기 번호 */
  wrong: number | null;
  /** 진행 막대에 칠할, 가장 멀리 간 장면(전체 번호) */
  reached: number;
  /** 끝까지 말한 장면 중 가장 먼 것(전체 번호). "이번 시간에 배운 것"에 쓴다. */
  finished: number;
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
  /** 오른쪽 목록에서 교시·장면을 골라 바로 재생 */
  | { type: 'jump'; lesson: number; step: number };

export const initialLessonState: LessonState = {
  started: false,
  playing: false,
  lesson: 0,
  step: 0,
  mode: 'step',
  quiz: 0,
  reviewing: false,
  reviewEnd: 0,
  wrong: null,
  reached: 0,
  finished: -1,
  cue: 0,
};

/** 아직 재생하지 않은 상태로 원하는 교시에서 시작 */
export function startAt(lessons: Lesson[], lesson: number): LessonState {
  const at = lesson >= 0 && lesson < lessons.length ? lesson : 0;
  return {
    ...initialLessonState,
    lesson: at,
    reached: flatIndex(lessons, at, 0),
    finished: flatIndex(lessons, at, 0) - 1,
  };
}

export function totalSteps(lessons: Lesson[]) {
  return lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
}

export function flatIndex(lessons: Lesson[], lesson: number, step: number) {
  return totalSteps(lessons.slice(0, lesson)) + step;
}

/** 같은 group(이어서 재생하는 교시 묶음)의 첫 교시와 마지막 교시 */
export function groupRange(lessons: Lesson[], lesson: number) {
  const { group } = lessons[lesson];
  let first = lesson;
  let last = lesson;
  while (first > 0 && lessons[first - 1].group === group) first--;
  while (last + 1 < lessons.length && lessons[last + 1].group === group) last++;
  return { first, last };
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
  const target = flatIndex(lessons, lesson, step);
  // 다른 수업 묶음으로 가면 진행 막대·배운 것을 그 수업 기준으로 새로 센다.
  const sameGroup = lessons[lesson].group === lessons[state.lesson].group;
  return {
    ...state,
    lesson,
    step,
    mode: 'step',
    quiz: 0,
    reviewing: false,
    wrong: null,
    reached: sameGroup ? Math.max(state.reached, target) : target,
    finished: sameGroup ? state.finished : target - 1,
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
  const quiz = lesson.quizzes[state.quiz];

  // 다음 교시가 같은 묶음이면 이어서, 아니면 수업 끝
  const nextOrDone = (): LessonState =>
    state.lesson < groupRange(lessons, state.lesson).last
      ? goTo(lessons, state, state.lesson + 1, 0)
      : { ...state, mode: 'done', playing: false };

  switch (action.type) {
    case 'play':
      if (!state.started || state.mode === 'done') {
        const first = state.started
          ? groupRange(lessons, state.lesson).first
          : state.lesson;
        return {
          ...startAt(lessons, first),
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
        case 'step': {
          const finished = Math.max(
            state.finished,
            flatIndex(lessons, state.lesson, state.step),
          );
          const toQuiz = state.reviewing
            ? state.step >= state.reviewEnd
            : state.step === lesson.steps.length - 1;
          if (toQuiz) {
            return {
              ...state,
              finished,
              mode: 'quiz',
              reviewing: false,
              wrong: null,
              cue: state.cue + 1,
            };
          }
          return goTo(lessons, state, state.lesson, state.step + 1, {
            finished,
            quiz: state.quiz,
            reviewing: state.reviewing,
          });
        }
        case 'retry':
          return goTo(lessons, state, state.lesson, quiz.review.from, {
            quiz: state.quiz,
            reviewing: true,
            reviewEnd: quiz.review.to,
          });
        case 'praise':
          if (state.quiz + 1 < lesson.quizzes.length) {
            return {
              ...state,
              mode: 'quiz',
              quiz: state.quiz + 1,
              wrong: null,
              cue: state.cue + 1,
            };
          }
          if (lesson.finish) {
            return { ...state, mode: 'finish', cue: state.cue + 1 };
          }
          return nextOrDone();
        case 'finish':
          return nextOrDone();
        default:
          return state;
      }

    case 'answer':
      if (state.mode !== 'quiz') return state;
      if (action.index === quiz.answer) {
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

    case 'jump':
      return goTo(lessons, state, action.lesson, action.step, {
        started: true,
        playing: true,
      });
  }
}

export function currentStep(lessons: Lesson[], state: LessonState): LessonStep {
  return lessons[state.lesson].steps[state.step];
}

/**
 * 지금 자막(=읽을 말)과 강조할 단어. 자막은 한국어 원문이고, 화면이 고른 언어로 바꾼다.
 * id: 수업 내용이 아닌 안내 문장(locales/ko.json·en.json)
 * parts: 장면 수업처럼 여러 말을 색칠하는 자막, note: 자막 아래 작은 글씨
 */
export type Subtitle = {
  text: string;
  key: string;
  id?: TextId;
  parts?: SubtitlePart[];
  note?: string;
};

export function getSubtitle(lessons: Lesson[], state: LessonState): Subtitle {
  const lesson = lessons[state.lesson];
  const quiz = lesson.quizzes[state.quiz];
  if (!state.started) {
    return { text: text('ko', 'lesson.start'), key: '', id: 'lesson.start' };
  }
  switch (state.mode) {
    case 'quiz':
      return { text: quiz.question, key: quiz.key };
    case 'retry':
      return lesson.retry
        ? { text: lesson.retry, key: '' }
        : { text: text('ko', 'lesson.retry'), key: '', id: 'lesson.retry' };
    case 'praise':
      return { text: quiz.praise, key: quiz.praiseKey };
    case 'finish':
    case 'done':
      return lesson.finish
        ? { text: lesson.finish.text, key: '', parts: lesson.finish.parts }
        : { text: quiz.praise, key: quiz.praiseKey };
    case 'step': {
      const step = currentStep(lessons, state);
      if (step.kind !== 'scene') return { text: step.text, key: step.key };
      const line = lesson.scenes?.[step.scene].lines[step.line];
      return { text: step.text, key: '', parts: step.parts, note: line?.note };
    }
  }
}

/** 강조 단어 색: 괜찮은 말은 초록, 안 되는 말은 빨강(한국어 원문 단어로 정한다) */
export function keyTone(key: string): 'ok' | 'no' {
  return /드셔도|괜찮|잘하셨/.test(key) ? 'ok' : 'no';
}

/** 한 장면을 최소한 보여 주는 시간. 사진은 X·O가 다 그려질 때까지 기다린다. */
export function getMinDuration(lessons: Lesson[], state: LessonState) {
  switch (state.mode) {
    case 'retry':
      return 900;
    case 'praise':
    case 'finish':
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
