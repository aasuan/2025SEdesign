import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType } from "../types";

// Initialize the Gemini client
// Note: In a real production app, backend should proxy these requests to hide the API KEY.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateQuestionsByTopic = async (
  topic: string, 
  count: number, 
  difficulty: string,
  questionType: QuestionType = QuestionType.SINGLE_CHOICE
): Promise<Question[]> => {
  if (!apiKey) return [];

  let typePrompt = "";
  switch (questionType) {
    case QuestionType.SINGLE_CHOICE:
      typePrompt = "Single Choice questions with 4 options";
      break;
    case QuestionType.MULTIPLE_CHOICE:
      typePrompt = "Multiple Choice questions with 4 options (potentially multiple correct answers)";
      break;
    case QuestionType.TRUE_FALSE:
      typePrompt = "True/False questions";
      break;
    case QuestionType.FILL_IN_THE_BLANK:
      typePrompt = "Fill-in-the-blank questions. IMPORTANT: Use '______' (6 underscores) to represent the blank in the content text.";
      break;
    case QuestionType.SHORT_ANSWER:
      typePrompt = "Short Answer questions. The correct answer should be a concise keyword or key phrase.";
      break;
    default:
      typePrompt = "Single Choice questions";
  }

  const prompt = `Generate ${count} ${difficulty} level ${typePrompt} about "${topic}" for a university exam in Chinese (Simplified).
  Return the response in a structured JSON format. 
  Ensure the content, options (if applicable), correct answer, and explanation are in Chinese.
  For 'FILL_IN_THE_BLANK' and 'SHORT_ANSWER', the 'options' field can be empty array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: "The question text in Chinese" },
              type: { 
                type: Type.STRING, 
                enum: [
                  "SINGLE_CHOICE", 
                  "MULTIPLE_CHOICE", 
                  "TRUE_FALSE", 
                  "FILL_IN_THE_BLANK", 
                  "SHORT_ANSWER"
                ] 
              },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for choice questions, empty for others" },
              correctAnswer: { type: Type.STRING, description: "The correct answer text" },
              explanation: { type: Type.STRING, description: "Why this answer is correct in Chinese" }
            },
            required: ["content", "type", "correctAnswer"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawData = JSON.parse(text);
    
    // Map to our internal type
    return rawData.map((q: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      content: q.content,
      type: questionType, // Enforce the requested type
      options: (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE) 
        ? (q.options || []) 
        : (questionType === QuestionType.TRUE_FALSE ? ['正确', '错误'] : []),
      correctAnswer: q.correctAnswer,
      difficulty: difficulty.toUpperCase() as any,
      tags: [topic, 'AI生成'],
      explanation: q.explanation
    }));

  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [];
  }
};

export const analyzeStudentPerformance = async (examTitle: string, score: number, total: number, missedTopics: string[]): Promise<string> => {
  if (!apiKey) return "没有 API Key，无法使用 AI 分析。";

  const prompt = `A student scored ${score}/${total} on the exam "${examTitle}". 
  They missed questions related to these topics: ${missedTopics.join(', ')}.
  Provide a concise, encouraging, second-person summary of their performance and 3 specific study recommendations in Chinese (Simplified).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Analysis failed:", error);
    return "AI 分析服务暂时不可用。";
  }
};

export const detectProctoringAnomalies = async (base64Image: string): Promise<boolean> => {
    // This simulates sending a frame to Gemini to check if the student is looking away or if multiple people are present.
    // Using a lightweight check.
    if (!apiKey) return false;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
                    { text: "Analyze this webcam frame of a student taking an exam. Answer ONLY 'SAFE' if one person is looking at the screen, or 'WARN' if they are looking away, multiple people are present, or no one is present." }
                ]
            }
        });
        const result = response.text?.trim().toUpperCase();
        return result === 'WARN';
    } catch (e) {
        return false;
    }
}