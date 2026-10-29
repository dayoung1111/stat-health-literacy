// 미리 번역 파일(src/lib/translations/*.json)을 만든다. 한국어 원문 목록(translation-sources.ts)과 비교해
// 아직 없는 문장·바뀐 문장만 AI로 번역하고, 더 이상 쓰지 않는 문장은 지운다.
// 이미 있는 번역은 건드리지 않으므로, 사람이 json 파일에서 직접 고친 번역은 원문이 같은 한 그대로 남는다.
//   npm run translate:build  → 빠진 문장을 번역해서 파일에 저장(.env의 ANTHROPIC_API_KEY 필요)
//   npm run translate:check  → 빠진 문장이 몇 개인지만 확인(AI를 부르지 않음)
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { translateTexts } from '../src/lib/translate';
import { presetSourceTexts } from '../src/lib/translation-sources';
import { translatableLanguages } from '../src/lib/translation-rules';

const checkOnly = process.argv.includes('--check');
const sources = presetSourceTexts();
const fileOf = (language: string) =>
  path.join(process.cwd(), 'src/lib/translations', `${language}.json`);

async function build(language: string) {
  const existing: Record<string, string> = JSON.parse(
    readFileSync(fileOf(language), 'utf8'),
  );
  const missing = sources.filter((text) => !existing[text]);
  const obsolete = Object.keys(existing).filter((k) => !sources.includes(k));
  if (checkOnly) {
    console.log(
      `${language}: 빠진 문장 ${missing.length}개, 안 쓰는 문장 ${obsolete.length}개`,
    );
    return missing.length;
  }

  const translated = missing.length
    ? await translateTexts(language, missing, { skipLimit: true })
    : [];
  const next: Record<string, string> = {};
  let failed = 0;
  for (const text of sources) {
    const index = missing.indexOf(text);
    const value = index === -1 ? existing[text] : translated[index];
    // 번역에 실패하면 한국어 원문이 그대로 돌아오므로 저장하지 않는다.
    if (value && value !== text) next[text] = value;
    else failed += 1;
  }
  writeFileSync(fileOf(language), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(
    `${language}: 새로 번역 ${missing.length - failed}개, 실패 ${failed}개, 지움 ${obsolete.length}개 (전체 ${Object.keys(next).length}/${sources.length})`,
  );
  return failed;
}

async function main() {
  console.log(`한국어 원문 ${sources.length}개`);
  const results = await Promise.all(translatableLanguages.map(build));
  process.exit(results.some((n) => n > 0) ? 1 : 0);
}

void main();
