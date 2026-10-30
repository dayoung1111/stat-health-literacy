import { TtobagiFigure } from '../ttobagi';

// 환자 화면 전체가 멈췄을 때 하얀 화면 대신 보여 주는 안내(그림·글자만. 기록 저장은 error.tsx가 한다).
// 글자는 한국어 원문이며, error.tsx가 고른 언어로 바꿔 넣어 준다.

export const errorScreenTexts = {
  title: '잠깐 문제가 생겼어요',
  body: '아래 "다시 시도" 버튼을 눌러 주세요.',
  numberLabel: '오류 번호',
  tellNurse: '간호사에게 이 번호를 알려 주세요',
  retry: '다시 시도',
};

export type ErrorScreenTexts = typeof errorScreenTexts;

export function PatientErrorView({
  errorNumber,
  texts = errorScreenTexts,
  onRetry,
}: {
  errorNumber: string;
  texts?: ErrorScreenTexts;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-5 text-center">
      <span aria-hidden="true" className="ttobagi-shake w-36">
        <TtobagiFigure pose="stop" />
      </span>
      <h1 className="text-3xl leading-snug font-bold break-keep">
        {texts.title}
      </h1>
      <p className="text-xl leading-relaxed break-keep text-zinc-700">
        {texts.body}
      </p>
      <div className="w-full rounded-3xl border-2 border-stat-alert bg-white px-6 py-5">
        <p className="text-xl font-semibold text-zinc-700">
          {texts.numberLabel}
        </p>
        <p className="mt-1 font-mono text-6xl font-bold tracking-wider text-stat-alert">
          {errorNumber}
        </p>
        <p className="mt-3 text-2xl leading-snug font-bold break-keep">
          {texts.tellNurse}
        </p>
      </div>
      {/* 버튼 모양은 환자 화면 기본 버튼(ui.tsx buttonClass.primary)과 같다. */}
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-18 w-full items-center justify-center rounded-3xl bg-stat-green px-6 text-2xl font-bold text-white hover:bg-stat-green-dark focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stat-green"
      >
        🔄 {texts.retry}
      </button>
    </div>
  );
}
