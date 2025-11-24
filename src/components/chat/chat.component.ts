
import { Component, ChangeDetectionStrategy, input, output, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, AiProposal } from '../../models/app.models';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  messages = input.required<ChatMessage[]>();
  isLoading = input.required<boolean>();
  
  messageSent = output<string>();
  proposalAction = output<{proposal: AiProposal, messageIndex: number}>();

  userInput = signal('');
  chatContainer = viewChild<ElementRef>('chatContainer');

  constructor() {
    effect(() => {
      // Auto-scroll when messages change
      this.messages(); // depend on messages
      this.scrollToBottom();
    });
  }

  sendMessage(): void {
    const text = this.userInput().trim();
    if (text) {
      this.messageSent.emit(text);
      this.userInput.set('');
    }
  }

  handleProposal(proposal: AiProposal, messageIndex: number, confirmed: boolean): void {
    if (confirmed) {
      this.proposalAction.emit({proposal, messageIndex});
    } else {
       // Find the message and mark it as handled (declined)
       const message = this.messages()[messageIndex];
       if (message) {
         message.proposalHandled = true;
       }
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.chatContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
