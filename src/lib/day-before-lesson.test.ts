import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { dayBeforeLessonKo, dayBeforeLessonSources } from './day-before-lesson';
import { mapLessonStrings } from './gastro-lesson';
import { translatableLanguages } from './translation-rules';

const load = (language: string): Record<string, string> =>
  JSON.parse(
    readFileSync(
      new URL(`./translations/${language}.json`, import.meta.url),
      'utf8',
    ),
  );

const marks = (text: string) => (text.match(/\*\*/g) ?? []).length;

describe('검진 전날 수업 글자', () => {
  it('수업 이름은 "N교시 · 이름"이라 대장내시경과 같은 번역 규칙을 따른다', () => {
    dayBeforeLessonKo.scenes.forEach((scene, i) =>
      assert.ok(scene.name.startsWith(`${i + 1}교시 · `), scene.name),
    );
  });

  it('강조 색 같은 코드 값은 번역 대상이 아니다', () => {
    const sources = dayBeforeLessonSources();
    for (const scene of dayBeforeLessonKo.scenes) {
      for (const line of scene.lines) assert.ok(!sources.includes(line.tone));
    }
  });

  for (const language of translatableLanguages) {
    it(`${language}: 모든 글자가 번역돼 있고 한글이 남지 않으며 강조(**) 표시가 그대로다`, () => {
      const translations = load(language);
      for (const source of dayBeforeLessonSources()) {
        const translated = translations[source];
        assert.ok(translated, `${language}: 번역 없음 "${source}"`);
        assert.ok(
          !/[가-힣]/.test(translated),
          `${language}: 한글 남음 "${translated}"`,
        );
        assert.equal(
          marks(translated),
          marks(source),
          `${language}: ** 개수 "${translated}"`,
        );
      }
    });

    it(`${language}: 수업 이름은 " · "로 나뉘고 숫자(N교시)가 그대로다`, () => {
      const translations = load(language);
      dayBeforeLessonKo.scenes.forEach((scene, i) => {
        const translated = translations[scene.name];
        assert.ok(translated.includes(' · '), `${language}: "${translated}"`);
        assert.ok(translated.includes(String(i + 1)), translated);
      });
    });
  }

  it('번역이 없으면 한국어 그대로 둔다', () => {
    const same = mapLessonStrings(dayBeforeLessonKo, (text) => text);
    assert.deepEqual(same, dayBeforeLessonKo);
  });
});
