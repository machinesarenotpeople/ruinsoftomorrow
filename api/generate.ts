import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Data, mimeType, prompt } = req.body;
    
    if (!base64Data || !mimeType || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server configuration error: GEMINI_API_KEY is missing.");
      return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let generatedImage = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!generatedImage) {
      throw new Error("No image returned from the model.");
    }

    res.status(200).json({ generatedImage });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || 'An error occurred during generation.' });
  }
}
