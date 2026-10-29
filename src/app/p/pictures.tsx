import type { Picture, Visual } from '@/lib/demo-guide';

import { Source, T } from '../language';

// 외부 이미지 없이 직접 그린 그림. 그림 뜻은 아래 글(label)로 함께 보여 주므로
// 화면 읽기 프로그램에는 그림을 숨기고 글만 읽게 한다.

function Clock({ hour }: { hour: number }) {
  const angle = (hour % 12) * 30;
  return (
    <svg viewBox="0 0 100 100" className="size-24">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#FFF6D6"
        stroke="#0F6670"
        strokeWidth="6"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="11"
          x2="50"
          y2={i % 3 === 0 ? 20 : 16}
          stroke="#15262B"
          strokeWidth={i % 3 === 0 ? 4 : 2}
          strokeLinecap="round"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        stroke="#15262B"
        strokeWidth="7"
        strokeLinecap="round"
        transform={`rotate(${angle} 50 50)`}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="18"
        stroke="#15262B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="5" fill="#C2410C" />
    </svg>
  );
}

function Pouch() {
  return (
    <svg viewBox="0 0 100 100" className="size-24">
      <path
        d="M22 22 L28 14 L34 22 L40 14 L46 22 L52 14 L58 22 L64 14 L70 22 L76 14 L80 22 L80 86 Q80 92 74 92 L26 92 Q20 92 20 86 L20 22 Z"
        fill="#DCEDEE"
        stroke="#0F6670"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="30"
        y="40"
        width="40"
        height="30"
        rx="6"
        fill="#fff"
        stroke="#0F6670"
        strokeWidth="3"
      />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#0F6670"
      >
        약
      </text>
    </svg>
  );
}

function Bottle() {
  return (
    <svg viewBox="0 0 100 100" className="size-24">
      <rect x="40" y="6" width="20" height="10" rx="3" fill="#0F6670" />
      <path
        d="M38 16 L62 16 L62 26 Q74 32 74 44 L74 88 Q74 94 68 94 L32 94 Q26 94 26 88 L26 44 Q26 32 38 26 Z"
        fill="#fff"
        stroke="#0F6670"
        strokeWidth="4"
      />
      <path
        d="M28 50 L72 50 L72 88 Q72 92 68 92 L32 92 Q28 92 28 88 Z"
        fill="#9FD3D6"
      />
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="#15262B"
      >
        1L
      </text>
    </svg>
  );
}

function Cup() {
  return (
    <svg viewBox="0 0 40 50" className="h-14 w-11">
      <path
        d="M4 6 L36 6 L32 46 L8 46 Z"
        fill="#fff"
        stroke="#0F6670"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M7 18 L33 18 L30 44 L10 44 Z" fill="#9FD3D6" />
    </svg>
  );
}

function Calendar({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-24">
      <rect
        x="12"
        y="16"
        width="76"
        height="74"
        rx="10"
        fill="#fff"
        stroke="#15262B"
        strokeWidth="4"
      />
      <path
        d="M12 26 Q12 16 22 16 L78 16 Q88 16 88 26 L88 36 L12 36 Z"
        fill="#C2410C"
      />
      <rect x="28" y="8" width="8" height="18" rx="4" fill="#15262B" />
      <rect x="64" y="8" width="8" height="18" rx="4" fill="#15262B" />
      <text
        x="50"
        y="74"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#15262B"
      >
        <Source text={text} />
      </text>
    </svg>
  );
}

export function Drawing({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case 'clock':
      return <Clock hour={visual.hour} />;
    case 'pouch':
      return <Pouch />;
    case 'bottle':
      return <Bottle />;
    case 'calendar':
      return <Calendar text={visual.text} />;
    case 'cups':
      return (
        <span className="flex h-24 items-center">
          {Array.from({ length: visual.count }, (_, i) => (
            <Cup key={i} />
          ))}
        </span>
      );
    case 'emoji':
      return <span className="text-7xl leading-none">{visual.emoji}</span>;
  }
}

// 그림 한 개. 하면 안 되는 것은 빨간 ✕를 겹쳐 그린다.
function Art({ picture }: { picture: Picture }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-24 min-w-24 shrink-0 items-center justify-center"
    >
      <Drawing visual={picture.visual} />
      {picture.no && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto size-24">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#C2410C"
            strokeWidth="8"
          />
          <line
            x1="20"
            y1="80"
            x2="80"
            y2="20"
            stroke="#C2410C"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function Label({ picture }: { picture: Picture }) {
  return (
    <>
      {picture.no && (
        <span className="sr-only">
          <T id="common.no" />
        </span>
      )}
      <Source text={picture.label} />
    </>
  );
}

// 그림 + 아래 짧은 말.
export function PictureCard({ picture }: { picture: Picture }) {
  return (
    <figure className="flex flex-col items-center gap-2 text-center">
      <Art picture={picture} />
      <figcaption className="text-xl leading-snug font-bold break-keep">
        <Label picture={picture} />
      </figcaption>
    </figure>
  );
}

// 그림 여러 개를 한 줄(좁으면 두 줄)로 보여 준다.
// compact: 그림을 조금 작게 해 휴대폰에서도 한 줄에 담는다(안내문 화면).
// 영어는 글자가 길어서 한 줄에 3개씩 나눠 보여 준다.
export function PictureRow({
  pictures,
  compact = false,
}: {
  pictures: Picture[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex justify-center gap-3 [&:lang(en)]:flex-wrap">
        {pictures.map((picture) => (
          <div
            key={picture.label}
            className="min-w-0 flex-1 [&:lang(en)]:w-[calc((100%-1.5rem)/3)] [&:lang(en)]:flex-none [&_.h-14]:h-8 [&_.size-24]:size-16 [&_.text-7xl]:text-5xl [&_.w-11]:w-[15px] [&>figure>span]:h-16 [&>figure>span]:min-w-16"
          >
            <PictureCard picture={picture} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-5">
      {pictures.map((picture) => (
        <PictureCard key={picture.label} picture={picture} />
      ))}
    </div>
  );
}

// 그림 왼쪽 + 짧은 한 줄 오른쪽. "헷갈려요" 설명에 쓴다.
export function PictureLines({ pictures }: { pictures: Picture[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {pictures.map((picture) => (
        <li
          key={picture.label}
          className="flex items-center gap-5 rounded-3xl bg-white p-4 shadow-sm"
        >
          <Art picture={picture} />
          <span className="text-2xl leading-snug font-bold break-keep">
            <Label picture={picture} />
          </span>
        </li>
      ))}
    </ul>
  );
}
