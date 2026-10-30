import type { TranslatableLanguage } from './translation-rules';

// 안내 캐릭터 "또박이"의 이름.
// written: 화면 글자와 번역문에 쓰는 표기(팀이 정한 것). 번역 규칙(translate.ts)도 이것을 쓴다.
// spoken: 읽어 주기(음성)에만 쓰는 발음용 철자. 화면 글자는 바뀌지 않는다.
//   en  Ttobagi → "토바지"로 읽혀서 Toh-bah-ghee (또바기에 가깝게)
//   zh  小朵比(xiǎo duǒ bǐ)는 또바기와 소리가 달라서 托巴基(tuō bā jī)
//   vi  Ttobagi는 "tt"를 이상하게 읽어서 Tô ba ghi(gh = 단단한 g)
//   ja  トバギ는 그대로 자연스럽게 읽히므로 같게 둔다.
// 소리가 어떻게 들리는지는 기기마다 다르므로 실제 기기에서 들어 보고 고친다.
export const characterNames: Record<
  TranslatableLanguage,
  { written: string; spoken: string }
> = {
  en: { written: 'Ttobagi', spoken: 'Toh-bah-ghee' },
  ja: { written: 'トバギ', spoken: 'トバギ' },
  zh: { written: '小朵比', spoken: '托巴基' },
  vi: { written: 'Ttobagi', spoken: 'Tô ba ghi' },
};

/**
 * 읽어 줄 문장에서 또박이 이름을 발음용 철자로 바꾼다.
 * language는 'en' 같은 언어 코드나 'en-US' 같은 음성 언어 태그. 한국어·모르는 언어는 그대로 둔다.
 */
export function forSpeech(text: string, language: string) {
  const code = language.slice(0, 2).toLowerCase();
  if (!(code in characterNames)) return text;
  const { written, spoken } = characterNames[code as TranslatableLanguage];
  return written === spoken ? text : text.split(written).join(spoken);
}
