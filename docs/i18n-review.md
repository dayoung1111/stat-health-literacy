# 영어 번역 검수 목록 (간호학과 팀 확인용)

환자 화면의 "한국어 / English" 바꾸기에서 English를 고르면 보이는 **의료 안내 영어 번역** 목록입니다.
한국어 원문은 바꾸지 않았고, 영어는 원문을 번역만 했습니다. 실제 병원 안내에 쓰기 전에 팀 확인이 필요합니다.

- 작성: 2026-10-29, 브랜치 `feat/english`
- 영어가 실제로 들어 있는 곳: `locales/en.json`의 `source`(의료 안내), `ui`(버튼·안내 문장)
- 한국어 원문이 있는 곳: `src/lib/demo-guide.ts`, `src/lib/medication-guide.ts`, `src/lib/guide-catalog.ts`

## 확인하는 방법

1. 표에서 한국어 원문과 English를 나란히 읽습니다.
2. 뜻이 같고 환자가 이해하기 쉬우면 확인 칸의 ☐를 ☑로 바꿉니다.
3. 고칠 곳이 있으면 English 칸 옆에 고칠 문장을 적거나 개발 담당에게 알려 주세요. 개발 담당이 `locales/en.json`을 고칩니다.

## 번역 원칙

- 짧고 쉬운 영어(초등학생 수준), 한 문장에 한 가지만 말합니다. 그래서 한국어 한 문장이 영어 두세 문장이 된 곳이 있습니다.
- 숫자·시간·양(새벽 5시, 1L, 500mL, 15분마다 4번 등)은 원문 그대로 둡니다. 원문의 숫자가 영어에 빠지면 자동 테스트(`npm test`)가 실패합니다.
- 원문에 없는 내용은 넣지 않았습니다.
- 한국어 원문이 나중에 바뀌면, 그 문장은 영어 번역이 생길 때까지 **한국어로 보입니다**(옛 번역이 바뀐 의료 내용과 다르게 보이지 않도록). 이때 자동 테스트가 실패해서 영어가 빠진 문장을 알려 줍니다.

## 특히 봐 주세요

1. **한 문장을 나눈 곳:** 예) "만든 약 1L를 15분마다 4번 나눠 1시간 동안 드세요." → 영어 3문장. 나눠도 뜻이 같은지 확인해 주세요.
2. **낱말 선택**
   - 금식 → fasting / "do not eat or drink anything"
   - 보호자 → caregiver, 가족 → family member
   - 센터 → the center, 접수 직원 → the front desk
   - 은단 → breath mints, 묵 → muk (Korean jelly), 나물 → namul (seasoned greens)
   - 김·미역 → gim·miyeok(한국어 소리 그대로), 다시마 → kelp, 참외 → Korean melon
   - A제·B제 1포 → 1 packet of A·B, 가소콜액 → Gasocol liquid, 생수 → bottled water / water
   - 피를 묽게 하는 약 → blood thinner, 한약 → herbal medicine, 철분제 → iron pills
3. **원문에 이미 "검수 필요·예정" 표시가 있는 내용:** 가소콜액 복용 방법(`demo-guide.ts`), 드시는 약 전체(2026-10-30 최종 검수 예정). 원문이 확정되면 영어도 다시 확인해야 합니다.
4. **시간 표기:** 원문의 "9시~10시"를 "9~10 PM"처럼 물결표(~) 그대로 옮겼습니다. 영어에서는 "9 to 10 PM"이 더 자연스러울 수 있으니 팀에서 정해 주세요.
5. **날짜:** 피를 묽게 하는 약 중단일은 "Stop from 11/3"처럼 미국식(월/일)으로 씁니다.

## 이 목록에 없는 것

- 버튼·화면 안내 문장(예: "다음 ▶", "🏠 홈으로")은 의료 내용이 아니라서 아래 8번에 의료와 관련된 몇 개만 넣었습니다. 전체는 `locales/en.json`의 `ui`에 있습니다.
- 의료진 화면과 첫 화면(`/`, 기존 4개 언어 문구)은 이번 영어 작업 범위가 아닙니다.

## 1. 대장내시경 안내문 (demo-guide.ts)

### 1) 검사 3일 전 음식

