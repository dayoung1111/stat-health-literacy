'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { guideKinds, type GuideKind } from '@/lib/guide-catalog';

import { completeGuide } from './records';

// 환자가 끝까지 마친 안내를 이 브라우저(localStorage)에 코드별로 남긴다.
// 서버 기록은 메모리라 다시 켜거나(서버 여러 대면) 사라질 수 있어서, 화면 표시는 브라우저 기록을 함께 본다.
// localStorage를 못 쓰는 브라우저(사생활 보호 창 등)에서도 이 화면이 열려 있는 동안은 표시되도록 메모리에도 둔다.

const storageKey = (code: string) => `stat-guide-done:${code}`;
const changed = 'stat-guide-done';
const thisVisit = new Map<string, GuideKind[]>();

const isGuideKind = (value: unknown): value is GuideKind =>
  guideKinds.includes(value as GuideKind);

function readSaved(code: string): GuideKind[] {
  try {
    const list: unknown = JSON.parse(
      window.localStorage.getItem(storageKey(code)) ?? '[]',
    );
    return Array.isArray(list) ? list.filter(isGuideKind) : [];
  } catch {
    return [];
  }
}

/** 안내 하나를 다 봤을 때: 브라우저에 남기고, 서버에도 저장한다(결과는 기다리지 않음). */
export function markGuideDone(code: string, guide: GuideKind) {
  const visit = thisVisit.get(code) ?? [];
  if (!visit.includes(guide)) thisVisit.set(code, [...visit, guide]);
  try {
    const saved = readSaved(code);
    if (!saved.includes(guide)) {
      window.localStorage.setItem(
        storageKey(code),
        JSON.stringify([...saved, guide]),
      );
    }
  } catch {
    // 저장하지 못해도 이번 방문 동안은 위 메모리로 보여 준다.
  }
  window.dispatchEvent(new Event(changed));
  void completeGuide(code, guide);
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(changed, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(changed, onChange);
  };
}

/**
 * 마친 안내 목록: 서버가 알려 준 것 + 이 브라우저에 남은 것(안내 목록 순서).
 * 처음 그릴 때(서버에서 만든 화면과 맞출 때)는 서버 목록만 쓰고, 그 뒤 브라우저 기록을 더한다.
 */
export function useCompletedGuides(
  code: string,
  fromServer: readonly GuideKind[],
): GuideKind[] {
  const local = useSyncExternalStore(
    subscribe,
    () => [...readSaved(code), ...(thisVisit.get(code) ?? [])].sort().join(','),
    () => '',
  );
  const serverKey = fromServer.join(',');
  return useMemo(() => {
    const done = new Set<string>([
      ...serverKey.split(','),
      ...local.split(','),
    ]);
    return guideKinds.filter((kind) => done.has(kind));
  }, [serverKey, local]);
}
