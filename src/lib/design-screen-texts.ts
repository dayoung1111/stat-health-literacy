// 환자 화면(받은 안내 목록·검사별 안내 홈) 새 디자인에 쓰는 한국어 문구.
// 화면에서는 <T>로 고른 언어로 바꿔 보여 준다. 의료 안내 내용은 넣지 않는다(안내 내용은 demo-guide.ts 그대로).
export const designTexts = {
  guidesCame: (count: number) => `안내가 ${count}개 왔어요. 1번부터 같이 봐요!`,
  statusDone: '완료',
  statusLeft: '안 봄',
  todayTodo: '오늘 할 일',
  lesson: '또박이 선생님 수업',
  fromStart: '처음부터 보기',
};
