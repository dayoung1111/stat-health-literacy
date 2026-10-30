import { Fragment, type CSSProperties, type ReactNode } from 'react';

import { prepSteps } from '@/lib/demo-guide';
import { screenTexts } from '@/lib/screen-texts';

import { FittedSvgText, T, useTranslatedTexts } from '../../translated';
import { SafeImage } from '../error-report';
import { Drawing } from '../pictures';
import { getPhoto, type Lesson, type LessonStep } from './photo-lesson';
import { FitText } from './fit-text';
import { Bottle, Cup, Pouch, PrepScene, WaterBottle } from './prep-scene';

// 또박이 선생님 수업 1~7교시 화면 모양(밝은 베이지 바탕 + 맨 위 제목 카드 + 가운데 그림).
// 자막·소리·장면 순서·시간은 demo-guide.ts 데이터와 lesson-state.ts 그대로이고,
// 이 파일은 "화면에 보이는 글자와 그림 배치"만 정한다. 사진 파일은 고치지 않고 보여 주는 위치만 맞춘다.

type Icon = 'no' | 'ok' | 'time' | 'care' | 'bottle';
type Tone = 'no' | 'ok';

const ink = '#15262B';

/** 1~7교시에만 쓴다(8교시는 기존 카드 화면). */
export const designedLessonCount = 7;

// ---------------------------------------------------------------------------
// 사진 맞추기: 사진 속 음식(접시)이 칸 정가운데 오고, 접시 전체가 보이도록 사진을 키우고 옮긴다.
// box: 사진 안 음식 위치(왼쪽·오른쪽·위·아래, 사진 너비·높이 대비 비율),
// fill: 칸이 남을 때 바탕색(그 사진 가장자리 색이라 테두리 띠가 눈에 띄지 않는다).

const WOOD = '#D9A266';
type Framing = {
  aspect: number;
  box: [number, number, number, number];
  fill: string;
};
const framing: Record<string, Framing> = {
  '/images/foods/food-01-multigrain.jpg': {
    aspect: 16 / 9,
    box: [0.07, 0.6, 0.06, 0.86],
    fill: '#C98951',
  },
  '/images/foods/food-02-kimchi.jpg': {
    aspect: 16 / 9,
    box: [0.03, 0.64, 0.05, 0.87],
    fill: '#BB7B47',
  },
  '/images/foods/food-03-seaweed.jpg': {
    aspect: 16 / 9,
    box: [0.03, 0.64, 0.06, 0.87],
    fill: '#C87F46',
  },
  '/images/foods/food-04-fruit.jpg': {
    aspect: 16 / 9,
    box: [0.02, 0.63, 0.03, 0.87],
    fill: '#C57D40',
  },
  '/images/foods/food-05-porridge.jpg': {
    aspect: 16 / 9,
    box: [0.06, 0.61, 0.03, 0.88],
    fill: '#C77F46',
  },
  '/images/foods/food-06-egg-tofu.jpg': {
    aspect: 16 / 9,
    box: [0.03, 0.64, 0.04, 0.88],
    fill: '#B97340',
  },
  '/images/foods/food-07-banana-apple.jpg': {
    aspect: 16 / 9,
    box: [0.03, 0.64, 0.02, 0.88],
    fill: '#C47D44',
  },
  '/images/foods/clear-soup.png': {
    aspect: 4 / 3,
    box: [0.07, 0.93, 0.03, 0.95],
    fill: '#C47D44',
  },
  '/images/foods/food-09-water.jpg': {
    aspect: 4 / 3,
    box: [0.3, 0.7, 0.1, 0.8],
    fill: '#D28A47',
  },
  '/images/foods/food-10-pills.jpg': {
    aspect: 4 / 3,
    box: [0.3, 0.75, 0.32, 0.77],
    fill: '#D18748',
  },
  '/images/foods/food-13-gum.jpg': {
    aspect: 4 / 3,
    box: [0.08, 0.88, 0.2, 0.8],
    fill: '#DC9451',
  },
  '/images/foods/eundan.png': {
    aspect: 582 / 532,
    box: [0.08, 0.92, 0.03, 0.97],
    fill: '#FFFFFF',
  },
  '/images/foods/food-11-smoking.jpg': {
    aspect: 4 / 3,
    box: [0.03, 0.8, 0.25, 1],
    fill: '#7F7F80',
  },
};

