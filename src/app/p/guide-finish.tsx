'use client';

import { useEffect, useRef } from 'react';

import type { GuideKind } from '@/lib/guide-catalog';
import { guideFinish } from '@/lib/guide-progress';
import { screenTexts } from '@/lib/screen-texts';

import { useLanguageOr } from '../language-provider';
import { T } from '../translated';
import { Ttobagi } from '../ttobagi';
import { ButtonLink } from './ui';

// 수업 액자(검진 전날·위내시경) 아래에 붙는 "다 봤어요" 화면.
// 다음 안내와 또박이 말은 대장내시경 수업과 같은 guideFinish로 정한다.
// 서버 저장 결과를 기다리지 않으므로, 저장이 늦거나 실패해도 다음 안내로 갈 수 있다.
export function GuideFinish({
  code,
  guide,
  guides,
  completed,
  language,
}: {
  code: string;
  guide: GuideKind;
  /** 발급된 안내 중 끝까지 볼 수 있는 것 */
  guides: GuideKind[];
  /** 이 화면을 열 때 이미 마친 안내 */
  completed: GuideKind[];
  /** 의료진이 고른 언어. 환자가 고른 언어가 있으면 그것을 쓴다. */
  language: string;
}) {
  const { language: shown, t } = useLanguageOr(language);
  const { next, nextHref, message } = guideFinish(
    t,
    code,
    guide,
    guides,
    completed,
  );
  const ref = useRef<HTMLDivElement>(null);

  // 수업 액자가 길어서 아래 버튼이 화면 밖에 있으므로, 나타나면 그곳으로 내려 준다.
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div ref={ref} role="status" className="mt-6 flex flex-col gap-4">
      <Ttobagi pose="cheer" language={shown} message={message} />
      {next && nextHref ? (
        <ButtonLink href={nextHref}>{t.nextButton(t.guides[next])}</ButtonLink>
      ) : (
        <ButtonLink href={`/p/${code}/home`}>
          🏠 <T>{screenTexts.teachback.toHome}</T>
        </ButtonLink>
      )}
    </div>
  );
}