| 번호 | 한국어 원문                                              | English                                                                                                   | 확인 |
| ---- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 1    | 검사 3일 전 음식                                         | Food 3 days before the test                                                                               | ☐    |
| 2    | 잡곡밥 · 현미 · 검은쌀                                   | Multigrain rice · Brown rice · Black rice                                                                 | ☐    |
| 3    | 김치 · 나물                                              | Kimchi · Namul                                                                                            | ☐    |
| 4    | 김 · 미역 · 버섯                                         | Gim · Miyeok · Mushrooms                                                                                  | ☐    |
| 5    | 씨 있는 과일                                             | Fruit with seeds                                                                                          | ☐    |
| 6    | 고추씨 · 옥수수 · 견과류                                 | Chili seeds · Corn · Nuts                                                                                 | ☐    |
| 7    | 검사 3일 전부터는 이 음식을 드시지 마세요.               | From 3 days before the test, do not eat these foods.                                                      | ☐    |
| 8    | 잡곡밥, 현미, 검은쌀은 드시면 안 돼요.                   | Do not eat multigrain rice, brown rice, or black rice.                                                    | ☐    |
| 9    | 김치, 나물, 콩나물도 안 돼요.                            | Do not eat kimchi, namul (seasoned greens), or bean sprouts, either.                                      | ☐    |
| 10   | 김, 미역, 다시마, 버섯도 안 돼요.                        | Do not eat gim, miyeok, kelp, or mushrooms, either.                                                       | ☐    |
| 11   | 수박, 참외, 딸기, 포도, 키위처럼 씨 있는 과일도 안 돼요. | Do not eat fruit with seeds, either. This means watermelon, Korean melon, strawberries, grapes, and kiwi. | ☐    |
| 12   | 고추씨, 옥수수, 견과류도 안 돼요.                        | Do not eat chili seeds, corn, or nuts, either.                                                            | ☐    |
| 13   | 잡곡밥 · 현미 · 검은쌀 — 안 돼요                         | Multigrain rice · Brown rice · Black rice — No                                                            | ☐    |
| 14   | 김치 · 나물 — 안 돼요                                    | Kimchi · Namul — No                                                                                       | ☐    |
| 15   | 김 · 미역 · 버섯 — 안 돼요                               | Gim · Miyeok · Mushrooms — No                                                                             | ☐    |
| 16   | 씨 있는 과일 — 안 돼요                                   | Fruit with seeds — No                                                                                     | ☐    |
| 17   | 고추씨 · 옥수수 · 견과류 — 안 돼요                       | Chili seeds · Corn · Nuts — No                                                                            | ☐    |
| 18   | 흰쌀밥 · 흰죽                                            | White rice · Rice porridge                                                                                | ☐    |
| 19   | 계란 · 두부 · 묵                                         | Eggs · Tofu · Muk                                                                                         | ☐    |
| 20   | 사과 · 배 · 바나나                                       | Apples · Pears · Bananas                                                                                  | ☐    |
| 21   | 국물 · 빵 · 맑은 음료 · 감자                             | Broth · Bread · Clear drinks · Potatoes                                                                   | ☐    |
| 22   | 흰쌀밥과 흰죽은 드셔도 돼요.                             | You can eat white rice and white rice porridge.                                                           | ☐    |
| 23   | 계란, 두부, 묵도 괜찮아요.                               | Eggs, tofu, and muk (Korean jelly) are okay, too.                                                         | ☐    |
| 24   | 사과, 배, 바나나도 드셔도 돼요.                          | You can eat apples, pears, and bananas, too.                                                              | ☐    |
| 25   | 국물, 빵, 맑은 음료, 감자도 괜찮아요.                    | Broth, bread, clear drinks, and potatoes are okay, too.                                                   | ☐    |
| 26   | 흰쌀밥 · 흰죽 — 괜찮아요                                 | White rice · Rice porridge — Okay                                                                         | ☐    |
| 27   | 계란 · 두부 · 묵 — 괜찮아요                              | Eggs · Tofu · Muk — Okay                                                                                  | ☐    |
| 28   | 사과 · 배 · 바나나 — 괜찮아요                            | Apples · Pears · Bananas — Okay                                                                           | ☐    |
| 29   | 국물 · 빵 · 맑은 음료 · 감자 — 괜찮아요                  | Broth · Bread · Clear drinks · Potatoes — Okay                                                            | ☐    |

### 2) 검사 전날 저녁

