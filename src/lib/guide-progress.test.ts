import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { guideKinds } from './guide-catalog';
import {
  guideFinish,
  guideLessonHref,
  nextGuide,
  readyGuides,
} from './guide-progress';
import { getMessages, languages } from './messages';
import { ko } from './messages/ko';

describe('안내 사이 이동', () => {
  const both = ['colonoscopy', 'medication'] as const;

  it('드시는 약을 먼저 마치면 대장내시경으로 간다', () => {
    assert.equal(nextGuide(both, ['medication'], 'medication'), 'colonoscopy');
  });

  it('대장내시경을 먼저 마치면 드시는 약으로 간다', () => {
    assert.equal(nextGuide(both, ['colonoscopy'], 'colonoscopy'), 'medication');
  });

  it('모두 마쳤거나 하나만 받았으면 다음 안내가 없다', () => {
    assert.equal(
      nextGuide(both, ['colonoscopy', 'medication'], 'medication'),
      null,
    );
    assert.equal(nextGuide(['colonoscopy'], [], 'colonoscopy'), null);
  });

  it('위내시경도 내용이 있어 다음 안내가 된다', () => {
    assert.deepEqual(readyGuides(['gastroscopy', 'medication']), [
      'gastroscopy',
      'medication',
    ]);
    assert.equal(
      nextGuide(['gastroscopy', 'medication'], [], 'medication'),
      'gastroscopy',
    );
    assert.equal(
      guideLessonHref('771204', 'gastroscopy'),
      '/p/771204/gastroscopy',
    );
  });

  it('기본 검진 → 위내시경 → 드시는 약 → 모두 끝 (518031과 같은 묶음)', () => {
    const issued = ['checkup', 'gastroscopy', 'medication'] as const;
    const a = guideFinish(ko, '518031', 'checkup', issued, []);
    assert.equal(a.next, 'gastroscopy');
    assert.equal(a.nextHref, '/p/518031/gastroscopy');
    assert.equal(
      a.message,
      '건강검진 기본 확인사항 수업 끝! 이제 위내시경을 볼게요.',
    );
    const b = guideFinish(ko, '518031', 'gastroscopy', issued, ['checkup']);
    assert.equal(b.next, 'medication');
    assert.equal(b.nextHref, '/p/518031/medication');
    const c = guideFinish(ko, '518031', 'medication', issued, [
      'checkup',
      'gastroscopy',
    ]);
    assert.equal(c.next, null);
    assert.equal(c.nextHref, null);
    assert.equal(c.message, ko.allDone);
  });

  it('대장내시경은 또박이 수업, 드시는 약은 약 화면으로 연다', () => {
    assert.equal(guideLessonHref('000000', 'colonoscopy'), '/p/000000/video');
    assert.equal(
      guideLessonHref('000000', 'medication'),
      '/p/000000/medication',
    );
  });
});

describe('안내 이동 문구', () => {
  it('한국어: 실제 안내 제목과 맞는 조사를 넣는다', () => {
    assert.equal(
      ko.guideDoneNext(ko.guides.colonoscopy, ko.guides.medication),
      '대장내시경 수업 끝! 이제 드시는 약을 볼게요.',
    );
    assert.equal(
      ko.guideDoneNext(ko.guides.medication, ko.guides.colonoscopy),
      '드시는 약 수업 끝! 이제 대장내시경을 볼게요.',
    );
    assert.equal(
      ko.guideDoneNext('약', '건강검진'),
      '약 수업 끝! 이제 건강검진을 볼게요.',
    );
    assert.equal(
      ko.guideDoneNext('약', '위내시경 안내'),
      '약 수업 끝! 이제 위내시경 안내를 볼게요.',
    );
    assert.equal(ko.nextButton(ko.guides.medication), '다음: 드시는 약 ▶');
    assert.equal(ko.allDone, '모든 수업 끝! 정말 잘하셨어요.');
  });

  it('5개 언어 모두 모든 안내 제목과 문구가 있다', () => {
    for (const language of languages) {
      const t = getMessages(language);
      for (const kind of guideKinds)
        assert.ok(t.guides[kind], `${language} ${kind}`);
      assert.ok(t.guideDoneNext('A', 'B').includes('B'));
      assert.ok(t.nextButton('B').includes('B'));
      assert.ok(t.allDone && t.restart && t.statusDone && t.statusLeft);
    }
  });

  it('언어마다 음성 읽기 언어 코드가 맞다', () => {
    assert.deepEqual(
      languages.map((language) => getMessages(language).speechLang),
      ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'vi-VN'],
    );
  });

  it('번호 입력 화면 문구가 5개 언어 모두 있다', () => {
    for (const language of languages) {
      const { entry, home } = getMessages(language);
      for (const text of Object.values(entry)) {
        if (typeof text === 'string') assert.ok(text, language);
      }
      assert.ok(home.hello && entry.wrong(3).includes('3'), language);
    }
  });

  it('모르는 언어는 한국어로 보여 준다', () => {
    assert.equal(getMessages('xx'), ko);
  });
});
