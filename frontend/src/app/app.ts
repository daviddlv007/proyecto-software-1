import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`, // Aquí se renderizan todas las rutas
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('mi-app');
}
