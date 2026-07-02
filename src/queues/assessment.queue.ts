// src/queues/assessment.queue.ts

import Queue, { Job } from "bull";
import {createRedisConnection} from "./redis";
import { logger } from "../middleware/logger.middleare";

interface AssessmentJobData {
  sessionId: string;
}

export const assessmentQueue = new Queue<AssessmentJobData>(
  "assessment-queue",
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

assessmentQueue.on(
  "failed",
  (job: Job<AssessmentJobData> | undefined, err: Error) => {
    logger.error(
      {
        jobId: job?.id,
        sessionId: job?.data.sessionId,
        err: err.message,
      },
      "Assessment job failed"
    );
  }
);

assessmentQueue.on(
  "completed",
  (job: Job<AssessmentJobData>) => {
    logger.info(
      {
        jobId: job.id,
        sessionId: job.data.sessionId,
      },
      "Assessment job completed"
    );
  }
);

export const addAssessmentJob = async (
  sessionId: string
): Promise<Job<AssessmentJobData>> => {
  return assessmentQueue.add(
    "generate-assessment",
    { sessionId },
    {
      jobId: `assessment:${sessionId}`,
    }
  );
};