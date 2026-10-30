import type { Messages } from './ko';

// 화면 문구(English). 모양은 ko.ts와 같다.
export const en: Messages = {
  languageName: 'English',
  speechLang: 'en-US',
  languagePicker: 'Language',

  home: {
    hello: "Hello, I'm Ttobagi.",
    headline: 'Hard hospital instructions,\nmade easy',
    enter: 'Enter as a patient',
    enterHint: 'I have a number from the hospital',
    call: 'No number? Call the hospital',
    staff: 'Staff login',
  },

  ttobagi: {
    aria: (message) => `Ttobagi: ${message} (tap to hear it)`,
    soundOn: 'Ttobagi sound on. Tap to turn off',
    soundOff: 'Ttobagi sound off. Tap to turn on',
  },

  entry: {
    back: 'Back to start',
    title: 'Hello 🙂\nPlease enter the number\nfrom the hospital',
    birthOnlyTitle: 'Hello 🙂\nPlease enter just your\n6-digit date of birth',
    codeLabel: '6-digit education number',
    codeHint: 'It is on the paper from the hospital',
    birthLabel: '6-digit date of birth',
    birthHint: 'e.g. July 4, 1985 → 850704',
    codeDigit: (n) => `Education number, digit ${n}`,
    birthDigit: (n) => `Date of birth, digit ${n}`,
    submit: 'OK ▶',
    checking: 'Checking…',
    callHelp: '📞 Having trouble? Call the hospital',
    typeCode: 'I will type the education number',
    badCode: 'Please check your code again',
    badCodeHint:
      'Please open the link or QR code you received again.\nIf it still does not work, please call the hospital.',
    sixDigits: 'Please enter 6 digits',
    locked:
      'Locked after 5 wrong tries. Please call the hospital for a new number.',
    wrong: (remaining) =>
      remaining === undefined
        ? 'Please check the number or date of birth'
        : `Please check the number or date of birth (${remaining} tries left)`,
  },

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
  statusNow: '👀 Viewing now',
  progressCount: (done, total) => `${done} of ${total} done`,
};
