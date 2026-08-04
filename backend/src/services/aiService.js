import { GoogleGenAI } from "@google/genai";

const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";

const getClient = () => {
  if (!process.env.GOOGLE_API_KEY) {
    return null;
  }

  return new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
};

const extractJsonObject = (text) => {
  if (!text) {
    return null;
  }

  let normalizedText = text.trim();
  // Strip markdown code fences if present
  if (normalizedText.startsWith("```")) {
    normalizedText = normalizedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  try {
    return JSON.parse(normalizedText);
  } catch (error) {
    const match = normalizedText.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (parseError) {
      return null;
    }
  }
};

const diagnosisFallback = {
  possibleConditions: [],
  riskLevel: "Medium",
  suggestedTests: [],
  note: "AI analysis is temporarily unavailable. Please rely on clinical review."
};

const explanationFallback = (language) => ({
  language,
  summary:
    language === "Urdu"
      ? "Filhal AI tashreeh dastiyab nahin hai. Barah-e-karam doctor ya pharmacist se rehnumai hasil karein."
      : "AI explanation is temporarily unavailable. Please consult your doctor or pharmacist for guidance.",
  lifestyleAdvice:
    language === "Urdu"
      ? ["Pani munasib miqdar mein piyen aur dawa waqt par istemal karein."]
      : ["Stay hydrated and take your medicines exactly as prescribed."],
  preventiveTips:
    language === "Urdu"
      ? ["Kisi bhi ghair mamooli alamat ki surat mein foran doctor se rabta karein."]
      : ["Contact your doctor promptly if you notice any unusual symptoms."]
});

const analyzeSymptomsAI = async (symptoms, age, gender) => {
  try {
    const client = getClient();

    if (!client) {
      console.error("Gemini AI is not configured: GOOGLE_API_KEY is missing.");
      return diagnosisFallback;
    }

    const prompt = `
You are a cautious medical triage assistant for clinicians.
Analyze the patient details below and return only a valid JSON object.
Do not include markdown, code fences, commentary, or extra text.

Patient symptoms: ${symptoms}
Patient age: ${age}
Patient gender: ${gender}

Return exactly this JSON shape:
{
  "possibleConditions": ["condition 1", "condition 2"],
  "riskLevel": "Low | Medium | High",
  "suggestedTests": ["test 1", "test 2"]
}

Rules:
- Keep possibleConditions concise, medically plausible, and non-diagnostic.
- riskLevel must be one of: Low, Medium, High.
- suggestedTests must be simple clinician-oriented next-step tests.
- If uncertainty is high, return broader differentials and safer tests.
`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt
    });

    const rawText = response?.text || "";
    const parsed = extractJsonObject(rawText);

    if (
      !parsed ||
      !Array.isArray(parsed.possibleConditions) ||
      !["Low", "Medium", "High"].includes(parsed.riskLevel) ||
      !Array.isArray(parsed.suggestedTests)
    ) {
      console.error("Gemini AI returned an invalid diagnosis payload.");
      return diagnosisFallback;
    }

    return {
      possibleConditions: parsed.possibleConditions,
      riskLevel: parsed.riskLevel,
      suggestedTests: parsed.suggestedTests
    };
  } catch (error) {
    console.error("Gemini symptom analysis failed:", error.message);
    return diagnosisFallback;
  }
};

const explainPrescriptionAI = async (medicines, instructions, language = "English") => {
  try {
    const client = getClient();

    if (!client) {
      console.error("Gemini AI is not configured: GOOGLE_API_KEY is missing.");
      return explanationFallback(language);
    }

    const prompt = `
You are a careful medical communication assistant.
Explain the prescription below in simple, patient-friendly ${language}.
Return only a valid JSON object with no markdown or extra commentary.

Medicines:
${JSON.stringify(medicines, null, 2)}

Instructions:
${instructions}

Return exactly this JSON shape:
{
  "language": "${language}",
  "summary": "short patient-friendly explanation",
  "lifestyleAdvice": ["advice 1", "advice 2"],
  "preventiveTips": ["tip 1", "tip 2"]
}

Rules:
- Keep the explanation simple and supportive.
- Do not invent diagnoses.
- Do not provide emergency claims unless clearly implied by the prescription context.
- lifestyleAdvice and preventiveTips must each be arrays of short strings.
`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt
    });

    const rawText = response?.text || "";
    const parsed = extractJsonObject(rawText);

    if (
      !parsed ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.lifestyleAdvice) ||
      !Array.isArray(parsed.preventiveTips)
    ) {
      console.error("Gemini AI returned an invalid prescription explanation payload.");
      return explanationFallback(language);
    }

    return {
      language: parsed.language || language,
      summary: parsed.summary,
      lifestyleAdvice: parsed.lifestyleAdvice,
      preventiveTips: parsed.preventiveTips
    };
  } catch (error) {
    console.error("Gemini prescription explanation failed:", error.message);
    return explanationFallback(language);
  }
};

const askAntigravityAi = async (userPrompt, userRole = "doctor", userName = "User", contextData = {}) => {
  try {
    const client = getClient();

    if (!client) {
      return "Antigravity AI is currently offline. Please verify API key setup.";
    }

    const prompt = `
You are Antigravity AI, the intelligent Grounded Clinical & SaaS Intelligence Assistant for the MedPulse SaaS Platform.
You have direct real-time access to the user's live clinic database records provided below.

User Name: ${userName}
User Role: ${userRole}
User Question: "${userPrompt}"

=== LIVE CLINIC DATABASE CONTEXT ===
${JSON.stringify(contextData, null, 2)}
====================================

Instructions:
1. Greet the user naturally by name (${userName}).
2. Use the live clinic database context above to answer accurately with specific real names, dates, medicines, risk levels, or clinic numbers whenever relevant.
3. If the user asks for a summary, high-risk patients, prescriptions, or appointments, synthesize the live database context clearly in formatted bullet points.
4. If the query or user requests Urdu, reply in polite and professional Urdu (اردو).
5. Maintain a professional, reassuring, and sharp clinical assistant tone.
`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt
    });

    return response?.text || "Antigravity AI generated a clinical response.";
  } catch (error) {
    console.error("Antigravity AI assistant query failed:", error.message);
    return "Antigravity AI encountered a temporary issue. Please re-query in a moment.";
  }
};

export { analyzeSymptomsAI, askAntigravityAi, explainPrescriptionAI };
