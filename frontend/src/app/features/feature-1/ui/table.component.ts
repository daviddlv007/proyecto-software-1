import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th *ngFor="let key of keys">{{ key }}</th>
            <th *ngIf="actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data; let i = index" [class.odd]="i % 2 === 0">
            <td *ngFor="let key of keys">{{ row[key] }}</td>
            <td *ngIf="actions">
              <button class="edit-btn" (click)="onEdit(row)">Editar</button>
              <button class="delete-btn" (click)="onDelete(row)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrapper {
      overflow-x:auto;
      border-radius: 8px;
      background:#1f1f1f;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      color:#f1f1f1;
    }
    table { width:100%; border-collapse:collapse; font-family:Arial,sans-serif; }
    th, td { padding:0.75rem 1rem; text-align:left; border-bottom:1px solid #333; }
    thead th { background:#2c2c2c; font-weight:600; }
    tbody tr.odd { background:#2a2a2a; }
    tbody tr:hover { background:#333; }

    button {
      padding:0.3rem 0.6rem; margin-right:0.3rem; border:none;
      border-radius:4px; cursor:pointer; font-weight:bold;
      transition: background 0.2s; color:#fff;
    }
    .edit-btn { background:#4cafef; }
    .edit-btn:hover { background:#3a9adf; }
    .delete-btn { background:#f44336; }
    .delete-btn:hover { background:#d32f2f; }
  `]
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() actions = false;
  @Input() excludeKeys: string[] = ['id'];
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  get keys() {
    if (!this.data.length) return [];
    return Object.keys(this.data[0]).filter(k => !this.excludeKeys.includes(k));
  }

  onEdit(row: any) { this.edit.emit(row); }
  onDelete(row: any) { this.delete.emit(row); }
}