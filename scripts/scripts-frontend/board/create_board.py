#!/usr/bin/env python3
import os

# ------------------------
# Configuración
# ------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEATURE_NAME = "board"
FEATURES_DIR = os.path.join(BASE_DIR, '..', '..', 'frontend', 'src', 'app', 'features')
OUTPUT_FEATURE_DIR = os.path.join(FEATURES_DIR, FEATURE_NAME)

# ------------------------
# Crear carpetas del feature
# ------------------------
folders = [
    "models",
    "data-access",
    "ui",
    "pages"
]

for folder in folders:
    path = os.path.join(OUTPUT_FEATURE_DIR, folder)
    os.makedirs(path, exist_ok=True)

# ------------------------
# Archivos y contenido mínimo
# ------------------------

files = {
    # Routes
    f"{FEATURE_NAME}.routes.ts": f"""import {{ Routes }} from '@angular/router';
import {{ BoardPageComponent }} from './pages/board-page.component';

export const boardRoutes: Routes = [
  {{ path: '{FEATURE_NAME}/:id', component: BoardPageComponent }}
];
""",
    # Models
    "models/board.model.ts": """export interface ClassNode {
  id: string;
  name: string;
  attributes: string[];
}

export interface RelationEdge {
  id: string;
  type: 'association' | 'inheritance' | 'composition';
  originId: string;
  targetId: string;
  multiplicity: string;
}

export interface BoardDiagram {
  classes: ClassNode[];
  relations: RelationEdge[];
}
""",
    # Service (mock)
    "data-access/board.service.ts": """import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BoardDiagram } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private diagram: BoardDiagram = { classes: [], relations: [] };

  getDiagram(): Observable<BoardDiagram> {
    return of(this.diagram);
  }

  updateDiagram(diagram: BoardDiagram): Observable<any> {
    this.diagram = diagram;
    console.log('Estado actualizado en mock service:', this.diagram);
    return of({ status: 'UPDATED' });
  }

  generateBackend(): Observable<any> {
    console.log('Generando backend mock con:', this.diagram);
    return of({ status: 'CREATED', downloadUrl: '/mock.zip' });
  }
}
""",
    # Página principal (standalone)
    "pages/board-page.component.ts": """import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardService } from '../data-access/board.service';
import { BoardDiagram, ClassNode, RelationEdge } from '../models/board.model';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Pizarra</h2>
      <button (click)="syncToBackend()">Actualizar backend</button>
      <button (click)="generateBackend()">Generar backend</button>
      <pre>{{ diagram | json }}</pre>
    </div>
  `
})
export class BoardPageComponent implements OnInit {
  diagram: BoardDiagram = { classes: [], relations: [] };

  constructor(private boardService: BoardService) {}

  ngOnInit() {
    this.boardService.getDiagram().subscribe(d => this.diagram = d);
  }

  addClass(name: string) {
    this.diagram.classes.push({ id: this.generateId(), name, attributes: [] });
  }

  addRelation(relation: RelationEdge) {
    this.diagram.relations.push(relation);
  }

  syncToBackend() {
    this.boardService.updateDiagram(this.diagram).subscribe(res => console.log('Sync completada', res));
  }

  generateBackend() {
    this.boardService.generateBackend().subscribe(res => console.log('Backend generado', res));
  }

  private generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}
""",
    # UI componentes
    "ui/class-node.component.ts": """import { Component, Input } from '@angular/core';
import { ClassNode } from '../models/board.model';

@Component({
  selector: 'app-class-node',
  template: `<div class="class-node">{{node.name}}</div>`
})
export class ClassNodeComponent {
  @Input() node!: ClassNode;
}
""",
    "ui/relation-edge.component.ts": """import { Component, Input } from '@angular/core';
import { RelationEdge } from '../models/board.model';

@Component({
  selector: 'app-relation-edge',
  template: `<div class="relation-edge">{{relation.type}}</div>`
})
export class RelationEdgeComponent {
  @Input() relation!: RelationEdge;
}
"""
}

# ------------------------
# Crear los archivos
# ------------------------
for relative_path, content in files.items():
    full_path = os.path.join(OUTPUT_FEATURE_DIR, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    if not os.path.exists(full_path):
        with open(full_path, 'w') as f:
            f.write(content)

print(f"✅ Feature '{FEATURE_NAME}' de la pizarra generado completamente en {OUTPUT_FEATURE_DIR}")
