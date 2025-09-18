// src/app/features/library/pages/library-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryAdapterService } from '../data-access/library-adapter.service';
import type { Book, BookInput } from '../../../shared/models';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Registrar Libro</h2>
    <form (ngSubmit)="addBook()">
      <input [(ngModel)]="newBook.title" name="title" placeholder="Título" required />
      <input [(ngModel)]="newBook.author" name="author" placeholder="Autor" required />
      <input [(ngModel)]="newBook.isbn" name="isbn" placeholder="ISBN" required />
      <button type="submit">Agregar</button>
    </form>

    <h2>Buscar Libros por Autor</h2>
    <input [(ngModel)]="searchAuthor" placeholder="Autor" />
    <button (click)="searchBooks()">Buscar</button>

    <ul>
      <li *ngFor="let book of books">{{ book.title }} — {{ book.author }} (id: {{ book.id }})</li>
    </ul>
  `
})
export class LibraryPageComponent {
  newBook: BookInput = { title: '', author: '', isbn: '' };
  searchAuthor = '';
  books: Book[] = [];

  constructor(private adapter: LibraryAdapterService) {}

  addBook() {
    this.adapter.registerBook(this.newBook).subscribe(book => {
      alert(`Libro registrado: ${book.title}`);
      this.newBook = { title: '', author: '', isbn: '' };
    }, err => {
      console.error('Error registrar libro', err);
    });
  }

  searchBooks() {
    this.adapter.listBooksByAuthor(this.searchAuthor).subscribe(books => {
      this.books = books;
    }, err => {
      console.error('Error buscar libros', err);
    });
  }
}
