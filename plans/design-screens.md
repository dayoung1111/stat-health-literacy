# 환자 화면 디자인 정리 (design/screens)

- 작성: 2026-10-30, 작성자 kongariapp
- 브랜치: `design/screens` (최신 main `0907188`에서 시작)
- 담당: 환자용 "번호 넣기", "받은 안내 목록", "검사별 안내 홈"
- 원칙: 겉모양만 바꾸고 버튼·링크가 가는 곳과 기능 코드는 그대로 둔다.

## 고치지 않은 파일(충돌 방지)

첫 화면(`src/app/page.tsx`), 수업 영상 플레이어, 공통 부품(`ttobagi.tsx`, `back-button.tsx`, `p/ui.tsx`, `p/layout.tsx`, `lesson-layout.tsx`, `guide-board.tsx`), `globals.css`, `package.json` 등 설정, `demo-guide.ts`, plans의 기존 계획 파일.

## 새 파일

- `src/app/p/screen-design.css`: 내 화면 전용 겉모양(색, 위쪽 흰 동그란 버튼, 청록 말풍선, 카드, 상태 칩, 진행 막대). 공통 부품 파일은 고치지 않고 감싼 칸 안에서만 덮어쓴다.
- `src/app/p/screen-design.tsx`: 선 아이콘, 위쪽 버튼 줄(`DesignTopBar`, 기존 `BackButton`·`SoundToggle`을 그대로 씀), 청록 말풍선 또박이, PC 넓은 틀.
- `src/app/p/[code]/home/guide-list.tsx`: 받은 안내 카드(순서 번호·아이콘·이름·상태 칩)와 진행 막대. 완료 여부는 기존 `useCompletedGuides`를 그대로 씀.
- `src/lib/design-screen-texts.ts`: 새 한국어 문구(`<T>`로 번역해 보여 줌).

## 바꾼 파일

- 번호 넣기: `p/page.tsx`, `p/[code]/page.tsx`, `p/patient-entry-form.tsx`, `p/entry-text.tsx`. 줄표(3-3, 년-월-일)는 보이기만 하고, 입력 칸의 처리 코드는 그대로다.
- 언어 파일 5개(`src/lib/messages/*.ts`)의 `entry` 부분에만 `bubble`, `bubbleBirth`, `privacy`를 더하고 `submit`을 "들어가기"로 바꿈.
- 받은 안내 목록: `p/[code]/home/page.tsx` (카드가 가는 주소 `guideHref`는 그대로).
- 대장내시경 안내 홈: `p/[code]/colonoscopy/page.tsx` (D-N 카드, 오늘 할 일은 `getTodo` 데이터만, 수업 버튼, 카드 3개. 링크 주소는 그대로).
- 위내시경·건강검진·드시는 약: 위쪽 버튼 줄만 `DesignTopBar`로 바꿈.

## 확인

- `npm test` 168개, `npm run check`, `npm run build` 통과(빌드는 임시 `SESSION_SECRET`, 파일에 저장하지 않음).
- 번호 넣기 화면을 휴대폰(390×844)·PC(1280×800)로 찍어 봄: 겹침·잘림 없음.

## 미검증·남은 일

- `.env`(DB 연결)가 없어 로그인 뒤 화면(받은 안내 목록·검사별 안내 홈)은 실제로 띄워 보지 못했다. 버튼 누르기 확인도 하지 못했다.
- 위내시경·건강검진 기본·드시는 약은 따로 된 "안내 홈"이 없고, 홈 카드를 누르면 바로 수업·약 화면이 열린다. 대장내시경과 같은 틀로 만들려면 새 화면 주소가 필요해서 "링크가 가는 곳 그대로" 원칙과 부딪히므로 하지 않았다.
- 몇 교시까지 봤는지는 저장된 기록이 없어 항상 "처음부터 보기"로 보인다. 상태 칩의 "보는 중"도 기록이 없어 보이지 않는다.
- "잘 안 되면 병원에 전화"의 📞, 인사말 "안녕하세요 🙂" 같은 문구 속 이모지는 번역·공통 문구라서 그대로 두었다.
- 새 한국어 문구(`design-screen-texts.ts`)는 미리 번역 목록(`translation-sources.ts`)에 넣지 않아, 다른 언어는 처음 볼 때 자동 번역을 거친다.
