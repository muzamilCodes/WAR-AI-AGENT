import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export class LLMService {
  private static geminiKey = process.env.GEMINI_API_KEY || '';
  private static openaiKey = process.env.OPENAI_API_KEY || '';

  /**
   * Check if an active LLM provider is configured
   */
  public static isLLMConfigured(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  }

  /**
   * Query Google Gemini Flash
   */
  public static async queryGemini(userPrompt: string, systemInstruction?: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || this.geminiKey;
    if (!apiKey) return null;

    const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-pro-latest'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[LLMService] Gemini model ${model} error:`, errData?.error?.message || response.statusText);
          continue;
        }

        const data: any = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (err: any) {
        console.warn(`[LLMService] Request failed for model ${model}:`, err.message);
      }
    }

    return null;
  }

  /**
   * Main AI reasoning function for conversational queries
   */
  public static async generateConversationalResponse(
    userText: string,
    language: string = 'hindi'
  ): Promise<string | null> {
    const systemPrompt = `You are WAR AI, a friendly, ultra-intelligent, professional female AI personal computer assistant for Windows.
The user speaks in ${language} (Hindi, Urdu, English, or Hinglish).
- Always address the user politely and respectfully as "boss" or "aap".
- Your tone is confident, natural, friendly, smart and female ("main kar sakti hoon", "bataiye", "main ready hoon").
- Keep replies concise, punchy and clear (2 to 4 sentences max unless detailed explanation is requested).
- If the user asks you to open an app, run code or execute commands, guide them that you are ready to automate it for them.
- Avoid using complex markdown symbols like asterisks or hashtags in spoken summaries.`;

    if (process.env.GEMINI_API_KEY) {
      const response = await this.queryGemini(userText, systemPrompt);
      if (response) return response;
    }

    return null;
  }
}
