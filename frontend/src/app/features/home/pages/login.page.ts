// app/features/home/pages/login.page.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { supabase } from '../../board/supabase.client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  template: `
    <style>
      .login-container {
        display: flex;
        min-height: 100vh;
        justify-content: center;
        align-items: center;
        background-color: #f5f5f5;
      }

      .login-box {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background-color: #ffffff;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        border-radius: 10px;
        text-align: center;
      }

      .login-box h1 {
        font-size: 1.8rem;
        margin-bottom: 1.5rem;
        color: #111827;
      }

      .login-box input {
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
        outline: none;
        transition: border 0.2s ease, box-shadow 0.2s ease;
      }

      .login-box input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      }

      .login-box button {
        width: 100%;
        padding: 0.75rem;
        margin-top: 0.5rem;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease;
        border: none;
        color: #fff;
      }

      .login-btn { background-color: #2563eb; }
      .login-btn:hover { background-color: #1d4ed8; }

      .signup-btn { background-color: #16a34a; }
      .signup-btn:hover { background-color: #15803d; }

      .logout-btn { background-color: #6b7280; }
      .logout-btn:hover { background-color: #4b5563; }

      .message { margin-top: 1rem; font-size: 0.9rem; }
      .message.error { color: #dc2626; }
      .message.success { color: #16a34a; }
    </style>

    <div class="login-container">
      <div class="login-box">
        <h1>Iniciar sesión</h1>

        <input [(ngModel)]="email" type="email" placeholder="Correo electrónico" required />
        <input [(ngModel)]="password" type="password" placeholder="Contraseña" required />

        <button class="login-btn" (click)="login()">Iniciar sesión</button>
        <button class="signup-btn" (click)="signup()">Registrarse</button>
        <button class="logout-btn" (click)="logout()">Cerrar sesión</button>

        <p *ngIf="error" class="message error">{{ error }}</p>
        <p *ngIf="user" class="message success">Bienvenido, {{ user.email }}</p>
      </div>
    </div>
  `
})
export class LoginPage {
  email = '';
  password = '';
  user: any = null;
  error = '';

  constructor(private router: Router) {}

  async login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });

    this.error = error?.message || '';
    this.user = data?.user;

    if (this.user) this.router.navigate(['/home']);
  }

  async signup() {
    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.password,
    });

    this.error = error?.message || '';
    this.user = data?.user;

    if (this.user) this.router.navigate(['/home']);
  }

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
  }
}
