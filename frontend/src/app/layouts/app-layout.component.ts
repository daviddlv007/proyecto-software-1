import { Component, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { supabase } from '../features/board/supabase.client';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <!-- Botón menú hamburguesa -->
      <button class="toggle-btn" (click)="sidebarOpen.set(!sidebarOpen())">
        {{ sidebarOpen() ? '«' : '☰' }}
      </button>

      <div class="logo">Pizarra Colaborativa UML</div>

      <!-- Menú de usuario a la derecha -->
      <div class="user-menu">
        <button class="user-btn" (click)="menuOpen.set(!menuOpen())">👤</button>
        <div class="dropdown" *ngIf="menuOpen()">
          <button class="dropdown-item" (click)="logout()">Cerrar sesión</button>
        </div>
      </div>

      <!-- Botón dark mode -->
      <button class="darkmode-btn" (click)="darkMode.set(!darkMode())">
        {{ darkMode() ? '🌙' : '☀️' }}
      </button>
    </header>

    <div class="layout" [class.dark]="darkMode()">
      <aside class="sidebar" [class.closed]="!sidebarOpen()">
        <h2>Menú</h2>
        <ul>
          <li><a routerLink="/">Home</a></li>
          <li><a routerLink="/board/1">Board 1</a></li>
        </ul>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host, html, body { margin:0; padding:0; height:100%; display:block; font-family:Arial,sans-serif; }

    /* Barra superior */
    .topbar { display:flex; align-items:center; padding:0 1rem; height:50px; background:#202123; color:#f1f1f1; font-weight:500; position:sticky; top:0; z-index:20; box-shadow:0 1px 6px rgba(0,0,0,0.3);}
    .topbar .logo { font-size:1.2rem; font-weight:bold; margin-left:0.5rem; }
    
    /* Botones generales */
    .topbar button { background:none; border:none; cursor:pointer; color:#f1f1f1; font-size:1.2rem; margin-left:0.5rem; }

    /* Dark mode */
    .darkmode-btn { margin-left:auto; }

    /* User menu */
    .user-menu { position:relative; margin-left:1rem; }
    .user-btn { font-size:1.3rem; }
    .dropdown { position:absolute; top:110%; right:0; background:#2c2c2c; border-radius:4px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.3); }
    .dropdown-item { padding:0.5rem 1rem; width:100%; text-align:left; color:#f1f1f1; cursor:pointer; background:none; border:none; }
    .dropdown-item:hover { background:#3a3a3a; }

    /* Layout */
    .layout { display:flex; height:calc(100% - 50px); background:#f8f9fa; color:#111; transition:0.3s; }
    .layout.dark { background:#121212; color:#e1e1e1; }

    /* Sidebar */
    .sidebar { flex:0 0 220px; max-width:220px; background:#2c2c2c; color:#f1f1f1; padding:1rem; transition:0.3s; overflow:hidden; }
    .sidebar.closed { flex-basis:0; max-width:0; padding:1rem 0; }
    .sidebar h2 { font-size:1.2rem; margin-bottom:1rem; }
    .sidebar ul { list-style:none; padding:0; margin:0; }
    .sidebar li { margin:0.5rem 0; }
    .sidebar a { color:inherit; text-decoration:none; }
    .sidebar a:hover { text-decoration:underline; }

    /* Toggle botones */
    .toggle-btn { width:30px; height:30px; background:#161616; border:none; color:#f1f1f1;
                  cursor:pointer; border-radius:4px; font-weight:bold; display:flex;
                  align-items:center; justify-content:center; transition:0.2s;}
    .toggle-btn:hover { background:#1f1f1f; }

    /* Contenido principal */
    .content { flex:1; padding:1rem; overflow-y:auto; }
    .layout.dark .sidebar { background:#1f1f1f; }
    .layout.dark .toggle-btn { background:#2a2a2a; }
    .layout.dark .toggle-btn:hover { background:#3a3a3a; }
  `]
})
export class AppLayoutComponent {
  sidebarOpen = signal(true);
  darkMode = signal(true);
  menuOpen = signal(false);

  constructor(private router: Router) {}

  async logout() {
    await supabase.auth.signOut();
    this.menuOpen.set(false);
    this.router.navigate(['/login']);
  }
}
