import { GoogleGenAI } from '@google/genai';
import { COPILOT_SYSTEM_PROMPT } from '../../prompts/copilotPrompt';

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

/**
 * Generates a stable, deterministic case number from a Firestore document ID.
 */
export const getCaseNumber = (id) => {
  if (!id) return 'CP-000000';
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  const numericValue = (hash >>> 0) % 1000000;
  return `CP-${String(numericValue).padStart(6, '0')}`;
};

/**
 * Sends a query to Gemini operations copilot with context of active incidents, pre-generated intelligence, and conversation history.
 */
export const askCopilot = async (cityName, incidents, cityIntelligence, messageHistory, newUserMessage) => {
  // Map clean incidents to replace Firestore document IDs with human-friendly Case Numbers
  const cleanIncidents = incidents.map(item => ({
    caseNumber: getCaseNumber(item.id),
    city: item.city || 'Unknown',
    state: item.state || 'Unknown',
    issueType: item.analysis?.issueType || 'Incident',
    severity: item.analysis?.severity || 'medium',
    priorityScore: typeof item.analysis?.riskScore === 'number' ? item.analysis.riskScore : parseFloat(item.analysis?.riskScore) || 5.0,
    authority: item.authority?.department || 'General Operations',
    status: item.status || 'Open',
    createdAt: item.createdAt || '',
    summary: item.summary || '',
    location: item.location || ''
  }));

  try {
    const client = getGenAIClient();
    
    // Inject active incidents, pre-generated intelligence and city context into system prompt
    const systemInstruction = COPILOT_SYSTEM_PROMPT
      .replace('{cityName}', cityName)
      .replace('{cityIntelligenceJson}', JSON.stringify(cityIntelligence || {}, null, 2))
      .replace('{incidentsJson}', JSON.stringify(cleanIncidents, null, 2));

    // Construct history for conversation memory
    const contents = [
      ...messageHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: newUserMessage }]
      }
    ];

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    if (!response || !response.text) {
      throw new Error('Empty response from Copilot API.');
    }

    return response.text;
  } catch (error) {
    console.error('Error in AI Copilot service:', error);
    throw error;
  }
};
