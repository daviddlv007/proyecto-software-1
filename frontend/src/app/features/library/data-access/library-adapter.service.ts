import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultService } from '../../../shared/api';
import type { Book, BookInput } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class LibraryAdapterService {
  constructor(private defaultService: DefaultService) {}

  registerBook(book: BookInput): Observable<Book> {
    return this.defaultService.booksPost(book);
  }

  listBooksByAuthor(author: string): Observable<Book[]> {
    return this.defaultService.booksGet(author);
  }
}