| 번호 | 한국어 원문                              | English                                                           | 확인 |
| ---- | ---------------------------------------- | ----------------------------------------------------------------- | ---- |
| 30   | 검사 전날 저녁                           | The evening before the test                                       | ☐    |
| 31   | 저녁 7시 전                              | Before 7 PM                                                       | ☐    |
| 32   | 흰죽만                                   | Only rice porridge                                                | ☐    |
| 33   | 반찬                                     | Side dishes                                                       | ☐    |
| 34   | 잡곡·호두·잣·깨                          | Grains · Walnuts · Pine nuts · Sesame                             | ☐    |
| 35   | 검사 전날 저녁은 7시 전에 드세요.        | The evening before the test, eat dinner before 7 PM.              | ☐    |
| 36   | 반찬 없이 흰죽만 드세요.                 | Eat only white rice porridge. Do not eat side dishes.             | ☐    |
| 37   | 흰죽에 잡곡, 호두, 잣, 깨는 넣지 마세요. | Do not put grains, walnuts, pine nuts, or sesame in the porridge. | ☐    |
| 38   | 저녁은 7시 전에                          | Dinner before 7 PM                                                | ☐    |
| 39   | 반찬 없이 흰죽만                         | Only porridge, no side dishes                                     | ☐    |
| 40   | 잡곡·호두·잣·깨는 빼요                   | No grains, walnuts, pine nuts, or sesame                          | ☐    |
| 41   | 밤 12시부터                              | From 12 midnight                                                  | ☐    |
| 42   | 음식                                     | Food                                                              | ☐    |
| 43   | 약과 물은 안내 시간대로                  | Medicine and water at the given times                             | ☐    |
| 44   | 음식은 밤 12시부터 드시지 마세요.        | Do not eat food from 12 midnight.                                 | ☐    |
| 45   | 약과 물은 안내한 시간대로 드세요.        | Take medicine and water at the times we gave you.                 | ☐    |
| 46   | 금식                                     | fasting                                                           | ☐    |
| 47   | 밤 12시부터 음식은 그만                  | No food from 12 midnight                                          | ☐    |
| 48   | 약과 물은 안내 시간대로 드세요           | Take medicine and water at the given times                        | ☐    |

### 3) 대변 검사가 있는 분

| 번호 | 한국어 원문                          | English                                               | 확인 |
| ---- | ------------------------------------ | ----------------------------------------------------- | ---- |
| 49   | 대변 검사가 있는 분                  | If you have a stool test                              | ☐    |
| 50   | 약 먹기 전에 대변 받기               | Collect stool before the medicine                     | ☐    |
| 51   | 못 받아도 약은 그대로                | No stool? Still take the medicine                     | ☐    |
| 52   | 약을 드시기 전에 대변을 받아 두세요. | Collect your stool before you take the medicine.      | ☐    |
| 53   | 대변을 못 받아도 약은 그대로 드세요. | If you cannot collect stool, still take the medicine. | ☐    |
| 54   | 약 먹기 전에 대변을 받아요           | Collect stool before the medicine                     | ☐    |
| 55   | 못 받아도 약은 드세요                | No stool? Still take the medicine                     | ☐    |

### 4) 약 만드는 법

| 번호 | 한국어 원문                         | English                                               | 확인 |
| ---- | ----------------------------------- | ----------------------------------------------------- | ---- |
| 56   | 약 만드는 법                        | How to make the medicine                              | ☐    |
| 57   | A제 1포                             | 1 packet of A                                         | ☐    |
| 58   | B제 1포                             | 1 packet of B                                         | ☐    |
| 59   | 표시선까지 생수                     | Water up to the line                                  | ☐    |
| 60   | 흔들어 녹이기                       | Shake to dissolve                                     | ☐    |
| 61   | A제 1포와 B제 1포를 1L 통에 넣어요. | Put 1 packet of A and 1 packet of B in the 1L bottle. | ☐    |
| 62   | 표시선까지 생수를 부어요.           | Pour bottled water up to the line.                    | ☐    |
| 63   | 흔들어서 잘 녹여요.                 | Shake it well until it dissolves.                     | ☐    |
| 64   | A제 1포 + B제 1포                   | 1 packet of A + 1 packet of B                         | ☐    |
| 65   | 1L 통 표시선까지 생수               | Water up to the line on the 1L bottle                 | ☐    |
| 66   | 흔들어서 녹여요                     | Shake until it dissolves                              | ☐    |

### 5) 첫 번째 약

| 번호 | 한국어 원문                                       | English                                                                                | 확인 |
| ---- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | ---- |
| 67   | 첫 번째 약                                        | First medicine                                                                         | ☐    |
| 68   | 전날 밤 9~10시                                    | 9~10 PM the night before                                                               | ☐    |
| 69   | 15분마다 4번                                      | 4 times, every 15 minutes                                                              | ☐    |
| 70   | 생수 500mL                                        | 500mL of water                                                                         | ☐    |
| 71   | 첫 번째 약은 검사 전날 밤 9시~10시에 드세요.      | Take the first medicine at 9~10 PM the night before the test.                          | ☐    |
| 72   | 만든 약 1L를 15분마다 4번 나눠 1시간 동안 드세요. | Drink the 1L of medicine in 4 parts. Drink 1 part every 15 minutes. This takes 1 hour. | ☐    |
| 73   | 생수 500mL도 드세요.                              | Also drink 500mL of water.                                                             | ☐    |
| 74   | 15분마다 1번, 모두 4번                            | 1 time every 15 minutes, 4 times in all                                                | ☐    |
| 75   | 생수 500mL 더                                     | Plus 500mL of water                                                                    | ☐    |

