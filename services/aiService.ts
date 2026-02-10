
import { GoogleGenAI, Type } from "@google/genai";
import { Car } from '../types';

export async function analyzeCarImage(base64Data: string, mimeType: string): Promise<Partial<Car>> {
  // Inicialização interna para garantir captura correta da API_KEY no momento da execução
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Analise esta imagem de um carrinho de coleção (die-cast). 
  Extraia os detalhes para um objeto JSON com as seguintes chaves:
  - 'marca': Marca real do carro (ex: Porsche, Nissan, Ford).
  - 'modelo': Modelo específico (ex: 911 GT3, Skyline GTR).
  - 'fabricante': Marca do brinquedo/miniatura (ex: Hot Wheels, Matchbox, Majorette).
  - 'cor': Cor predominante visível.
  - 'ano': Ano do modelo ou da miniatura, se visível na embalagem ou chassi.
  - 'pack': Nome da série ou pack (ex: Nightburnerz, HW Exotics).
  - 'observacoes': Detalhes extras como 'rodas especiais', 'pintura metalizada' ou 'temática de filme'.
  
  Retorne APENAS o JSON válido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Modelo mais estável para visão multimodal
      contents: { 
        parts: [
          { inlineData: { mimeType, data: base64Data } }, 
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
    
    const text = response.text;
    if (!text) throw new Error("A IA não retornou dados para esta imagem.");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    // Erro amigável para o usuário em caso de permissão ou cota
    if (error.message?.includes('permission')) {
      throw new Error("Acesso à IA negado. Verifique se o serviço Gemini está ativo na sua conta Google.");
    }
    throw error;
  }
}

export async function analyzeConfigImage(base64Data: string, mimeType: string): Promise<{ clientId?: string, syncUrl?: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Extraia o 'Google Client ID' e a 'App Script Sync URL' desta imagem de tela.
    O Client ID termina em '.apps.googleusercontent.com'.
    A Sync URL começa com 'https://script.google.com/macros/s/'.
    Retorne um objeto JSON com as chaves 'clientId' e 'syncUrl'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
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
