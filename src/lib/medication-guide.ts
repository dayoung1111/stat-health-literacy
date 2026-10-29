// 복용약 안내(STAT 교육내용 초안 "D. 복용약" 표). 나이대와 상관없이 항상 전체 목록을 보낸다(언어·큰 글씨만 적용).
// 검수 예정: 팀(간호학과)이 만든 내용이며 2026-10-30 최종 검수 예정이다. 표에 없는 내용은 넣지 않는다.
// 화면은 고른 약마다 1) 판정 → 2) 자세히 → 3) 확인 질문 순서로 보여 준다.

export const medicationIds = [
  'blood-pressure',
  'diabetes',
  'insulin',
  'blood-thinner',
  'supplement',
  'other',
] as const;

export type MedicationId = (typeof medicationIds)[number];

/** 판정 기준: 🟢 드세요 / ❌ 드시지 마세요 / 📞 간호사에게 물어보세요 */
export type Verdict = 'ok' | 'stop' | 'ask';

export const verdictLabels: Record<Verdict, string> = {
  ok: '드세요',
  stop: '드시지 마세요',
  ask: '간호사에게 물어보세요',
};

// 그림 이름. 실제 그림은 화면 쪽 SVG(med-icons.tsx)로 그린다.
export type MedIconName =
  | 'pill'
  | 'syringe'
  | 'drop'
  | 'leaf'
  | 'clipboard'
  | 'half-cup'
  | 'bag'
  | 'candy'
  | 'hand'
  | 'doctor'
  | 'nurse'
  | 'person'
  | 'phone'
  | 'ok'
  | 'stop';

/** 2화면 "자세히" 한 줄: 큰 그림 + 짧은 말. no면 빨간 ✕를 겹친다. */
export type MedDetail =
  | { kind: 'clock'; hour: number; text: string; no?: boolean }
  | { kind: 'calendar'; label: string; text: string; no?: boolean }
  | { kind: 'icon'; icon: MedIconName; text: string; no?: boolean }
  /** 피를 묽게 하는 약 중단 시작일. 의료진이 입력한 날짜, 없으면 "의사 선생님과 정한 날짜부터" */
  | { kind: 'stop-date' };

export type MedQuizOption = {
  value: string;
  icon: MedIconName;
  text: string;
  correct?: boolean;
};

export type Medication = {
  id: MedicationId;
  name: string;
  icon: MedIconName;
  verdict: Verdict;
  details: MedDetail[];
  quiz: { question: string; options: MedQuizOption[] };
};

const yesNo = (yes: string, no: string, answer: 'yes' | 'no') => [
  { value: 'yes', icon: 'ok' as const, text: yes, correct: answer === 'yes' },
  { value: 'no', icon: 'stop' as const, text: no, correct: answer === 'no' },
];

export const medications: Medication[] = [
  {
    id: 'blood-pressure',
    name: '혈압약',
    icon: 'pill',
    verdict: 'ok',
    details: [
      { kind: 'clock', hour: 6, text: '검사날 아침 6시' },
      { kind: 'icon', icon: 'half-cup', text: '물 반 컵' },
    ],
    quiz: {
      question: '검사날 아침\n혈압약 먹어요?',
      options: yesNo('먹어요', '안 먹어요', 'yes'),
    },
  },
  {
    id: 'diabetes',
    name: '당뇨약',
    icon: 'pill',
    verdict: 'stop',
    details: [
      { kind: 'clock', hour: 6, text: '검사날 아침 안 먹어요', no: true },
      { kind: 'icon', icon: 'bag', text: '약은 챙겨 오기' },
    ],
    quiz: {
      question: '검사날 아침\n당뇨약 먹어요?',
      options: yesNo('먹어요', '안 먹어요', 'no'),
    },
  },
  {
    id: 'insulin',
    name: '인슐린',
    icon: 'syringe',
    verdict: 'ask',
    details: [
      { kind: 'clock', hour: 7, text: '전날 저녁 주사 → 간호사 확인' },
      {
        kind: 'icon',
        icon: 'syringe',
        text: '검사날 아침 주사 안 돼요',
        no: true,
      },
      { kind: 'icon', icon: 'candy', text: '사탕 챙겨 오기' },
    ],
    quiz: {
      question: '인슐린은\n누구 말대로 해요?',
      options: [
        { value: 'nurse', icon: 'nurse', text: '간호사', correct: true },
        { value: 'self', icon: 'person', text: '내 마음대로' },
      ],
    },
  },
  {
    id: 'blood-thinner',
    name: '피를 묽게 하는 약',
    icon: 'drop',
    verdict: 'ask',
    details: [
      { kind: 'icon', icon: 'hand', text: '혼자 끊으면 안 돼요', no: true },
      { kind: 'icon', icon: 'doctor', text: '검사 2주 전 의사 상담' },
      { kind: 'stop-date' },
    ],
    quiz: {
      question: '이 약,\n혼자 끊어도 돼요?',
      options: yesNo('돼요', '안 돼요', 'no'),
    },
  },
  {
    id: 'supplement',
    name: '영양제·한약',
    icon: 'leaf',
    verdict: 'stop',
    details: [
      { kind: 'calendar', label: '7일 전', text: '검사 일주일 전부터' },
      { kind: 'icon', icon: 'pill', text: '철분제도 포함' },
    ],
    quiz: {
      question: '검사 일주일 전,\n한약 먹어요?',
      options: yesNo('먹어요', '안 먹어요', 'no'),
    },
  },
  {
    id: 'other',
    name: '기타 약',
    icon: 'clipboard',
    verdict: 'ask',
    details: [
      { kind: 'calendar', label: '7일 전', text: '검사 일주일 전' },
      { kind: 'icon', icon: 'phone', text: '병원에 전화' },
    ],
    quiz: {
      question: '모르는 약,\n병원에 전화해요?',
      options: yesNo('전화해요', '안 해요', 'yes'),
    },
  },
];

export function findMedication(id: string) {
  return medications.find((m) => m.id === id);
}

export function medicationName(id: string) {
  return findMedication(id)?.name ?? id;
}
