import { demoGuide, getTodo, hospital } from '@/lib/demo-guide';
import { getDemoSchedule } from '@/lib/demo-patient';

import { ButtonLink, CheckWithStaff } from '../../ui';
import { PatientPage } from '../patient-page';

export default function PatientHomePage({
  params,
}: PageProps<'/p/[code]/home'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => <PatientHome code={code} />}
    />
  );
}

async function PatientHome({ code }: { code: string }) {
  const { examLabel, daysLeft } = await getDemoSchedule();
  const todo = getTodo(daysLeft);

  return (
    <>
      <p className="text-lg text-zinc-600">
        {hospital.name} · 검사일 {examLabel}
        {daysLeft > 0 && ` · 검사까지 ${daysLeft}일`}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{demoGuide.examName} 안내</h1>

      <section
        aria-labelledby="todo-title"
        className="mt-6 rounded-2xl bg-amber-50 p-6"
      >
        <h2 id="todo-title" className="text-xl font-bold">
          <span aria-hidden="true">⏰ </span>지금 할 일
        </h2>
        <p className="mt-3 text-2xl leading-relaxed font-bold">{todo.title}</p>
        {todo.lines.map((line) => (
          <p key={line} className="text-xl leading-relaxed">
            {line}
          </p>
        ))}
      </section>

      <nav aria-label="환자 메뉴" className="mt-8 flex flex-col gap-4">
        <ButtonLink href={`/p/${code}/guide/1`} variant="outline">
          📄 안내문 전체 보기
        </ButtonLink>
        <ButtonLink href={`/p/${code}/check`} variant="outline">
          ✅ 이해했는지 확인하기
        </ButtonLink>
        <ButtonLink href={`/p/${code}/danger`} variant="danger">
          🚨 이럴 땐 바로 병원에
        </ButtonLink>
      </nav>
      <CheckWithStaff />
    </>
  );
}
