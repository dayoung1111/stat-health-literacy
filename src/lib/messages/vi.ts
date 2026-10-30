import type { Messages } from './ko';

// 화면 문구(Tiếng Việt). 모양은 ko.ts와 같다.
export const vi: Messages = {
  languageName: 'Tiếng Việt',
  speechLang: 'vi-VN',
  languagePicker: 'Chọn ngôn ngữ',

  home: {
    hello: 'Xin chào, tôi là Ttobagi!',
    headline: 'Hướng dẫn bệnh viện khó hiểu,\nnay thật dễ hiểu',
    enter: 'Vào dành cho bệnh nhân',
    enterHint: 'Hãy nhập mã số bệnh viện đã đưa',
    call: 'Không có mã số? Gọi bệnh viện',
    staff: 'Đăng nhập nhân viên y tế',
    howTitle: 'Cách dùng',
    how: ['Nhập mã số', 'Bài học Ttobagi', 'Câu đố nhanh'],
  },

  ttobagi: {
    aria: (message) => `Ttobagi: ${message} (chạm để nghe)`,
    soundOn: 'Âm thanh Ttobagi đang bật. Chạm để tắt',
    soundOff: 'Âm thanh Ttobagi đang tắt. Chạm để bật',
  },

  entry: {
    back: 'Về trang đầu',
    title: 'Xin chào 🙂\nHãy nhập mã số\nbệnh viện đã đưa',
    birthOnlyTitle: 'Xin chào 🙂\nChỉ cần nhập 6 số\nngày sinh',
    codeLabel: 'Mã số giáo dục 6 chữ số',
    codeHint: 'Có ghi trên tờ giấy bệnh viện đưa',
    birthLabel: 'Ngày sinh 6 chữ số',
    birthHint: 'Ví dụ: ngày 4 tháng 7 năm 1985 → 850704',
    codeDigit: (n) => `Mã số giáo dục, số thứ ${n}`,
    birthDigit: (n) => `Ngày sinh, số thứ ${n}`,
    submit: 'Xác nhận ▶',
    checking: 'Đang kiểm tra…',
    callHelp: '📞 Gặp khó khăn? Gọi bệnh viện',
    typeCode: 'Tôi sẽ tự nhập mã số giáo dục',
    badCode: 'Vui lòng kiểm tra lại mã',
    badCodeHint:
      'Vui lòng mở lại đường link hoặc mã QR đã nhận.\nNếu vẫn không được, vui lòng gọi cho bệnh viện.',
    sixDigits: 'Hãy nhập 6 chữ số',
    locked: 'Đã bị khóa vì sai 5 lần. Hãy gọi bệnh viện để nhận mã số mới.',
    wrong: (remaining) =>
      remaining === undefined
        ? 'Hãy kiểm tra lại mã số hoặc ngày sinh'
        : `Hãy kiểm tra lại mã số hoặc ngày sinh (còn ${remaining} lần)`,
  },

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
  statusNow: '👀 Đang xem',
  progressCount: (done, total) => `Đã xong ${done}/${total}`,
};
