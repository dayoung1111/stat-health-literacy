import { screenTexts } from '@/lib/screen-texts';

import { T } from '../../../translated';
import { PrepFollow } from '../../ttobak/prep-follow';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 약 만들기 따라하기(또박이 수업 5·6교시의 "따라하기로 직접 해보기").
export default function PrepPage({ params }: PageProps<'/p/[code]/prep'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/video` }} />
          <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
            <T>{screenTexts.prep.title}</T>
          </h1>
          <PrepFollow />
          <CheckWithStaff />
        </>
      )}
    />
  );
}
