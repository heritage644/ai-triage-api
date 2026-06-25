// src/services/session.service.js
'use strict';

const prisma = require('../database/prisma');
const ApiError = require('../utils/apiError');

const createSession = async () => {
  return prisma.triageSession.create({
    data: { status: 'CREATED' },
  });
};

const findSessionById = async (sessionId) => {
  const session = await prisma.triageSession.findUnique({
    where: { id: sessionId },
    include: {
      symptom: true,
      followUp: true,
      assessment: true,
    },
  });
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }
  return session;
};

const updateSessionStatus = async (sessionId, status) => {
  return prisma.triageSession.update({
    where: { id: sessionId },
    data: { status },
  });
};

const getSessionStatus = async (sessionId) => {
  const session = await findSessionById(sessionId);
  return {
    sessionId: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    hasFollowUp: !!session.followUp,
    hasAssessment: !!session.assessment,
  };
};

module.exports = {
  createSession,
  findSessionById,
  updateSessionStatus,
  getSessionStatus,
};
