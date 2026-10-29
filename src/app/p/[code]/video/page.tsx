import { demoGuide, videoScenes } from '@/lib/demo-guide';

import { TtobakPlayer } from '../../ttobak/ttobak-player';
import { CheckWithStaff, PatientTopBar } from '../../ui';
import { PatientPage } from '../patient-page';

// 또박이가 안내문을 말로 설명해 주는 화면. 내용은 안내문 화면과 같은 데이터를 쓴다.
export default function VideoPage({ params }: PageProps<'/p/[code]/video'>) {
  return (
    <PatientPage
      params={params}
      render={(code) => (
        <>
          <PatientTopBar code={code} back={{ fallback: `/p/${code}/home` }} />
          <h1 className="mb-4 text-3xl leading-snug font-bold break-keep">
            또박이와 같이 볼까요? 🙂
          </h1>
          <TtobakPlayer
            title={`${demoGuide.examName} 준비`}
            scenes={videoScenes}
          />
          <CheckWithStaff />
        </>
      )}
    />
  );
}
