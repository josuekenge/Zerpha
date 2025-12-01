import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  try {
    console.log("Key loaded:", !!process.env.GEMINI_API_KEY);

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Say hello from Gemini 3 Pro Preview in one short sentence.",
      config: {
        thinkingConfig: { thinkingLevel: "low" },
      },
    });

    console.log("Gemini says:", response.text);
  } catch (err) {
    console.error("Gemini error:", err);
  }
}

testGemini();
