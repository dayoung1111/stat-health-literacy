import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { photoLessons } from '../components/ttobak/photo-lesson';
import { demoGuide, foodGroups, guideSteps, tellUs } from './demo-guide';

// 안내문·영상·티치백이 같은 내용을 쓰는지 확인한다.
describe('안내 내용 하나로 쓰기', () => {
  it('음식 목록의 문장이 안내문에도, 영상 자막에도 그대로 나온다', () => {
    const guideLines = guideSteps.flatMap((step) => step.lines);
    const videoLines = photoLessons.flatMap((lesson) =>
      lesson.steps.map((step) => step.text),
    );
    for (const group of foodGroups) {
      assert.ok(guideLines.includes(group.say), `안내문에 없음: ${group.say}`);
      assert.ok(videoLines.includes(group.say), `영상에 없음: ${group.say}`);
    }
  });

  it('티치백 질문은 정답이 하나씩 있다', () => {
    for (const q of demoGuide.questions) {
      const count = (choices: { correct?: boolean }[]) =>
        choices.filter((choice) => choice.correct).length;
      assert.equal(count(q.choices), 1, q.topic);
      assert.equal(count(q.retry.choices), 1, `${q.topic} 다시 질문`);
    }
  });

  it('검수자가 정한 티치백 정답', () => {
    const answers = demoGuide.questions.map(
      (q) => q.choices.find((choice) => choice.correct)?.text,
    );
    assert.deepEqual(answers, [
      '저녁 7시 전',
      '15분마다 4번 나눠서',
      '혈압약',
      '먹지 않는다',
    ]);
  });

  it('"이럴 땐" 화면과 안내문 8단계가 같은 목록이다', () => {
    assert.equal(demoGuide.dangerSigns, tellUs);
  });

  it('원문에 없는 당뇨약 내용이 없다', () => {
    assert.ok(!JSON.stringify(demoGuide).includes('당뇨'));
  });
});