### 6) 두 번째 약

| 번호 | 한국어 원문                                   | English                                             | 확인 |
| ---- | --------------------------------------------- | --------------------------------------------------- | ---- |
| 76   | 두 번째 약                                    | Second medicine                                     | ☐    |
| 77   | 당일 새벽 4~5시                               | 4~5 AM on the test day                              | ☐    |
| 78   | 첫 번째와 같은 방법                           | Same way as the first                               | ☐    |
| 79   | 가소콜액 1포                                  | 1 packet of Gasocol liquid                          | ☐    |
| 80   | 두 번째 약은 검사 당일 새벽 4시~5시에 드세요. | Take the second medicine at 4~5 AM on the test day. | ☐    |
| 81   | 첫 번째 약과 같은 방법으로 드세요.            | Drink it the same way as the first medicine.        | ☐    |
| 82   | 가소콜액 1포도 함께 드세요.                   | Also take 1 packet of Gasocol liquid with it.       | ☐    |
| 83   | 첫 번째와 똑같이                              | Same as the first                                   | ☐    |
| 84   | 가소콜액 1포도 함께                           | Plus 1 packet of Gasocol liquid                     | ☐    |

### 7) 새벽 5시부터 금식

| 번호 | 한국어 원문                               | English                                                      | 확인 |
| ---- | ----------------------------------------- | ------------------------------------------------------------ | ---- |
| 85   | 새벽 5시부터 금식                         | Fasting from 5 AM                                            | ☐    |
| 86   | 새벽 5시부터                              | From 5 AM                                                    | ☐    |
| 87   | 물                                        | Water                                                        | ☐    |
| 88   | 약                                        | Medicine                                                     | ☐    |
| 89   | 껌 · 은단                                 | Gum · Breath mints                                           | ☐    |
| 90   | 담배                                      | Cigarettes                                                   | ☐    |
| 91   | 혈압약은 물 한두 모금과 함께              | Blood pressure pill with 1 or 2 sips of water                | ☐    |
| 92   | 검사 당일 새벽 5시부터는 완전히 금식해요. | From 5 AM on the test day, do not eat or drink anything.     | ☐    |
| 93   | 물, 약, 껌, 은단, 담배 모두 안 돼요.      | No water, medicine, gum, breath mints, or cigarettes.        | ☐    |
| 94   | 단, 혈압약은 물 한두 모금과 함께 드세요.  | But take your blood pressure pill with 1 or 2 sips of water. | ☐    |
| 95   | 새벽 5시부터 아무것도 안 돼요             | Nothing from 5 AM                                            | ☐    |
| 96   | 껌, 은단, 담배도 안 돼요                  | No gum, breath mints, or cigarettes                          | ☐    |

### 8) 이럴 땐 꼭 말씀하세요

| 번호 | 한국어 원문                                                                        | English                                                                                                   | 확인 |
| ---- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 97   | 이럴 땐 꼭 말씀하세요                                                              | Tell us in these cases                                                                                    | ☐    |
| 98   | 생리 중이면 약을 드시지 마세요                                                     | On your period? Do not take the medicine                                                                  | ☐    |
| 99   | 임신·수유 중이면 먼저 확인해 주세요                                                | Pregnant or breastfeeding? Check with us first                                                            | ☐    |
| 100  | 생리 중이면 약을 드시지 마세요.                                                    | If you have your period, do not take the medicine.                                                        | ☐    |
| 101  | 임신 중이거나 수유 중이면 먼저 확인해 주세요.                                      | If you are pregnant or breastfeeding, check with us first.                                                | ☐    |
| 102  | 토를 심하게 하면 약을 멈추고 센터에 전화하세요                                     | Throwing up a lot? Stop the medicine. Call the center                                                     | ☐    |
| 103  | 변을 충분히 못 봤거나 약 시간·양을 못 지켰으면 검사 날 접수 직원에게 말씀해 주세요 | Not enough stool came out? Or you missed the medicine time or amount? Tell the front desk on the test day | ☐    |
| 104  | 토를 심하게 하면 약을 멈추고 센터에 전화하세요.                                    | If you throw up a lot, stop the medicine. Then call the center.                                           | ☐    |
| 105  | 변을 충분히 못 봤거나 약 시간·양을 못 지켰으면                                     | Not enough stool came out? Or you missed the medicine time or amount?                                     | ☐    |
| 106  | 검사 날 접수 직원에게 말씀해 주세요.                                               | Then tell the front desk on the test day.                                                                 | ☐    |
| 107  | 보호자와 함께                                                                      | With a caregiver                                                                                          | ☐    |
| 108  | 검사 날에는 보호자와 함께 오세요.                                                  | On the test day, come with a caregiver.                                                                   | ☐    |
| 109  | 가족과 함께 오세요                                                                 | Come with a family member                                                                                 | ☐    |

