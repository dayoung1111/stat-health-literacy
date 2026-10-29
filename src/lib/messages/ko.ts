import type { GuideKind } from '../guide-catalog';

// 안내 사이 이동 문구(한국어). 다른 언어 파일(en·zh·vi)도 같은 모양이다.
// done·next에는 안내 제목(아래 guides)이 들어간다.

// 받침이 있으면 "을", 없으면 "를"
function eul(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '을(를)';
  return code % 28 === 0 ? '를' : '을';
}

export const ko = {
  guides: {
    checkup: '건강검진 기본 확인사항',
    colonoscopy: '대장내시경',
    gastroscopy: '위내시경',
    medication: '드시는 약',
  } satisfies Record<GuideKind, string>,
  guideDoneNext: (done: string, next: string) =>
    `${done} 수업 끝! 이제 ${next}${eul(next)} 볼게요.`,
  nextButton: (next: string) => `다음: ${next} ▶`,
  allDone: '모든 수업 끝! 정말 잘하셨어요.',
  restart: '처음부터 다시',
  progressTitle: '받은 안내',
  statusDone: '✅ 완료',
  statusLeft: '▶ 남은 안내',
};

export type Messages = typeof ko;
