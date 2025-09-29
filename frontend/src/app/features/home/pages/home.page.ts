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
      <button (click)="goToBoard()">
        Ir a Pizarra
      </button>
      <button (click)="goToBoardGuest()">
        Ir a Pizarra (Invitado)
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
      cursor: pointer;
    }
  `]
})
export class HomePage {

  constructor(private router: Router) {}

  goToBoard() {
    this.router.navigate(['board', 1]); // navega a /board/1
  }

  goToBoardGuest() {
    this.router.navigate(['board-guest', 1]); // navega a /board-guest/1
  }
}
