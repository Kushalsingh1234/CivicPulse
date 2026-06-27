import { GoogleGenAI, Type } from '@google/genai';
import { CITY_INTELLIGENCE_SYSTEM_PROMPT } from '../../prompts/cityIntelligencePrompt';

let genAIClient = null;

const getGenAIClient = () => {
  if (genAIClient) return genAIClient;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please define VITE_GEMINI_API_KEY in your .env file.');
  }

  genAIClient = new GoogleGenAI({ apiKey });
  return genAIClient;
};

const parseJsonResponse = (text) => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('AI returned an invalid JSON block.');
      }
    }
    throw new Error('AI response was not structured correctly.');
  }
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveBrief: { type: Type.STRING },
    trendingIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          count: { type: Type.INTEGER }
        },
        required: ['category', 'count']
      }
    },
    hotspots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          reason: { type: Type.STRING },
          risk: { type: Type.STRING }
        },
        required: ['location', 'reason', 'risk']
      }
    },
    departmentWorkload: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          department: { type: Type.STRING },
          workload: { type: Type.STRING }
        },
        required: ['department', 'workload']
      }
    },
    recommendedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    oneWeekForecast: { type: Type.STRING },
    overallRiskLevel: { type: Type.STRING }
  },
  required: [
    'executiveBrief',
    'trendingIssues',
    'hotspots',
    'departmentWorkload',
    'recommendedActions',
    'oneWeekForecast',
    'overallRiskLevel'
  ]
};

export const generateCityIntelligence = async (cityName, incidents) => {
  // Only send structured incident data to Gemini, excluding heavy binary/base64 visual assets
  const cleanIncidents = incidents.map(item => ({
    city: item.city || 'Unknown',
    state: item.state || 'Unknown',
    issueType: item.analysis?.issueType || 'Incident',
    severity: item.analysis?.severity || 'medium',
    priorityScore: typeof item.analysis?.riskScore === 'number' ? item.analysis.riskScore : parseFloat(item.analysis?.riskScore) || 5.0,
    authority: item.authority?.department || 'General Operations',
    status: item.status || 'Open',
    createdAt: item.createdAt || '',
    summary: item.summary || ''
  }));

  try {
    const client = getGenAIClient();
    const systemInstruction = CITY_INTELLIGENCE_SYSTEM_PROMPT.replace('{cityName}', cityName);

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Scope: ${cityName}\nAnalyze these active municipal incidents:\n${JSON.stringify(cleanIncidents, null, 2)}` }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    if (!response || !response.text) {
      throw new Error('Empty response from intelligence API.');
    }

    return parseJsonResponse(response.text);
  } catch (error) {
    console.error('Error generating city intelligence:', error);
    throw error;
  }
};
