import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { isCarried } from './video-frame-control';

// 모든 영상 수업의 교시 이동·다음 안내 이동 규칙.
// 대장내시경 수업의 계산은 ttobak/lesson-state.test.ts에서, 여기서는 수업 파일(위내시경·검진 전날)과
// 앱 화면이 같은 규칙으로 이어져 있는지 확인한다.

const read = (path: string) => readFileSync(path, 'utf8');
const gastro = read('public/lessons/gastroscopy.html');
const dayBefore = read('public/lessons/day-before.html');
const frames = [
  {
    name: '위내시경',
    source: read('src/app/p/[code]/gastroscopy/gastroscopy-frame.tsx'),
  },
  {
    name: '건강검진 전날',
    source: read('src/app/p/[code]/day-before/day-before-frame.tsx'),
  },
];
const player = read('src/app/p/ttobak/photo-lesson-player.tsx');

describe('위내시경 수업: 다음·교시 목록·퀴즈 건너뛰기·다음 안내', () => {
  it('다음: 마지막 장면이 아니면 다음 장면으로(교시 끝이면 다음 교시 첫 장면)', () => {
    assert.match(
      gastro,
      /\$\('nextBtn'\)\.onclick=[\s\S]*?step\(st\.line\+1\)/,
    );
    assert.match(
      gastro,
      /\$\('prevBtn'\)\.onclick=\(\)=>step\(Math\.max\(0,st\.line-1\)\)/,
    );
  });

  it('오늘의 수업(1~4교시)을 누르면 그 교시 첫 장면으로 간다', () => {
    assert.match(gastro, /data-lesson="\$\{n\}"/);
    assert.match(
      gastro,
      /LINES\.findIndex\(x=>x\.lesson===\+li\.dataset\.lesson\)/,
    );
  });

  it('마지막 장면·퀴즈가 나와 있을 때 다음: 퀴즈를 풀지 않아도 다음 안내로(없으면 완료)', () => {
    assert.match(
      gastro,
      /if\(st\.line===LINES\.length-1\)\{[\s\S]{0,120}if\(HAS_NEXT\)\{[\s\S]{0,80}tellApp\(\{type:'stat-lesson-next'/,
    );
  });

  it('마지막 퀴즈를 맞혀 칭찬이 끝나면 다음 안내로 넘어간다', () => {
    assert.match(
      gastro,
      /say\(CHEER,\(\)=>\{[^}]*\}\);if\(HAS_NEXT\)tellApp\(\{type:'stat-lesson-next',lesson:'gastroscopy'\}\)/,
    );
  });
});

describe('건강검진 전날 수업: 다음·교시 목록·다음 안내', () => {
  it('다음·이전은 교시(장면) 단위로 넘어가고, 교시 목록을 누르면 그 교시로 간다', () => {
    assert.match(dayBefore, /go\(cur\+1,playing\)/);
    assert.match(dayBefore, /go\(cur-1,playing\)/);
    assert.match(
      dayBefore,
      /onclick=\(\)=>\{returnToQuiz=null;hideQuiz\(\);go\(i,true\)\}/,
    );
  });

  it('마지막 교시에서 다음 → 다음 안내, 끝까지 보면 칭찬 뒤 다음 안내', () => {
    assert.match(
      dayBefore,
      /if\(cur===scenes\.length-1\)\{[^}]*if\(HAS_NEXT\)tellApp\(\{type:'stat-lesson-next'/,
    );
    assert.match(
      dayBefore,
      /await say\(cheer\);[\s\S]{0,80}if\(HAS_NEXT\)tellApp\(\{type:'stat-lesson-next',lesson:'day-before'\}\)/,
    );
  });
});

describe('앱 화면: 다음 안내로 이동', () => {
  for (const { name, source } of frames) {
    it(`${name}: 다음 안내로 갈 때 "완료"를 기록하고, 전체 화면이면 이어서 연다`, () => {
      assert.match(source, /markGuideDone\(code, '[a-z-]+'\)/);
      assert.match(source, /carryFullscreen\(\);\s*router\.push\(nextHref\)/);
    });
    it(`${name}: 다음 안내가 없으면 전체 화면을 닫아 "모든 안내를 다 봤어요"·처음으로가 보이게 한다`, () => {
      assert.match(source, /if \(!nextHref\) closeFullscreen\(\)/);
      assert.match(source, /<GuideFinish/);
    });
  }

  it('대장내시경: 수업을 마치면 "완료" 기록 후 다음 안내로, 없으면 처음으로 버튼', () => {
    assert.match(player, /markGuideDone\(code, thisGuide\)/);
    assert.match(player, /carryFullscreen\(\);\s*router\.push\(nextHref\)/);
    assert.match(player, /href=\{`\/p\/\$\{code\}\/home`\}/);
  });

  it('수업 파일이 앱보다 먼저 열려도 글자·다음 안내 정보를 받도록 "열렸어요"를 다시 알린다', () => {
    for (const source of [gastro, dayBefore]) {
      assert.match(source, /readyTries/);
    }
  });
});

describe('다음 안내로 넘어가도 전체 화면 유지', () => {
  it('방금(10초 안) 전체 화면으로 넘어왔으면 다음 안내도 전체 화면으로 연다', () => {
    const now = 1_000_000;
    assert.equal(isCarried(String(now - 300), now), true);
    assert.equal(isCarried(String(now - 9_000), now), true);
  });

  it('표시가 없거나 오래됐으면 보통 화면으로 연다', () => {
    const now = 1_000_000;
    assert.equal(isCarried(null, now), false);
    assert.equal(isCarried(String(now - 60_000), now), false);
    assert.equal(isCarried('엉뚱한 값', now), false);
  });
});
