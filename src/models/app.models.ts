
export interface Todo {
  id: number;
  description: string;
  progress: number; // 0-100
}

export interface Goal {
  id: number;
  name: string;
  todos: Todo[];
}

export interface AiProposal {
  type: 'CREATE_GOAL' | 'CREATE_TODO' | 'UPDATE_TODO';
  goalName?: string;
  todoDescription?: string;
  progress?: number;
  existingGoalName?: string;
  existingTodoDescription?: string;
}

export type ChatMessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  role: ChatMessageRole;
  text?: string;
  proposal?: AiProposal;
  proposalHandled?: boolean; // To disable confirmation buttons after use
}
