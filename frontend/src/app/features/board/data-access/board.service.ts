import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { BoardDiagram } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private diagram$ = new BehaviorSubject<BoardDiagram>({ classes: [], relations: [] });

  getDiagram(): Observable<BoardDiagram> { return this.diagram$.asObservable(); }

  updateDiagram(diagram: BoardDiagram): Observable<any> {
    this.diagram$.next(diagram);
    console.log('Estado actualizado', diagram);
    return of({ status:'UPDATED' });
  }

  generateBackend(): Observable<any> {
    console.log('Generando backend mock', this.diagram$.value);
    return of({ status:'CREATED', downloadUrl:'/mock.zip' });
  }
}
