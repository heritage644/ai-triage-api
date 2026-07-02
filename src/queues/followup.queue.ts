// src/queues/followup.queue.ts

import Queue, { Job } from "bull";
import { createRedisConnection } from "./redis";
import { logger } from "../middleware/logger.middleare";

interface FollowupJobData {
  sessionId: string;
}

export const followupQueue = new Queue<FollowupJobData>(
  "followup-queue",
  {
    createClient: () => createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);

followupQueue.on(
  "failed",
  (job: Job<FollowupJobData> | undefined, err: Error) => {
    logger.error(
      {
        jobId: job?.id,
        sessionId: job?.data.sessionId,
        err: err.message,
      },
      "Follow-up job failed"
    );
  }
);

followupQueue.on(
  "completed",
  (job: Job<FollowupJobData>) => {
    logger.info(
      {
        jobId: job.id,
        sessionId: job.data.sessionId,
      },
      "Follow-up job completed"
    );
  }
);

export const addFollowupJob = async (
  sessionId: string
): Promise<Job<FollowupJobData>> => {
  return followupQueue.add(
    "generate-followup",
    { sessionId },
    {
      jobId: `followup:${sessionId}`,
    }
  );
};