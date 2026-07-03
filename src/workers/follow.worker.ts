// src/workers/followup.worker.ts

import "dotenv/config";

import { Prisma, SessionStatus } from "@prisma/client";
import prisma from "../database/prisma";
import { followupQueue } from "../queues/followup.queue";
import { callGPTJson } from "../ai/openai.service";
import { buildFollowupPrompt } from "../ai/prompts/follow.prompts";
import { logger } from "../middleware/logger.middleare";

interface FollowupQuestion {
  questionId: string;
  question: string;
}

interface FollowupResponse {
  questions: FollowupQuestion[];
}

const processFollowupJob = async (
  job: any
): Promise<{
  sessionId: string;
  questionCount: number;
}> => {
  const { sessionId } = job.data;

  logger.info(
    {
      jobId: job.id,
      sessionId,
    },
    "Processing followup job"
  );

  const submission = await prisma.symptomSubmission.findUnique({
    where: {
      sessionId,
    },
    include: {
      session: true,
    },
  });

  if (!submission) {
    throw new Error(
      `Symptom submission not found for session ${sessionId}`
    );
  }

  const { system, user } = buildFollowupPrompt({
    symptoms: submission.symptoms,
    age: submission.age,
    gender: submission.gender,
  });

  const { parsed } = await callGPTJson({
    system,
    user,
    schemaName: "followup",
  });

  const response = parsed as FollowupResponse;

  if (!Array.isArray(response.questions)) {
    throw new Error("GPT did not return a questions array");
  }

  await prisma.$transaction([
    prisma.followUpResponse.upsert({
      where: {
        sessionId,
      },
      create: {
        sessionId,
        questions: response as unknown as Prisma.InputJsonValue,
      },
      update: {
        questions: response as unknown as Prisma.InputJsonValue,
      },
    }),

    prisma.triageSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: SessionStatus.AWAITING_ANSWERS,
      },
    }),
  ]);

  logger.info(
    {
      sessionId,
      count: response.questions.length,
    },
    "Followup questions saved"
  );

  return {
    sessionId,
    questionCount: response.questions.length,
  };
};

followupQueue.process(
  "generate-followup",
  2,
  processFollowupJob
);

logger.info("Followup worker started");

process.on("SIGTERM", async () => {
  logger.info("Followup worker shutting down");

  await followupQueue.close();
  await prisma.$disconnect();

  process.exit(0);
});