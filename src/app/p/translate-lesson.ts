import { mapLessonStrings } from '@/lib/gastro-lesson';

import { translateForPatient } from './translate-actions';

// 수업(위내시경·검진 전날) 글자를 고른 언어로 번역한다(미리 번역 파일 → 저장된 번역 → AI, 대장내시경과 같은 서버 함수).
// 번역이 안 된 글자는 한국어 그대로 남는다.
export async function translateLesson<T>(
  language: string,
  korean: T,
  sources: string[],
): Promise<T> {
  if (language === 'ko') return korean;
  const done = new Map<string, string>();
  for (let start = 0; start < sources.length; start += 40) {
    const chunk = sources.slice(start, start + 40);
    try {
      const out = await translateForPatient(language, chunk);
      chunk.forEach((text, i) => {
        if (out[i]) done.set(text, out[i]);
      });
    } catch {
      // 이 묶음은 한국어로 보여 준다.
    }
  }
  return mapLessonStrings(korean, (text) => done.get(text) ?? text);
}
