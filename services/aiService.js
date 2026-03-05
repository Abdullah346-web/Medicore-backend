const parseRiskLevel = (text = '') => {
  const normalized = text.toLowerCase();
  if (normalized.includes('high risk') || normalized.includes('urgent')) return 'high';
  if (normalized.includes('low risk')) return 'low';
  return 'medium';
};

const extractJsonObject = (text = '') => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (_error) {
    return null;
  }
};

const fallbackSymptomChecker = ({ symptoms, age, gender, history }) => {
  const normalizedSymptoms = (symptoms || '').toLowerCase();
  const numericAge = Number(age);

  const hasAny = (keywords = []) => keywords.some((keyword) => normalizedSymptoms.includes(keyword));

  const possibleConditions = [];
  const suggestedTests = new Set();
  let riskLevel = 'medium';

  if (
    hasAny([
      'blood cancer',
      'leukemia',
      'lymphoma',
      'cancer',
      'tumor',
      'malignancy',
      'weight loss',
      'night sweats',
      'persistent bleeding',
    ])
  ) {
    possibleConditions.push('Hematologic/oncologic red-flag condition (urgent specialist evaluation needed)');
    suggestedTests.add('CBC with differential');
    suggestedTests.add('Peripheral blood smear');
    suggestedTests.add('ESR/CRP');
    riskLevel = 'high';
  }

  if (hasAny(['chest pain', 'shortness of breath', 'breathing difficulty', 'fainting'])) {
    possibleConditions.push('Acute cardiopulmonary red-flag symptoms');
    suggestedTests.add('ECG');
    suggestedTests.add('Troponin');
    suggestedTests.add('Chest X-ray');
    riskLevel = 'high';
  }

  if (hasAny(['cough', 'cold', 'sore throat', 'runny nose', 'flu'])) {
    possibleConditions.push('Upper respiratory infection');
    suggestedTests.add('CBC');
    suggestedTests.add('CRP');
  }

  if (hasAny(['fever', 'body ache', 'viral'])) {
    possibleConditions.push('Viral febrile illness');
    suggestedTests.add('CBC');
    suggestedTests.add('CRP');
  }

  if (hasAny(['vomiting', 'nausea', 'diarrhea', 'loose motion', 'stomach pain', 'abdominal pain'])) {
    possibleConditions.push('Gastrointestinal irritation / infection');
    suggestedTests.add('Basic Metabolic Panel');
    suggestedTests.add('Stool routine examination');
  }

  if (hasAny(['burning urine', 'dysuria', 'urinary', 'uti'])) {
    possibleConditions.push('Urinary tract irritation/infection');
    suggestedTests.add('Urine routine and culture');
    suggestedTests.add('CBC');
  }

  if (!Number.isNaN(numericAge) && (numericAge >= 60 || numericAge <= 5) && riskLevel !== 'high') {
    riskLevel = 'high';
  }

  if (possibleConditions.length === 0) {
    possibleConditions.push('Undifferentiated symptoms (needs clinician review)');
    suggestedTests.add('CBC');
    suggestedTests.add('CRP');
    suggestedTests.add('Basic Metabolic Panel');
  }

  return {
    possibleConditions,
    riskLevel,
    suggestedTests: Array.from(suggestedTests),
    disclaimer:
      'AI service unavailable. This fallback is supportive only and not a final diagnosis.',
    summary: `Patient (${gender}, ${age}) with symptoms: ${symptoms}. History: ${history || 'N/A'}.`,
  };
};

