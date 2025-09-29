import { Routes } from '@angular/router';
import { BoardPageGuestComponent } from './pages/board-page-guest.component';
import { BoardPageComponent } from './pages/board-page.component';

export const boardRoutes: Routes = [
  { path: 'board/:id', component: BoardPageComponent },
  { path: 'board-guest/:id', component: BoardPageGuestComponent }
];
