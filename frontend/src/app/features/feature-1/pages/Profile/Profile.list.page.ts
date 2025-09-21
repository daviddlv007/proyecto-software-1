import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from '../../data-access/Profile.service';
import { Profile } from '../../models/Profile';
import { TableComponent } from '../../ui/table.component';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <div class="list-container">
      <button class="create-btn" (click)="goToCreate()">Crear Profile</button>
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
export class ProfileListPage implements OnInit {
  items: Profile[] = [];

  constructor(private service: ProfileService, private router: Router) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.service.getAll().subscribe((data: Profile[]) => {
      this.items = data; // ✅ mantener id internamente
    });
  }

  goToCreate() {
    this.router.navigate(['profile/create']);
  }

  goToEdit(item: Profile) {
    this.router.navigate(['profile/edit', item.id]);
  }

  delete(item: Profile) {
    this.service.delete(item.id).subscribe(() => this.loadItems());
  }
}