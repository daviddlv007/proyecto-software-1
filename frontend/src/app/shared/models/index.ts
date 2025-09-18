// Reexports para usar tipos limpios en Angular
import type { components } from './api';

export type Book = components["schemas"]["Book"];
export type Error = components["schemas"]["Error"];
export type BookInput = components["schemas"]["BookInput"];
export type Loan = components["schemas"]["Loan"];
export type LoanInput = components["schemas"]["LoanInput"];
