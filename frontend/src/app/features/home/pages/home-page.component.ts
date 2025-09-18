import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Bienvenido a Mi App</h1>
    <ul>
      <li><a [routerLink]="['/library']">Biblioteca</a></li>
      <li><a [routerLink]="['/loans']">Préstamos</a></li>
    </ul>
  `
})
export class HomePageComponent {}
