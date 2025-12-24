import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return { score: 0, comment: "无法解析 AI 响应。" };
  } catch (error) {
    console.error("AI Grading Error:", error);
    return { score: 0, comment: "AI 服务错误。" };
  }
};

export const getAIAnalysis = async (examName: string, scores: number[]): Promise<string> => {
  if (!apiKey) return "API Key 缺失。";

  try {
    const prompt = `
      Analyze the following exam scores for "${examName}": ${JSON.stringify(scores)}.
      Provide a brief 3-sentence summary of class performance in Chinese, identifying if the exam was too hard, too easy, or balanced, and suggest a focus area for the next class.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "未生成分析结果。";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "无法生成分析。";
  }
};