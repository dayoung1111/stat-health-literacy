-- 환자 화면 오류 기록(30일 보관). 생년월일·이름·환자가 입력한 값·오류 문장은 저장하지 않는다.
-- Supabase SQL Editor에 그대로 붙여 넣어도 되도록, 이미 있는 표·색인은 건너뛴다.

-- CreateTable
CREATE TABLE IF NOT EXISTS "error_logs" (
    "id" UUID NOT NULL,
    "error_number" VARCHAR(6) NOT NULL,
    "code" VARCHAR(6),
    "staff_id" TEXT,
    "place" VARCHAR(60) NOT NULL,
    "kind" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "digest" VARCHAR(64),
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_created_at_idx" ON "error_logs"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_staff_id_created_at_idx" ON "error_logs"("staff_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_code_idx" ON "error_logs"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_error_number_idx" ON "error_logs"("error_number");

-- 접근 규칙(RLS): 허용 규칙(policy)을 하나도 만들지 않아, Supabase 공개 API(anon·authenticated)로는
-- 아무도 읽거나 쓸 수 없다. 앱 서버(Prisma, DB 소유자 계정)만 읽고 쓰며,
-- 관리자=전체 / 간호사=자기가 발급한 코드 / 로그인 안 함=없음은 앱 서버가 매번 확인한다.
ALTER TABLE "error_logs" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "error_logs" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "error_logs" FROM authenticated;
  END IF;
END $$;

-- 30일 지난 기록 자동 삭제: Supabase에서 pg_cron을 켜 두었으면 매일 새벽(한국 12시 17분) 지운다.
-- 켜지 않았어도 앱이 기록을 저장하거나 볼 때마다 30일 지난 기록을 지운다.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE $cron$
      SELECT cron.schedule(
        'error-logs-30-days',
        '17 15 * * *',
        'DELETE FROM public.error_logs WHERE created_at < now() - interval ''30 days'''
      )
    $cron$;
  END IF;
END $$;
