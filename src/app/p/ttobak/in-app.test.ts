import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { inAppBrowser, kakaoOpenExternal } from './in-app';

// 수업 전체 화면의 "Safari나 크롬으로 열기" 띠는 앱 안 브라우저에서만 보인다.
const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const iphoneKakao =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 25.8.0';
const androidChrome =
  'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const androidNaver =
  'Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.8.0)';
const iphoneInstagram =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0';

describe('앱 안 브라우저 알아보기', () => {
  it('카카오톡은 kakao', () => {
    assert.equal(inAppBrowser(iphoneKakao), 'kakao');
  });

  it('네이버·인스타그램은 other', () => {
    assert.equal(inAppBrowser(androidNaver), 'other');
    assert.equal(inAppBrowser(iphoneInstagram), 'other');
  });

  it('일반 Safari·크롬은 띠를 보여 주지 않는다(null)', () => {
    assert.equal(inAppBrowser(iphoneSafari), null);
    assert.equal(inAppBrowser(androidChrome), null);
  });

  it('카카오톡 외부 브라우저 열기 주소', () => {
    assert.equal(
      kakaoOpenExternal('https://stat-health-literacy.vercel.app/p/DEMO/video'),
      'kakaotalk://web/openExternal?url=https%3A%2F%2Fstat-health-literacy.vercel.app%2Fp%2FDEMO%2Fvideo',
    );
  });
});
