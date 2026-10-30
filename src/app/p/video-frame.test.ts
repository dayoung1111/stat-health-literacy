import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { createFrameController, type FrameEnv } from './video-frame-control';

// 전체 화면 영상 틀(video-frame.tsx)의 열기·닫기 규칙과, 모든 영상 화면이 이 틀을 쓰는지 확인한다.

/** 화면 대신 무엇을 했는지 적어 두는 가짜 환경. system: 기기 전체 화면이 되는 기기인지(안드로이드 크롬) */
function fakeEnv(system: boolean) {
  const log: string[] = [];
  let systemOn = false;
  const env: FrameEnv = {
    liftOut: () => {
      log.push('꺼내기');
      return () => log.push('되돌리기');
    },
    enterSystem: async () => {
      log.push('기기전체화면시도');
      systemOn = system;
      return system;
    },
    exitSystem: () => {
      log.push('기기전체화면풀기');
      systemOn = false;
    },
    isSystemFullscreen: () => systemOn,
  };
  return {
    env,
    log,
    /** 안드로이드 뒤로가기·시스템 제스처로 기기 전체 화면이 꺼짐 */
    systemExit: () => {
      systemOn = false;
    },
  };
}

function setup(system = false) {
  const fake = fakeEnv(system);
  const shown: boolean[] = [];
  let paused = 0;
  const frame = createFrameController(fake.env, {
    onChange: (open) => shown.push(open),
    onClose: () => {
      paused += 1;
    },
  });
  return { ...fake, frame, shown, paused: () => paused };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// 앱 안에서 재생 버튼이 있는(또는 크게 보기가 있는) 영상 화면 전부
const videoScreens = [
  { name: '대장내시경 수업', file: 'src/app/p/ttobak/photo-lesson-player.tsx' },
  {
    name: '위내시경 수업',
    file: 'src/app/p/[code]/gastroscopy/gastroscopy-frame.tsx',
  },
  {
    name: '건강검진 전날 수업',
    file: 'src/app/p/[code]/day-before/day-before-frame.tsx',
  },
  { name: '약 만들기 따라하기', file: 'src/app/p/ttobak/prep-follow.tsx' },
];
// 수업 파일(액자 안)에서 재생 버튼을 누르는 화면
const lessonFiles = [
  'public/lessons/gastroscopy.html',
  'public/lessons/day-before.html',
];

describe('전체 화면 영상 틀: 열기 → X로 끄기 → 다시 열기', () => {
  for (const screen of videoScreens) {
    for (const system of [false, true]) {
      const device = system ? '안드로이드 크롬' : '아이폰·카카오톡';
      it(`${screen.name}(${device}): 휴대폰에서 재생을 누를 때마다 3번 모두 전체 화면이 열린다`, async () => {
        const { frame, shown, log, paused } = setup(system);
        for (let round = 1; round <= 3; round += 1) {
          frame.play(true);
          await settle();
          assert.equal(frame.isOpen(), true, `${round}번째 열기`);
          frame.close();
          assert.equal(frame.isOpen(), false, `${round}번째 닫기`);
        }
        assert.deepEqual(shown, [true, false, true, false, true, false]);
        // 열 때마다 처음처럼: 꺼내기 + 기기 전체 화면 시도, 닫을 때마다: 풀기 + 되돌리기
        assert.equal(log.filter((x) => x === '꺼내기').length, 3);
        assert.equal(log.filter((x) => x === '기기전체화면시도').length, 3);
        assert.equal(log.filter((x) => x === '기기전체화면풀기').length, 3);
        assert.equal(log.filter((x) => x === '되돌리기').length, 3);
        // X로 닫을 때마다 일시정지
        assert.equal(paused(), 3);
      });
    }
  }

  it('일시정지 뒤 다시 재생해도(이미 열려 있으면) 그대로 전체 화면이고, 두 번 열지 않는다', async () => {
    const { frame, log } = setup();
    frame.play(true);
    frame.play(true);
    await settle();
    assert.equal(frame.isOpen(), true);
    assert.equal(log.filter((x) => x === '꺼내기').length, 1);
  });

  it('PC에서는 재생해도 전체 화면이 열리지 않고, "크게 보기"를 누르면 열린다', () => {
    const { frame } = setup();
    frame.play(false);
    assert.equal(frame.isOpen(), false);
    frame.open();
    assert.equal(frame.isOpen(), true);
  });

  it('안드로이드 뒤로가기로 기기 전체 화면이 꺼지면 우리 화면도 닫히고, 다시 재생하면 또 열린다', async () => {
    const { frame, systemExit, paused } = setup(true);
    for (let round = 1; round <= 3; round += 1) {
      frame.play(true);
      await settle();
      systemExit();
      frame.systemChanged();
      assert.equal(frame.isOpen(), false, `${round}번째 뒤로가기 뒤 닫힘`);
    }
    assert.equal(paused(), 3);
  });

  it('기기 전체 화면이 되기 전에 X를 눌러도 남는 것 없이 풀린다', async () => {
    const { frame, log } = setup(true);
    frame.open();
    frame.close();
    await settle();
    assert.equal(frame.isOpen(), false);
    assert.equal(log.at(-1), '기기전체화면풀기');
  });
});

describe('모든 영상 화면이 공통 부품을 쓴다', () => {
  for (const screen of videoScreens) {
    it(`${screen.name}: 전체 화면 영상 틀(VideoFrame)을 쓴다`, () => {
      const source = readFileSync(screen.file, 'utf8');
      assert.match(source, /from '\.\.\/(\.\.\/)?video-frame'/);
      assert.match(source, /<VideoFrame\b/);
    });
  }

  for (const file of lessonFiles) {
    it(`${file}: 재생·크게 보기를 앱에 알리고, 전체 화면 켬/끔과 일시정지를 받는다`, () => {
      const source = readFileSync(file, 'utf8');
      for (const message of [
        'stat-lesson-play',
        'stat-lesson-bigview',
        'stat-lesson-full',
        'stat-lesson-pause',
      ]) {
        assert.match(source, new RegExp(message), message);
      }
    });
  }

  it('전체 화면 요청(requestFullscreen)은 공통 부품에만 있다(화면마다 따로 만들지 않음)', () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name) && !name.endsWith('.test.ts')) {
          if (readFileSync(path, 'utf8').includes('requestFullscreen')) {
            found.push(path.replaceAll('\\', '/'));
          }
        }
      }
    };
    walk('src');
    assert.deepEqual(found, ['src/app/p/video-frame.tsx']);
  });
});
