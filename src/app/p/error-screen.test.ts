import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PatientErrorView } from './error-screen';

// 환자 화면에서 오류가 나면 하얀 화면 대신 보이는 안내(error.tsx가 이 화면을 그린다).
describe('환자 오류 화면', () => {
  const html = renderToStaticMarkup(
    createElement(PatientErrorView, { errorNumber: 'E-4821' }),
  );

  it('"잠깐 문제가 생겼어요"와 오류 번호, 간호사 안내, 다시 시도 버튼이 보인다', () => {
    assert.match(html, /잠깐 문제가 생겼어요/);
    assert.match(html, /E-4821/);
    assert.match(html, /간호사에게 이 번호를 알려 주세요/);
    assert.match(html, /<button[^>]*>.*다시 시도<\/button>/);
  });

  it('화면 읽기 프로그램이 바로 읽도록 경고(alert)로 표시하고, 또박이 그림이 있다', () => {
    assert.match(html, /role="alert"/);
    assert.match(html, /<svg/);
  });

  it('오류 번호는 크게(6xl) 보인다', () => {
    assert.match(html, /text-6xl[^>]*>E-4821</);
  });
});
