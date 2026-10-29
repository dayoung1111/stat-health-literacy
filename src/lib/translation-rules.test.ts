import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cacheKey,
  isTranslatable,
  isUsableTranslation,
  numbersKept,
  placeholdersKept,
} from './translation-rules';

describe('AI 번역 규칙', () => {
  it('한국어와 모르는 언어는 번역하지 않는다', () => {
    assert.equal(isTranslatable('ko'), false);
    assert.equal(isTranslatable('fr'), false);
    for (const language of ['en', 'ja', 'zh', 'vi']) {
      assert.equal(isTranslatable(language), true);
    }
  });

  it('숫자·시간·양이 그대로 있어야 쓸 수 있다', () => {
    const source = '새벽 5시에 물 500mL와 1L를 2번 드세요.';
    assert.equal(
      isUsableTranslation(
        source,
        'Drink 500mL and 1L of water twice at 5 AM (2).',
      ),
      true,
    );
    assert.equal(
      numbersKept(source, 'Drink 400mL and 1L at 5 AM, 2 times.'),
      false,
    );
    assert.equal(numbersKept(source, 'Drink 500mL and 1L at 5 AM.'), false);
  });

  it('같은 숫자가 여러 번 나오면 그만큼 있어야 한다', () => {
    assert.equal(numbersKept('1시, 1시', 'at 1'), false);
    assert.equal(numbersKept('1시, 1시', '1 and 1'), true);
  });

  it('비었거나 터무니없이 긴 번역은 쓰지 않는다', () => {
    assert.equal(isUsableTranslation('물을 드세요', '  '), false);
    assert.equal(isUsableTranslation('물', 'x'.repeat(200)), false);
  });

  it('{date} 같은 자리 표시가 빠지면 쓰지 않는다', () => {
    assert.equal(placeholdersKept('{date}부터 중단', 'Stop from {date}'), true);
    assert.equal(placeholdersKept('{date}부터 중단', 'Stop from March'), false);
    assert.equal(
      isUsableTranslation('{date}부터 중단', 'Stop from March'),
      false,
    );
  });

  it('저장 키는 언어와 원문이 같아야 같고, 원문이 바뀌면 달라진다', () => {
    assert.equal(cacheKey('en', '안녕하세요'), cacheKey('en', '안녕하세요'));
    assert.notEqual(cacheKey('en', '안녕하세요'), cacheKey('ja', '안녕하세요'));
    assert.notEqual(
      cacheKey('en', '안녕하세요'),
      cacheKey('en', '안녕하세요.'),
    );
  });
});
