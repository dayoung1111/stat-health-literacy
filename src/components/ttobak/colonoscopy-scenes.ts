import type { Scene } from './types';

// 대장내시경 준비 안내 대본. 문구를 고칠 때는 이 파일만 수정한다.
// 현재 1~3장면만 있으며, 4~8장면은 확인 후 추가한다.
export const colonoscopyScenes: readonly Scene[] = [
  {
    id: 'greeting',
    title: '인사',
    action: 'wave',
    cards: [],
    lines: [
      { text: '안녕하세요, 저는 또박이예요.' },
      { text: '대장내시경 준비를 같이 해볼게요.' },
    ],
  },
  {
    id: 'diet-3-days',
    title: '3일 전 음식',
    action: 'point',
    cards: [
      { id: 'grain-rice', label: '잡곡밥', emoji: '🌾', kind: 'avoid' },
      { id: 'kimchi', label: '김치', emoji: '🥬', kind: 'avoid' },
      { id: 'seaweed', label: '김', emoji: '🍙', kind: 'avoid' },
      { id: 'seed-fruit', label: '씨 있는 과일', emoji: '🍉', kind: 'avoid' },
      { id: 'white-rice', label: '흰쌀밥', emoji: '🍚', kind: 'ok' },
      { id: 'rice-porridge', label: '흰죽', emoji: '🥣', kind: 'ok' },
      { id: 'egg', label: '계란', emoji: '🥚', kind: 'ok' },
      { id: 'tofu', label: '두부', emoji: '⬜', kind: 'ok' },
      { id: 'banana', label: '바나나', emoji: '🍌', kind: 'ok' },
    ],
    lines: [
      { text: '검사 3일 전부터는 음식을 골라 드셔야 해요.' },
      {
        text: '잡곡밥, 김치, 김, 씨 있는 과일은 드시지 마세요.',
        highlight: ['grain-rice', 'kimchi', 'seaweed', 'seed-fruit'],
      },
      {
        text: '흰쌀밥, 흰죽, 계란, 두부, 바나나는 드셔도 돼요.',
        highlight: ['white-rice', 'rice-porridge', 'egg', 'tofu', 'banana'],
      },
    ],
  },
  {
    id: 'evening-before',
    title: '전날 저녁',
    action: 'alarm',
    cards: [
      {
        id: 'porridge-before-7',
        label: '저녁 7시 전, 반찬 없이 흰죽',
        emoji: '🥣',
        kind: 'ok',
      },
      {
        id: 'fast-from-midnight',
        label: '밤 12시부터 금식',
        emoji: '🌙',
        kind: 'avoid',
      },
    ],
    lines: [
      {
        text: '검사 전날 저녁은 7시 전에 드세요.',
        highlight: ['porridge-before-7'],
      },
      {
        text: '반찬 없이 흰죽만 드세요.',
        highlight: ['porridge-before-7'],
      },
      {
        text: '밤 12시부터는 아무것도 드시지 마세요.',
        highlight: ['fast-from-midnight'],
      },
    ],
  },
];
