import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoansAdapterService } from '../data-access/loans-adapter.service';
import type { Loan, LoanInput } from '../../../shared/models';

@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Prestar Libro</h2>
    <form (ngSubmit)="createLoan()">
      <input [(ngModel)]="newLoan.bookId" name="bookId" type="number" placeholder="ID del libro" required />
      <input [(ngModel)]="newLoan.userName" name="userName" placeholder="Nombre del usuario" required />
      <button type="submit">Prestar</button>
    </form>

    <h2>Préstamos Activos</h2>
    <input [(ngModel)]="searchUserName" placeholder="Nombre del usuario" />
    <button (click)="searchLoans()">Buscar</button>

    <ul>
      <li *ngFor="let loan of loans">
        Libro ID: {{ loan.bookId }} — Usuario: {{ loan.userName }}
      </li>
    </ul>
  `
})
export class LoansPageComponent {
  newLoan: LoanInput = { bookId: 0, userName: '' };
  searchUserName = '';
  loans: Loan[] = [];

  constructor(private adapter: LoansAdapterService) {}

  // Crear préstamo
  createLoan() {
    this.adapter.createLoan(this.newLoan).subscribe(
      loan => {
        alert(`Préstamo registrado (libro id: ${loan.bookId})`);
        this.newLoan = { bookId: 0, userName: '' };
      },
      err => {
        console.error('Error crear préstamo', err);
      }
    );
  }

  // Buscar préstamos activos
  searchLoans() {
    this.adapter.listActiveLoans(this.searchUserName).subscribe(
      list => {
        this.loans = list;
      },
      err => {
        console.error('Error listar préstamos', err);
      }
    );
  }
}
