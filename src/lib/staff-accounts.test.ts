import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLoginThrottle } from './login-throttle';
import { hashSecret } from './password';
import {
  createNurseAccount,
  disableNurseAccount,
  verifyLogin,
  type StaffAccountRow,
} from './staff-accounts';

const valid = { id: 'nurse10', name: '박간호사', password: 'password1' };

function fakeStore() {
  const rows = new Map<string, StaffAccountRow & { active: boolean }>();
  return {
    rows,
    insert: async (row: StaffAccountRow) => {
      if (rows.has(row.id)) return false;
      rows.set(row.id, { ...row, active: true });
      return true;
    },
    disable: async (id: string) => {
      const row = rows.get(id);
      if (!row) return false;
      row.active = false;
      return true;
    },
    // 로그인은 사용 중인 계정만 찾는다.
    find: async (id: string) => {
      const row = rows.get(id);
      return row?.active ? row : null;
    },
  };
}

describe('간호사 계정 만들기', () => {
  it('관리자는 만들 수 있고 비밀번호는 해시로만 저장된다', async () => {
    const store = fakeStore();
    const result = await createNurseAccount(
      { role: 'admin', insert: store.insert },
      valid,
    );
    assert.deepEqual(result, { ok: true });
    const saved = store.rows.get('nurse10');
    assert.ok(saved && !saved.passwordHash.includes('password1'));
    assert.equal(saved.role, 'nurse');
  });

  it('간호사·로그인 안 한 사람은 만들 수 없다', async () => {
    for (const role of ['nurse', null] as const) {
      const store = fakeStore();
      const result = await createNurseAccount(
        { role, insert: store.insert },
        valid,
      );
      assert.equal(result.ok, false);
      assert.equal(store.rows.size, 0);
    }
  });

  it('아이디 형식·중복, 비밀번호 8자 미만은 거절한다', async () => {
    const store = fakeStore();
    const deps = { role: 'admin' as const, insert: store.insert };
    for (const bad of [
      { ...valid, id: 'a b' },
      { ...valid, id: 'ab' },
      { ...valid, id: '한글아이디' },
      { ...valid, id: 'admin01' },
      { ...valid, id: 'nurse01' },
      { ...valid, password: '1234567' },
      { ...valid, name: '  ' },
    ]) {
      assert.equal((await createNurseAccount(deps, bad)).ok, false);
    }
    assert.equal(store.rows.size, 0);
    assert.equal((await createNurseAccount(deps, valid)).ok, true);
    const again = await createNurseAccount(deps, valid);
    assert.equal(again.ok, false);
  });
});

describe('간호사 계정 중지', () => {
  it('관리자만 중지할 수 있고 시연 계정은 중지할 수 없다', async () => {
    const store = fakeStore();
    await store.insert({
      id: 'nurse10',
      name: 'x',
      passwordHash: hashSecret('password1'),
      role: 'nurse',
    });
    const asNurse = await disableNurseAccount(
      { role: 'nurse', disable: store.disable },
      'nurse10',
    );
    assert.equal(asNurse.ok, false);
    assert.equal(store.rows.get('nurse10')?.active, true);
    const demo = await disableNurseAccount(
      { role: 'admin', disable: store.disable },
      'nurse01',
    );
    assert.equal(demo.ok, false);
    const done = await disableNurseAccount(
      { role: 'admin', disable: store.disable },
      'nurse10',
    );
    assert.equal(done.ok, true);
    assert.equal(store.rows.get('nurse10')?.active, false);
  });
});

describe('로그인', () => {
  const demoHash = hashSecret('1234');
  const demo: StaffAccountRow = {
    id: 'nurse01',
    name: '김간호사',
    passwordHash: demoHash,
    role: 'nurse',
  };

  function setup() {
    const store = fakeStore();
    return {
      store,
      deps: {
        throttle: createLoginThrottle(),
        // 실제 앱처럼 시연 계정을 먼저, 없으면 DB 계정을 찾는다.
        find: async (id: string) => (id === 'nurse01' ? demo : store.find(id)),
        fallbackHash: demoHash,
      },
    };
  }

  it('시연 계정은 계속 로그인된다', async () => {
    const { deps } = setup();
    assert.deepEqual(await verifyLogin(deps, 'nurse01', '1234'), {
      ok: true,
      id: 'nurse01',
      role: 'nurse',
    });
  });

  it('DB 계정은 로그인되고, 사용 중지하면 로그인되지 않는다', async () => {
    const { deps, store } = setup();
    await store.insert({
      id: 'nurse10',
      name: 'x',
      passwordHash: hashSecret('password1'),
      role: 'nurse',
    });
    assert.equal((await verifyLogin(deps, 'nurse10', 'password1')).ok, true);
    assert.equal((await verifyLogin(deps, 'nurse10', 'wrong')).ok, false);
    await store.disable('nurse10');
    assert.equal((await verifyLogin(deps, 'nurse10', 'password1')).ok, false);
  });

  it('5번 틀리면 맞는 비밀번호로도 잠겨 있다', async () => {
    const { deps } = setup();
    for (let i = 0; i < 5; i++) await verifyLogin(deps, 'nurse01', 'bad');
    assert.deepEqual(await verifyLogin(deps, 'nurse01', '1234'), {
      ok: false,
      reason: 'locked',
    });
  });
});
