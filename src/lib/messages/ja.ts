import type { Messages } from './ko';

// 화면 문구(日本語). 모양은 ko.ts와 같다.
export const ja: Messages = {
  languageName: '日本語',
  speechLang: 'ja-JP',
  languagePicker: '言語の選択',

  home: {
    hello: 'こんにちは、トバギです！',
    headline: 'むずかしい病院の案内を、\nやさしくお伝えします',
    enter: '患者として入る',
    enterHint: '病院でもらった番号を入れてください',
    call: '番号がわからないときは病院に電話',
    staff: '医療スタッフのログイン',
    howTitle: 'つかいかた',
    how: ['番号を入れる', 'トバギの授業', 'とつぜんクイズ'],
  },

  ttobagi: {
    aria: (message) => `トバギ：${message}（押すと音声で聞けます）`,
    soundOn: 'トバギの音声オン。押すとオフになります',
    soundOff: 'トバギの音声オフ。押すとオンになります',
  },

  entry: {
    back: '最初へ',
    title: 'こんにちは 🙂\n病院でもらった番号を\n入れてください',
    birthOnlyTitle: 'こんにちは 🙂\n生年月日6けただけ\n入れてください',
    codeLabel: '教育番号6けた',
    codeHint: '病院でもらった紙に書いてあります',
    birthLabel: '生年月日6けた',
    birthHint: '例：1985年7月4日 → 850704',
    codeDigit: (n) => `教育番号 ${n}けた目`,
    birthDigit: (n) => `生年月日 ${n}けた目`,
    submit: '進む',
    bubble: '紙に書かれた番号を入れてください',
    bubbleBirth: '生年月日6桁を入れてください',
    privacy: '生年月日は本人確認にだけ使い、お名前はお聞きしません。',
    checking: '確認中…',
    callHelp: '📞 うまくいかないときは病院に電話',
    typeCode: '教育番号を自分で入れます',
    badCode: 'コードをもう一度確認してください',
    badCodeHint:
      '受け取ったリンクかQRコードをもう一度開いてください。\nそれでもだめなら病院に電話してください。',
    sixDigits: '数字6けたを入れてください',
    locked:
      '5回まちがえたのでロックされました。病院に電話して新しい番号をもらってください。',
    wrong: (remaining) =>
      remaining === undefined
        ? '番号か生年月日をもう一度確かめてください'
        : `番号か生年月日をもう一度確かめてください（残り${remaining}回）`,
  },

  guides: {
    checkup: '健康診断の基本確認事項',
    colonoscopy: '大腸内視鏡',
    gastroscopy: '胃内視鏡',
    medication: '飲んでいる薬',
  },
  guideDoneNext: (done, next) =>
    `${done}の授業おわり！次は${next}を見ましょう。`,
  nextButton: (next) => `次へ：${next} ▶`,
  allDone: 'すべての授業おわり！本当によくできました。',
  restart: '最初からもう一度',
  progressTitle: '受け取った案内',
  statusDone: '✅ 完了',
  statusLeft: '▶ 残りの案内',
  statusNow: '👀 見ている',
  progressCount: (done, total) => `${total}個中${done}個完了`,
};
