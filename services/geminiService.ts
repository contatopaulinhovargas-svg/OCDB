
import { GoogleGenAI, Type } from "@google/genai";
import { Venue } from "../types";

// Always use the process.env.API_KEY directly as per the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractVenuesFromImage = async (base64Image: string): Promise<Partial<Venue>[]> => {
  const prompt = `
    Aja como um assistente de produção de bandas. Analise este print de uma agenda de shows.
    Extraia todas as casas de show listadas.
    Para cada casa, identifique: Nome, Cidade e o DDD da região (ex: 48, 47, 49).
    Tente encontrar ou sugerir o link da rede social (Instagram) mais provável da casa.
    
    CALCULE A DISTÂNCIA E O TEMPO DE VIAGEM:
    Partida: Rua Julio Teodoro Martins, 3067, Rio Caveiras, Biguaçu, SC.
    Calcule a distância precisa em KM e o tempo estimado de viagem de carro.
    
    Retorne apenas o JSON.
  `;

  // Always use ai.models.generateContent with the appropriate model.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image.split(',')[1] || base64Image
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            city: { type: Type.STRING },
            ddd: { type: Type.STRING },
            socialMedia: { type: Type.STRING },
            distanceKm: { type: Type.NUMBER },
            travelTime: { type: Type.STRING, description: "Ex: 1h 20min" },
          },
          required: ["name", "city", "ddd", "distanceKm", "travelTime"]
        }
      }
    }
  });

  try {
    // Access the response text directly as a property.
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao parsear resposta do Gemini", e);
    return [];
  }
};
