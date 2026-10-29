// 로그인 실패 잠금: 같은 키(아이디)로 연속 max번 틀리면 lockMs 동안 잠근다. 성공하면 횟수를 지운다.
// 기록이 무한히 쌓이지 않게 maxEntries를 넘으면 가장 오래된 것부터 지운다.
export function createLoginThrottle({
  max = 5,
  lockMs = 10 * 60 * 1000,
  maxEntries = 1000,
}: { max?: number; lockMs?: number; maxEntries?: number } = {}) {
  const entries = new Map<string, { fails: number; lockedUntil: number }>();

  return {
    isLocked(key: string, now = Date.now()) {
      const entry = entries.get(key);
      if (!entry) return false;
      if (entry.lockedUntil > now) return true;
      if (entry.lockedUntil > 0) entries.delete(key); // 잠금 시간이 끝나면 처음부터
      return false;
    },
    /** 실패를 기록하고, 지금 잠겼는지와 남은 횟수를 돌려준다. */
    recordFailure(key: string, now = Date.now()) {
      const entry = entries.get(key) ?? { fails: 0, lockedUntil: 0 };
      entry.fails += 1;
      if (entry.fails >= max) entry.lockedUntil = now + lockMs;
      entries.delete(key);
      entries.set(key, entry);
      if (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
      return { locked: entry.lockedUntil > now, remaining: max - entry.fails };
    },
    reset(key: string) {
      entries.delete(key);
    },
  };
}
