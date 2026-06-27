import { GoogleGenAI, Type } from '@google/genai';
import { VISION_SYSTEM_PROMPT } from '../../prompts/visionPrompt';

let genAIClient = null;

/**
 * Initializes and retrieves the Google GenAI client instance lazily.
 */
const getGenAIClient = () => {
  if (genAIClient) return genAIClient;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please define VITE_GEMINI_API_KEY in your .env file.');
  }

  genAIClient = new GoogleGenAI({ apiKey });
  return genAIClient;
};

/**
 * Compresses an image file using browser Canvas APIs.
 */
const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas image compression failed.'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

/**
 * Helper to fetch a remote image and return a local Blob.
 * Bypasses Canvas CORS issues for Unsplash mockup images.
 */
const fetchRemoteImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  return await response.blob();
};

/**
 * Prepares the image input (File, http URL, or blob URL) into a Base64 string for Gemini API.
 */
const getBase64Image = async (imageInput) => {
  let blob;
  let mimeType = 'image/jpeg';

  if (imageInput instanceof File) {
    // Compress user uploaded image
    try {
      blob = await compressImage(imageInput);
      mimeType = blob.type;
    } catch (err) {
      console.warn('Canvas compression failed, using original file:', err);
      blob = imageInput;
      mimeType = imageInput.type;
    }
  } else if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
    // Remote mockup URL
    blob = await fetchRemoteImage(imageInput);
    mimeType = blob.type || 'image/jpeg';
  } else if (typeof imageInput === 'string') {
    // Local relative path or blob: URL from drag & drop / state
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`Failed to fetch local image data: ${response.statusText}`);
    }
    blob = await response.blob();
    mimeType = blob.type || 'image/jpeg';
  } else {
    throw new Error('Unsupported image input type.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        data: base64Data,
        mimeType
      });
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Safely parses the Gemini text response into valid JSON.
 */
const parseJsonResponse = (text) => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Attempt fallback by matching the first complete JSON object in the text
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('AI returned an invalid JSON block. Please retry.');
      }
    }
    throw new Error('AI analysis response was not structured correctly.');
  }
};

/**
 * Schema configuration definition utilizing the SDK Type definitions.
 */
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        issueType: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        severity: { type: Type.STRING },
        priority: { type: Type.STRING },
        riskScore: { type: Type.NUMBER },
        publicSafetyRisk: { type: Type.STRING },
        environmentalRisk: { type: Type.STRING }
      },
      required: ['issueType', 'confidence', 'severity', 'priority', 'riskScore', 'publicSafetyRisk', 'environmentalRisk']
    },
    locationAnalysis: {
      type: Type.OBJECT,
      properties: {
        detectedContext: { type: Type.STRING },
        locationConfidence: { type: Type.NUMBER },
        address: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        country: { type: Type.STRING },
        landmark: { type: Type.STRING }
      },
      required: ['detectedContext', 'locationConfidence', 'address', 'city', 'state', 'country', 'landmark']
    },
    authority: {
      type: Type.OBJECT,
      properties: {
        department: { type: Type.STRING },
        urgency: { type: Type.STRING }
      },
      required: ['department', 'urgency']
    },
    resolution: {
      type: Type.OBJECT,
      properties: {
        immediateAction: { type: Type.STRING },
        shortTerm: { type: Type.STRING },
        longTerm: { type: Type.STRING }
      },
      required: ['immediateAction', 'shortTerm', 'longTerm']
    },
    impactPrediction: {
      type: Type.OBJECT,
      properties: {
        oneWeek: { type: Type.STRING },
        oneMonth: { type: Type.STRING }
      },
      required: ['oneWeek', 'oneMonth']
    },
    summary: { type: Type.STRING }
  },
  required: ['analysis', 'locationAnalysis', 'authority', 'resolution', 'impactPrediction', 'summary']
};

/**
 * Main service entry point to perform incident vision analysis.
 * Stores raw Gemini JSON alongside telemetry context and image references.
 */
export const analyzeIncident = async (imageInput, locationText, description = '') => {
  const client = getGenAIClient();
  const { data, mimeType } = await getBase64Image(imageInput);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: `Incident Location Context: ${locationText}\nUser Description: ${description || 'None provided.'}` },
          {
            inlineData: {
              mimeType,
              data
            }
          }
        ]
      }
    ],
    config: {
      systemInstruction: VISION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema
    }
  });

  if (!response || !response.text) {
    throw new Error('Empty response received from the Gemini Vision API.');
  }

  const rawAnalysis = parseJsonResponse(response.text);

  // Return the raw analysis along with component telemetry (imageUrl and address context)
  return {
    ...rawAnalysis,
    telemetry: {
      address: locationText,
      modelUsed: 'gemini-2.5-flash',
      analyzedAt: new Date().toISOString()
    }
  };
};
