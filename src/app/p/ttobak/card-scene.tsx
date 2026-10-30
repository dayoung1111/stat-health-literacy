import Image from 'next/image';

import type { CardItem, KeyTone, LessonCard } from '@/lib/demo-guide';

import { screenTexts } from '@/lib/screen-texts';

import { T } from '../../translated';
import { Drawing } from '../pictures';
import { FitText } from './fit-text';

// 3·4·7·8교시 카드 장면: 위에 큰 안내 카드, 아래에 이름표 붙은 사진(그림) 카드.
// 사진 위 X / O / 노란 ! 는 하나씩 차례로 그려진다.

const signs: Record<KeyTone, { say: string }> = {
  no: { say: screenTexts.lesson.signNo },
  ok: { say: screenTexts.lesson.signOk },
  care: { say: screenTexts.lesson.signCare },
};

// 안내 카드 왼쪽 동그라미 속 ✕ / ○ / !
function SignMark({ tone }: { tone: KeyTone }) {
  const color = tone === 'care' ? '#15262B' : '#FFFFFF';
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40">
      {tone === 'no' && (
        <path
          d="M8 8 L32 32 M32 8 L8 32"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
        />
      )}
      {tone === 'ok' && (
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke={color}
          strokeWidth="6"
        />
      )}
      {tone === 'care' && (
        <>
          <path
            d="M20 4 L20 24"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="20" cy="34" r="4.5" fill={color} />
        </>
      )}
    </svg>
  );
}

// 8교시 "이럴 땐 꼭 말씀하세요": 글 대신 그림 + 색 띠로 보여 준다.
// 할 일은 demo-guide.ts의 tellUs와 같고 말만 짧게 줄였다(빨강: 하지 않기, 초록: 알리기).
type PictureNote = {
  emoji: string;
  situation: string;
  action: string;
  actionIcon: string;
  tone: 'stop' | 'tell';
};
const pictureNotesByCard: Record<string, PictureNote[]> = {
  'tell-us': [
    {
      emoji: '🩸',
      situation: screenTexts.lesson.notes.period,
      actionIcon: '✋',
      action: screenTexts.lesson.notes.periodDo,
      tone: 'stop',
    },
    {
      emoji: '🤰',
      situation: screenTexts.lesson.notes.pregnant,
      actionIcon: '📞',
      action: screenTexts.lesson.notes.pregnantDo,
      tone: 'tell',
    },
    {
      emoji: '🤮',
      situation: screenTexts.lesson.notes.vomit,
      actionIcon: '✋',
      action: screenTexts.lesson.notes.vomitDo,
      tone: 'stop',
    },
    {
      emoji: '💩',
      situation: screenTexts.lesson.notes.stool,
      actionIcon: '🗣️',
      action: screenTexts.lesson.notes.stoolDo,
      tone: 'tell',
    },
  ],
};

const drawingAlt: Record<string, string> = {
  stoolCup: '뚜껑 달린 대변 검사 통 그림',
  bottle: '약을 만든 1리터 통 그림',
};

export function CardScene({ card }: { card: LessonCard }) {
  const sign = signs[card.sign];
  const wide = card.items.length === 1 && Boolean(card.items[0].tags);
  const pictureNotes = pictureNotesByCard[card.id];
  return (
    <div className="pc-wrap">
      <div className={`pc-guide ${card.sign}`}>
        <span className={`pc-sign ${card.sign}`}>
          <SignMark tone={card.sign} />
          <span className="sr-only">
            <T>{sign.say}</T>:{' '}
          </span>
        </span>
        <span className="pc-guide-text">
          <span className="pc-title">
            <T>{card.title}</T>
          </span>
          {!pictureNotes && (
            <span className="pc-sub">
              <T>{card.sub}</T>
            </span>
          )}
        </span>
      </div>

      {pictureNotes ? (
        <ul className="pc-picnotes">
          {pictureNotes.map((note, index) => (
            <li
              key={note.situation}
              className={`pc-picnote ${note.tone}`}
              style={{ animationDelay: `${0.5 + index * 0.4}s` }}
            >
              <span aria-hidden="true" className="pc-picnote-emoji">
                {note.emoji}
              </span>
              {/* 번역으로 길어진 말(특히 베트남어)이 칸 밖으로 나가지 않게 글자 크기를 맞춘다. */}
              <span className="pc-picnote-situation">
                <FitText maxLines={1}>{note.situation}</FitText>
              </span>
              <span className="pc-picnote-band">
                <span aria-hidden="true">{note.actionIcon}</span>
                <FitText maxLines={1}>{note.action}</FitText>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        card.notes && (
          <ul className="pc-notes">
            {card.notes.map((note, index) => (
              <li
                key={note}
                className="pc-note"
                style={{ animationDelay: `${0.5 + index * 0.4}s` }}
              >
                {note}
              </li>
            ))}
          </ul>
        )
      )}

      {card.items.length > 0 && (
        <ul className="pc-items">
          {card.items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className={`pc-item ${wide ? 'wide' : ''} ${item.mark ?? ''}`}
              style={{ animationDelay: `${0.2 + index * 0.25}s` }}
            >
              <ItemPicture item={item} wide={wide} />
              {item.mark && (
                <CardMark tone={item.mark} delay={0.9 + index * 0.45} />
              )}
              {item.tags?.map((tag) => (
                <span
                  key={tag.text}
                  className="pc-tag"
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                >
                  <T>{tag.text}</T>
                </span>
              ))}
              {!wide && (
                <span className="pc-item-name">
                  {item.mark && (
                    <span className="sr-only">
                      <T>{signs[item.mark].say}</T>:{' '}
                    </span>
                  )}
                  <T>{item.label}</T>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemPicture({ item, wide }: { item: CardItem; wide: boolean }) {
  if (item.photo) {
    return (
      <span className="pc-photo">
        <Image
          src={item.photo.src}
          alt={item.photo.alt}
          fill
          sizes={wide ? '(max-width: 900px) 60vw, 400px' : '200px'}
        />
      </span>
    );
  }
  if (!item.visual) return null;
  return (
    <span
      role="img"
      aria-label={drawingAlt[item.visual.kind] ?? item.label}
      className="pc-photo pc-drawing"
    >
      <Drawing visual={item.visual} />
    </span>
  );
}

// 사진 위 X(빨강) / 동그라미(초록) / 느낌표(노랑)
function CardMark({ tone, delay }: { tone: KeyTone; delay: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className="pc-mark">
      {tone === 'no' && (
        <>
          <path
            d="M18 18 L102 102"
            stroke="#D9363E"
            strokeWidth="13"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay}s` }}
          />
          <path
            d="M102 18 L18 102"
            stroke="#D9363E"
            strokeWidth="13"
            strokeLinecap="round"
            className="pl-draw-line"
            style={{ animationDelay: `${delay + 0.2}s` }}
          />
        </>
      )}
      {tone === 'ok' && (
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#2E9E6B"
          strokeWidth="12"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="pl-draw-circle"
          style={{ animationDelay: `${delay}s` }}
        />
      )}
      {tone === 'care' && (
        <g className="pc-care" style={{ animationDelay: `${delay}s` }}>
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="#F5C33B"
            stroke="#15262B"
            strokeWidth="5"
          />
          <path
            d="M60 36 L60 66"
            stroke="#15262B"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <circle cx="60" cy="83" r="6.5" fill="#15262B" />
        </g>
      )}
    </svg>
  );
}
