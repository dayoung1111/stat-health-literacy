import type { Messages } from './ko';

// 안내 사이 이동 문구(English). 모양은 ko.ts와 같다.
export const en: Messages = {
  guides: {
    checkup: 'Health checkup basics',
    colonoscopy: 'Colonoscopy',
    gastroscopy: 'Gastroscopy',
    medication: 'Your medicines',
  },
  guideDoneNext: (done, next) =>
    `${done} lesson done! Now let's look at ${next}.`,
  nextButton: (next) => `Next: ${next} ▶`,
  allDone: 'All lessons done! You did a great job.',
  restart: 'Start over',
  progressTitle: 'Your guides',
  statusDone: '✅ Done',
  statusLeft: '▶ Still to see',
};
