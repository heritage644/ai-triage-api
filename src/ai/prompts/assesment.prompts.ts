// src/ai/prompts/assessment.prompt.js
'use strict';
interface GPTParams {
  symptoms: string;
  answers: { question: string; answer: string }[];
  age: number | null;
  gender: string | null;
  schemaName?: string; // The '?' means it's optional since you have a default value
}
const buildAssessmentPrompt = ({ symptoms, answers, age, gender }:GPTParams) => {
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
    - EMERGENCY: life-threatening signs — advise calling emergency services now.
    - HIGH: urgent — should seek medical care within hours.
    - MODERATE: should schedule a consultation soon (24-72h).
    - LOW: likely non-urgent, self-monitor and see a doctor if it worsens.
- possibleConditions: 1 to 5 short labels (not a diagnosis — just possibilities).
- recommendations: 2 to 6 concrete next steps.
- explanation: 40-120 words, empathetic, no medical jargon where avoidable.
- ALWAYS end the explanation by reminding the user to consult a qualified clinician.`;

  const answersBlock = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
    .join('\n');

  const user = `Initial symptoms:
${symptoms}
${age ? `Age: ${age}` : ''}
${gender ? `Gender: ${gender}` : ''}

Follow-up Q&A:
${answersBlock}

Produce the risk assessment now.`;

  return { system, user };
};

module.exports = { buildAssessmentPrompt };
