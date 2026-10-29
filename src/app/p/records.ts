'use server';

import { z } from 'zod';

import { isCodeShape } from '@/lib/code-shape';
import { demoGuide, guideSteps } from '@/lib/demo-guide';
import { getPatientCode } from '@/lib/demo-patient';
import {
  addConfusionMark,
  markGuideCompleted,
  saveMedicationCheck,
  saveTeachbackResult,
} from '@/lib/education-store';
import { guideKinds } from '@/lib/guide-catalog';
import { nextGuide } from '@/lib/guide-progress';
import { medicationIds } from '@/lib/medication-guide';

// 환자 화면에서 남기는 기록. 생년월일을 확인한 같은 코드의 환자만 저장할 수 있다.
// 저장 위치는 education-store.ts(Supabase)이며, 의료진 코드 상세에 보인다.

const codeSchema = z.string().refine(isCodeShape);

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

// 복용약 확인 질문 결과(약마다 하나, 다시 풀면 최신으로).
export async function recordMedicationQuiz(
  code: string,
  medicationId: string,
  result: string,
) {
  const parsed = z
    .object({
      code: codeSchema,
      medicationId: z.enum(medicationIds),
      result: z.enum(['correct', 'retry_correct', 'wrong']),
    })
    .safeParse({ code, medicationId, result });
  if (!parsed.success || !(await getPatientCode(parsed.data.code))) return;
  await saveTeachbackResult(
    parsed.data.code,
    'medication',
    parsed.data.medicationId,
    parsed.data.result,
  );
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

// 안내 하나를 끝까지 마쳤을 때. 아직 안 마친 다른 안내(다음에 볼 곳)를 돌려준다.
export async function completeGuide(code: string, guide: string) {
  const parsed = z
    .object({ code: codeSchema, guide: z.enum(guideKinds) })
    .safeParse({ code, guide });
  if (!parsed.success || !(await getPatientCode(parsed.data.code))) {
    return { ok: false as const };
  }
  const row = await markGuideCompleted(parsed.data.code, parsed.data.guide);
  if (!row) return { ok: false as const };
  return {
    ok: true as const,
    next: nextGuide(
      row.guides,
      row.guideCompletions.map((c) => c.guide),
      parsed.data.guide,
    ),
  };
}
