// "전체 화면 영상 틀"(video-frame.tsx)의 열기·닫기 규칙. 화면(DOM)과 떨어져 있어 테스트할 수 있다.
// - 열 때마다 처음부터 똑같이 연다(화면 맨 위로 꺼내기 → 기기 전체 화면·가로 고정 시도).
//   "한 번 열었음" 같은 기록을 남기지 않아 몇 번을 닫았다 열어도 매번 열린다.
// - 닫으면 연 것을 전부 되돌린다(기기 전체 화면·가로 고정 풀기, 뒤 화면 스크롤 막기·꺼내기 되돌리기).
// - 안드로이드 뒤로가기·시스템 제스처로 기기 전체 화면이 꺼지면 우리 화면도 닫는다.

export type FrameEnv = {
  /** 화면 맨 위 층으로 꺼내고 뒤 화면 스크롤을 막는다. 되돌리는 함수를 돌려준다. */
  liftOut: () => () => void;
  /** 기기 전체 화면(Fullscreen API) + 가로 고정을 시도한다. 기기 전체 화면이 되면 true. */
  enterSystem: () => Promise<boolean>;
  /** 기기 전체 화면과 가로 고정을 푼다(안 되어 있으면 아무 일도 하지 않는다). */
  exitSystem: () => void;
  /** 지금 이 틀이 기기 전체 화면인지 */
  isSystemFullscreen: () => boolean;
};

export type FrameController = ReturnType<typeof createFrameController>;

export function createFrameController(
  env: FrameEnv,
  events: {
    /** 열림·닫힘이 바뀌었을 때(화면을 다시 그리게 한다) */
    onChange: (open: boolean) => void;
    /** 닫았을 때(영상 일시정지 등) */
    onClose?: () => void;
  },
) {
  let isOpen = false;
  let usedSystem = false;
  let undo: (() => void) | null = null;

  const controller = {
    isOpen: () => isOpen,

    /** 전체 화면으로 연다. 이미 열려 있으면 그대로 둔다. */
    open() {
      if (isOpen) return;
      isOpen = true;
      undo = env.liftOut();
      events.onChange(true);
      void env.enterSystem().then((ok) => {
        // 기기 전체 화면이 되기 전에 이미 닫았으면 바로 푼다.
        if (!isOpen) {
          if (ok) env.exitSystem();
          return;
        }
        usedSystem = ok;
      });
    },

    /** 닫고 연 것을 전부 되돌린다. 이미 닫혀 있으면 아무 일도 하지 않는다. */
    close() {
      if (!isOpen) return;
      isOpen = false;
      usedSystem = false;
      env.exitSystem();
      undo?.();
      undo = null;
      events.onChange(false);
      events.onClose?.();
    },

    /** 재생 버튼: 휴대폰이면 누를 때마다 전체 화면으로 연다. */
    play(isPhone: boolean) {
      if (isPhone) controller.open();
    },

    /** 기기 전체 화면이 바뀌었을 때(뒤로가기·시스템 제스처·Esc로 꺼짐) 우리 화면도 맞춘다. */
    systemChanged() {
      if (usedSystem && !env.isSystemFullscreen()) controller.close();
    },
  };
  return controller;
}
