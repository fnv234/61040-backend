/**
 * LLM Integration
 * 
 * Handles the requestAssignmentsFromLLM functionality using Google's Gemini API.
 * The LLM prompt is hardwired with user preferences and doesn't take external hints.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Configuration for API access
 */
export interface Config {
    apiKey: string;
}

export class GeminiLLM {
    private apiKey: string;

    constructor(config: Config) {
        this.apiKey = config.apiKey;
    }

    async executeLLM (prompt: string): Promise<string> {
        try {
            // Initialize Gemini AI
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash-lite",
                generationConfig: {
                    maxOutputTokens: 1000,
                }
            });
            // Execute the LLM
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return text;            
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }    }
}

// Mock LLM for testing purposes
export const mockLLM = (): GeminiLLM => {
  let mockResponse = "Mock response";
  let mockCalls: any[] = [];

  const executeLLM = (prompt: string) => {
    mockCalls.push({ args: [prompt] });
    return Promise.resolve(mockResponse);
  };

  // Add mock methods to the function
  (executeLLM as any).mockResolvedValue = (value: string) => {
    mockResponse = value;
  };
  (executeLLM as any).mock = {
    calls: mockCalls
  };

  return {
    executeLLM: executeLLM as any,
  } as GeminiLLM;
};