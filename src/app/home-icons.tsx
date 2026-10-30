import type { ReactNode } from 'react';

// 첫 화면에서만 쓰는 선 아이콘. 글자 색(currentColor)을 따른다.

function Icon({
  children,
  className = 'size-6',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function SoundOnIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </Icon>
  );
}

export function SoundOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
    </Icon>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function StaffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  );
}

/** 이렇게 쓰여요 1: 번호 넣기 */
export function KeypadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M7 12h.01M10.5 12h.01M14 12h.01M17 12h.01" strokeWidth="2.6" />
    </Icon>
  );
}

/** 이렇게 쓰여요 2: 또박이 수업 */
export function LessonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="13" rx="2.5" />
      <path d="M10 9v5l4-2.5z" />
      <path d="M8 21h8" />
    </Icon>
  );
}

/** 이렇게 쓰여요 3: 돌발 퀴즈 */
export function QuizIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
    </Icon>
  );
}
