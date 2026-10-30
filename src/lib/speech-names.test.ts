import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { characterNames, forSpeech } from './speech-names';

describe('읽어 주기용 또박이 이름', () => {
  it('영어: Ttobagi를 Toh-bah-ghee로 읽게 바꾼다(언어 코드·음성 태그 모두)', () => {
    assert.equal(
      forSpeech("Hello, I'm Ttobagi.", 'en'),
      "Hello, I'm Toh-bah-ghee.",
    );
    assert.equal(
      forSpeech('Ttobagi says Ttobagi', 'en-US'),
      'Toh-bah-ghee says Toh-bah-ghee',
    );
  });

  it('중국어·베트남어도 발음용 철자로 바꾼다', () => {
    assert.equal(forSpeech('我是小朵比。', 'zh-CN'), '我是托巴基。');
    assert.equal(
      forSpeech('Xin chào, tôi là Ttobagi.', 'vi'),
      'Xin chào, tôi là Tô ba ghi.',
    );
  });

  it('일본어·한국어·모르는 언어는 그대로 둔다', () => {
    assert.equal(forSpeech('私はトバギです。', 'ja-JP'), '私はトバギです。');
    assert.equal(forSpeech('저는 또박이예요.', 'ko-KR'), '저는 또박이예요.');
    assert.equal(forSpeech('Ttobagi', 'fr'), 'Ttobagi');
  });

  it('발음용 철자에는 화면 표기가 들어 있지 않다(다시 바뀌는 일이 없다)', () => {
    for (const { written, spoken } of Object.values(characterNames)) {
      if (written !== spoken) assert.ok(!spoken.includes(written));
    }
  });
});
