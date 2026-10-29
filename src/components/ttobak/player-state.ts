// 플레이어의 재생 상태 계산. 화면·음성과 분리해 테스트하기 쉽게 둔다.

/** 음성이 없을 때 자막 한 줄을 보여 주는 최소 시간 */
export const MIN_LINE_MS = 3000;
/** 글자 하나를 읽는 데 걸리는 시간(천천히 읽는 속도 기준) */
export const MS_PER_CHAR = 250;
/** 자막과 자막 사이에 쉬는 시간 */
export const LINE_GAP_MS = 600;

export function getLineDuration(text: string): number {
  const letters = text.replace(/\s/g, '').length;
  return Math.max(MIN_LINE_MS, letters * MS_PER_CHAR) + LINE_GAP_MS;
}

export type PlayerStatus = 'ready' | 'playing' | 'paused' | 'ended';

export type PlayerState = {
  status: PlayerStatus;
  sceneIndex: number;
  lineIndex: number;
  /** 줄이 바뀌거나 다시 재생할 때마다 늘어나 음성을 새로 시작하게 한다. */
  cue: number;
};

export type PlayerAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'lineEnded' }
  | { type: 'goToScene'; index: number };

type SceneShape = { lines: readonly unknown[] };

export const initialPlayerState: PlayerState = {
  status: 'ready',
  sceneIndex: 0,
  lineIndex: 0,
  cue: 0,
};

export function reducePlayer(
  scenes: readonly SceneShape[],
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  switch (action.type) {
    case 'play':
      if (state.status === 'playing') return state;
      if (state.status === 'ended') {
        return { status: 'playing', sceneIndex: 0, lineIndex: 0, cue: state.cue + 1 };
      }
      // 일시정지 후에는 지금 줄을 처음부터 다시 읽는다.
      return { ...state, status: 'playing', cue: state.cue + 1 };

    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;

    case 'lineEnded': {
      // 멈춘 뒤 늦게 도착한 종료 알림은 무시한다.
      if (state.status !== 'playing') return state;
      if (state.lineIndex + 1 < scenes[state.sceneIndex].lines.length) {
        return { ...state, lineIndex: state.lineIndex + 1, cue: state.cue + 1 };
      }
      if (state.sceneIndex + 1 < scenes.length) {
        return {
          ...state,
          sceneIndex: state.sceneIndex + 1,
          lineIndex: 0,
          cue: state.cue + 1,
        };
      }
      return { ...state, status: 'ended' };
    }

    case 'goToScene':
      if (action.index < 0 || action.index >= scenes.length) return state;
      return {
        status: state.status === 'paused' ? 'paused' : 'playing',
        sceneIndex: action.index,
        lineIndex: 0,
        cue: state.cue + 1,
      };
  }
}
