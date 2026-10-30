// 카카오톡·네이버·인스타그램 같은 앱 안 브라우저인지 알아낸다.
// 앱 안 브라우저는 전체 화면·가로 고정이 잘 안 되어서, 수업 전체 화면에 "Safari나 크롬으로 열기" 띠를 보여 준다.

export type InAppBrowser = 'kakao' | 'other';

const otherApps = [
  /NAVER\(inapp|; ?NAVER/i,
  /Instagram/i,
  /FBAN|FBAV|FB_IAB/i,
  /\bLine\//i,
  /DaumApps/i,
  /BAND\//i,
  /everytimeApp/i,
];

/** 앱 안 브라우저면 'kakao' 또는 'other', 일반 Safari·크롬이면 null */
export function inAppBrowser(userAgent: string): InAppBrowser | null {
  if (/KAKAOTALK/i.test(userAgent)) return 'kakao';
  return otherApps.some((app) => app.test(userAgent)) ? 'other' : null;
}

/** 카카오톡에서 지금 주소를 기기 기본 브라우저(Safari·크롬)로 여는 주소 */
export const kakaoOpenExternal = (url: string) =>
  `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
