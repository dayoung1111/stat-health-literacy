import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { homeSourceTexts, homeTexts } from './home-texts';
import { collectKorean } from './translation-sources';
import {
  isUsableTranslation,
  translatableLanguages,
} from './translation-rules';

const load = (language: string): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`./translations/${language}.json`, import.meta.url),
      'utf8',
    ),
  );

describe('미리 번역 파일', () => {
  for (const language of translatableLanguages) {
    it(`${language}: 모든 번역이 숫자·시간·양을 그대로 지키고 비어 있지 않다`, () => {
      const entries = Object.entries(load(language));
      assert.ok(entries.length > 0);
      for (const [source, translated] of entries) {
        assert.ok(
          isUsableTranslation(source, translated),
          `${language}: "${source}" → "${translated}"`,
        );
      }
    });
  }
});

describe('번역할 한국어 문장 모으기', () => {
  it('한글이 있는 글자만 모으고, 겹치는 문장은 한 번만 센다', () => {
    const found = collectKorean({
      a: ['물을 드세요', 'clock', { b: '물을 드세요', c: '02-0000' }],
      d: 12,
      e: null,
    });
    assert.deepEqual([...found], ['물을 드세요']);
  });

  it('환자 홈에서 나올 수 있는 문구가 목록에 모두 들어 있다', () => {
    assert.ok(homeSourceTexts.includes(homeTexts.greeting));
    assert.ok(homeSourceTexts.includes(homeTexts.guidesCame(1)));
    assert.ok(homeSourceTexts.includes(homeTexts.guidesCame(4)));
  });
});
