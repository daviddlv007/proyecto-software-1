import { Routes } from '@angular/router';
import { BoardPageComponent } from './pages/board-page.component';
export const boardRoutes: Routes = [
  { path: 'board/:id', component: BoardPageComponent }
];
