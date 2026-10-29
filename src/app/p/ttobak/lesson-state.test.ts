import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  getFallbackDuration,
  getSubtitle,
  initialLessonState,
  reduceLesson,
  reviewStep,
  splitKeys,
  totalSteps,
  type LessonAction,
  type LessonState,
} from './lesson-state';
import {
  getPhoto,
  keyTone,
  lessonImageSources,
  photoLessons,
} from './photo-lesson';

const lessons = photoLessons;
const reduce = (state: LessonState, ...actions: LessonAction[]) =>
  actions.reduce(
    (current, action) => reduceLesson(lessons, current, action),
    state,
  );
const ended = { type: 'lineEnded' } as const;
const repeat = (action: LessonAction, count: number) =>
  Array.from({ length: count }, () => action);

// 1교시 마지막 장면(정리)까지 진행한 상태
const playToQuiz = () =>
  reduce(
    initialLessonState,
    { type: 'play' },
    ...repeat(ended, lessons[0].steps.length),
  );
const indexOf = (id: string) => lessons.findIndex((item) => item.id === id);
// 그 교시 처음부터 퀴즈까지
const quizOf = (lesson: number) =>
  reduce(
    initialLessonState,
    { type: 'play' },
    { type: 'goLesson', lesson },
    ...repeat(ended, lessons[lesson].steps.length),
  );

describe('수업 진행', () => {
  it('재생하면 1교시 인사부터 시작한다', () => {
    const state = reduce(initialLessonState, { type: 'play' });
    assert.deepEqual(
      [state.started, state.playing, state.lesson, state.step, state.mode],
      [true, true, 0, 0, 'step'],
    );
  });

  it('정리 장면이 끝나면 퀴즈를 내고, 답을 누를 때까지 기다린다', () => {
    const quiz = playToQuiz();
    assert.equal(quiz.mode, 'quiz');
    assert.equal(getSubtitle(lessons, quiz).text, '김치는 먹어도 될까요?');
    assert.equal(reduce(quiz, ended), quiz);
  });

  it('틀리면 "다시 볼까요?" → 김치 장면 → 다시 퀴즈', () => {
    const retry = reduce(playToQuiz(), { type: 'answer', index: 0 });
    assert.equal(retry.mode, 'retry');
    assert.equal(retry.wrong, 0);
    const review = reduce(retry, ended);
    const step = lessons[0].steps[review.step];
    assert.ok(step.kind === 'photo' && step.photo === 'kimchi');
    assert.equal(review.reviewing, true);
    assert.equal(reduce(review, ended).mode, 'quiz');
  });

  it('맞히면 칭찬 후 2교시로 넘어간다', () => {
    const praise = reduce(playToQuiz(), { type: 'answer', index: 1 });
    assert.equal(praise.mode, 'praise');
    assert.equal(
      getSubtitle(lessons, praise).text,
      '잘하셨어요! 이제 드셔도 되는 음식을 배워요.',
    );
    const next = reduce(praise, ended);
    assert.deepEqual([next.lesson, next.step, next.mode], [1, 0, 'step']);
  });

  it('2교시 퀴즈를 맞히면 "잘하셨어요!" 후 3교시로 넘어간다', () => {
    const lesson2 = reduce(playToQuiz(), { type: 'answer', index: 1 }, ended);
    const quiz2 = reduce(lesson2, ...repeat(ended, lessons[1].steps.length));
    assert.equal(quiz2.mode, 'quiz');
    const praise = reduce(quiz2, { type: 'answer', index: 0 });
    assert.equal(getSubtitle(lessons, praise).text, '잘하셨어요!');
    assert.deepEqual(reduce(praise, ended).lesson, 2);
  });

  it('1~8교시이고, 4교시는 퀴즈 없이 바로 5교시로 간다', () => {
    assert.equal(lessons.length, 8);
    const four = indexOf('stool-test');
    assert.equal(four, 3);
    const after = quizOf(four);
    assert.deepEqual([after.lesson, after.step, after.mode], [4, 0, 'step']);
  });

  it('5교시를 틀리면 컵 장면을 다시 보고 퀴즈로 돌아온다', () => {
    const five = indexOf('prep-first');
    const quiz = quizOf(five);
    assert.equal(quiz.mode, 'quiz');
    const review = reduce(quiz, { type: 'answer', index: 0 }, ended);
    assert.equal(lessons[five].steps[review.step].id, 'cups');
    assert.equal(reduce(review, ended).mode, 'quiz');
  });

  it('8교시를 맞히면 수업 끝, 다시 재생하면 처음부터', () => {
    const last = lessons.length - 1;
    const praise = reduce(quizOf(last), { type: 'answer', index: 1 });
    assert.equal(
      getSubtitle(lessons, praise).text,
      '대장내시경 준비 수업 끝! 정말 잘하셨어요.',
    );
    const done = reduce(praise, ended);
    assert.deepEqual([done.mode, done.playing], ['done', false]);
    const again = reduce(done, { type: 'play' });
    assert.deepEqual([again.lesson, again.step, again.reached], [0, 0, 0]);
  });

  it('수업 목록을 누르면 그 교시 처음으로 바로 간다', () => {
    const state = reduce(initialLessonState, { type: 'goLesson', lesson: 6 });
    assert.deepEqual(
      [state.started, state.playing, state.lesson, state.step, state.mode],
      [true, true, 6, 0, 'step'],
    );
  });

  it('일시정지 뒤 늦게 온 종료 알림으로는 넘어가지 않는다', () => {
    const paused = reduce(
      initialLessonState,
      { type: 'play' },
      { type: 'pause' },
    );
    assert.equal(reduce(paused, ended), paused);
  });

  it('이전·다음은 끝에서 멈추고, 교시를 넘어 이동한다', () => {
    const start = reduce(initialLessonState, { type: 'play' });
    assert.equal(reduce(start, { type: 'prev' }), start);
    const into2 = reduce(
      start,
      ...repeat({ type: 'next' }, lessons[0].steps.length),
    );
    assert.deepEqual([into2.lesson, into2.step], [1, 0]);
    const end = reduce(
      start,
      ...repeat({ type: 'next' }, totalSteps(lessons) + 3),
    );
    const last = lessons.length - 1;
    assert.deepEqual(
      [end.lesson, end.step],
      [last, lessons[last].steps.length - 1],
    );
  });
});

