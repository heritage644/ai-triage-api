// src/routes/triage.routes.js
'use strict';

const { Router } = require('express');
const controller = require('../controllers/triage.controller');
const {
  validate,
  startTriageSchema,
  sessionIdParamSchema,
  submitFollowupSchema,
} = require('../validators/triage.validator');

const router = Router();

// POST /api/triage/start
router.post('/start', validate(startTriageSchema), controller.startTriage);

// GET /api/triage/:sessionId
router.get('/:sessionId', validate(sessionIdParamSchema), controller.getSession);

// POST /api/triage/:sessionId/followup
router.post('/:sessionId/followup', validate(submitFollowupSchema), controller.submitFollowup);

// GET /api/triage/:sessionId/result
router.get('/:sessionId/result', validate(sessionIdParamSchema), controller.getResult);

export default router;