/**
 * boxAspect: 사진 칸의 가로:세로
 * cover: true면 음식을 가운데 두면서 칸에 빈자리가 없도록 사진을 더 키운다(1·2교시).
 * 이때 접시 가장자리가 조금 잘릴 수 있다.
 */
function frameStyle(
  src: string,
  boxAspect: number,
  cover = false,
): CSSProperties {
  const f = framing[src];
  if (!f) return { inset: 0 };
  const [x0, x1, y0, y1] = f.box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const margin = 0.92;
  // 사진을 보여 줄 너비(칸 너비 대비). 음식이 칸 안에 다 들어오는 만큼만 키운다.
  const fit = Math.min(
    margin / (x1 - x0),
    (margin * f.aspect) / (boxAspect * (y1 - y0)),
    2.4,
  );
  // 음식이 가운데일 때 칸의 네 변까지 사진이 닿는 가장 작은 너비
  const fill = Math.max(
    1,
    f.aspect / boxAspect,
    0.5 / cx,
    0.5 / (1 - cx),
    (0.5 * f.aspect) / (cy * boxAspect),
    (0.5 * f.aspect) / ((1 - cy) * boxAspect),
  );
  const width = cover ? fill : fit;
  const height = width / f.aspect;
  const left = 0.5 - cx * width;
  const top = 0.5 - cy * height * boxAspect;
  return {
    width: `${width * 100}%`,
    aspectRatio: `${f.aspect}`,
    left: `${left * 100}%`,
    top: `${top * 100}%`,
  };
}

function FramedPhoto({
  src,
  alt,
  boxAspect,
  tone,
  delay,
  cover = false,
}: {
  src: string;
  alt: string;
  boxAspect: number;
  tone?: Tone;
  delay: number;
  cover?: boolean;
}) {
  return (
    <span
      className="ld-photo"
      style={{
        aspectRatio: `${boxAspect}`,
        background: cover ? undefined : (framing[src]?.fill ?? WOOD),
      }}
    >
      <span
        className="ld-photo-frame"
        style={frameStyle(src, boxAspect, cover)}
      >
        <SafeImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 900px) 40vw, 360px"
        />
      </span>
      {tone && <BigMark tone={tone} delay={delay} />}
    </span>
  );
}

