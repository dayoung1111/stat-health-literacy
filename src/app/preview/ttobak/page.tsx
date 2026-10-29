import type { Metadata } from 'next';
import { colonoscopyScenes } from '@/components/ttobak/colonoscopy-scenes';
import { TtobakPlayer } from '@/components/ttobak/TtobakPlayer';

// 확인용 임시 화면. 팀 환자 화면에 플레이어를 붙인 뒤에는 삭제해도 된다.
export const metadata: Metadata = {
  title: '또박이 안내 영상 미리보기',
  robots: { index: false },
};

export default function TtobakPreviewPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-8 sm:py-12 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
          확인용 미리보기 화면
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">전체 설명</h1>
        <div className="mt-6">
          <TtobakPlayer title="대장내시경 준비" scenes={colonoscopyScenes} />
        </div>
      </div>
    </main>
  );
}
