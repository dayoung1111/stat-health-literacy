import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { getStaff, listStaffAccounts } from '@/lib/demo-staff';
import {
  ERROR_LOG_DAYS,
  errorKindLabels,
  groupErrorLogs,
  parseErrorSearch,
  type ErrorKind,
} from '@/lib/error-log';
import { listErrorLogs } from '@/lib/error-log-store';

import { ResolveButton } from '../../error-buttons';
import { Panel } from '../../ui';

// 오류 기록: 환자 화면에서 난 오류(Supabase error_logs).
// 관리자는 전체, 간호사는 자기가 발급한 교육 코드의 기록만 본다. 로그인하지 않았으면 로그인 화면으로 보낸다.
// 걸러 내기는 서버(error-log-store.ts)가 매번 한다.
export default function ErrorLogPage({
  searchParams,
}: PageProps<'/staff/errors'>) {
  return (
    <Suspense fallback={<p className="text-lg text-zinc-600">불러오는 중…</p>}>
      {searchParams.then((params) => (
        <ErrorLogs query={typeof params.q === 'string' ? params.q : ''} />
      ))}
    </Suspense>
  );
}

const time = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const kindLabel = (kind: string) => errorKindLabels[kind as ErrorKind] ?? kind;

async function ErrorLogs({ query }: { query: string }) {
  const staff = await getStaff();
  if (!staff) redirect('/staff');

  const search = query.trim() ? parseErrorSearch(query) : null;
  const badSearch = query.trim() !== '' && search === null;
  const logs = badSearch ? [] : await listErrorLogs(staff, search);
  const groups = groupErrorLogs(logs);
  const accounts = await listStaffAccounts();
  const nameOf = (id: string | null) =>
    id ? (accounts.find((a) => a.id === id)?.name ?? id) : '—';
  const isAdmin = staff.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <Panel title="오류 기록">
        <p className="mb-4 text-base text-zinc-600">
          {isAdmin
            ? '모든 환자 화면의 오류예요.'
            : '내가 발급한 교육 코드에서 난 오류만 보여요.'}{' '}
          {ERROR_LOG_DAYS}일이 지난 기록은 자동으로 지워져요. 생년월일·이름·
          환자가 입력한 값은 저장하지 않아요.
        </p>
        <form
          action="/staff/errors"
          className="flex flex-wrap items-end gap-3"
          role="search"
        >
          <label className="flex flex-col gap-1 text-base font-semibold">
            교육 코드 또는 오류 번호
            <input
              name="q"
              defaultValue={query}
              placeholder="예: 482917 / E-4821"
              maxLength={12}
              className="min-h-12 w-64 rounded-lg border-2 border-zinc-300 px-3 font-mono text-lg focus-visible:border-blue-700 focus-visible:outline-none"
            />
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-lg bg-blue-700 px-5 text-lg font-bold text-white hover:bg-blue-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            찾기
          </button>
          {query && (
            <Link
              href="/staff/errors"
              className="min-h-12 py-3 text-base text-zinc-600 underline underline-offset-4"
            >
              전체 보기
            </Link>
          )}
        </form>
        {badSearch && (
          <p role="alert" className="mt-3 text-base text-red-700">
            교육 코드 6자리(또는 DEMO)나 오류 번호(E-4821)로 찾아 주세요.
          </p>
        )}
      </Panel>

      <Panel title={`같은 화면·같은 오류 묶음 (${groups.length}가지)`}>
        {groups.length === 0 ? (
          <Empty>{query ? '찾은 오류가 없어요.' : '아직 오류가 없어요.'}</Empty>
        ) : (
          <Table head={['화면 위치', '오류 종류', '건수', '마지막', '처리']}>
            {groups.map((g) => (
              <tr
                key={`${g.place}-${g.kind}`}
                className="border-b border-zinc-200"
              >
                <td className="px-3 py-3 font-semibold">{g.place}</td>
                <td className="px-3 py-3">{kindLabel(g.kind)}</td>
                <td className="px-3 py-3">
                  <strong>{g.count}건</strong>
                  {g.open > 0 && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 text-sm text-red-700">
                      미해결 {g.open}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {time.format(g.lastAt)}
                </td>
                <td className="px-3 py-3">
                  {g.open > 0 ? (
                    <ResolveButton
                      place={g.place}
                      kind={g.kind}
                      count={g.open}
                    />
                  ) : (
                    <span className="text-green-700">해결됨</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title={`최근 오류 (${logs.length}건)`}>
        {logs.length === 0 ? (
          <Empty>{query ? '찾은 오류가 없어요.' : '아직 오류가 없어요.'}</Empty>
        ) : (
          <Table
            head={[
              '오류 번호',
              '시간',
              '교육 코드',
              ...(isAdmin ? ['발급 간호사'] : []),
              '화면 위치',
              '오류 종류',
              '기기',
              '처리',
            ]}
          >
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-200">
                <td className="px-3 py-3 font-mono text-lg font-bold">
                  {log.errorNumber}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {time.format(log.createdAt)}
                </td>
                <td className="px-3 py-3 font-mono">{log.code ?? '—'}</td>
                {isAdmin && (
                  <td className="px-3 py-3">{nameOf(log.staffId)}</td>
                )}
                <td className="px-3 py-3">{log.place}</td>
                <td className="px-3 py-3">{kindLabel(log.kind)}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {log.device} · {log.browser}
                </td>
                <td className="px-3 py-3">
                  {log.resolvedAt ? (
                    <span className="text-green-700">
                      해결함 ({nameOf(log.resolvedBy)})
                    </span>
                  ) : (
                    <ResolveButton id={log.id} />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead className="bg-zinc-100">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-lg text-zinc-500">{children}</p>;
}
