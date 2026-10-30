-- 관리자가 만드는 간호사 계정. 비밀번호는 해시만 저장한다.
-- CreateTable
CREATE TABLE "staff_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'nurse',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_accounts_pkey" PRIMARY KEY ("id")
);

-- 접근 규칙(RLS): 허용 규칙(policy)을 만들지 않아 Supabase 공개 API(anon·authenticated)로는 읽고 쓸 수 없다.
ALTER TABLE "staff_accounts" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "staff_accounts" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "staff_accounts" FROM authenticated;
  END IF;
END $$;
