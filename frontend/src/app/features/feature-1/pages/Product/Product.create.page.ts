import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../data-access/Product.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <h2>Crear Product</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        
          
        
          
        <div class="form-group">
          <label for="name">name</label>
          <input id="name" type="text" formControlName="name">
        </div>
          
        
          
        <div class="form-group">
          <label for="price">price</label>
          <input id="price" type="text" formControlName="price">
        </div>
          
        
          
        <div class="form-group">
          <label for="isAvailable">isAvailable</label>
          <input id="isAvailable" type="text" formControlName="isAvailable">
        </div>
          
        
        <div class="button-group">
          <button type="submit" [disabled]="form.invalid">Crear</button>
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
    h2 { text-align: center; margin-bottom: 1rem; }
    .form-group { display:flex; flex-direction:column; margin-bottom:1rem; }
    label { margin-bottom:0.3rem; font-weight:500; }
    input {
      padding:0.5rem; border-radius:4px; border:1px solid #555;
      background:#2a2a2a; color:#f1f1f1; transition: border-color 0.2s;
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
export class ProductCreatePage implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: ProductService,
    private router: Router
  ) {
    this.form = this.fb.group({
      
        
      
        
      name: [''],
        
      
        
      price: [''],
        
      
        
      isAvailable: ['']
        
      
    });
  }

  ngOnInit() {}

  submit() {
    if (this.form.valid) {
      const { id, ...payload } = this.form.value;
      this.service.create(payload)
        .subscribe(() => this.router.navigate(['product']));
    }
  }

  cancel() {
    this.router.navigate(['product']);
  }
}