## 2. 티치백 질문 (demo-guide.ts)

### 질문 1: 전날 저녁 흰죽 시간

| 번호 | 한국어 원문                                   | English                                                           | 확인 |
| ---- | --------------------------------------------- | ----------------------------------------------------------------- | ---- |
| 110  | 전날 저녁 흰죽 시간                           | Porridge time the evening before                                  | ☐    |
| 111  | 검사 전날 저녁 흰죽은<br>몇 시 전에 드실까요? | The evening before the test,<br>by what time do you eat porridge? | ☐    |
| 112  | 밤 9시 전                                     | Before 9 PM                                                       | ☐    |
| 113  | 밤 12시 전                                    | Before 12 midnight                                                | ☐    |
| 114  | 검사 전날 저녁은                              | The evening before the test,                                      | ☐    |
| 115  | 7시 전에 반찬 없이 흰죽만 드세요.             | eat only porridge before 7 PM. Do not eat side dishes.            | ☐    |
| 116  | 검사 전날 저녁이에요.<br>드실 수 있는 것은?   | It is the evening before the test.<br>What can you eat?           | ☐    |
| 117  | 반찬 없는 흰죽                                | Porridge with no side dishes                                      | ☐    |
| 118  | 흰죽과 반찬                                   | Porridge and side dishes                                          | ☐    |
| 119  | 호두 넣은 흰죽                                | Porridge with walnuts                                             | ☐    |

### 질문 2: 약 1L 먹는 방법

| 번호 | 한국어 원문                                         | English                                                              | 확인 |
| ---- | --------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| 120  | 약 1L 먹는 방법                                     | How to drink the 1L medicine                                         | ☐    |
| 121  | 만든 약 1L는<br>어떻게 드실까요?                    | How do you drink<br>the 1L of medicine?                              | ☐    |
| 122  | 한 번에                                             | All at once                                                          | ☐    |
| 123  | 15분마다 4번 나눠서                                 | In 4 parts, every 15 minutes                                         | ☐    |
| 124  | 아침에 한 번                                        | Once in the morning                                                  | ☐    |
| 125  | 만든 약 1L                                          | 1L of medicine                                                       | ☐    |
| 126  | 만든 약 1L를                                        | Drink the 1L of medicine                                             | ☐    |
| 127  | 15분마다 4번 나눠 1시간 동안 드세요.                | in 4 parts, every 15 minutes. This takes 1 hour.                     | ☐    |
| 128  | 약을 처음 마시고<br>15분이 지났어요. 어떻게 할까요? | You drank the first part.<br>15 minutes have passed. What do you do? | ☐    |
| 129  | 다음 한 번을 마셔요                                 | Drink the next part                                                  | ☐    |
| 130  | 그만 마셔요                                         | Stop drinking                                                        | ☐    |
| 131  | 남은 약을 한 번에 마셔요                            | Drink the rest all at once                                           | ☐    |

### 질문 3: 새벽 5시 이후 금식

| 번호 | 한국어 원문                                               | English                                                              | 확인 |
| ---- | --------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| 132  | 새벽 5시 이후 금식                                        | Fasting after 5 AM                                                   | ☐    |
| 133  | 검사 날 새벽 5시 이후<br>먹어도 되는 것은?                | On the test day, after 5 AM,<br>what can you take?                   | ☐    |
| 134  | 혈압약                                                    | Blood pressure pill                                                  | ☐    |
| 135  | 껌                                                        | Gum                                                                  | ☐    |
| 136  | 새벽 5시부터는                                            | From 5 AM,                                                           | ☐    |
| 137  | 검사 날 새벽 6시예요.<br>목이 말라요. 물을 마셔도 될까요? | It is 6 AM on the test day.<br>You are thirsty. Can you drink water? | ☐    |
| 138  | 마셔요                                                    | I drink it                                                           | ☐    |
| 139  | 마시지 않아요                                             | I do not drink it                                                    | ☐    |

### 질문 4: 생리 중일 때

