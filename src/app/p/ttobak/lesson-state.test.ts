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
import {
  allLessons,
  dayBeforeLessons,
  foodPhotos,
  getPhoto,
  photoLessons,
  type Lesson,
} from './photo-lesson';
import { startAt } from './lesson-state';

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
      assert.equal(lesson.quizzes.length, 1);
      const [quiz] = lesson.quizzes;
      assert.ok(quiz.question.includes(quiz.key));
      assert.ok(quiz.answer < quiz.options.length);
      assert.equal(
        lesson.steps[quiz.review.from]?.kind,
        'photo',
        '틀렸을 때 다시 볼 사진이 이 교시에 있어야 한다',
      );
      assert.equal(lesson.steps[0].kind, 'intro');
      assert.equal(lesson.steps.at(-1)?.kind, 'summary');
    });
  }
});

describe('검진 전날 준비(장면 수업)', () => {
  const [day] = dayBeforeLessons;
  const run = (
    list: Lesson[],
    state: LessonState,
    ...actions: LessonAction[]
  ) =>
    actions.reduce(
      (current, action) => reduceLesson(list, current, action),
      state,
    );
  const sceneOf = (state: LessonState) => {
    const step = day.steps[state.step];
    return step.kind === 'scene' ? step.scene : -1;
  };
  // 처음부터 장면 6개 자막을 모두 듣고 깜짝 퀴즈 1번까지
  const toQuiz1 = () =>
    run(
      dayBeforeLessons,
      initialLessonState,
      { type: 'play' },
      ...repeat(ended, day.steps.length),
    );

  it('시안의 자막·그림 이름표·배운 것·퀴즈를 글자 그대로 쓴다', () => {
    assert.deepEqual(
      day.steps.map((step) => step.text),
      [
        '안녕하세요, 저는 또박이예요.',
        '검진 전날 지킬 일 다섯 가지를 알려 드릴게요.',
        '전날 저녁은 가볍고 소화가 잘 되는 음식으로 드세요.',
        '기름진 음식은 피하세요.',
        '피 검사와 배 초음파 결과가 달라질 수 있어요.',
        '밤 9시부터는 아무것도 드시면 안 돼요.',
        '물도 마시지 않아요.',
        '껌, 사탕, 담배도 안 돼요.',
        '적어도 8시간은 속을 비워야 해요.',
        '술은 검진 2~3일 전부터 피하는 것이 좋아요.',
        '간 검사 수치와 피 속 기름 수치가 올라갈 수 있어요.',
        '전날에는 힘든 운동을 하지 마세요.',
        '근육 검사 수치나 소변 검사 결과가 달라질 수 있어요.',
        '전날 밤에는 일찍 누워 잠을 충분히 자 두세요.',
        '잠이 부족하면 혈압이 높게 나올 수 있어요.',
        '다섯 가지 모두 배웠어요! 이제 퀴즈를 풀어 볼까요?',
      ],
    );
    assert.equal(
      day.scenes?.[1].lines[2].note,
      '피 속 기름(중성지방) 수치가 높게 나올 수 있어요',
    );
    assert.deepEqual(
      day.scenes?.flatMap((scene) => scene.items.map((item) => item.label)),
      [
        '부드러운 죽',
        '맑은 국',
        '기름진 음식',
        '밤 9시',
        '물',
        '껌',
        '담배',
        '맥주',
        '소주',
        '와인',
        '무거운 운동',
        '오래 달리기',
        '일찍, 푹 자기',
      ],
    );
    assert.deepEqual(
      day.scenes?.flatMap((scene) => (scene.learned ? [scene.learned] : [])),
      [
        '저녁은 가볍고 소화가 잘 되는 음식',
        '밤 9시부터 금식 (물·껌·사탕·담배도 안 돼요)',
        '검진 2~3일 전부터 술 피하기',
        '전날 격한 운동은 쉬기',
        '일찍 누워 충분히 자기 (혈압에 영향)',
      ],
    );
    assert.deepEqual(
      day.quizzes.map((quiz) => [quiz.question, quiz.options, quiz.answer]),
      [
        [
          '밤 9시가 넘었어요. 목이 마르면 물을 마셔도 될까요?',
          ['마셔도 돼요', '안 돼요'],
          1,
        ],
        [
          '술은 언제부터 피하면 좋을까요?',
          ['검진 당일 아침', '검진 2~3일 전'],
          1,
        ],
      ],
    );
    assert.equal(
      day.finish?.text,
      '참 잘했어요! 검진 전날 준비를 모두 배웠어요.',
    );
  });

  it('사진 파일이 모두 있고, 그림 번호가 장면 그림 안에 있다', () => {
    for (const scene of day.scenes ?? []) {
      for (const item of scene.items) {
        if (!('photo' in item)) continue;
        assert.ok(item.photo.alt, `${item.label} 대체 글 없음`);
        assert.ok(
          existsSync(join(process.cwd(), 'public', item.photo.src)),
          `${item.photo.src} 없음`,
        );
      }
      for (const line of scene.lines) {
        const used = [
          ...(line.show ?? []),
          ...Object.keys(line.mark ?? {}).map(Number),
        ];
        for (const index of used) assert.ok(index < scene.items.length);
      }
    }
  });

  it('장면 6개를 다 들으면 깜짝 퀴즈 1번을 낸다', () => {
    const quiz = toQuiz1();
    assert.deepEqual([quiz.mode, quiz.quiz], ['quiz', 0]);
    assert.equal(
      getSubtitle(dayBeforeLessons, quiz).text,
      '밤 9시가 넘었어요. 목이 마르면 물을 마셔도 될까요?',
    );
  });

  it('1번을 틀리면 장면 3(밤 9시 금식) 전체를 다시 보고 같은 1번으로 돌아온다', () => {
    const retry = run(dayBeforeLessons, toQuiz1(), {
      type: 'answer',
      index: 0,
    });
    assert.equal(retry.mode, 'retry');
    assert.equal(
      getSubtitle(dayBeforeLessons, retry).text,
      '괜찮아요. 그 장면을 한 번 더 볼게요.',
    );
    let review = run(dayBeforeLessons, retry, ended);
    const lines: number[] = [];
    while (review.mode === 'step') {
      assert.equal(sceneOf(review), 2);
      lines.push(review.step);
      review = run(dayBeforeLessons, review, ended);
    }
    assert.equal(lines.length, 4, '장면 3의 자막 4줄을 모두 본다');
    assert.deepEqual([review.mode, review.quiz], ['quiz', 0]);
  });

  it('2번을 틀리면 장면 4(술 피하기)를 보고 같은 2번으로, 다 맞히면 "참 잘했어요" 후 멈춘다', () => {
    const quiz2 = run(
      dayBeforeLessons,
      toQuiz1(),
      { type: 'answer', index: 1 },
      ended,
    );
    assert.deepEqual([quiz2.mode, quiz2.quiz], ['quiz', 1]);
    const review = run(
      dayBeforeLessons,
      quiz2,
      { type: 'answer', index: 0 },
      ended,
    );
    assert.equal(sceneOf(review), 3);
    const back = run(dayBeforeLessons, review, ended, ended);
    assert.deepEqual([back.mode, back.quiz], ['quiz', 1]);
    const finish = run(
      dayBeforeLessons,
      back,
      { type: 'answer', index: 1 },
      ended,
    );
    assert.equal(finish.mode, 'finish');
    assert.equal(
      getSubtitle(dayBeforeLessons, finish).text,
      '참 잘했어요! 검진 전날 준비를 모두 배웠어요.',
    );
    const done = run(dayBeforeLessons, finish, ended);
    assert.deepEqual([done.mode, done.playing], ['done', false]);
  });

  it('영상 화면 목록에서도 검진 전날 준비가 끝나면 대장내시경으로 넘어가지 않는다', () => {
    assert.equal(allLessons[0].id, day.id);
    const end = run(
      allLessons,
      startAt(allLessons, 0),
      { type: 'play' },
      ...repeat(ended, day.steps.length),
      { type: 'answer', index: 1 },
      ended,
      { type: 'answer', index: 1 },
      ended,
      ended,
    );
    assert.deepEqual([end.lesson, end.mode], [0, 'done']);
  });

  it('대장내시경부터 시작하면 지금처럼 1·2교시가 이어지고, 다시 재생하면 1교시부터', () => {
    const colon = allLessons.findIndex(
      (lesson) => lesson.group === 'colonoscopy',
    );
    const start = run(allLessons, startAt(allLessons, colon), { type: 'play' });
    assert.deepEqual([start.lesson, start.step], [colon, 0]);
    const lesson2 = run(
      allLessons,
      start,
      ...repeat(ended, allLessons[colon].steps.length),
      { type: 'answer', index: 1 },
      ended,
    );
    assert.deepEqual([lesson2.lesson, lesson2.step], [colon + 1, 0]);
    const done = run(
      allLessons,
      lesson2,
      ...repeat(ended, allLessons[colon + 1].steps.length),
      { type: 'answer', index: 0 },
      ended,
    );
    assert.equal(done.mode, 'done');
    assert.equal(run(allLessons, done, { type: 'play' }).lesson, colon);
  });
});
