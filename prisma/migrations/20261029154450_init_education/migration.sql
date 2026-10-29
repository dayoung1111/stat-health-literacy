-- CreateEnum
CREATE TYPE "TeachbackOutcome" AS ENUM ('correct', 'retry_correct', 'wrong');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "staff_id" TEXT NOT NULL,
    "guides" TEXT[],
    "age_group" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "extras" TEXT[],
    "exam_date" DATE NOT NULL,
    "blood_thinner_stop_date" DATE,
    "birth_date_hash" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_checks" (
    "code_id" UUID NOT NULL,
    "medications" TEXT[],
    "checked_at" TIMESTAMPTZ NOT NULL,
    "picked_at" JSONB NOT NULL,

    CONSTRAINT "medication_checks_pkey" PRIMARY KEY ("code_id")
);

-- CreateTable
CREATE TABLE "teachback_results" (
    "id" UUID NOT NULL,
    "code_id" UUID NOT NULL,
    "guide" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "result" "TeachbackOutcome" NOT NULL,
    "answered_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teachback_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confusion_marks" (
    "id" UUID NOT NULL,
    "code_id" UUID NOT NULL,
    "guide" TEXT NOT NULL,
    "paragraph_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "last_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "confusion_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_completions" (
    "id" UUID NOT NULL,
    "code_id" UUID NOT NULL,
    "guide" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guide_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "education_codes_code_key" ON "education_codes"("code");

-- CreateIndex
CREATE INDEX "education_codes_staff_id_expires_at_idx" ON "education_codes"("staff_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "teachback_results_code_id_guide_question_key" ON "teachback_results"("code_id", "guide", "question");

-- CreateIndex
CREATE UNIQUE INDEX "confusion_marks_code_id_guide_paragraph_id_key" ON "confusion_marks"("code_id", "guide", "paragraph_id");

-- CreateIndex
CREATE UNIQUE INDEX "guide_completions_code_id_guide_key" ON "guide_completions"("code_id", "guide");

-- AddForeignKey
ALTER TABLE "medication_checks" ADD CONSTRAINT "medication_checks_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "education_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachback_results" ADD CONSTRAINT "teachback_results_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "education_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confusion_marks" ADD CONSTRAINT "confusion_marks_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "education_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_completions" ADD CONSTRAINT "guide_completions_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "education_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
