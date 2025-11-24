
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../models/app.models';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent {
  goals = input.required<Goal[]>();

  goalProgress = computed(() => {
    const goals = this.goals();
    return goals.map(goal => {
      if (goal.todos.length === 0) {
        return { ...goal, progress: 0 };
      }
      const totalProgress = goal.todos.reduce((sum, todo) => sum + todo.progress, 0);
      const averageProgress = Math.round(totalProgress / goal.todos.length);
      return { ...goal, progress: averageProgress };
    });
  });
}
