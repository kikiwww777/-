import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ModelType } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize the client strictly with the process.env.API_KEY as mandated.
// We do not create this instance inside a component to avoid recreation on re-renders,
// but in a real app, you might want to wrap this in a Context or Hook if the key changes.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat | null = null;
  private model: string;

  constructor(model: string = ModelType.FLASH) {
    this.model = model;
    this.initChat();
  }

  private initChat() {
    this.chat = ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  public async sendMessageStream(
    message: string, 
    onChunk: (text: string) => void
  ): Promise<string> {
    if (!this.chat) {
      this.initChat();
    }

    let fullText = "";

    try {
      // We use sendMessageStream for a better user experience
      const responseStream = await this.chat!.sendMessageStream({ message });

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
           const newText = c.text;
           fullText += newText;
           onChunk(newText);
        }
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }

    return fullText;
  }

  public resetSession() {
    this.initChat();
  }
}

// Singleton instance for the default chat session
export const geminiService = new GeminiService();