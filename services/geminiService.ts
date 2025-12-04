import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from "../types";

const getSystemInstruction = (source: SupportedLanguage, target: SupportedLanguage): string => {
  return `You are an expert document translator and layout preservation specialist. 
  Your task is to translate the text in the provided image from ${source} to ${target}.
  
  CRITICAL OUTPUT RULES:
  1. Return ONLY valid, semantic HTML code. 
  2. Do NOT wrap the output in markdown code blocks (e.g., no \`\`\`html).
  3. Do NOT include <html>, <head>, or <body> tags. Just return the content/body fragment.
  4. Preserve the visual structure of the original document as closely as possible using HTML tags (h1-h6, p, ul, ol, table, etc.).
  5. If there are tables, generate HTML tables.
  6. If there are images or diagrams, insert a placeholder: <div class="bg-gray-200 p-4 text-center italic text-gray-500">[Image/Diagram Placeholder]</div>
  7. Maintain approximate spacing and alignment using standard HTML/CSS classes (e.g., text-center, font-bold).
  8. Do not add any conversational text or explanations. Output ONLY the translated HTML.`;
};

export const translatePageImage = async (
  base64Image: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Remove header from base64 string if present (data:image/jpeg;base64,...)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Translate this page from ${sourceLang} to ${targetLang}. Preserve layout.`,
          },
        ],
      },
      config: {
        systemInstruction: getSystemInstruction(sourceLang, targetLang),
        temperature: 0.3, // Lower temperature for more accurate translation
      },
    });

    const text = response.text || "";
    // Cleanup if the model accidentally included markdown
    return text.replace(/```html/g, '').replace(/```/g, '').trim();

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw new Error("Failed to translate page. Please try again.");
  }
};