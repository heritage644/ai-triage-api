// src/workers/followup.worker.js
'use strict';

require('dotenv').config();

const prisma = require('../database/prisma');
const { followupQueue } = require('../queues/followup.queue');
const { callGPTJson } = require('../ai/openai.service');
const { buildFollowupPrompt } = require('../ai/prompts/followup.prompt');
const { logger } = require('../middleware/logger.middleware');

const processFollowupJob = async (job) => {
  const { sessionId } = job.data;
  logger.info({ jobId: job.id, sessionId }, 'Processing followup job');

  const submission = await prisma.symptomSubmission.findUnique({
    where: { sessionId },
    include: { session: true },
  });

  if (!submission) {
    throw new Error(`Symptom submission not found for session ${sessionId}`);
  }

  const { system, user } = buildFollowupPrompt({
    symptoms: submission.symptoms,
    age: submission.age,
    gender: submission.gender,
  });

  const { parsed } = await callGPTJson({
    system,
    user,
    schemaName: 'followup',
  });

  if (!Array.isArray(parsed?.questions)) {
    throw new Error('GPT did not return a questions array');
  }

  await prisma.$transaction([
    prisma.followUpResponse.upsert({
      where: { sessionId },
      create: {
        sessionId,
        questions: parsed,
      },
      update: {
        questions: parsed,
      },
    }),
    prisma.triageSession.update({
      where: { id: sessionId },
      data: { status: 'AWAITING_ANSWERS' },
    }),
  ]);

  logger.info({ sessionId, count: parsed.questions.length }, 'Followup questions saved');
  return { sessionId, questionCount: parsed.questions.length };
};

followupQueue.process('generate-followup', 2, processFollowupJob);

logger.info('Followup worker started');

process.on('SIGTERM', async () => {
  logger.info('Followup worker shutting down');
  await followupQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});
