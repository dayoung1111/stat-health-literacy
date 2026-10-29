import type { GuideKind } from '../guide-catalog';

// 화면 문구(한국어). 다른 언어 파일(en·ja·zh·vi)도 같은 모양이다.
// 함수로 된 문구는 안내 제목·숫자 등이 들어가는 자리다.

// 받침이 있으면 "을", 없으면 "를"
function eul(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '을(를)';
  return code % 28 === 0 ? '를' : '을';
}

export const ko = {
  /** 언어 고르기 목록에 보이는 이름(그 언어로) */
  languageName: '한국어',
  /** 음성 읽기 언어 코드 */
  speechLang: 'ko-KR',
  languagePicker: '언어 선택',

  // 첫 화면
  home: {
    hello: '안녕하세요, 또박이예요.',
    headline: '어려운 병원 안내문,\n쉽게 알려 드릴게요',
    enter: '환자로 들어가기',
    enterHint: '병원에서 받은 번호가 있어요',
    call: '번호를 모르면 병원에 전화',
    staff: '의료진 로그인',
  },

  // 또박이 말풍선·소리 버튼(화면 읽기 프로그램용)
  ttobagi: {
    aria: (message: string) => `또박이: ${message} (누르면 소리로 들어요)`,
    soundOn: '또박이 소리 켜짐. 누르면 꺼요',
    soundOff: '또박이 소리 꺼짐. 누르면 켜요',
  },

  // 번호 입력 화면(/p, 문자 링크로 온 /p/번호)
  entry: {
    back: '처음으로',
    title: '안녕하세요 🙂\n병원에서 받은 번호를\n넣어 주시면 돼요',
    birthOnlyTitle: '안녕하세요 🙂\n생년월일 6자리만\n넣어 주시면 돼요',
    codeLabel: '교육 번호 6자리',
    codeHint: '병원에서 받은 종이에 적혀 있어요',
    birthLabel: '생년월일 6자리',
    birthHint: '예: 1985년 7월 4일 → 850704',
    digit: (label: string, n: number) => `${label} ${n}번째 숫자`,
    submit: '확인 ▶',
    checking: '확인 중…',
    callHelp: '📞 잘 안 되면 병원에 전화',
    typeCode: '교육 번호를 직접 넣을게요',
    badCode: '코드를 다시 확인해 주세요',
    badCodeHint:
      '받은 링크나 QR을 다시 열어 주세요.\n그래도 안 되면 병원에 전화해 주세요.',
    sixDigits: '숫자 6자리를 넣어 주세요',
    locked: '5번 틀려서 잠겼어요. 병원에 전화해서 새 번호를 받아 주세요.',
    wrong: (remaining?: number) =>
      remaining === undefined
        ? '번호나 생년월일을 다시 확인해 주세요'
        : `번호나 생년월일을 다시 확인해 주세요 (남은 횟수 ${remaining}번)`,
  },

  // 안내 사이 이동(수업·약 화면 끝)
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
  statusNow: '👀 보는 중',
  progressCount: (done: number, total: number) =>
    `${total}개 중 ${done}개 완료`,
};

export type Messages = typeof ko;
