import { env } from '../../config/env';
import { ChatMessage, SupportedLang } from './types';
import { logger } from '../../utils/logger';

export class GroqClient {
  private static readonly GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly FALLBACK_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ];

  static async generateResponse(params: {
    systemPrompt: string;
    conversationHistory: ChatMessage[];
    userPrompt: string;
    lang: SupportedLang;
  }): Promise<string | null> {
    const apiKey = env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      logger.warn('Groq API Key not found in backend environment.');
      return null;
    }

    const messages = [
      { role: 'system', content: params.systemPrompt },
      ...params.conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: params.userPrompt }
    ];

    for (const model of this.FALLBACK_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(this.GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2, // Aniq va factual ma'lumotlar
            max_tokens: 1000,
            presence_penalty: 0.2,
            frequency_penalty: 0.2
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            // Refusal checks
            const isEnglishRefusal = 
              /^(i'm sorry|i am sorry|sorry|as an ai|i cannot|i can't|unfortunately)\b/i.test(content) ||
              (params.lang !== 'en' && /\b(sorry|cannot help|can't help|as an ai language model|unable to help)\b/i.test(content));

            if (!isEnglishRefusal && content.length > 5) {
              return content;
            }
          }
        } else {
          logger.warn(`Groq API returned status ${response.status} for model ${model}`);
        }
      } catch (err: any) {
        logger.warn(`Groq request failed for model ${model}: ${err.message}`);
      }
    }

    return null;
  }
}

