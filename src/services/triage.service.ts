import { Prisma, SessionStatus } from "@prisma/client";
import prisma from "../database/prisma";
import ApiError from "../utils/apierror";
import * as sessionService from "./session.services";
import { addFollowupJob } from "../queues/followup.queue";
import { addAssessmentJob } from "../queues/assessment.queue";

interface StartTriageParams {
  symptoms: string[];
  age?: number | null;
  gender?: string | null;
  metadata?: Record<string, unknown>;
}

interface FollowUpAnswer {
  question: string;
  answer: string;
}

/**
 * Create a new triage session, persist the initial symptoms,
 * and enqueue the follow-up generation job.
 */
export const startTriage = async ({
  symptoms,
  age,
  gender,
  metadata,
}: StartTriageParams) => {
  const session = await sessionService.createSession();

  await prisma.symptomSubmission.create({
    data: {
      sessionId: session.id,
      symptoms,
      age: age ?? null,
      gender: gender ?? null,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  await sessionService.updateSessionStatus(
    session.id,
    SessionStatus.AWAITING_FOLLOWUP
  );

  await addFollowupJob(session.id);

  return {
    sessionId: session.id,
    status: SessionStatus.AWAITING_FOLLOWUP,
    message:
      "Triage session created. Follow-up questions will be generated shortly.",
  };
};

/**
 * Store the patient's answers and enqueue
 * the assessment job.
 */
export const submitFollowupAnswers = async (
  sessionId: string,
  answers: FollowUpAnswer[]
) => {
  const session = await sessionService.findSessionById(sessionId);

  if (
    session.status !== SessionStatus.AWAITING_ANSWERS &&
    session.status !== SessionStatus.AWAITING_FOLLOWUP
  ) {
    throw new ApiError(
      409,
      `Session is not accepting answers (current status: ${session.status})`
    );
  }

  if (!session.followUp) {
    throw new ApiError(
      409,
      "Follow-up questions have not been generated yet"
    );
  }

  await prisma.followUpResponse.update({
    where: { sessionId },
    data: {
      answers: answers as unknown as Prisma.InputJsonValue,
    },
  });

  await sessionService.updateSessionStatus(
    sessionId,
    SessionStatus.AWAITING_ASSESSMENT
  );

  await addAssessmentJob(sessionId);

  return {
    sessionId,
    status: SessionStatus.AWAITING_ASSESSMENT,
    message:
      "Answers received. Risk assessment is being generated.",
  };
};

export const getAssessmentResult = async (
  sessionId: string
) => {
  const session = await sessionService.findSessionById(sessionId);

  if (
    session.status !== SessionStatus.COMPLETED ||
    !session.assessment
  ) {
    return {
      sessionId,
      status: session.status,
      ready: false,
      assessment: null,
    };
  }

  return {
    sessionId,
    status: session.status,
    ready: true,
    assessment: {
      riskLevel: session.assessment.riskLevel,
      possibleConditions: session.assessment.possibleConditions,
      recommendations: session.assessment.recommendations,
      explanation: session.assessment.explanation,
      createdAt: session.assessment.createdAt,
    },
  };
};