| 번호 | 한국어 원문                                                  | English                                                                      | 확인 |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---- |
| 140  | 생리 중일 때                                                 | If you have your period                                                      | ☐    |
| 141  | 약 먹기 전에<br>생리를 시작했다면?                           | Your period started<br>before the medicine. What do you do?                  | ☐    |
| 142  | 그대로 먹는다                                                | Take it as planned                                                           | ☐    |
| 143  | 반만 먹는다                                                  | Take only half                                                               | ☐    |
| 144  | 먹지 않는다                                                  | Do not take it                                                               | ☐    |
| 145  | 생리 중                                                      | On your period                                                               | ☐    |
| 146  | 생리 중이면                                                  | If you have your period,                                                     | ☐    |
| 147  | 약을 드시지 마세요.                                          | do not take the medicine.                                                    | ☐    |
| 148  | 두 번째 약 먹을 시간이에요.<br>생리 중이에요. 어떻게 할까요? | It is time for the second medicine.<br>You have your period. What do you do? | ☐    |
| 149  | 약을 먹는다                                                  | Take the medicine                                                            | ☐    |
| 150  | 약을 먹지 않는다                                             | Do not take the medicine                                                     | ☐    |

## 3. 음식 목록·사진 설명 (demo-guide.ts foodGroups)

### 음식

| 번호 | 한국어 원문                        | English                                                  | 확인 |
| ---- | ---------------------------------- | -------------------------------------------------------- | ---- |
| 151  | 그릇에 담긴 잡곡밥 사진            | Photo of multigrain rice in a bowl                       | ☐    |
| 152  | 접시에 담긴 김치와 콩나물무침 사진 | Photo of kimchi and seasoned bean sprouts on a plate     | ☐    |
| 153  | 접시에 담긴 구운 김과 미역 사진    | Photo of roasted gim and miyeok seaweed on a plate       | ☐    |
| 154  | 접시에 담긴 수박, 딸기, 포도 사진  | Photo of watermelon, strawberries, and grapes on a plate | ☐    |
| 155  | 그릇에 담긴 흰죽 사진              | Photo of white rice porridge in a bowl                   | ☐    |
| 156  | 접시에 담긴 삶은 계란과 두부 사진  | Photo of boiled eggs and tofu on a plate                 | ☐    |
| 157  | 접시에 담긴 바나나와 사과 사진     | Photo of bananas and apples on a plate                   | ☐    |

## 4. 또박이 사진 수업 영상 교시·퀴즈 (demo-guide.ts videoLessons)

### 1교시 · 3일 전 피할 음식

| 번호 | 한국어 원문                                     | English                                                       | 확인 |
| ---- | ----------------------------------------------- | ------------------------------------------------------------- | ---- |
| 158  | 1교시 · 3일 전 피할 음식                        | Class 1 · Foods to avoid for 3 days                           | ☐    |
| 159  | 오늘 배울 음식                                  | Foods we learn today                                          | ☐    |
| 160  | 검사 3일 전부터 이 음식은 안 돼요               | No to these foods from 3 days before                          | ☐    |
| 161  | 검사 3일 전부터는 먹으면 안 되는 음식이 있어요. | There are foods you must not eat from 3 days before the test. | ☐    |
| 162  | 먹으면 안 되는 음식                             | Foods you must not eat                                        | ☐    |
| 163  | 이 음식들은 검사 3일 전부터 드시지 마세요.      | From 3 days before the test, do not eat these foods.          | ☐    |
| 164  | 드시지 마세요                                   | Do not take it                                                | ☐    |
| 165  | 김치는 먹어도 될까요?                           | Can you eat kimchi?                                           | ☐    |
| 166  | 김치                                            | Kimchi                                                        | ☐    |
| 167  | 먹어도 돼요                                     | Yes, I can eat it                                             | ☐    |
| 168  | 안 돼요                                         | No                                                            | ☐    |
| 169  | 잘하셨어요! 이제 드셔도 되는 음식을 배워요.     | Well done! Now let's learn foods you can eat.                 | ☐    |

### 2교시 · 드셔도 되는 음식

| 번호 | 한국어 원문                              | English                                      | 확인 |
| ---- | ---------------------------------------- | -------------------------------------------- | ---- |
| 170  | 2교시 · 드셔도 되는 음식                 | Class 2 · Foods you can eat                  | ☐    |
| 171  | 드셔도 되는 음식                         | Foods you can eat                            | ☐    |
| 172  | 이 음식은 드셔도 돼요                    | You can eat these foods                      | ☐    |
| 173  | 이번에는 드셔도 되는 음식을 볼까요?      | Now, let's see foods you can eat.            | ☐    |
| 174  | 이 음식들은 검사 전에도 드셔도 괜찮아요. | These foods are okay to eat before the test. | ☐    |
| 175  | 괜찮아요                                 | Okay                                         | ☐    |
| 176  | 바나나는 먹어도 될까요?                  | Can you eat bananas?                         | ☐    |
| 177  | 바나나                                   | Bananas                                      | ☐    |
| 178  | 잘하셨어요! 오늘 수업 끝이에요.          | Well done! Today's class is over.            | ☐    |

