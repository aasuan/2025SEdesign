import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || 'AIzaSyCtflmpPbrFh7KloAPGgrhvlb1xFJ0PWnE';
const ai = new GoogleGenAI({ apiKey });
const MODEL_CANDIDATES = [
  'models/gemini-3-flash-preview',
  'models/gemini-2.5-flash',
  'models/gemini-flash-latest',
  'models/gemini-2.0-flash',
];

async function generateWithFallback(payload: { contents: string; mimeJson?: boolean }) {
  const errors: string[] = [];
  for (const model of MODEL_CANDIDATES) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: payload.contents,
        ...(payload.mimeJson ? ({ generationConfig: { responseMimeType: 'application/json' } } as any) : {}),
      });
      return res;
    } catch (err: any) {
      const msg = err?.response?.error?.message || err?.message || String(err);
      errors.push(`${model}: ${msg}`);
      // try next
    }
  }
  // No available model in current environment; return null with aggregated errors
  return { text: '', errors };
}

const tryParseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
};

export const getAIGradingSuggestion = async (
  questionContent: string,
  correctAnswer: string,
  studentResponse: string,
  maxScore: number
): Promise<{ score: number; comment: string }> => {
  if (!apiKey) {
    return { score: 0, comment: "未配置 API Key，AI 服务不可用。" };
  }

  try {
    const prompt = `
      Act as an expert strict academic grader.
      Question: "${questionContent}"
      Standard Answer: "${correctAnswer}"
      Student Response: "${studentResponse}"
      Max Score: ${maxScore}

      Evaluate the student response. 
      Return ONLY a JSON object with 'score' (number) and 'comment' (string). 
      The comment must be in Chinese and be constructive.
    `;

    const response: any = await generateWithFallback({ contents: prompt, mimeJson: true });
    const text = response?.text;
    if (text) {
      const parsed = tryParseJson(text);
      if (parsed) return parsed;
      return { score: 0, comment: `AI 返回非 JSON：${text}` };
    }
    const errs = Array.isArray(response?.errors) ? response.errors.join(' | ') : '模型不可用';
    return { score: 0, comment: `AI不可用：${errs}` };
  } catch (error: any) {
    console.error("AI Grading Error:", error?.response ?? error);
    const msg = error?.response?.error?.message || error?.message || "AI 服务错误。";
    return { score: 0, comment: msg };
  }
};

export const getAIAnalysis = async (examName: string, scores: number[]): Promise<string> => {
  if (!apiKey) return "API Key 缺失。";

  try {
    const prompt = `
      Analyze the following exam scores for "${examName}": ${JSON.stringify(scores)}.
      Provide a brief 3-sentence summary of class performance in Chinese, identifying if the exam was too hard, too easy, or balanced, and suggest a focus area for the next class.
    `;
    
    const response: any = await generateWithFallback({ contents: prompt });
    if (response?.text) return response.text;
    const errs = Array.isArray(response?.errors) ? response.errors.join(' | ') : '模型不可用';
    return `AI不可用：${errs}`;
  } catch (error: any) {
    console.error("AI Analysis Error:", error?.response ?? error);
    return error?.response?.error?.message || error?.message || "无法生成分析。";
  }
};
