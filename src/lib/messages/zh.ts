import type { Messages } from './ko';

// 안내 사이 이동 문구(中文). 모양은 ko.ts와 같다.
export const zh: Messages = {
  guides: {
    checkup: '健康体检基本事项',
    colonoscopy: '结肠镜检查',
    gastroscopy: '胃镜检查',
    medication: '您服用的药',
  },
  guideDoneNext: (done, next) => `${done}课程结束！现在我们来看${next}。`,
  nextButton: (next) => `下一个：${next} ▶`,
  allDone: '全部课程结束！您做得非常好。',
  restart: '从头再来',
  progressTitle: '收到的指南',
  statusDone: '✅ 已完成',
  statusLeft: '▶ 还没看',
};
