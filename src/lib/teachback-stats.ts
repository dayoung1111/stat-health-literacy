import type { EducationCode } from './education-store';
import { guideCatalog } from './guide-catalog';
import { teachbackOnly } from './medication-summary';

// 관리자 통계 "❌ 많이 틀린 문제 TOP 3". 티치백은 질문마다 마지막 결과만 남으므로,
// "틀린 횟수"는 그 질문을 처음에 틀린 코드 수(틀림 + 다시 설명 후 맞힘)로 센다.
// 복용약 확인 질문은 "드시는 약" 칸에서 따로 보여 주므로 뺀다(teachbackOnly).
export function mostMissedQuestions(
  codes: Pick<EducationCode, 'teachbackResults'>[],
  limit = 3,
) {
  const missed = new Map<string, { label: string; count: number }>();
  for (const code of codes) {
    for (const r of teachbackOnly(code)) {
      if (r.result === 'correct') continue;
      const key = `${r.guide}:${r.question}`;
      const found = missed.get(key);
      if (found) found.count += 1;
      else
        missed.set(key, {
          label: `${guideCatalog[r.guide].name} › ${r.question}`,
          count: 1,
        });
    }
  }
  return [...missed.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'))
    .slice(0, limit);
}
