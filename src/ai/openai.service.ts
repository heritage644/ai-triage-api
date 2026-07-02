// src/ai/openai.service.ts

import OpenAI from "openai";
import env from "../config/env";
import { logger } from "../middleware/logger.middleare";
import ApiError from "../utils/apierror";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: env.OPENAI_TIMEOUT_MS,
});

export interface GPTParams {
  system: string;
  user: string;
  schemaName?: string;
}

interface GPTResponse {
  parsed: unknown;
  usage: OpenAI.CompletionUsage | undefined;
  rawContent: string;
}

export const callGPTJson = async ({
  system,
  user,
  schemaName = "generic",
}: GPTParams): Promise<GPTResponse> => {
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: user,
          },
        ],
      });

      const content = completion.choices?.[0]?.message?.content ?? "";

      logger.debug(
        {
          schemaName,
          attempt,
          model: completion.model,
          usage: completion.usage,
        },
        "GPT response received"
      );

      return {
        parsed: JSON.parse(content),
        usage: completion.usage,
        rawContent: content,
      };
    } catch (err) {
      lastError = err;

      logger.warn(
        {
          schemaName,
          attempt,
          err: err instanceof Error ? err.message : err,
        },
        "GPT call attempt failed"
      );

      if (attempt === maxAttempts) break;

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1000)
      );
    }
  }

  logger.error(
    {
      err: lastError,
    },
    "GPT call failed after retries"
  );

  throw new ApiError(502, "AI provider failed to generate a response");
};

export default callGPTJson;