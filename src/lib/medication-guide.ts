// 복용약·영양제 안내(틀만). 나이대와 상관없이 항상 전체 목록을 보낸다(언어·큰 글씨만 적용).
// 검수 필요: 약마다 드셔도 되는지(advice)와 언제부터인지(when)는 아직 정하지 않았다.
// 팀이 내용을 정하면 아래 advice·when만 채운다. 원문에 없는 내용은 넣지 않는다.

export const medicationIds = [
  'blood-pressure',
  'diabetes',
  'blood-thinner',
  'iron',
  'supplement',
  'other',
] as const;

export type MedicationId = (typeof medicationIds)[number];

/** ok: 드셔도 돼요 / stop: 드시면 안 돼요(언제부터) / ask: 의료진과 상의하세요 */
export type MedicationAdvice = 'ok' | 'stop' | 'ask';

export const adviceLabels: Record<MedicationAdvice, string> = {
  ok: '드셔도 돼요',
  stop: '드시면 안 돼요',
  ask: '의료진과 상의하세요',
};

export type Medication = {
  id: MedicationId;
  name: string;
  example?: string;
  emoji: string;
  /** 검수 필요: 정해지기 전에는 null */
  advice: MedicationAdvice | null;
  /** 검수 필요: "드시면 안 돼요"일 때 언제부터인지 */
  when: string | null;
};

export const medications: Medication[] = [
  {
    id: 'blood-pressure',
    name: '혈압약',
    emoji: '🩺',
    advice: null,
    when: null,
  },
  {
    id: 'diabetes',
    name: '당뇨약·인슐린',
    emoji: '💉',
    advice: null,
    when: null,
  },
  {
    id: 'blood-thinner',
    name: '피 묽게 하는 약',
    example: '아스피린 등',
    emoji: '🩸',
    advice: null,
    when: null,
  },
  { id: 'iron', name: '철분제', emoji: '💊', advice: null, when: null },
  {
    id: 'supplement',
    name: '영양제',
    example: '피시오일·오메가3 등',
    emoji: '🐟',
    advice: null,
    when: null,
  },
  {
    id: 'other',
    name: '기타',
    example: '위에 없는 약',
    emoji: '❔',
    advice: null,
    when: null,
  },
];

export function medicationName(id: MedicationId) {
  return medications.find((m) => m.id === id)?.name ?? id;
}
