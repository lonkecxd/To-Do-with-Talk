
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './components/chat/chat.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { GeminiService } from './services/gemini.service';
import { Goal, Todo, ChatMessage, AiProposal } from './models/app.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatComponent, TodoListComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  isLoading = signal(false);
  goals = signal<Goal[]>([]);
  messages = signal<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your AI assistant. How can I help you manage your goals and tasks today?' }
  ]);

  currentGoalsState = computed(() => {
    return this.goals().map(g => `- Goal: ${g.name}, Tasks: [${g.todos.map(t => `'${t.description}' (${t.progress}%)`).join(', ')}]`).join('\n');
  });

  async handleMessageSent(prompt: string) {
    this.messages.update(m => [...m, { role: 'user', text: prompt }]);
    this.isLoading.set(true);

    const history = this.messages().filter(m => m.role !== 'system');
    const aiResponse = await this.geminiService.getAiResponse(history, this.currentGoalsState());
    
    this.isLoading.set(false);

    this.messages.update(m => [...m, { 
      role: 'model', 
      text: aiResponse.reply,
      proposal: aiResponse.action === 'PROPOSE_ACTION' ? aiResponse.proposal : undefined,
      proposalHandled: false
    }]);
  }

  handleProposalAction(event: {proposal: AiProposal, messageIndex: number}) {
    const { proposal, messageIndex } = event;

    this.messages.update(currentMessages => {
        const newMessages = [...currentMessages];
        if (newMessages[messageIndex]) {
            newMessages[messageIndex] = { ...newMessages[messageIndex], proposalHandled: true };
        }
        return newMessages;
    });

    switch (proposal.type) {
      case 'CREATE_GOAL':
        if (proposal.goalName) {
          this.goals.update(goals => [
            ...goals,
            { id: Date.now(), name: proposal.goalName!, todos: [] }
          ]);
        }
        break;
      case 'CREATE_TODO':
        if (proposal.todoDescription && proposal.existingGoalName) {
          this.goals.update(goals => 
            goals.map(goal => 
              goal.name.toLowerCase() === proposal.existingGoalName!.toLowerCase()
                ? { ...goal, todos: [...goal.todos, { id: Date.now(), description: proposal.todoDescription!, progress: 0 }] }
                : goal
            )
          );
        }
        break;
      case 'UPDATE_TODO':
        if (proposal.existingTodoDescription && proposal.progress !== undefined) {
          this.goals.update(goals => 
            goals.map(goal => ({
              ...goal,
              todos: goal.todos.map(todo => 
                todo.description.toLowerCase() === proposal.existingTodoDescription!.toLowerCase()
                  ? { ...todo, progress: proposal.progress! }
                  : todo
              )
            }))
          );
        }
        break;
    }
  }
}
