import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../data-access/Profile.service';
import { Profile } from '../../models/Profile';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <h2>Editar Profile</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        
          
        
          
        <div class="form-group">
          <label for="userId">userId</label>
          <input id="userId" type="text" formControlName="userId">
        </div>
          
        
          
        <div class="form-group">
          <label for="fullName">fullName</label>
          <input id="fullName" type="text" formControlName="fullName">
        </div>
          
        
          
        <div class="form-group">
          <label for="age">age</label>
          <input id="age" type="text" formControlName="age">
        </div>
          
        
        <div class="button-group">
          <button type="submit" [disabled]="form.invalid">Actualizar</button>
          <button type="button" class="cancel-btn" (click)="cancel()">Cancelar</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 1.5rem;
      background: #1f1f1f;
      color: #f1f1f1;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
    }
    h2 { text-align:center; margin-bottom:1rem; }
    .form-group { display:flex; flex-direction:column; margin-bottom:1rem; }
    label { margin-bottom:0.3rem; font-weight:500; }
    input {
      padding:0.5rem; border-radius:4px; border:1px solid #555;
      background:#2a2a2a; color:#f1f1f1; transition:border-color 0.2s;
    }
    input:focus { border-color:#4cafef; outline:none; }

    .button-group { display:flex; gap:0.5rem; margin-top:1rem; }
    button {
      flex:1;
      padding:0.7rem;
      border:none; border-radius:4px;
      font-weight:bold;
      cursor:pointer;
      transition: background 0.2s;
    }
    button[type="submit"] {
      background:#4cafef; color:#fff;
    }
    button[type="submit"]:hover:not(:disabled) { background:#3a9adf; }
    button[type="submit"]:disabled { background:#555; cursor:not-allowed; }

    .cancel-btn {
      background:#888;
      color:#fff;
    }
    .cancel-btn:hover { background:#666; }
  `]
})
export class ProfileEditPage implements OnInit {
  form: FormGroup;
  id: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      
        
      
        
      userId: [''],
        
      
        
      fullName: [''],
        
      
        
      age: ['']
        
      
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam != null) {
      this.id = Number(idParam);
      this.service.get(this.id).subscribe((data: Profile) => {
        const { id, ...fields } = data;
        this.form.patchValue(fields);
      });
    } else {
      console.error('ID no proporcionado en la URL');
      this.router.navigate(['profile']);
    }
  }

  submit() {
    if (this.id != null && this.form.valid) {
      const { id, ...payload } = this.form.value;
      this.service.update(this.id, payload)
        .subscribe(() => this.router.navigate(['profile']));
    } else {
      console.error('ID no definido o formulario inválido');
    }
  }

  cancel() {
    this.router.navigate(['profile']);
  }
}