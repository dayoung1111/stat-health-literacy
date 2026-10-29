import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { demoGuide, guideSteps, videoScenes } from '../../../lib/demo-guide';
import {
  getLineDuration,
  initialPlayerState,
  LINE_GAP_MS,
  MIN_LINE_MS,
  MS_PER_CHAR,
  reducePlayer,
  type PlayerAction,
  type PlayerState,
} from './player-state';

// 장면 2개(2줄, 1줄)짜리 시험용 대본
const scenes = [{ lines: ['가', '나'] }, { lines: ['다'] }];
const reduce = (state: PlayerState, action: PlayerAction) =>
  reducePlayer(scenes, state, action);
const playing: PlayerState = {
  ...initialPlayerState,
  status: 'playing',
  cue: 1,
};

describe('자막 표시 시간', () => {
  it('짧은 자막도 최소 시간만큼 보여 준다', () => {
    assert.equal(getLineDuration('안녕'), MIN_LINE_MS + LINE_GAP_MS);
  });

  it('긴 자막은 글자 수에 맞춰 길어지고 띄어쓰기는 세지 않는다', () => {
    const text = '가'.repeat(20);
    assert.equal(getLineDuration(text), 20 * MS_PER_CHAR + LINE_GAP_MS);
    assert.equal(
      getLineDuration(text.split('').join(' ')),
      getLineDuration(text),
    );
  });
});

describe('재생 상태', () => {
  it('처음 재생하면 첫 장면 첫 줄부터 시작한다', () => {
    assert.deepEqual(reduce(initialPlayerState, { type: 'play' }), playing);
  });

  it('한 줄이 끝나면 다음 줄, 장면 끝에서는 다음 장면으로 넘어간다', () => {
    const second = reduce(playing, { type: 'lineEnded' });
    assert.equal(second.lineIndex, 1);
    const nextScene = reduce(second, { type: 'lineEnded' });
    assert.deepEqual([nextScene.sceneIndex, nextScene.lineIndex], [1, 0]);
  });

  it('마지막 줄이 끝나면 종료되고, 다시 재생하면 처음부터 시작한다', () => {
    const last: PlayerState = { ...playing, sceneIndex: 1, lineIndex: 0 };
    const ended = reduce(last, { type: 'lineEnded' });
    assert.equal(ended.status, 'ended');
    const replay = reduce(ended, { type: 'play' });
    assert.deepEqual(
      [replay.status, replay.sceneIndex, replay.lineIndex],
      ['playing', 0, 0],
    );
  });

  it('일시정지 후 재생하면 같은 줄을 처음부터 다시 읽는다', () => {
    const paused = reduce({ ...playing, lineIndex: 1 }, { type: 'pause' });
    assert.equal(paused.status, 'paused');
    const resumed = reduce(paused, { type: 'play' });
    assert.equal(resumed.lineIndex, 1);
    assert.ok(resumed.cue > paused.cue, '음성을 새로 시작해야 한다');
  });

  it('멈춘 뒤 늦게 온 종료 알림으로는 넘어가지 않는다', () => {
    const paused = reduce(playing, { type: 'pause' });
    assert.equal(reduce(paused, { type: 'lineEnded' }), paused);
  });

  it('장면 이동은 첫 줄로 가고, 멈춤 상태는 그대로 둔다', () => {
    const moved = reduce(
      { ...playing, lineIndex: 1 },
      { type: 'goToScene', index: 1 },
    );
    assert.deepEqual(
      [moved.status, moved.sceneIndex, moved.lineIndex],
      ['playing', 1, 0],
    );
    const paused = reduce(
      { ...playing, status: 'paused' },
      { type: 'goToScene', index: 1 },
    );
    assert.equal(paused.status, 'paused');
  });

  it('없는 장면으로는 이동하지 않는다', () => {
    assert.equal(reduce(playing, { type: 'goToScene', index: -1 }), playing);
    assert.equal(reduce(playing, { type: 'goToScene', index: 2 }), playing);
  });
});

describe('안내문·영상·티치백 데이터', () => {
  it('영상 장면은 인사 + 안내문 화면과 같은 내용이다', () => {
    assert.equal(videoScenes[0].id, 'greeting');
    assert.equal(videoScenes.length, guideSteps.length + 1);
    guideSteps.forEach((step, i) => {
      assert.deepEqual(
        videoScenes[i + 1].lines.map((line) => line.text),
        step.lines,
      );
    });
  });

  it('장면 id가 겹치지 않는다', () => {
    const ids = videoScenes.map((scene) => scene.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  for (const step of guideSteps) {
    it(`"${step.id}" 화면의 그림과 문장 번호가 맞다`, () => {
      assert.ok(step.lines.length > 0, '문장이 한 줄 이상 있어야 한다');
      const labels = step.pictures.map((picture) => picture.label);
      assert.equal(new Set(labels).size, labels.length, '그림 이름이 겹친다');
      for (const picture of step.pictures) {
        for (const n of picture.lines ?? []) {
          assert.ok(
            n >= 1 && n <= step.lines.length,
            `"${picture.label}"이 없는 문장 ${n}번을 가리킨다`,
          );
        }
      }
    });
  }

  for (const question of demoGuide.questions) {
    it(`티치백 "${question.topic}"은 정답이 하나씩 있다`, () => {
      const count = (choices: { correct?: boolean }[]) =>
        choices.filter((choice) => choice.correct).length;
      assert.equal(count(question.choices), 1);
      assert.equal(count(question.retry.choices), 1);
    });
  }

  it('원본 안내문에 없는 당뇨약 내용이 들어 있지 않다', () => {
    assert.ok(!JSON.stringify(demoGuide).includes('당뇨'));
  });
});
