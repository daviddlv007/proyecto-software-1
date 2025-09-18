import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultService } from '../../../shared/api';
import type { Loan, LoanInput } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class LoansAdapterService {
  constructor(private defaultService: DefaultService) {}

  // Crear un préstamo
  createLoan(input: LoanInput): Observable<Loan> {
    return this.defaultService.loansPost(input);
  }

  // Listar préstamos activos por nombre de usuario
  listActiveLoans(userName: string): Observable<Loan[]> {
    return this.defaultService.loansGet(userName);
  }
}
