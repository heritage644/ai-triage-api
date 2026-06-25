// src/workers/assessment.worker.js
'use strict';

require('dotenv').config();

const prisma = require('../database/prisma');
const { assessmentQueue } = require('../queues/assessment.queue');
const { callGPTJson } = require('../ai/openai.service');
const { buildAssessmentPrompt } = require('../ai/prompts/assessment.prompt');
const { logger } = require('../middleware/logger.middleware');

const VALID_RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'EMERGENCY'];

const normaliseAssessment = (parsed) => {
  const riskLevel = String(parsed?.riskLevel || '').toUpperCase();
  if (!VALID_RISK_LEVELS.includes(riskLevel)) {
    throw new Error(`Invalid riskLevel received from GPT: ${parsed?.riskLevel}`);
  }
  return {
    riskLevel,
    possibleConditions: Array.isArray(parsed.possibleConditions)
      ? parsed.possibleConditions.slice(0, 5)
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 6)
      : [],
    explanation: String(parsed.explanation || ''),
  };
};

const processAssessmentJob = async (job) => {
  const { sessionId } = job.data;
  logger.info({ jobId: job.id, sessionId }, 'Processing assessment job');

  const session = await prisma.triageSession.findUnique({
    where: { id: sessionId },
    include: { symptom: true, followUp: true },
  });

  if (!session || !session.symptom || !session.followUp) {
    throw new Error(`Incomplete session data for assessment (session=${sessionId})`);
  }

  const answers = Array.isArray(session.followUp.answers?.answers)
    ? session.followUp.answers.answers
    : Array.isArray(session.followUp.answers)
    ? session.followUp.answers
    : [];

  const questions = Array.isArray(session.followUp.questions?.questions)
    ? session.followUp.questions.questions
    : [];

  // Build merged Q&A for the prompt
  const qa = answers.map((a, i) => ({
    question: questions.find((q) => q.questionId === a.questionId)?.question || `Question ${i + 1}`,
    answer: a.answer,
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
    schemaName: 'assessment',
  });

  const assessment = normaliseAssessment(parsed);

  await prisma.$transaction([
    prisma.assessmentResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        ...assessment,
        rawPayload: parsed,
      },
      update: {
        ...assessment,
        rawPayload: parsed,
      },
    }),
    prisma.triageSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    }),
  ]);

  logger.info({ sessionId, riskLevel: assessment.riskLevel }, 'Assessment saved');
  return { sessionId, rawLength: rawContent?.length ?? 0 };
};

assessmentQueue.process('generate-assessment', 2, processAssessmentJob);

logger.info('Assessment worker started');

process.on('SIGTERM', async () => {
  logger.info('Assessment worker shutting down');
  await assessmentQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});
