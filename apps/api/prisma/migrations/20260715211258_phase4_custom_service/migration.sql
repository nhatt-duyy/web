-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NEW', 'QUOTING', 'CONFIRMED', 'IN_PROGRESS', 'REVIEW', 'DELIVERED', 'WARRANTY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('WEB_APP', 'MOBILE_APP', 'DESKTOP_APP', 'EXTENSION', 'INTEGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectFileKind" AS ENUM ('REQUEST_ATTACHMENT', 'DELIVERABLE', 'MESSAGE_ATTACHMENT');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'SKIPPED');

-- CreateTable
CREATE TABLE "CustomProjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ProjectType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" INTEGER,
    "deadline" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomProject" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NEW',
    "quotedAmount" INTEGER,
    "contractKey" TEXT,
    "contractSignedAt" TIMESTAMP(3),
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "warrantyMonths" INTEGER NOT NULL DEFAULT 3,
    "warrantyEndAt" TIMESTAMP(3),
    "isShowcase" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "percent" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFromStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "kind" "ProjectFileKind" NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "size" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "milestoneId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomProjectRequest_userId_idx" ON "CustomProjectRequest"("userId");

-- CreateIndex
CREATE INDEX "CustomProjectRequest_status_idx" ON "CustomProjectRequest"("status");

-- CreateIndex
CREATE INDEX "CustomProjectRequest_type_idx" ON "CustomProjectRequest"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CustomProject_requestId_key" ON "CustomProject"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomProject_slug_key" ON "CustomProject"("slug");

-- CreateIndex
CREATE INDEX "CustomProject_status_idx" ON "CustomProject"("status");

-- CreateIndex
CREATE INDEX "CustomProject_assigneeId_idx" ON "CustomProject"("assigneeId");

-- CreateIndex
CREATE INDEX "CustomProject_userId_idx" ON "CustomProject"("userId");

-- CreateIndex
CREATE INDEX "CustomProject_slug_idx" ON "CustomProject"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_paymentId_key" ON "Milestone"("paymentId");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status");

-- CreateIndex
CREATE INDEX "ProjectMessage_projectId_createdAt_idx" ON "ProjectMessage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectMessage_senderId_idx" ON "ProjectMessage"("senderId");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_kind_idx" ON "ProjectFile"("projectId", "kind");

-- CreateIndex
CREATE INDEX "ProjectFile_uploaderId_idx" ON "ProjectFile"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_milestoneId_key" ON "Payment"("milestoneId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_milestoneId_idx" ON "Payment"("milestoneId");

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_providerRef_key" ON "Payment"("provider", "providerRef");

-- AddForeignKey
ALTER TABLE "CustomProjectRequest" ADD CONSTRAINT "CustomProjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomProject" ADD CONSTRAINT "CustomProject_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomProject" ADD CONSTRAINT "CustomProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomProject" ADD CONSTRAINT "CustomProject_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CustomProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CustomProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CustomProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