## 5. 대장내시경 첫 화면 "지금 할 일"·또박이 대사 (demo-guide.ts getTodo)

### 검사 2일 이상 전

| 번호 | 한국어 원문                                                       | English                                                                                    | 확인 |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| 179  | 음식 조심                                                         | Watch what you eat                                                                         | ☐    |
| 180  | 잡곡밥, 김치, 김, 씨 있는 과일은 드시지 마세요                    | Do not eat multigrain rice, kimchi, gim, or fruit with seeds                               | ☐    |
| 181  | 검사 3일 전부터는 잡곡밥, 김치, 김, 씨 있는 과일을 드시지 마세요. | From 3 days before the test, do not eat multigrain rice, kimchi, gim, or fruit with seeds. | ☐    |

### 검사 전날

| 번호 | 한국어 원문                                             | English                                                                    | 확인 |
| ---- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| 182  | 오늘 밤 9~10시 첫 번째 약                               | First medicine tonight at 9~10 PM                                          | ☐    |
| 183  | 저녁 7시 전 흰죽                                        | Porridge before 7 PM                                                       | ☐    |
| 184  | 밤 9~10시 첫 번째 약                                    | First medicine at 9~10 PM                                                  | ☐    |
| 185  | 음식은 밤 12시부터 금지, 약과 물은 안내 시간대로        | No food from 12 midnight. Take medicine and water at the given times.      | ☐    |
| 186  | 저녁은 7시 전에 흰죽만 드세요. 첫 번째 약은 밤 9시예요. | For dinner, eat only porridge before 7 PM. Your first medicine is at 9 PM. | ☐    |

### 검사 당일

| 번호 | 한국어 원문                                                                 | English                                                                                          | 확인 |
| ---- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---- |
| 187  | 오늘 검사 날                                                                | Today is your test day                                                                           | ☐    |
| 188  | 새벽 4~5시 두 번째 약                                                       | Second medicine at 4~5 AM                                                                        | ☐    |
| 189  | 새벽 5시부터는 물도 드시지 마세요. 단, 혈압약은 물 한두 모금과 함께 드세요. | From 5 AM, do not drink even water. But take your blood pressure pill with 1 or 2 sips of water. | ☐    |

### 검사 후

| 번호 | 한국어 원문                   | English                                | 확인 |
| ---- | ----------------------------- | -------------------------------------- | ---- |
| 190  | 검사가 끝났어요               | Your test is over                      | ☐    |
| 191  | 수고하셨어요                  | Good job                               | ☐    |
| 192  | 궁금한 점은 병원에 물어보세요 | Ask the hospital if you have questions | ☐    |
| 193  | 수고 많으셨어요.              | You did a great job.                   | ☐    |

## 6. 드시는 약 (medication-guide.ts)

### 판정 글자

| 번호 | 한국어 원문           | English        | 확인 |
| ---- | --------------------- | -------------- | ---- |
| 194  | 드세요                | Take it        | ☐    |
| 195  | 간호사에게 물어보세요 | Ask your nurse | ☐    |

### 혈압약

| 번호 | 한국어 원문                   | English                                                           | 확인 |
| ---- | ----------------------------- | ----------------------------------------------------------------- | ---- |
| 196  | 검사날 아침 6시               | 6 AM on the test day                                              | ☐    |
| 197  | 물 한두 모금                  | 1 or 2 sips of water                                              | ☐    |
| 198  | 검사날 아침<br>혈압약 먹어요? | On the test day morning,<br>do you take your blood pressure pill? | ☐    |
| 199  | 먹어요                        | I take it                                                         | ☐    |
| 200  | 안 먹어요                     | I do not take it                                                  | ☐    |

### 당뇨약

| 번호 | 한국어 원문                   | English                                                         | 확인 |
| ---- | ----------------------------- | --------------------------------------------------------------- | ---- |
| 201  | 당뇨약                        | Diabetes medicine                                               | ☐    |
| 202  | 검사날 아침 안 먹어요         | Do not take it on the test day morning                          | ☐    |
| 203  | 약은 챙겨 오기                | Bring the medicine with you                                     | ☐    |
| 204  | 검사날 아침<br>당뇨약 먹어요? | On the test day morning,<br>do you take your diabetes medicine? | ☐    |

### 인슐린

