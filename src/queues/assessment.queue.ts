// src/queues/assessment.queue.js
'use strict';

const Queue = require('bull');
const { createRedisConnection } = require('./redis');
const { logger } = require('../middleware/logger.middleware');

const assessmentQueue = new Queue('assessment-queue', {
  createClient: () => createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

assessmentQueue.on('failed', (job, err) => {
  logger.error(
    { jobId: job.id, sessionId: job.data?.sessionId, err: err.message },
    'Assessment job failed'
  );
});

assessmentQueue.on('completed', (job) => {
  logger.info({ jobId: job.id, sessionId: job.data?.sessionId }, 'Assessment job completed');
});

const addAssessmentJob = async (sessionId) => {
  return assessmentQueue.add(
    'generate-assessment',
    { sessionId },
    { jobId: `assessment:${sessionId}` }
  );
};

module.exports = { assessmentQueue, addAssessmentJob };
