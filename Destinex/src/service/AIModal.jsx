// src/service/AIModal.jsx
import { generateAI } from "@/lib/ai";

export const chatSession = {
  async sendMessage(prompt) {
    const text = await generateAI(prompt);
    return {
      response: {
        text: () => text,
      },
    };
  },
};
