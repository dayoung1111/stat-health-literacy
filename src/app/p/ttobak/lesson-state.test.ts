import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  getFallbackDuration,
  getSubtitle,
  initialLessonState,
  keyTone,
  reduceLesson,
  totalSteps,
  type LessonAction,
  type LessonState,
} from './lesson-state';
import { foodPhotos, getPhoto, photoLessons } from './photo-lesson';

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

  it('2교시 퀴즈를 맞히면 수업이 끝나고, 다시 재생하면 처음부터', () => {
    const lesson2 = reduce(playToQuiz(), { type: 'answer', index: 1 }, ended);
    const quiz2 = reduce(lesson2, ...repeat(ended, lessons[1].steps.length));
    assert.equal(quiz2.mode, 'quiz');
    const done = reduce(quiz2, { type: 'answer', index: 0 }, ended);
    assert.deepEqual([done.mode, done.playing], ['done', false]);
    const again = reduce(done, { type: 'play' });
    assert.deepEqual([again.lesson, again.step, again.reached], [0, 0, 0]);
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
    assert.deepEqual([end.lesson, end.step], [1, lessons[1].steps.length - 1]);
  });
});

describe('자막', () => {
  it('강조 단어 색: 안 돼요는 빨강, 괜찮아요·드셔도 돼요는 초록', () => {
    assert.equal(keyTone('안 돼요'), 'no');
    assert.equal(keyTone('드셔도 돼요'), 'ok');
    assert.equal(keyTone('괜찮아요'), 'ok');
  });

  it('음성이 없을 때도 최소 시간 이상 보여 준다', () => {
    assert.ok(getFallbackDuration('안녕', 3600) >= 3600);
  });
});

describe('수업 데이터', () => {
  it('사진 파일이 모두 public 폴더에 있다', () => {
    for (const photo of foodPhotos) {
      assert.ok(
        existsSync(join(process.cwd(), 'public', photo.src)),
        `${photo.src} 없음`,
      );
    }
  });

  for (const lesson of lessons) {
    it(`${lesson.title}: 강조 단어·사진·퀴즈가 올바르다`, () => {
      for (const step of lesson.steps) {
        assert.ok(
          step.text.includes(step.key),
          `"${step.text}"에 "${step.key}" 없음`,
        );
        if (step.kind === 'photo') getPhoto(step.photo);
      }
      assert.ok(lesson.quiz.question.includes(lesson.quiz.key));
      assert.ok(lesson.quiz.answer < lesson.quiz.options.length);
      assert.ok(
        lesson.steps.some(
          (step) => step.kind === 'photo' && step.photo === lesson.quiz.review,
        ),
        '틀렸을 때 다시 볼 사진이 이 교시에 있어야 한다',
      );
      assert.equal(lesson.steps[0].kind, 'intro');
      assert.equal(lesson.steps.at(-1)?.kind, 'summary');
    });
  }
});
