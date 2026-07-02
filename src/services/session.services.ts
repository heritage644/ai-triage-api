// src/services/session.service.ts

import prisma from "../database/prisma";
import ApiError from "../utils/apierror";

/**
 * Creates a new triage session.
 */
export const createSession = async () => {
  return prisma.triageSession.create({
    data: {
      status: "CREATED",
    },
  });
};

/**
 * Finds a session by its ID.
 * Throws a 404 ApiError if the session does not exist.
 */
export const findSessionById = async (sessionId: string) => {
  const session = await prisma.triageSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      symptom: true,
      followUp: true,
      assessment: true,
    },
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  return session;
};

/**
 * Updates the status of an existing session.
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: string
) => {
  return prisma.triageSession.update({
    where: {
      id: sessionId,
    },
    data: {
      status,
    },
  });
};

/**
 * Returns a simplified view of the session's current state.
 */
export const getSessionStatus = async (sessionId: string) => {
  const session = await findSessionById(sessionId);

  return {
    sessionId: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    hasFollowUp: Boolean(session.followUp),
    hasAssessment: Boolean(session.assessment),
  };
};