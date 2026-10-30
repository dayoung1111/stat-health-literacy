// 검진 전날 수업(public/lessons/day-before.html)에 들어가는 한국어 글자 모음.
// 수업 파일에는 글자를 두지 않고, 앱이 고른 언어로 바꾼 이 모양 그대로 수업에 넘긴다(day-before-frame.tsx).
// 여기 있는 글자는 translation-sources.ts가 미리 번역 목록에 모은다(npm run translate:build).
// **…**로 감싼 부분은 말풍선에서 색으로 강조한다. 번역에서도 같은 자리에 ** 가 있어야 강조가 보인다.
// 수업 이름은 "N교시 · 이름"으로 써서 대장내시경과 같은 번역 규칙(Lesson N / N時間目 / 第N节课 / Tiết N)을 따른다.
// 위내시경 수업(gastro-lesson.ts)과 같은 모양이며 글자를 바꾸는 함수(mapLessonStrings)도 그것을 쓴다.

import { mapLessonStrings } from './gastro-lesson';

// 강조 색: r 빨강(하지 않기) / g 초록(하기) / k 청록(알아 둘 것)
export type LineTone = 'r' | 'g' | 'k';

export const dayBeforeLessonKo = {
  ui: {
    frameTitle: '검진 전날 준비 수업',
    back: '← 뒤로',
    title: '검진 전날 준비',
    crumb: '기본 검진',
    ttobak: '또박이',
    coverTitle: '검진 전날, 이것만 지키면 돼요',
    startHint: '소리를 켜면 또박이가 읽어 드려요 · 약 2분',
    startLabel: '수업 시작',
    play: '재생',
    pause: '일시정지',
    prev: '이전',
    prevLabel: '이전 장면',
    next: '다음',
    nextLabel: '다음 장면',
    soundOn: '🔊 소리 켬',
    soundOff: '🔈 소리 끔',
    fullscreen: '전체 화면',
    phoneHint:
      '휴대폰 실제 서비스에서는 재생을 누르면 가로 전체 화면으로 바뀌어요.',
    chapters: '교시 목록',
    learned: '이번 시간에 배운 것',
    learnedEmpty: '수업을 보면 여기에 하나씩 쌓여요.',
    quizTag: '깜짝 퀴즈',
    retry: '괜찮아요. 그 장면을 한 번 더 볼게요.',
    finishChip: '수업 완료',
    night: '밤',
  },
  // 장면마다: 이름("N교시 · 제목"), 배운 것, 그림 이름표, 자막(들)
  scenes: [
    {
      name: '1교시 · 인사',
      learned: '',
      labels: [] as string[],
      lines: [
        {
          tone: 'k' as LineTone,
          text: '안녕하세요, 저는 **또박이**예요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '검진 **전날** 지킬 일 **다섯 가지**를 알려 드릴게요.',
          small: '',
        },
      ],
    },
    {
      name: '2교시 · 가벼운 저녁',
      learned: '저녁은 가볍고 소화가 잘 되는 음식',
      labels: ['부드러운 죽', '맑은 국', '기름진 음식'],
      lines: [
        {
          tone: 'g' as LineTone,
          text: '전날 저녁은 **가볍고 소화가 잘 되는** 음식으로 드세요.',
          small: '',
        },
        {
          tone: 'r' as LineTone,
          text: '**기름진 음식**은 피하세요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '피 검사와 배 초음파 결과가 달라질 수 있어요.',
          small: '피 속 기름(중성지방) 수치가 높게 나올 수 있어요',
        },
      ],
    },
    {
      name: '3교시 · 밤 9시 금식',
      learned: '밤 9시부터 금식 (물·껌·사탕·담배도 안 돼요)',
      labels: ['밤 9시', '물', '껌', '담배'],
      lines: [
        {
          tone: 'r' as LineTone,
          text: '**밤 9시**부터는 아무것도 드시면 안 돼요.',
          small: '',
        },
        {
          tone: 'r' as LineTone,
          text: '**물**도 마시지 않아요.',
          small: '',
        },
        {
          tone: 'r' as LineTone,
          text: '**껌, 사탕, 담배**도 안 돼요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '적어도 **8시간**은 속을 비워야 해요.',
          small: '',
        },
      ],
    },
    {
      name: '4교시 · 술 피하기',
      learned: '검진 2~3일 전부터 술 피하기',
      labels: ['맥주', '소주', '와인'],
      lines: [
        {
          tone: 'r' as LineTone,
          text: '술은 검진 **2~3일 전**부터 피하는 것이 좋아요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '간 검사 수치와 피 속 기름 수치가 올라갈 수 있어요.',
          small: '',
        },
      ],
    },
    {
      name: '5교시 · 운동 쉬기',
      learned: '전날 격한 운동은 쉬기',
      labels: ['무거운 운동', '오래 달리기'],
      lines: [
        {
          tone: 'r' as LineTone,
          text: '전날에는 **힘든 운동**을 하지 마세요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '근육 검사 수치나 소변 검사 결과가 달라질 수 있어요.',
          small: '',
        },
      ],
    },
    {
      name: '6교시 · 푹 자기',
      learned: '일찍 누워 충분히 자기 (혈압에 영향)',
      labels: ['일찍, 푹 자기'],
      lines: [
        {
          tone: 'g' as LineTone,
          text: '전날 밤에는 **일찍 누워 잠을 충분히** 자 두세요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '잠이 부족하면 **혈압**이 높게 나올 수 있어요.',
          small: '',
        },
        {
          tone: 'k' as LineTone,
          text: '다섯 가지 모두 배웠어요! 이제 **퀴즈**를 풀어 볼까요?',
          small: '',
        },
      ],
    },
  ],
  quizzes: [
    {
      question: '밤 9시가 넘었어요. 목이 마르면 물을 마셔도 될까요?',
      options: ['마셔도 돼요', '안 돼요'],
      ok: '맞아요! 밤 9시부터는 물도 안 돼요.',
    },
    {
      question: '술은 언제부터 피하면 좋을까요?',
      options: ['검진 당일 아침', '검진 2~3일 전'],
      ok: '맞아요! 2~3일 전부터 피해요.',
    },
  ],
  cheer: '참 잘했어요! 검진 전날 준비를 **모두 배웠어요**.',
};

export type DayBeforeLessonTexts = typeof dayBeforeLessonKo;

/** 수업 글자 중 번역할 글자 전부(중복 없이, 빈 글자 제외) */
export function dayBeforeLessonSources() {
  const found = new Set<string>();
  mapLessonStrings(dayBeforeLessonKo, (text) => {
    if (text) found.add(text);
    return text;
  });
  return [...found];
}
