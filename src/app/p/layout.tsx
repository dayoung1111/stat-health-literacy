import { LangRoot, LanguageSwitch } from '../language';

// 환자 화면 공통 틀. 위쪽 오른편에 "한국어 / English" 바꾸기 버튼을 둔다.
export default function PatientLayout({ children }: LayoutProps<'/p'>) {
  return (
    <LangRoot className="min-h-screen bg-stat-paper px-4 text-stat-ink">
      <div className="mx-auto flex w-full max-w-md justify-end pt-4">
        <LanguageSwitch />
      </div>
      <main className="mx-auto w-full max-w-md py-6">{children}</main>
    </LangRoot>
  );
}
