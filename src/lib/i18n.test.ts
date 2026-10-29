import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { photoLessons } from '@/app/p/ttobak/photo-lesson';

import en from '../../locales/en.json';
import ko from '../../locales/ko.json';
import {
  demoGuide,
  foodGroups,
  getTodo,
  hospital,
  videoLessons,
} from './demo-guide';
import { guideCatalog } from './guide-catalog';
import { source, subtitleKey } from './i18n';
import { medications, verdictLabels } from './medication-guide';

// 의료 안내 원본에서 화면에 보이는 한국어 문장을 모두 모은다.
function koreanIn(value: unknown, found = new Set<string>()) {
  if (typeof value === 'string') {
    if (/[가-힣]/.test(value)) found.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => koreanIn(item, found));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => koreanIn(item, found));
  }
  return found;
}

const guideKorean = koreanIn([
  hospital,
  foodGroups,
  demoGuide,
  videoLessons,
  [2, 1, 0, -1].map(getTodo),
  medications,
  verdictLabels,
  guideCatalog,
]);
const sourceEn: Record<string, string> = en.source;
const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
const numbers = (text: string): string[] => text.match(/\d+/g) ?? [];

describe('화면 문장(ko.json·en.json ui)', () => {
  it('한국어와 영어의 문장 목록이 같다', () => {
    assert.deepEqual(Object.keys(en.ui).sort(), Object.keys(ko.ui).sort());
  });

  it('{이름} 자리가 두 언어에 똑같이 있다(영어를 아직 비워 둔 문장은 한국어로 보인다)', () => {
    for (const [id, korean] of Object.entries(ko.ui)) {
      const english = (en.ui as Record<string, string>)[id];
      if (!english) continue;
      assert.deepEqual(placeholders(english), placeholders(korean), id);
    }
  });
});

describe('의료 안내 영어(en.json source)', () => {
  it('안내 원문의 모든 문장에 영어가 있다', () => {
    const missing = [...guideKorean].filter((korean) => !sourceEn[korean]);
    assert.deepEqual(missing, [], '영어 짝이 없는 원문');
  });

  it('원문에서 사라진 문장의 영어는 남겨 두지 않는다', () => {
    const unused = Object.keys(sourceEn).filter(
      (korean) => !guideKorean.has(korean),
    );
    assert.deepEqual(unused, [], '원문에 없는 영어 짝');
  });

  it('원문의 숫자(시간·양·횟수)가 영어에 그대로 있다', () => {
    for (const korean of guideKorean) {
      const english = numbers(sourceEn[korean] ?? '');
      for (const n of numbers(korean)) {
        assert.ok(english.includes(n), `숫자 ${n}: ${korean}`);
      }
    }
  });
});

describe('영상 자막 강조', () => {
  it('영어 강조 말이 영어 자막 안에 있다', () => {
    const check = (text: string, key: string) => {
      if (!key) return;
      const english = subtitleKey('en', key);
      assert.ok(english, `영어 강조 말 없음: ${key}`);
      assert.ok(source('en', text).includes(english), `${english} / ${text}`);
    };
    for (const lesson of photoLessons) {
      lesson.steps.forEach((step) => check(step.text, step.key));
      for (const quiz of lesson.quizzes) {
        check(quiz.question, quiz.key);
        check(quiz.praise, quiz.praiseKey);
      }
    }
  });
});
