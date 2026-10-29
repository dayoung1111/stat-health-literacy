import { guideCatalog, guideKinds, type GuideKind } from './guide-catalog';

// 의료진이 묶어 보낸 안내 사이의 이동. 순서는 정해 두지 않고,
// 하나를 마치면 아직 안 마친 안내(내용이 준비된 것만)로 간다.

/** 환자 화면에서 그 안내를 여는 주소. 대장내시경은 또박이 수업으로 바로 간다. */
export function guideLessonHref(code: string, kind: GuideKind) {
  if (kind === 'colonoscopy') return `/p/${code}/video`;
  if (kind === 'medication') return `/p/${code}/medication`;
  return `/p/${code}/preparing/${kind}`;
}

/** 발급된 안내 중 환자가 끝까지 볼 수 있는 것(목록 순서) */
export function readyGuides(issued: readonly GuideKind[]) {
  return guideKinds.filter(
    (kind) => issued.includes(kind) && guideCatalog[kind].ready,
  );
}

/** 방금 마친 안내(current) 다음에 볼 안내. 모두 마쳤으면 null. */
export function nextGuide(
  issued: readonly GuideKind[],
  completed: readonly GuideKind[],
  current: GuideKind,
): GuideKind | null {
  return (
    readyGuides(issued).find(
      (kind) => kind !== current && !completed.includes(kind),
    ) ?? null
  );
}
