'use server';

import { z } from 'zod';

import { demoGuide, guideSteps } from '@/lib/demo-guide';
import { getPatientCode } from '@/lib/demo-patient';
import {
  addConfusionMark,
  saveMedicationCheck,
  saveTeachbackResult,
} from '@/lib/education-store';
import { medicationIds } from '@/lib/medication-guide';

// 환자 화면에서 남기는 기록. 생년월일을 확인한 같은 코드의 환자만 저장할 수 있다.
// 저장 위치는 education-store.ts(지금은 시연용 임시 저장소)이며, 의료진 코드 상세에 보인다.

const codeSchema = z.string().regex(/^\d{6}$/);

export async function saveMyMedications(code: string, ids: string[]) {
  const parsed = z
    .object({ code: codeSchema, ids: z.array(z.enum(medicationIds)) })
    .safeParse({ code, ids });
  if (!parsed.success || !(await getPatientCode(parsed.data.code))) {
    return { ok: false as const };
  }
  await saveMedicationCheck(parsed.data.code, [...new Set(parsed.data.ids)]);
  return { ok: true as const };
}

const topics = demoGuide.questions.map((q) => q.topic) as [string, ...string[]];

export async function recordTeachback(
  code: string,
  question: string,
  result: string,
) {
  const parsed = z
    .object({
      code: codeSchema,
      question: z.enum(topics),
      result: z.enum(['correct', 'retry_correct', 'wrong']),
    })
    .safeParse({ code, question, result });
  if (!parsed.success || !(await getPatientCode(parsed.data.code))) return;
  await saveTeachbackResult(
    parsed.data.code,
    'colonoscopy',
    parsed.data.question,
    parsed.data.result,
  );
}

const paragraphIds = guideSteps.map((step) => step.id) as [string, ...string[]];

export async function recordConfusion(code: string, paragraphId: string) {
  const parsed = z
    .object({ code: codeSchema, paragraphId: z.enum(paragraphIds) })
    .safeParse({ code, paragraphId });
  if (!parsed.success || !(await getPatientCode(parsed.data.code))) return;
  await addConfusionMark(
    parsed.data.code,
    'colonoscopy',
    parsed.data.paragraphId,
  );
}
