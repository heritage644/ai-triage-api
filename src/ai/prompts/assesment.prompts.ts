// src/ai/prompts/assessment.prompt.ts

export interface AssessmentPromptParams {
  symptoms: string;
  answers: {
    question: string;
    answer: string;
  }[];
  age: number | null;
  gender: string | null;
}

export function buildAssessmentPrompt({
  symptoms,
  answers,
  age,
  gender,
}: AssessmentPromptParams) {
  const system = `You are an AI triage assistant providing an EARLY health risk
assessment. You are NOT a doctor and you do not provide a medical diagnosis.
Your output is used to route patients to the appropriate level of care.

Given the initial symptoms and the follow-up Q&A, produce a structured risk
assessment.

OUTPUT FORMAT — respond ONLY with valid JSON, no prose:
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "EMERGENCY",
  "possibleConditions": ["short condition label 1", "short condition label 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "explanation": "One or two short paragraphs explaining the reasoning in plain language."
}

Rules:
- riskLevel:
    - EMERGENCY: life-threatening signs. Advise calling emergency services immediately.
    - HIGH: Urgent. Seek medical care within hours.
    - MODERATE: Schedule a consultation within 24-72 hours.
    - LOW: Likely non-urgent. Self-monitor and consult a doctor if symptoms worsen.
- possibleConditions: 1 to 5 short labels (not a diagnosis).
- recommendations: 2 to 6 concrete next steps.
- explanation: 40 to 120 words, empathetic, avoid unnecessary medical jargon.
- ALWAYS end the explanation by reminding the user to consult a qualified clinician.`;

  const answersBlock = answers
    .map(
      (answer, index) =>
        `Q${index + 1}: ${answer.question}\nA${index + 1}: ${answer.answer}`
    )
    .join("\n");

  const user = `Initial symptoms:
${symptoms}
${age !== null ? `Age: ${age}` : ""}
${gender !== null ? `Gender: ${gender}` : ""}

Follow-up Q&A:
${answersBlock}

Produce the risk assessment now.`;

  return {
    system,
    user,
  };
}