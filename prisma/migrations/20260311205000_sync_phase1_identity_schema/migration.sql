DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole')
    AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    ALTER TYPE "UserRole" RENAME TO "Role";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('student', 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OnboardingStatus') THEN
    CREATE TYPE "OnboardingStatus" AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OnboardingStep') THEN
    CREATE TYPE "OnboardingStep" AS ENUM ('account', 'interests', 'profile', 'complete');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'displayName'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "name" TO "displayName";
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "displayName" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

UPDATE "User"
SET "displayName" = COALESCE(NULLIF("displayName", ''), split_part("email", '@', 1))
WHERE "displayName" IS NULL OR "displayName" = '';

UPDATE "User"
SET "passwordHash" = 'legacy-account'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "displayName" SET NOT NULL,
  ALTER COLUMN "passwordHash" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
      AND udt_name <> 'Role'
  ) THEN
    ALTER TABLE "User"
      ALTER COLUMN "role" TYPE "Role"
      USING ("role"::text::"Role");
  END IF;
END $$;

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "verificationStatus";

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OnboardingState" (
  "userId" TEXT NOT NULL,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'not_started',
  "currentStep" "OnboardingStep" NOT NULL DEFAULT 'account',
  "interestKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx"
  ON "Session"("userId", "expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Session_userId_fkey'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE "Session"
      ADD CONSTRAINT "Session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'OnboardingState_userId_fkey'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE "OnboardingState"
      ADD CONSTRAINT "OnboardingState_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "OnboardingState" (
  "userId",
  "status",
  "currentStep",
  "interestKeywords",
  "completedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'in_progress'::"OnboardingStatus",
  'interests'::"OnboardingStep",
  ARRAY[]::TEXT[],
  NULL,
  "createdAt",
  "updatedAt"
FROM "User"
WHERE NOT EXISTS (
  SELECT 1
  FROM "OnboardingState"
  WHERE "OnboardingState"."userId" = "User"."id"
);
