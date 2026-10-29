// 또박이 안내 영상의 장면 데이터 모양. 다른 검사 안내도 같은 모양으로 만들 수 있다.

export type TtobakAction = 'wave' | 'point' | 'alarm' | 'cheer' | 'stop';

/** avoid: 먹지 마세요, ok: 드셔도 돼요, info: 기억하세요 */
export type CardKind = 'avoid' | 'ok' | 'info';

export type SceneCard = {
  id: string;
  label: string;
  emoji: string;
  kind: CardKind;
};

export type SceneLine = {
  text: string;
  /** 이 자막이 나올 때 강조할 카드 id */
  highlight?: readonly string[];
};

export type Scene = {
  id: string;
  title: string;
  action: TtobakAction;
  cards: readonly SceneCard[];
  lines: readonly SceneLine[];
};
