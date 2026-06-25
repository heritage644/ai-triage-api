// src/queues/followup.queue.js
'use strict';

const Queue = require('bull');
const { createRedisConnection } = require('./redis');
const { logger } = require('../middleware/logger.middleware');

const followupQueue = new Queue('followup-queue', {
  createClient: () => createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

followupQueue.on('failed', (job, err) => {
  logger.error(
    { jobId: job.id, sessionId: job.data?.sessionId, err: err.message },
    'Followup job failed'
  );
});

followupQueue.on('completed', (job) => {
  logger.info({ jobId: job.id, sessionId: job.data?.sessionId }, 'Followup job completed');
});

const addFollowupJob = async (sessionId) => {
  return followupQueue.add(
    'generate-followup',
    { sessionId },
    { jobId: `followup:${sessionId}` }
  );
};

module.exports = { followupQueue, addFollowupJob };
