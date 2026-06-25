// src/ai/openai.service.js
'use strict';

const OpenAI = require('openai');
const env = require('../config/env');
const { logger } = require('../middleware/logger.middleware');
const ApiError = require('../utils/apiError');

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: env.OPENAI_TIMEOUT_MS,
});

/**
 * Call the chat completions endpoint expecting a JSON response.
 * @param {{ system: string, user: string, schemaName?: string }} opts
 */
const callGPTJson = async ({ system, user, schemaName = 'generic' }) => {
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });

      const content = completion.choices?.[0]?.message?.content ?? '';
      logger.debug(
        { schemaName, attempt, model: completion.model, usage: completion.usage },
        'GPT response received'
      );

      const parsed = JSON.parse(content);
      return { parsed, usage: completion.usage, rawContent: content };
    } catch (err) {
      lastError = err;
      logger.warn({ schemaName, attempt, err: err.message }, 'GPT call attempt failed');
      if (attempt === maxAttempts) break;
      // small back-off before retry
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  logger.error({ err: lastError }, 'GPT call failed after retries');
  throw new ApiError(502, 'AI provider failed to generate a response');
};

module.exports = { callGPTJson };
