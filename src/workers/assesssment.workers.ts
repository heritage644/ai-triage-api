// src/workers/assessment.worker.ts

import "dotenv/config";

import prisma from "../database/prisma";
import { Prisma, SessionStatus, RiskLevel } from "@prisma/client";

import { assessmentQueue } from "../queues/assessment.queue";
import { callGPTJson } from "../ai/openai.service";
import { buildAssessmentPrompt } from "../ai/prompts/assesment.prompts";
import { logger } from "../middleware/logger.middleare";



interface ParsedAssessment {
  riskLevel: RiskLevel;
  possibleConditions: string[];
  recommendations: string[];
  explanation: string;
}

interface FollowupAnswer {
  questionId: string;
  answer: string;
}

interface FollowupQuestion {
  questionId: string;
  question: string;
}

const VALID_RISK_LEVELS: RiskLevel[] = [
  "LOW",
  "MODERATE",
  "HIGH",
  "EMERGENCY",
];

function normaliseAssessment(parsed: any): ParsedAssessment {
  const riskLevel = String(parsed?.riskLevel ?? "").toUpperCase() as RiskLevel;

  if (!VALID_RISK_LEVELS.includes(riskLevel)) {
    throw new Error(`Invalid riskLevel received from GPT: ${parsed?.riskLevel}`);
  }

  return {
    riskLevel,

    possibleConditions: Array.isArray(parsed?.possibleConditions)
      ? parsed.possibleConditions.slice(0, 5)
      : [],

    recommendations: Array.isArray(parsed?.recommendations)
      ? parsed.recommendations.slice(0, 6)
      : [],

    explanation: String(parsed?.explanation ?? ""),
  };
}

const processAssessmentJob = async (job: any) => {
  const { sessionId } = job.data;

  logger.info(
    {
      jobId: job.id,
      sessionId,
    },
    "Processing assessment job"
  );

  const session = await prisma.triageSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      symptom: true,
      followUp: true,
    },
  });

  if (!session || !session.symptom || !session.followUp) {
    throw new Error(
      `Incomplete session data for assessment (session=${sessionId})`
    );
  }

  const answers: FollowupAnswer[] = Array.isArray(
    (session.followUp.answers as any)?.answers
  )
    ? (session.followUp.answers as any).answers
    : Array.isArray(session.followUp.answers)
    ? (session.followUp.answers as unknown as FollowupAnswer[])
    : [];

  const questions: FollowupQuestion[] = Array.isArray(
    (session.followUp.questions as any)?.questions
  )
    ? (session.followUp.questions as any).questions
    : [];

  const qa = answers.map((answer, index) => ({
    question:
      questions.find((q) => q.questionId === answer.questionId)?.question ??
      `Question ${index + 1}`,
    answer: answer.answer,
  }));

  const { system, user } = buildAssessmentPrompt({
    symptoms: session.symptom.symptoms,
    age: session.symptom.age,
    gender: session.symptom.gender,
    answers: qa,
  });

  const { parsed, rawContent } = await callGPTJson({
    system,
    user,
    schemaName: "assessment",
  });

  const assessment = normaliseAssessment(parsed);

  await prisma.$transaction([
    prisma.assessmentResult.upsert({
      where: {
        sessionId,
      },
      create: {
        sessionId,
        ...assessment,
        rawPayload: parsed as Prisma.InputJsonValue,
      },
      update: {
        ...assessment,
        rawPayload: parsed as Prisma.InputJsonValue,
      },
    }),

    prisma.triageSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: SessionStatus.COMPLETED,
      },
    }),
  ]);

  logger.info(
    {
      sessionId,
      riskLevel: assessment.riskLevel,
    },
    "Assessment saved"
  );

  return {
    sessionId,
    rawLength: rawContent?.length ?? 0,
  };
};

assessmentQueue.process(
  "generate-assessment",
  2,
  processAssessmentJob
);

logger.info("Assessment worker started");

process.on("SIGTERM", async () => {
  logger.info("Assessment worker shutting down");

  await assessmentQueue.close();
  await prisma.$disconnect();

  process.exit(0);
});