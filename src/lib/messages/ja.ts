import type { Messages } from './ko';

// 화면 문구(日本語). 모양은 ko.ts와 같다.
export const ja: Messages = {
  languageName: '日本語',
  speechLang: 'ja-JP',
  languagePicker: '言語の選択',

  home: {
    hello: 'こんにちは、トバギです。',
    headline: 'むずかしい病院の案内を、\nやさしくお伝えします',
    enter: '患者として入る',
    enterHint: '病院でもらった番号があります',
    call: '番号がわからないときは病院に電話',
    staff: '医療スタッフのログイン',
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
    digit: (label, n) => `${label} ${n}けた目`,
    submit: '確認 ▶',
    checking: '確認中…',
    callHelp: '📞 うまくいかないときは病院に電話',
    typeCode: '教育番号を自分で入れます',
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
};
