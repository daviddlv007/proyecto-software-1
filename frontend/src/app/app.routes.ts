import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Componentes principales
import { HomePage } from './features/home/pages/home.page';
import { AppLayoutComponent } from './layouts/app-layout.component';

// Rutas del feature-1
import { featureRoutes } from './features/feature-1/feature-1.routes';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent, // <--- Layout como contenedor
    children: [
      // Páginas principales
      { path: 'home', component: HomePage },

      // Rutas del feature-1
      ...featureRoutes,

      // Redirección raíz
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  // Ruta comodín (opcional) para 404
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
