// src/ai/openai.service.ts

import { GoogleGenAI } from "@google/genai";
import env from "../config/env";
import { logger } from "../middleware/logger.middleare";
import ApiError from "../utils/apierror";

const client = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export interface GPTParams {
  system: string;
  user: string;
  schemaName?: string;
}

interface GPTResponse {
  parsed: unknown;
  usage?: unknown;
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
      const prompt = `
${system}

${user}

IMPORTANT:
- Respond ONLY with valid JSON.
- Do not wrap the JSON in markdown.
- Do not include explanations.
`;

      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const content = response.text ?? "";

      logger.debug(
        {
          schemaName,
          attempt,
          model: env.GEMINI_MODEL,
          usage: response.usageMetadata,
        },
        "Gemini response received"
      );

      return {
        parsed: JSON.parse(content),
        usage: response.usageMetadata,
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
        "Gemini call attempt failed"
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 1000)
        );
      }
    }
  }

  logger.error(
    {
      err: lastError,
    },
    "Gemini call failed after retries"
  );

  throw new ApiError(502, "AI provider failed to generate a response");
};

export default callGPTJson;