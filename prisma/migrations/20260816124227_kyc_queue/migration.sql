-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'escalated');

-- CreateEnum
CREATE TYPE "KycRiskBand" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('passport', 'driving_licence', 'proof_of_address');

-- CreateTable
CREATE TABLE "KycCase" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskBand" "KycRiskBand" NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'pending',
    "assigneeId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,

    CONSTRAINT "KycCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "KycDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycCase_status_idx" ON "KycCase"("status");

-- CreateIndex
CREATE INDEX "KycCase_assigneeId_idx" ON "KycCase"("assigneeId");

-- CreateIndex
CREATE INDEX "KycCase_riskScore_submittedAt_idx" ON "KycCase"("riskScore", "submittedAt");

-- CreateIndex
CREATE INDEX "KycDocument_caseId_idx" ON "KycDocument"("caseId");

-- AddForeignKey
ALTER TABLE "KycCase" ADD CONSTRAINT "KycCase_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycCase" ADD CONSTRAINT "KycCase_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "KycCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
