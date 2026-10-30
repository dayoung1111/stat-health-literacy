'use client';

import { createContext, useContext } from 'react';

// 환자가 직접 고른 적이 없으면 의료진이 코드를 발급할 때 고른 언어를 쓴다(patient-page.tsx가 translated.tsx의 IssuedLanguage로 넣어 준다).
export const IssuedLanguageContext = createContext('ko');

export const useIssuedLanguage = () => useContext(IssuedLanguageContext);

// 오류 화면(error.tsx)은 환자 화면 틀(IssuedLanguage) 바깥에 있어서 발급 언어를 모른다.
// 그래서 마지막으로 연 코드 화면의 발급 언어를 기억해 두고, 오류 화면이 그 언어로 보이게 한다.
let lastIssued = 'ko';
export const rememberIssuedLanguage = (language: string) => {
  lastIssued = language;
};
export const rememberedIssuedLanguage = () => lastIssued;
