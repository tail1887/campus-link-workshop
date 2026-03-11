-- CreateEnum
CREATE TYPE "RecruitCategory" AS ENUM ('study', 'project', 'hackathon');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'admin');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "campus" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "RecruitCategory" NOT NULL,
    "campus" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "roles" TEXT[],
    "techStack" TEXT[],
    "capacity" INTEGER NOT NULL,
    "currentMembers" INTEGER NOT NULL DEFAULT 2,
    "stage" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "highlight" BOOLEAN NOT NULL DEFAULT true,
    "ownerName" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,
    "meetingStyle" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "expectations" TEXT[],
    "perks" TEXT[],
    "ownerId" TEXT,

    CONSTRAINT "RecruitPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitApplication" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "applicantId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitPost_slug_key" ON "RecruitPost"("slug");

-- CreateIndex
CREATE INDEX "RecruitPost_category_deadline_idx" ON "RecruitPost"("category", "deadline");

-- CreateIndex
CREATE INDEX "RecruitApplication_createdAt_idx" ON "RecruitApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitApplication_postId_contact_key" ON "RecruitApplication"("postId", "contact");

-- AddForeignKey
ALTER TABLE "RecruitPost" ADD CONSTRAINT "RecruitPost_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitApplication" ADD CONSTRAINT "RecruitApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitApplication" ADD CONSTRAINT "RecruitApplication_postId_fkey" FOREIGN KEY ("postId") REFERENCES "RecruitPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