| 번호 | 한국어 원문                   | English                                  | 확인 |
| ---- | ----------------------------- | ---------------------------------------- | ---- |
| 205  | 인슐린                        | Insulin                                  | ☐    |
| 206  | 전날 저녁 주사 → 간호사 확인  | Shot the evening before → Ask your nurse | ☐    |
| 207  | 검사날 아침 주사 안 돼요      | No shot on the test day morning          | ☐    |
| 208  | 사탕 챙겨 오기                | Bring candy with you                     | ☐    |
| 209  | 인슐린은<br>누구 말대로 해요? | For insulin,<br>who do you listen to?    | ☐    |
| 210  | 간호사                        | The nurse                                | ☐    |
| 211  | 내 마음대로                   | Myself                                   | ☐    |

### 피를 묽게 하는 약

| 번호 | 한국어 원문                 | English                                     | 확인 |
| ---- | --------------------------- | ------------------------------------------- | ---- |
| 212  | 피를 묽게 하는 약           | Blood thinner                               | ☐    |
| 213  | 혼자 끊으면 안 돼요         | Do not stop it on your own                  | ☐    |
| 214  | 검사 2주 전 의사 상담       | Talk to your doctor 2 weeks before the test | ☐    |
| 215  | 이 약,<br>혼자 끊어도 돼요? | Can you stop this medicine<br>on your own?  | ☐    |
| 216  | 돼요                        | Yes                                         | ☐    |

### 영양제·한약

| 번호 | 한국어 원문                     | English                                                 | 확인 |
| ---- | ------------------------------- | ------------------------------------------------------- | ---- |
| 217  | 영양제·한약                     | Supplements · Herbal medicine                           | ☐    |
| 218  | 7일 전                          | 7 days                                                  | ☐    |
| 219  | 검사 일주일 전부터              | From 1 week before the test                             | ☐    |
| 220  | 철분제도 포함                   | Iron pills, too                                         | ☐    |
| 221  | 검사 일주일 전,<br>한약 먹어요? | 1 week before the test,<br>do you take herbal medicine? | ☐    |

### 기타 약

| 번호 | 한국어 원문                    | English                                                 | 확인 |
| ---- | ------------------------------ | ------------------------------------------------------- | ---- |
| 222  | 기타 약                        | Other medicine                                          | ☐    |
| 223  | 검사 일주일 전                 | 1 week before the test                                  | ☐    |
| 224  | 병원에 전화                    | Call the hospital                                       | ☐    |
| 225  | 모르는 약,<br>병원에 전화해요? | Not sure about a medicine?<br>Do you call the hospital? | ☐    |
| 226  | 전화해요                       | I call                                                  | ☐    |
| 227  | 안 해요                        | I do not call                                           | ☐    |

## 7. 안내 이름·병원 이름 (guide-catalog.ts, demo-guide.ts)

### 이름

| 번호 | 한국어 원문                   | English                              | 확인 |
| ---- | ----------------------------- | ------------------------------------ | ---- |
| 228  | 건강검진 기본 확인사항        | Health checkup basics                | ☐    |
| 229  | 대장내시경                    | Colonoscopy                          | ☐    |
| 230  | 위내시경                      | Gastroscopy                          | ☐    |
| 231  | 복용약·영양제 안내            | Medicines and supplements            | ☐    |
| 232  | 드시는 약                     | Your medicines                       | ☐    |
| 233  | 드시는 약, 드셔도 되는지 확인 | Check if you can take your medicines | ☐    |
| 234  | ○○병원                        | ○○ Hospital                          | ☐    |

## 8. 화면 문장 중 의료 안내와 관련된 것 (locales/ko.json·en.json ui)

`{month}` 같은 중괄호 자리는 화면에서 날짜·정답으로 바뀝니다.

| 번호 | 한국어 원문                                                 | English                                                   | 확인 |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------- | ---- |
| 235  | {month}월 {day}일부터 중단                                  | Stop from {month}/{day}                                   | ☐    |
| 236  | 의사 선생님과 정한 날짜부터 중단                            | Stop on the date you set with your doctor                 | ☐    |
| 237  | 정답은 「{answer}」예요. 간호사에게 꼭 물어보세요.          | The answer is "{answer}". Please ask your nurse.          | ☐    |
| 238  | 정답은 「{answer}」예요. 간호사 선생님께 한 번 더 여쭤봐요. | The answer is "{answer}". Please ask your nurse about it. | ☐    |
| 239  | 이럴 땐 꼭 병원에 말씀하세요.                               | If this happens, tell the hospital.                       | ☐    |
| 240  | 정확한 내용은 의료진에게 확인하세요.                        | Check the details with your care team.                    | ☐    |
