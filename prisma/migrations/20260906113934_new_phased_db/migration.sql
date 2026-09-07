-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CREATED', 'AWAITING_FOLLOWUP', 'AWAITING_ANSWERS', 'AWAITING_ASSESSMENT', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY');

-- CreateTable
CREATE TABLE "triage_sessions" (
    "id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_submissions" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "symptoms" TEXT[],
    "age" INTEGER,
    "gender" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_responses" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "possible_conditions" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triage_sessions_status_idx" ON "triage_sessions"("status");

-- CreateIndex
CREATE INDEX "triage_sessions_created_at_idx" ON "triage_sessions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_submissions_session_id_key" ON "symptom_submissions"("session_id");

-- CreateIndex
CREATE INDEX "symptom_submissions_session_id_idx" ON "symptom_submissions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_responses_session_id_key" ON "follow_up_responses"("session_id");

-- CreateIndex
CREATE INDEX "follow_up_responses_session_id_idx" ON "follow_up_responses"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_session_id_key" ON "assessment_results"("session_id");

-- CreateIndex
CREATE INDEX "assessment_results_session_id_idx" ON "assessment_results"("session_id");

-- CreateIndex
CREATE INDEX "assessment_results_risk_level_idx" ON "assessment_results"("risk_level");

-- AddForeignKey
ALTER TABLE "symptom_submissions" ADD CONSTRAINT "symptom_submissions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "triage_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_responses" ADD CONSTRAINT "follow_up_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "triage_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "triage_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
