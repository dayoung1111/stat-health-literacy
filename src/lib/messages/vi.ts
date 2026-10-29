import type { Messages } from './ko';

// 안내 사이 이동 문구(Tiếng Việt). 모양은 ko.ts와 같다.
export const vi: Messages = {
  guides: {
    checkup: 'Khám sức khỏe cơ bản',
    colonoscopy: 'Nội soi đại tràng',
    gastroscopy: 'Nội soi dạ dày',
    medication: 'Thuốc đang dùng',
  },
  guideDoneNext: (done, next) =>
    `Xong bài ${done}! Bây giờ chúng ta sẽ xem ${next}.`,
  nextButton: (next) => `Tiếp theo: ${next} ▶`,
  allDone: 'Đã xong tất cả bài học! Bạn làm rất tốt.',
  restart: 'Học lại từ đầu',
  progressTitle: 'Hướng dẫn đã nhận',
  statusDone: '✅ Đã xong',
  statusLeft: '▶ Còn lại',
};
