import type { ReactNode } from 'react';

import { demoGuide, guideSteps } from '@/lib/demo-guide';
import { listStaffAccounts, roleLabels } from '@/lib/demo-staff';
import { listAllCodes, type EducationCode } from '@/lib/education-store';
import { guideCatalog, guideKinds, guideNames } from '@/lib/guide-catalog';
import { confusionLabel } from '@/lib/guide-labels';
import { medications } from '@/lib/medication-guide';
import { medicationCell, teachbackOnly } from '@/lib/medication-summary';

import { Panel } from '../../ui';
import { StaffPage } from '../../staff-page';

// 관리자 화면(시연용 간단 버전). 관리자 역할만 들어올 수 있고, 서버에서 매번 확인한다.
// 데이터는 Supabase(education-store.ts)에서 읽는다.
export default function AdminPage() {
  return (
    <StaffPage role="admin">
      <AdminOverview />
    </StaffPage>
  );
}

const percent = (part: number, total: number) =>
  total === 0 ? '—' : `${Math.round((part / total) * 100)}%`;

// 전체 코드 표의 "이해 확인"은 티치백만 센다(의료진 목록과 같게).
function passed(code: EducationCode) {
  return teachbackOnly(code).filter((r) => r.result !== 'wrong').length;
}

async function AdminOverview() {
  const codes = await listAllCodes();
  const accounts = listStaffAccounts();
  const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  // 이해 확인 통과율: 확인 질문(대장내시경 티치백 + 복용약 확인 질문) 중 맞힘·다시 설명 후 맞힘 비율
  const results = codes.flatMap((c) => c.teachbackResults);
  const passCount = results.filter((r) => r.result !== 'wrong').length;
  const byGuide = guideKinds
    .map((kind) => {
      const list = results.filter((r) => r.guide === kind);
      return {
        kind,
        total: list.length,
        pass: list.filter((r) => r.result !== 'wrong').length,
      };
    })
    .filter((g) => g.total > 0);
  const answered = codes.filter((c) => c.teachbackResults.length > 0);
  const allClear = answered.filter((c) =>
    c.teachbackResults.every((r) => r.result !== 'wrong'),
  );

  // "헷갈려요" 많이 누른 부분 순위(모든 코드 합계)
  const marks = new Map<string, { label: string; count: number }>();
  for (const code of codes) {
    for (const m of code.confusionMarks) {
      const key = `${m.guide}:${m.paragraphId}`;
      const found = marks.get(key);
      if (found) found.count += m.count;
      else
        marks.set(key, {
          label: confusionLabel(m.guide, m.paragraphId),
          count: m.count,
        });
    }
  }
  const ranking = [...marks.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="관리자 화면 바로가기" className="flex flex-wrap gap-2">
        {[
          ['#stats', '통계'],
          ['#codes', '전체 코드'],
          ['#accounts', '간호사 계정'],
          ['#guides', '안내문'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border-2 border-zinc-300 bg-white px-4 py-2 font-semibold hover:border-blue-700"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="stats" className="scroll-mt-4">
        <Panel title="통계">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="이해 확인 통과율"
              value={percent(passCount, results.length)}
              note={`확인 질문 ${results.length}개 중 ${passCount}개 맞힘`}
            />
            <Stat
              label="모두 맞힌 환자"
              value={percent(allClear.length, answered.length)}
              note={`결과가 있는 코드 ${answered.length}개 중 ${allClear.length}개`}
            />
            <Stat
              label="발급된 코드"
              value={`${codes.length}개`}
              note="만료(7일)된 코드는 빠져요"
            />
          </div>
          {byGuide.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-base">
              {byGuide.map((g) => (
                <li key={g.kind} className="rounded-lg bg-zinc-50 px-3 py-2">
                  {guideCatalog[g.kind].name}:{' '}
                  <strong>{percent(g.pass, g.total)}</strong> ({g.pass}/
                  {g.total})
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-6 mb-2 text-lg font-bold">
            「헷갈려요」 많이 누른 부분
          </h3>
          {ranking.length === 0 ? (
            <Empty>아직 누른 곳이 없어요.</Empty>
          ) : (
            <ol className="flex flex-col gap-2">
              {ranking.map((r, i) => (
                <li
                  key={r.label}
                  className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-2 text-lg"
                >
                  <span className="w-8 font-bold text-amber-900">
                    {i + 1}위
                  </span>
                  <span className="flex-1">{r.label}</span>
                  <strong>{r.count}회</strong>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      <section id="codes" className="scroll-mt-4">
        <Panel title={`전체 코드 (${codes.length}개)`}>
          <Table
            head={[
              '코드',
              '발급 간호사',
              '묶은 안내',
              '검사일',
              '드시는 약',
              '이해 확인',
            ]}
          >
            {codes.map((c) => {
              const total = teachbackOnly(c).length;
              const ok = passed(c) === total;
              return (
                <tr key={c.code} className="border-b border-zinc-200">
                  <td className="px-3 py-3 font-mono font-semibold">
                    {c.code}
                    {c.lockedAt && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 text-sm text-red-700">
                        잠김
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">{nameOf(c.staffId)}</td>
                  <td className="px-3 py-3">
                    {guideNames(c.guides).join(', ')}
                  </td>
                  <td className="px-3 py-3">{c.examDate}</td>
                  <td
                    className={`px-3 py-3 ${medicationCell(c).muted ? 'text-zinc-500' : 'font-semibold'}`}
                  >
                    {medicationCell(c).text}
                  </td>
                  <td
                    className={`px-3 py-3 font-bold ${
                      total === 0
                        ? 'font-normal text-zinc-500'
                        : ok
                          ? 'text-green-700'
                          : 'text-red-700'
                    }`}
                  >
                    {total === 0
                      ? '아직 없음'
                      : `${passed(c)}/${total} ${ok ? '✓' : '⚠ 재교육'}`}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      </section>

      <section id="accounts" className="scroll-mt-4">
        <Panel title="간호사 계정">
          <Table head={['아이디', '이름', '역할', '발급한 코드']}>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-zinc-200">
                <td className="px-3 py-3 font-mono">{a.id}</td>
                <td className="px-3 py-3">{a.name}</td>
                <td className="px-3 py-3">{roleLabels[a.role]}</td>
                <td className="px-3 py-3">
                  {a.role === 'nurse'
                    ? `${codes.filter((c) => c.staffId === a.id).length}개`
                    : '—'}
                </td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-sm text-zinc-500">
            시연용 계정입니다. 계정 추가·비밀번호 변경은 로그인 단계(DB)에서
            만들어요.
          </p>
        </Panel>
      </section>

      <section id="guides" className="scroll-mt-4">
        <Panel title="안내문">
          <Table head={['안내', '상태', '내용']}>
            {guideKinds.map((kind) => {
              const guide = guideCatalog[kind];
              const content =
                kind === 'colonoscopy'
                  ? `안내 ${guideSteps.length}화면 · 확인 질문 ${demoGuide.questions.length}개`
                  : kind === 'medication'
                    ? `약 ${medications.length}종 · 약마다 확인 질문 1개`
                    : '—';
              return (
                <tr key={kind} className="border-b border-zinc-200">
                  <td className="px-3 py-3 font-semibold">{guide.name}</td>
                  <td
                    className={`px-3 py-3 ${guide.ready ? 'text-green-700' : 'text-amber-800'}`}
                  >
                    {guide.ready ? '환자 화면 있음' : '준비 중'}
                  </td>
                  <td className="px-3 py-3">{content}</td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-base font-semibold text-zinc-600">{label}</p>
      <p className="mt-1 text-4xl font-bold text-blue-700">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{note}</p>
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
