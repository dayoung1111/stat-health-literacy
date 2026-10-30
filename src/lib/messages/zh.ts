import type { Messages } from './ko';

// 화면 문구(中文). 모양은 ko.ts와 같다.
export const zh: Messages = {
  languageName: '中文',
  speechLang: 'zh-CN',
  languagePicker: '选择语言',

  home: {
    hello: '您好，我是小朵比！',
    headline: '难懂的医院说明，\n简单讲给您听',
    enter: '患者入口',
    enterHint: '请输入医院给的号码',
    call: '不知道号码请致电医院',
    staff: '医护人员登录',
    howTitle: '使用方法',
    how: ['输入号码', '小朵比课堂', '突击小测验'],
  },

  ttobagi: {
    aria: (message) => `小朵比：${message}（点击可听语音）`,
    soundOn: '小朵比声音已开启。点击关闭',
    soundOff: '小朵比声音已关闭。点击开启',
  },

  entry: {
    back: '回到首页',
    title: '您好 🙂\n请输入医院给您的\n号码',
    birthOnlyTitle: '您好 🙂\n只需输入6位\n出生日期',
    codeLabel: '6位教育号码',
    codeHint: '写在医院给您的纸上',
    birthLabel: '6位出生日期',
    birthHint: '例：1985年7月4日 → 850704',
    codeDigit: (n) => `教育号码 第${n}位`,
    birthDigit: (n) => `出生日期 第${n}位`,
    submit: '确认 ▶',
    checking: '正在确认…',
    callHelp: '📞 有困难请致电医院',
    typeCode: '我自己输入教育号码',
    badCode: '请再确认一下代码',
    badCodeHint:
      '请重新打开收到的链接或二维码。\n如果还是不行，请给医院打电话。',
    sixDigits: '请输入6位数字',
    locked: '已输错5次，已被锁定。请致电医院获取新号码。',
    wrong: (remaining) =>
      remaining === undefined
        ? '请再次确认号码或出生日期'
        : `请再次确认号码或出生日期（还剩${remaining}次）`,
  },

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
  statusNow: '👀 正在看',
  progressCount: (done, total) => `${total}个中已完成${done}个`,
};
