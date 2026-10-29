import type { EducationCode } from './education-store';
import { findMedication, type Verdict } from './medication-guide';

// 의료진 목록·상세와 관리자 목록이 함께 쓰는 "드시는 약" 요약.
// 고른 약마다 판정과 확인 질문 결과(티치백 표에 guide='medication', question=약 아이디로 저장)를 묶는다.

export const verdictMarks: Record<Verdict, string> = {
  ok: '🟢',
  stop: '❌',
  ask: '📞',
};

export function medicationRows(code: EducationCode) {
  const check = code.medicationCheck;
  if (!check) return [];
  return check.medications.map((id) => {
    const med = findMedication(id);
    const quiz = code.teachbackResults.find(
      (r) => r.guide === 'medication' && r.question === id,
    );
    return {
      id,
      name: med?.name ?? id,
      verdict: med?.verdict ?? null,
      quiz: quiz?.result ?? null,
      pickedAt: check.pickedAt[id] ?? check.checkedAt,
    };
  });
}

// 목록 칸 한 줄. 예: "혈압약 · 당뇨약⚠" (확인 질문을 틀린 약에 ⚠)
export function medicationCell(code: EducationCode) {
  if (!code.guides.includes('medication')) return { text: '—', muted: true };
  if (!code.medicationCheck) return { text: '아직 안 고름', muted: true };
  const rows = medicationRows(code);
  if (rows.length === 0) return { text: '먹는 약 없음', muted: false };
  return {
    text: rows
      .map((r) => `${r.name}${r.quiz === 'wrong' ? '⚠' : ''}`)
      // 약 이름에 이미 '·'가 있어(영양제·한약) 약 사이는 띄어 구분한다.
      .join(' · '),
    muted: false,
  };
}

// "이해 확인"(티치백) 결과만. 복용약 확인 질문은 "드시는 약" 칸에서 따로 보여 준다.
export function teachbackOnly(code: EducationCode) {
  return code.teachbackResults.filter((r) => r.guide !== 'medication');
}