const fallbackPrescriptionExplanation = ({ medicines, instructions, urduMode }) => ({
  explanation: urduMode
    ? 'یہ ادویات علامات میں بہتری کے لئے ہیں۔ ڈاکٹر کی ہدایات کے مطابق استعمال کریں۔'
    : 'These medicines are meant to relieve current symptoms. Please follow dosage exactly as prescribed.',
  lifestyleAdvice: urduMode
    ? 'پانی زیادہ پئیں، مناسب آرام کریں، اور متوازن غذا لیں۔'
    : 'Stay hydrated, rest well, and maintain a balanced diet.',
  preventiveAdvice: urduMode
    ? 'ادویات وقت پر لیں، صفائی کا خیال رکھیں، اور فالو اپ وزٹ لازمی کریں۔'
    : 'Take medicines on time, maintain hygiene, and attend follow-up visits.',
  notes: `Medicines: ${medicines.join(', ')} | Instructions: ${instructions || 'N/A'}`,
});

const fallbackRiskDetection = ({ symptoms, history }) => {
  const text = `${symptoms} ${history || ''}`.toLowerCase();
  const chronicWords = ['chronic', 'recurring', 'repeated', 'frequent', 'persistent'];
  const hasChronicPattern = chronicWords.some((word) => text.includes(word));

  return {
    riskLevel: hasChronicPattern ? 'high' : 'medium',
    insights: hasChronicPattern
      ? 'Pattern suggests potential chronic or repeated infection indicators. Prioritize specialist review.'
      : 'No clear chronic repetition patterns detected in provided text.',
  };
};

const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI request failed');
  }

  const data = await response.json();
  return data.output_text || data?.output?.[0]?.content?.[0]?.text || '';
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY/GOOGLE_API_KEY not configured');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error('Gemini request failed');
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || ''
  );
};

const runAIText = async (prompt) => {
  const configuredProvider = (process.env.AI_PROVIDER || '').toLowerCase().trim();
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (configuredProvider === 'gemini') {
    if (!hasGemini && hasOpenAI) {
      return callOpenAI(prompt);
    }
    return callGemini(prompt);
  }

  if (configuredProvider === 'openai') {
    if (!hasOpenAI && hasGemini) {
      return callGemini(prompt);
    }
    return callOpenAI(prompt);
  }

  if (hasOpenAI) {
    return callOpenAI(prompt);
  }

  if (hasGemini) {
    return callGemini(prompt);
  }

  throw new Error('No AI provider key configured');
};

export const smartSymptomChecker = async (payload) => {
  const prompt = `You are a clinical assistant. Return strict JSON with keys: possibleConditions (string[]), riskLevel (low|medium|high), suggestedTests (string[]), summary.\nInput: ${JSON.stringify(
    payload
  )}`;

  try {
    const text = await runAIText(prompt);
    const parsed = extractJsonObject(text);

    return {
      possibleConditions: parsed?.possibleConditions || [],
      riskLevel: parsed?.riskLevel || parseRiskLevel(text),
      suggestedTests: parsed?.suggestedTests || [],
      summary: parsed?.summary || text,
    };
  } catch (_error) {
    return fallbackSymptomChecker(payload);
  }
};

export const explainPrescription = async (payload) => {
  const prompt = `Explain the prescription in patient friendly language and return strict JSON keys: explanation, lifestyleAdvice, preventiveAdvice. Urdu mode: ${payload.urduMode}. Data: ${JSON.stringify(
    payload
  )}`;

  try {
    const text = await runAIText(prompt);
    const parsed = extractJsonObject(text);

    return {
      explanation: parsed?.explanation || text,
      lifestyleAdvice: parsed?.lifestyleAdvice || '',
      preventiveAdvice: parsed?.preventiveAdvice || '',
    };
  } catch (_error) {
    return fallbackPrescriptionExplanation(payload);
  }
};

export const detectRiskPattern = async (payload) => {
  const prompt = `Detect repeated infections or chronic symptom patterns. Return strict JSON keys: riskLevel(low|medium|high), insights. Data: ${JSON.stringify(
    payload
  )}`;

  try {
    const text = await runAIText(prompt);
    const parsed = extractJsonObject(text);

    return {
      riskLevel: parsed?.riskLevel || parseRiskLevel(text),
      insights: parsed?.insights || text,
    };
  } catch (_error) {
    return fallbackRiskDetection(payload);
  }
};
