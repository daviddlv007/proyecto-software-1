import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div *ngFor="let key of keys">
        {{ key }}: {{ data[key] }}
      </div>
    </div>
  `
})
export class CardComponent {
  @Input() data: any;
  get keys() { return Object.keys(this.data || {}); }
}