// 사진 가운데 큰 빨간 X / 초록 동그라미(사진 높이의 약 80%, 굵은 둥근 선)
function BigMark({ tone, delay }: { tone: Tone; delay: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="ld-mark">
      {tone === 'no' ? (
        <>
          <path
            d="M14 14 L86 86"
            stroke="#D9363E"
            strokeWidth="12"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay}s` }}
          />
          <path
            d="M86 14 L14 86"
            stroke="#D9363E"
            strokeWidth="12"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay + 0.2}s` }}
          />
        </>
      ) : (
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#2E9E6B"
          strokeWidth="11"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="pl-draw-circle"
          style={{ animationDelay: `${delay}s` }}
        />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 제목 카드: 왼쪽 큰 동그라미 아이콘 + 가운데 한 줄 제목

const iconColor: Record<Icon, string> = {
  no: '#D9363E',
  ok: '#2E9E6B',
  time: '#0F6670',
  care: '#F5C33B',
  bottle: '#0F6670',
};
const iconSay: Record<Icon, string> = {
  no: screenTexts.design.iconNo,
  ok: screenTexts.design.iconOk,
  time: screenTexts.design.iconTime,
  care: screenTexts.design.iconCare,
  bottle: screenTexts.design.iconBottle,
};

function TitleIcon({ icon }: { icon: Icon }) {
  const mark = icon === 'care' ? ink : '#FFFFFF';
  return (
    <svg viewBox="0 0 40 40" className="ld-icon" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={iconColor[icon]} />
      {icon === 'no' && (
        <path
          d="M12 12 L28 28 M28 12 L12 28"
          stroke={mark}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      {icon === 'ok' && (
        <circle
          cx="20"
          cy="20"
          r="10"
          fill="none"
          stroke={mark}
          strokeWidth="4.5"
        />
      )}
      {icon === 'time' && (
        <>
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="none"
            stroke={mark}
            strokeWidth="3.5"
          />
          <path
            d="M20 13 L20 20 L25 23"
            fill="none"
            stroke={mark}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {icon === 'care' && (
        <>
          <path
            d="M20 9 L20 23"
            stroke={mark}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="30" r="3" fill={mark} />
        </>
      )}
      {icon === 'bottle' && (
        <path
          d="M17 9 H23 V13 Q28 15 28 20 V30 Q28 32 26 32 H14 Q12 32 12 30 V20 Q12 15 17 13 Z"
          fill="none"
          stroke={mark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// 한 줄에 들어가도록 글자 크기만 줄인다(한글 1칸, 숫자·영문 0.6칸, 띄어쓰기 0.3칸, 문장부호 0.35칸으로 어림).
const TITLE_MAX = 4.6;
const TITLE_SPACE = 74;
function titleSize(text: string) {
  let em = 0;
  for (const ch of text) {
    if (/[가-힣\u3040-\u30ff\u4e00-\u9fff]/.test(ch)) em += 1;
    else if (/[0-9A-Za-z]/.test(ch)) em += 0.62;
    else if (ch === ' ') em += 0.3;
    else em += 0.4;
  }
  return Math.min(TITLE_MAX, TITLE_SPACE / (em * 1.04));
}

function TitleCard({
  icon,
  title,
  extra,
}: {
  icon: Icon;
  title: string;
  /** 제목 뒤에 붙는 말(5교시 단계 이름) */
  extra?: string;
}) {
  // 제목은 번역한 뒤의 길이에 맞춰 글자 크기를 정한다.
  const { texts } = useTranslatedTexts([title, iconSay[icon], extra ?? '']);
  const shown = extra ? `${texts[0]} · ${texts[2]}` : texts[0];
  return (
    <div className="ld-title">
      <TitleIcon icon={icon} />
      <p
        className="ld-title-text"
        style={{ fontSize: `${titleSize(shown)}cqw` }}
      >
        <span className="sr-only">{texts[1]}: </span>
        {shown}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1·2·3·7교시 사진 카드

type PhotoCard = {
  src: string;
  alt: string;
  /** 줄바꿈은 \n */
  name: string;
  tone: Tone;
  /** 이 장면 id가 나오면 이 카드를 강조한다 */
  stepIds?: string[];
};

const food = (
  id: string,
  name: string,
  stepIds: string[] = [id],
): PhotoCard => {
  const photo = getPhoto(id);
  return { src: photo.src, alt: photo.alt, name, tone: photo.tone, stepIds };
};

const lesson1: PhotoCard[] = [
  food('grain', screenTexts.design.foods.grain),
  food('kimchi', screenTexts.design.foods.kimchi),
  food('seaweed', screenTexts.design.foods.seaweed),
  food('seed-fruit', screenTexts.design.foods.seedFruit),
];
const lesson2: PhotoCard[] = [
  food('white-rice', screenTexts.design.foods.whiteRice),
  food('egg-tofu', screenTexts.design.foods.eggTofu),
  {
    src: '/images/foods/clear-soup.png',
    alt: '그릇에 담긴 맑은 무국 사진',
    name: screenTexts.design.foods.clearSoup,
    tone: 'ok',
    stepIds: ['ok-more'],
  },
  food('ok-fruit', screenTexts.design.foods.okFruit),
];
const lesson3: PhotoCard[] = [
  food('white-rice', screenTexts.design.foods.porridge, []),
  food('kimchi', screenTexts.design.foods.side, []),
  food('grain', screenTexts.design.foods.nuts, []),
];
const lesson7: PhotoCard[] = [
  {
    src: '/images/foods/food-09-water.jpg',
    alt: '유리컵에 담긴 물 사진',
    name: screenTexts.design.foods.water,
    tone: 'no',
  },
  {
    src: '/images/foods/food-10-pills.jpg',
    alt: '알약과 캡슐 사진',
    name: screenTexts.design.foods.pills,
    tone: 'no',
  },
  {
    src: '/images/foods/food-13-gum.jpg',
    alt: '포장을 벗긴 껌 사진',
    name: screenTexts.design.foods.gum,
    tone: 'no',
  },
  {
    src: '/images/foods/eundan.png',
    alt: '병에 담긴 은단 사진',
    name: screenTexts.design.foods.eundan,
    tone: 'no',
  },
  {
    src: '/images/foods/food-11-smoking.jpg',
    alt: '손가락에 든 불 붙은 담배 사진',
    name: screenTexts.design.foods.cigarette,
    tone: 'no',
  },
];

function FoodGrid({ cards, stepId }: { cards: PhotoCard[]; stepId: string }) {
  return (
    <ul className="ld-food-grid">
      {cards.map((card, index) => (
        <li
          key={card.src}
          className={`ld-food ${card.tone} ${card.stepIds?.includes(stepId) ? 'is-now' : ''}`}
          style={{ animationDelay: `${0.1 + index * 0.15}s` }}
        >
          <FramedPhoto
            src={card.src}
            alt={card.alt}
            boxAspect={1.2}
            tone={card.tone}
            delay={0.5 + index * 0.3}
            cover
          />
          <span className="ld-name-cell">
            <FitText className="ld-name" maxLines={3}>
              {card.name}
            </FitText>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PhotoRow({
  cards,
  boxAspect,
  className,
}: {
  cards: PhotoCard[];
  boxAspect: number;
  className: string;
}) {
  return (
    <ul className={className}>
      {cards.map((card, index) => (
        <li
          key={card.src}
          className={`ld-column ${card.tone}`}
          style={{ animationDelay: `${0.1 + index * 0.12}s` }}
        >
          <FramedPhoto
            src={card.src}
            alt={card.alt}
            boxAspect={boxAspect}
            tone={card.tone}
            delay={0.5 + index * 0.25}
          />
          <span className="ld-name-cell">
            <FitText className="ld-name">{card.name}</FitText>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// 4교시: ① 대변 받기 → ② 약 먹기 + 노란 띠

function StoolFlow({ cardIndex }: { cardIndex: number }) {
  const steps: {
    no: number;
    art: 'stoolCup' | 'bottle';
    label: string;
    alt: string;
  }[] = [
    {
      no: 1,
      art: 'stoolCup',
      label: screenTexts.design.stool,
      alt: '뚜껑 달린 대변 검사 통 그림',
    },
    {
      no: 2,
      art: 'bottle',
      label: screenTexts.design.takeMed,
      alt: '약을 만든 1리터 통 그림',
    },
  ];
  return (
    <div className="ld-stool">
      <div className="ld-stool-row">
        {steps.map((item, index) => (
          <Fragment key={item.no}>
            {index > 0 && <Arrow />}
            <div className={`ld-stool-card ${item.no === 1 ? 'first' : ''}`}>
              <span className="ld-stool-no">{item.no}</span>
              <span role="img" aria-label={item.alt} className="ld-art">
                <Drawing visual={{ kind: item.art }} />
              </span>
              <span className="ld-name-cell">
                <FitText className="ld-name">{item.label}</FitText>
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <p className={`ld-band ${cardIndex === 1 ? 'is-now' : ''}`}>
        <FitText>{screenTexts.design.stoolBand}</FitText>
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 60 40" className="ld-arrow" aria-hidden="true">
      <path
        d="M4 20 H46 M34 8 L50 20 L34 32"
        fill="none"
        stroke="#0F6670"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 5교시: 진행 막대 + 단계 그림

function PrepProgress({ index, total }: { index: number; total: number }) {
  return (
    <div className="ld-progress">
      <span className="ld-progress-count">
        {index + 1} / {total}
      </span>
      <span className="ld-progress-bar" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? 'on' : ''} />
        ))}
      </span>
    </div>
  );
}

function Supplies() {
  return (
    <div className="ld-supplies">
      <figure>
        <svg viewBox="0 0 100 145" role="img" aria-label="A제 약 봉지 그림">
          <Pouch x={0} y={2} letter="A" />
        </svg>
        <figcaption className="ld-name">
          <T>{screenTexts.design.pouchA}</T>
        </figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 100 145" role="img" aria-label="B제 약 봉지 그림">
          <Pouch x={0} y={2} letter="B" />
        </svg>
        <figcaption className="ld-name">
          <T>{screenTexts.design.pouchB}</T>
        </figcaption>
      </figure>
      <Arrow />
      <figure>
        <svg
          viewBox="0 0 160 290"
          role="img"
          aria-label="빨간 표시선이 있는 빈 1리터 통 그림"
          className="tall"
        >
          <Bottle x={0} y={2} level={0} />
        </svg>
        <figcaption className="ld-name">
          <T>{screenTexts.design.bottle1L}</T>
        </figcaption>
      </figure>
    </div>
  );
}

// 마시는 단계: 큰 컵 4개를 "15분" 화살표로 잇고, 생수 500mL 병
function Drinking() {
  return (
    <div className="ld-drink">
      <svg
        viewBox="0 0 830 330"
        role="img"
        aria-label="15분마다 한 컵씩 마시는 컵 네 개와 생수 500밀리리터 병 그림"
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <g transform={`translate(${i * 165} 80) scale(1.2)`}>
              <Cup x={0} y={0} at={0.3 + i * 0.5} />
            </g>
            {i < 3 && (
              <g>
                <FittedSvgText
                  x={i * 165 + 135}
                  y="120"
                  textAnchor="middle"
                  fontSize={30}
                  width={70}
                  fontWeight="900"
                  fill="#0F6670"
                >
                  {screenTexts.lesson.every15}
                </FittedSvgText>
                <path
                  d={`M${i * 165 + 112} 145 H${i * 165 + 152} M${i * 165 + 142} 135 L${i * 165 + 154} 145 L${i * 165 + 142} 155`}
                  fill="none"
                  stroke="#0F6670"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        ))}
        <g transform="translate(700 20) scale(0.98)">
          <WaterBottle x={0} y={0} />
        </g>
      </svg>
      <p className="ld-caption">
        <T>{screenTexts.design.drinkCaption}</T>
      </p>
    </div>
  );
}

function PrepStepScene({ step, hour }: { step: LessonStep; hour: number }) {
  if (step.kind !== 'prep') return null;
  switch (step.scene) {
    case 'supplies':
      return <Supplies />;
    case 'cups':
    case 'water':
      return <Drinking />;
    default:
      return (
        <div className="ld-prep">
          <span className="ld-prep-art">
            <PrepScene scene={step.scene} hour={hour} plain />
          </span>
          {step.scene === 'fill' && (
            <p className="ld-caption warn">
              <T>{screenTexts.design.fillLine}</T>
            </p>
          )}
          {step.scene === 'shake' && (
            <p className="ld-caption">
              <T>{screenTexts.design.shake}</T>
            </p>
          )}
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// 6교시: ① 같은 방법 + ② 가소콜 1포 + ③ 생수 500mL

// 가소콜 1포 봉지(사진이 없어 다른 그림과 같은 선 색·굵기로 그렸다)
function GasocolPack() {
  return (
    <svg viewBox="0 0 120 170" role="img" aria-label="가소콜 1포 봉지 그림">
      <path
        d="M10 22 L18 10 L26 22 L34 10 L42 22 L50 10 L58 22 L66 10 L74 22 L82 10 L90 22 L98 10 L106 22 L110 22 L110 156 Q110 164 102 164 L18 164 Q10 164 10 156 Z"
        fill="#E4E8EB"
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M26 42 H94"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M60 66 C46 86 40 98 40 110 A20 20 0 0 0 80 110 C80 98 74 86 60 66 Z"
        fill="#FFFFFF"
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SecondDose({ stepId }: { stepId: string }) {
  const now =
    stepId === 'second-gasocol' ? 1 : stepId === 'second-water' ? 2 : 0;
  const boxes: { art: ReactNode; lines: ReactNode }[] = [
    {
      art: (
        <svg
          viewBox="0 0 260 300"
          role="img"
          aria-label="약을 만든 1리터 통과 작은 컵 네 개 그림"
        >
          <g transform="translate(66 0) scale(0.8)">
            <Bottle x={0} y={0} level={1} cap />
          </g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${16 + i * 60} 240) scale(0.5)`}>
              <Cup x={0} y={0} at={0} />
            </g>
          ))}
        </svg>
      ),
      lines: (
        <>
          <FitText className="ld-name">{screenTexts.design.sameWay}</FitText>
          <FitText className="ld-name teal">
            {screenTexts.design.fourTimes}
          </FitText>
        </>
      ),
    },
    {
      // 검수 필요: 가소콜액 복용 방법 (그림은 "1포"만 보여 준다)
      art: <GasocolPack />,
      lines: (
        <FitText className="ld-name">{screenTexts.design.gasocolPack}</FitText>
      ),
    },
    {
      art: (
        <svg
          viewBox="0 0 120 300"
          role="img"
          aria-label="생수 500밀리리터 병 그림"
        >
          <WaterBottle x={0} y={2} />
        </svg>
      ),
      lines: (
        <FitText className="ld-name">{screenTexts.design.water500}</FitText>
      ),
    },
  ];
  return (
    <div className="ld-second">
      {boxes.map((box, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className="ld-plus" aria-hidden="true">
              +
            </span>
          )}
          <div className={`ld-box ${index === now ? 'is-now' : ''}`}>
            <span className="ld-box-art">{box.art}</span>
            <span className="ld-box-text">{box.lines}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7교시: 빨간 카드 5개 + 혈압약 칸

function Fasting({ cardIndex }: { cardIndex: number }) {
  return (
    <div className="ld-fasting">
      <PhotoRow
        cards={lesson7}
        boxAspect={1}
        className={`ld-row five ${cardIndex === 0 ? 'is-now' : ''}`}
      />
      <p className={`ld-okbox ${cardIndex === 1 ? 'is-now' : ''}`}>
        <TitleIcon icon="ok" />
        <T>{screenTexts.design.bpOk}</T>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

const titles: { icon: Icon; title: string }[] = [
  { icon: 'no', title: screenTexts.design.titles[0] },
  { icon: 'ok', title: screenTexts.design.titles[1] },
  { icon: 'time', title: screenTexts.design.titles[2] },
  { icon: 'care', title: screenTexts.design.titles[3] },
  { icon: 'bottle', title: screenTexts.design.titles[4] },
  { icon: 'time', title: screenTexts.design.titles[5] },
  { icon: 'no', title: screenTexts.design.titles[6] },
];

export function LessonDesign({
  lessonIndex,
  lesson,
  step,
  stepIndex,
}: {
  lessonIndex: number;
  lesson: Lesson;
  step: LessonStep;
  stepIndex: number;
}) {
  const head = titles[lessonIndex];
  const prepName = prepSteps.find((item) => item.id === step.id)?.name;
  const extra = lessonIndex === 4 ? prepName : undefined;
  const cardIndex = step.kind === 'card' ? step.card : 0;

  let body: ReactNode = null;
  switch (lessonIndex) {
    case 0:
      body = <FoodGrid cards={lesson1} stepId={step.id} />;
      break;
    case 1:
      body = <FoodGrid cards={lesson2} stepId={step.id} />;
      break;
    case 2:
      body = (
        <PhotoRow cards={lesson3} boxAspect={1} className="ld-row three" />
      );
      break;
    case 3:
      body = <StoolFlow cardIndex={cardIndex} />;
      break;
    case 4:
      body = (
        <div className="ld-prep-wrap">
          <PrepProgress index={stepIndex} total={lesson.steps.length} />
          <div key={step.id} className="ld-prep-body">
            <PrepStepScene step={step} hour={lesson.hour} />
          </div>
        </div>
      );
      break;
    case 5:
      body = <SecondDose stepId={step.id} />;
      break;
    case 6:
      body = <Fasting cardIndex={cardIndex} />;
      break;
  }

  return (
    <div className={`ld-scene ${lessonIndex < 2 ? 'wide' : ''}`}>
      <TitleCard icon={head.icon} title={head.title} extra={extra} />
      <div className="ld-body">{body}</div>
    </div>
  );
}