describe('자막', () => {
  it('강조 단어 색: 안 돼요는 빨강, 괜찮아요·드셔도 돼요는 초록', () => {
    assert.equal(keyTone('안 돼요'), 'no');
    assert.equal(keyTone('드셔도 돼요'), 'ok');
    assert.equal(keyTone('괜찮아요'), 'ok');
  });

  it('한 자막에 빨강·노랑 강조를 함께 칠한다', () => {
    const parts = splitKeys('먹으면 안 돼요. 안내 시간대로 드세요.', [
      { word: '안내 시간대로', tone: 'care' },
      { word: '안 돼요', tone: 'no' },
    ]);
    assert.deepEqual(
      parts.map((part) => [part.text, part.tone]),
      [
        ['먹으면 ', undefined],
        ['안 돼요', 'no'],
        ['. ', undefined],
        ['안내 시간대로', 'care'],
        [' 드세요.', undefined],
      ],
    );
  });

  it('음성이 없을 때도 최소 시간 이상 보여 준다', () => {
    assert.ok(getFallbackDuration('안녕', 3600) >= 3600);
  });
});

describe('수업 데이터', () => {
  it('사진 파일이 모두 public 폴더에 있다', () => {
    for (const src of lessonImageSources) {
      assert.ok(existsSync(join(process.cwd(), 'public', src)), `${src} 없음`);
    }
  });

  for (const lesson of lessons) {
    it(`${lesson.title}: 강조 단어·사진·퀴즈가 올바르다`, () => {
      assert.ok(lesson.steps.length > 0);
      for (const step of lesson.steps) {
        for (const key of step.keys) {
          assert.ok(
            step.text.includes(key.word),
            `"${step.text}"에 "${key.word}" 없음`,
          );
        }
        if (step.kind === 'photo') getPhoto(step.photo);
      }
      if (lesson.format === 'photo') {
        assert.equal(lesson.steps[0].kind, 'intro');
        assert.equal(lesson.steps.at(-1)?.kind, 'summary');
      }
      const { quiz } = lesson;
      if (!quiz) return;
      assert.ok(quiz.question.includes(quiz.key));
      assert.ok(quiz.answer < quiz.options.length);
      assert.equal(
        lesson.steps[reviewStep(lesson)].id,
        quiz.review,
        '틀렸을 때 다시 볼 장면이 이 교시에 있어야 한다',
      );
    });
  }
});
