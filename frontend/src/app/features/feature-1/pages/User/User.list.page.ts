import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../data-access/User.service';
import { User } from '../../models/User';
import { TableComponent } from '../../ui/table.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <div class="list-container">
      <button class="create-btn" (click)="goToCreate()">Crear User</button>
      <app-table [data]="items" [actions]="true" [excludeKeys]="['id']"
                 (edit)="goToEdit($event)" (delete)="delete($event)">
      </app-table>
    </div>
  `,
  styles: [`
    .list-container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 1rem;
      background: #1f1f1f;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      color: #f1f1f1;
      font-family: Arial, sans-serif;
    }
    .create-btn {
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: #4cafef;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    .create-btn:hover { background: #3a9adf; }
    app-table { display:block; }
  `]
})
export class UserListPage implements OnInit {
  items: User[] = [];

  constructor(private service: UserService, private router: Router) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.service.getAll().subscribe((data: User[]) => {
      this.items = data; // ✅ mantener id internamente
    });
  }

  goToCreate() {
    this.router.navigate(['user/create']);
  }

  goToEdit(item: User) {
    this.router.navigate(['user/edit', item.id]);
  }

  delete(item: User) {
    this.service.delete(item.id).subscribe(() => this.loadItems());
  }
}