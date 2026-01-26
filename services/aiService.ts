import { GoogleGenAI, Type } from "@google/genai";
import { Car } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeCarImage(base64Data: string, mimeType: string): Promise<Partial<Car>> {
  const prompt = `
  Analyze this image of a die-cast car. Extract details into a JSON object.

  CRITICAL INSTRUCTIONS FOR 'fabricante' (Manufacturer):
  1. LOOK AT THE LOGO on the card/packaging if visible.
  2. Common manufacturers: Matchbox, Hot Wheels, Majorette, Tomica, Greenlight, Maisto, Mini GT, etc.
  3. ONLY classify as "Hot Wheels" if you explicitly see the Hot Wheels flame logo.

  Fields to extract:
  - 'marca': Real car brand (e.g., Citroën, Porsche).
  - 'modelo': Real car model (e.g., Ami, 911 GT3).
  - 'fabricante': The toy brand (Matchbox, Hot Wheels, etc).
  - 'cor': Visual color (e.g., 'Verde Oliva', 'Azul Metálico').
  - 'ano': Year visible on packaging.
  - 'pack': Series name (e.g., 'Moving Parts', 'Mainline').
  - 'observacoes': Extra features (e.g., 'Police', 'Custom').

  Return valid JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Faster model for vision tasks
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
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

    let rawText = response.text || "{}";
    
    // Safety check: remove potential markdown code blocks if the model ignores the mimeType config
    const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", cleanedText);
      return {};
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
}