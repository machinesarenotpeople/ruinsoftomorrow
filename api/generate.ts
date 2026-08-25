import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

const SYSTEM_PROMPT = "abandoned buildings, empty streetscapes, rusted steel, derelict, urban exploration, ruin, decrepit, dilapidated, deserted, broken windows, dark windows, burnt out, ramshackle, homeless shelter, burnt-out car, wreckage, decay, debris, ruined, ruined signs, overgrown, worn down, eroded, corrosion, deterioration, dirt, mud, wear and tear, gravel, litter, trash, 8k, photorealistic, charred, smashed windows, blown-out windows, warzone, burnt-out, collapsed roof, every wall is realistically grimed, boarded windows, condemned buildings, crumbling, collapsed building, peeling paint, exposed rebar, rusted pipes, shattered glass, oxidized metal, twisted iron, water stains, rotting wood, neglected, forsaken, weathering, reclaimed by nature, dead weeds, desolate, structural failure, gritty";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Basic Origin Verification
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !origin.includes('localhost') && !origin.includes('ruinsoftomorrow.com') && !origin.includes('vercel.app')) {
     return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
  }

  try {
    const { base64Data, mimeType } = req.body;
    
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server configuration error: GEMINI_API_KEY is missing.");
      return res.status(500).json({ error: 'Server configuration error.' });
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
            text: SYSTEM_PROMPT,
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
    // Return a generic error message to the client to avoid leaking sensitive information
    res.status(500).json({ error: 'An error occurred while generating the image. Please try again later.' });
  }
}
