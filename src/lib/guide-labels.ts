import { guideSteps } from './demo-guide';
import { guideCatalog, type GuideKind } from './guide-catalog';

// "헷갈려요"를 누른 곳 이름. 예: "대장내시경 › 첫 번째 약"
// 의료진 코드 상세와 관리자 통계가 함께 쓴다.
export function confusionLabel(guide: GuideKind, paragraphId: string) {
  const title =
    guide === 'colonoscopy'
      ? (guideSteps.find((step) => step.id === paragraphId)?.sectionTitle ??
        paragraphId)
      : paragraphId;
  return `${guideCatalog[guide].name} › ${title}`;
}
