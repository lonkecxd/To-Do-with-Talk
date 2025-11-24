
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { environment } from '../environments/environment';
import { ChatMessage } from '../models/app.models';

// This is a placeholder for the API key. In a real app, this would be managed securely.
// The Applet environment provides process.env.API_KEY.
declare var process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  private readonly model = 'gemini-2.5-flash';

  private readonly responseSchema = {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["CHAT_REPLY", "PROPOSE_ACTION"]
      },
      reply: {
        type: Type.STRING,
        description: "The conversational reply to the user. This should be friendly and helpful."
      },
      proposal: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["CREATE_GOAL", "CREATE_TODO", "UPDATE_TODO"]
          },
          goalName: { 
            type: Type.STRING,
            description: "The name of a new goal to be created."
          },
          todoDescription: { 
            type: Type.STRING,
            description: "The description of a new or existing to-do item."
          },
          progress: { 
            type: Type.NUMBER, 
            description: "A number between 0 and 100 representing the completion percentage of a to-do item."
          },
          existingGoalName: { 
            type: Type.STRING,
            description: "The name of an existing goal to which a new to-do should be added, or the goal of the to-do to be updated."
          },
          existingTodoDescription: {
            type: Type.STRING,
            description: "The description of an existing to-do that needs to be updated. Match this as closely as possible to an existing item."
          }
        }
      }
    }
  };

  async getAiResponse(history: ChatMessage[], currentGoals: string): Promise<any> {
    const systemInstruction = `You are an AI assistant for a to-do list app. Your goal is to help users manage their goals and tasks. 
Current goals and tasks are: ${currentGoals}.
Engage in natural conversation. When you identify an intent to create a goal, create a to-do, or update a to-do's progress, you MUST respond with a JSON object.
Your response must follow the provided schema.
- Use 'PROPOSE_ACTION' when you want to suggest creating or updating a goal or to-do.
- Fill the 'proposal' object with the details of the action.
- When updating, try to find the best match for 'existingGoalName' and 'existingTodoDescription' from the current list.
- For all other conversation, use 'CHAT_REPLY' and leave the 'proposal' field empty.
- Your 'reply' should always be a friendly, conversational text.`;

    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        const response: GenerateContentResponse = await this.ai.models.generateContent({
            model: this.model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: this.responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        action: 'CHAT_REPLY',
        reply: "I'm sorry, I encountered an error. Please try again."
      };
    }
  }
}
