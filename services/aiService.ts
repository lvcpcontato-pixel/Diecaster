
import { GoogleGenAI, Type } from "@google/genai";
import { Car } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeCarImage(base64Data: string, mimeType: string): Promise<Partial<Car>> {
  const prompt = `
  Analyze this image of a die-cast car. Extract details into a JSON object.
  - 'marca': Real car brand.
  - 'modelo': Real car model.
  - 'fabricante': The toy brand (Matchbox, Hot Wheels, etc).
  - 'cor': Visual color.
  - 'ano': Year visible.
  - 'pack': Series name.
  - 'observacoes': Extra features.
  Return valid JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marca: { type: Type.STRING },
            modelo: { type: Type.STRING },
            fabricante: { type: Type.STRING },
            cor: { type: Type.STRING },
            ano: { type: Type.STRING },
            pack: { type: Type.STRING },
            observacoes: { type: Type.STRING },
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
}

export async function analyzeConfigImage(base64Data: string, mimeType: string): Promise<{ clientId?: string, syncUrl?: string }> {
  const prompt = `
    Extract the 'Google Client ID' and the 'App Script Sync URL' from this image of a computer screen.
    The Client ID usually ends in '.apps.googleusercontent.com'.
    The Sync URL usually starts with 'https://script.google.com/macros/s/'.
    Return a JSON object with keys 'clientId' and 'syncUrl'.
    If not found, return null for that key.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientId: { type: Type.STRING },
            syncUrl: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Config analysis error:", error);
    throw error;
  }
}
