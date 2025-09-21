import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Bienvenido a la Aplicación</h1>
    <div class="buttons-container">
      
      <button (click)="goToUserList()">
        User List
      </button>
      
      <button (click)="goToProfileList()">
        Profile List
      </button>
      
      <button (click)="goToProductList()">
        Product List
      </button>
      
    </div>
  `,
  styles: [`
    .buttons-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 300px;
    }
    button {
      padding: 10px;
      font-size: 16px;
    }
  `]
})
export class HomePage {

  constructor(private router: Router) {}

  
  goToUserList() {
    this.router.navigate(['user']);
  }
  
  goToProfileList() {
    this.router.navigate(['profile']);
  }
  
  goToProductList() {
    this.router.navigate(['product']);
  }
  
}