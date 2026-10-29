// 의료진이 코드 하나에 묶어 보낼 수 있는 안내 종류.
// 의료진 발급 화면·환자 홈 카드·의료진 목록·서버 입력 검사가 함께 쓴다.

export const guideKinds = [
  'checkup',
  'colonoscopy',
  'gastroscopy',
  'medication',
] as const;

export type GuideKind = (typeof guideKinds)[number];

export type GuideIcon = 'checkup' | 'endoscope' | 'pill' | 'colon' | 'stomach';

// ready: 환자 화면에 보여 줄 안내 내용이 있는지. false면 "안내 내용 준비 중이에요".
export const guideCatalog: Record<
  GuideKind,
  {
    name: string;
    /** 환자 홈 카드에 쓰는 이름(없으면 name) */
    patientName?: string;
    hint?: string;
    icon: GuideIcon;
    ready: boolean;
  }
> = {
  checkup: { name: '건강검진 기본 확인사항', icon: 'checkup', ready: true },
  colonoscopy: { name: '대장내시경', icon: 'colon', ready: true },
  gastroscopy: { name: '위내시경', icon: 'stomach', ready: true },
  medication: {
    name: '복용약·영양제 안내',
    patientName: '드시는 약',
    hint: '드시는 약, 드셔도 되는지 확인',
    icon: 'pill',
    ready: true,
  },
};

export function guideNames(kinds: readonly GuideKind[]) {
  return kinds.map((kind) => guideCatalog[kind].name);
}
