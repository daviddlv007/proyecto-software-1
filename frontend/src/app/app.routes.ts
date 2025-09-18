import type { Routes } from '@angular/router';
import { LibraryPageComponent } from './features/library/pages/library-page.component';
import { LoansPageComponent } from './features/loans/pages/loans-page.component';
import { HomePageComponent } from './features/home/pages/home-page.component';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent }, // Home
  { path: 'library', component: LibraryPageComponent },
  { path: 'loans', component: LoansPageComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' } // Redirección raíz
];
