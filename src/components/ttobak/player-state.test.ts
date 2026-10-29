import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { colonoscopyScenes } from './colonoscopy-scenes';
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

describe('대장내시경 장면 데이터', () => {
  it('장면 id가 겹치지 않는다', () => {
    const ids = colonoscopyScenes.map((scene) => scene.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  for (const scene of colonoscopyScenes) {
    it(`"${scene.title}" 장면의 자막과 카드가 올바르다`, () => {
      assert.ok(scene.lines.length > 0, '자막이 한 줄 이상 있어야 한다');
      const cardIds = scene.cards.map((card) => card.id);
      assert.equal(new Set(cardIds).size, cardIds.length, '카드 id가 겹친다');
      for (const line of scene.lines) {
        assert.ok(line.text.trim().length > 0, '빈 자막이 있다');
        for (const id of line.highlight ?? []) {
          assert.ok(cardIds.includes(id), `없는 카드 "${id}"를 강조한다`);
        }
      }
    });
  }
});
