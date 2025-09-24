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
# Carpetas del feature
# ------------------------
folders = ["models", "data-access", "pages", "ui"]
for folder in folders:
    path = os.path.join(OUTPUT_FEATURE_DIR, folder)
    os.makedirs(path, exist_ok=True)

# ------------------------
# Archivos del feature
# ------------------------
FILES = {
    "models/board.model.ts": """export interface Attribute {
  name: string;
  type: string;
}

export interface ClassNode {
  id: string;
  name: string;
  attributes: Attribute[];
  x: number;
  y: number;
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
    "data-access/board.service.ts": """import { Injectable } from '@angular/core';
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
""",
    "pages/board-page.component.ts": """import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../data-access/board.service';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h2>Pizarra UML</h2>
      <button (click)="sync()">Actualizar</button>
      <button (click)="gen()">Generar</button>
      <button (click)="addClass()">+ Clase</button>

      <svg #svg width="1200" height="700" style="border:1px solid #000"
           (mousemove)="move($event)" (mouseup)="up()" (mouseleave)="up()">

        <!-- Relaciones -->
        <g *ngFor="let r of d.relations; let i=index">
          <line [attr.x1]="n(r.originId).x+60" [attr.y1]="n(r.originId).y+25+i*gap"
                [attr.x2]="n(r.targetId).x+60" [attr.y2]="n(r.targetId).y+25+i*gap"
                stroke="black" stroke-width="2"/>
          <foreignObject [attr.x]="(n(r.originId).x+n(r.targetId).x)/2"
                         [attr.y]="(n(r.originId).y+n(r.targetId).y)/2+i*gap"
                         width="20" height="20">
            <button (click)="remRel(r)" style="width:100%;height:100%;border:none;background:none;">x</button>
          </foreignObject>
        </g>

        <!-- Clases -->
        <g *ngFor="let n of d.classes" [attr.transform]="'translate('+n.x+','+n.y+')'"
           (mousedown)="down($event,n)" (click)="click(n,$event)">
          <rect [attr.width]="120" [attr.height]="50+n.attributes.length*20" fill="white" stroke="black"/>
          <foreignObject width="120" height="30">
            <input [(ngModel)]="n.name" style="width:100%; text-align:center; border:none;"/>
          </foreignObject>
          <ng-container *ngFor="let a of n.attributes; let i=index">
            <foreignObject [attr.y]="30+i*20" width="120" height="20">
              <div style="display:flex;gap:2px;">
                <input [(ngModel)]="a.name" placeholder="Nombre" style="width:50%;border:none;"/>
                <input [(ngModel)]="a.type" placeholder="Tipo" style="width:50%;border:none;"/>
              </div>
            </foreignObject>
          </ng-container>
          <foreignObject [attr.y]="30+n.attributes.length*20" width="120" height="60">
            <button (click)="n.attributes.push({name:'',type:''})" style="width:100%;border:none;">+ Atributo</button>
            <button (click)="remClass(n)" style="width:100%;border:none;">- Clase</button>
            <button (click)="startRel(n)" style="width:100%;border:none;">+ Relación</button>
          </foreignObject>
        </g>

        <!-- Menú relación -->
        <foreignObject *ngIf="relO && menu" [attr.x]="relO.x+130" [attr.y]="relO.y" width="100" height="60">
          <div style="display:flex;flex-direction:column;">
            <button *ngFor="let t of ['association','inheritance','composition']" (click)="setType(t)">{{t}}</button>
            <button (click)="cancel()">Cancelar</button>
          </div>
        </foreignObject>

      </svg>
    </div>
  `
})
export class BoardPageComponent implements OnInit, AfterViewInit {
  d = { classes: [] as any[], relations: [] as any[] };
  drag: any = null; offX = 0; offY = 0; svg!: SVGSVGElement;
  relO: any = null; type: any = null; menu = false; gap = 15;

  constructor(private s: BoardService) {}

  ngOnInit() {
    this.s.getDiagram().subscribe(di => this.d = di);
    this.s.updateDiagram({
      classes: [
        { id: '1', name: 'Usuario', attributes: [{name:'id',type:'number'},{name:'email',type:'string'}], x:100, y:100 },
        { id: '2', name: 'Producto', attributes: [{name:'id',type:'number'},{name:'precio',type:'number'}], x:300, y:200 }
      ],
      relations: []
    });
  }

  ngAfterViewInit() { this.svg = document.querySelector('svg')!; }

  n = (id: string) => this.d.classes.find((n:any)=>n.id===id)!;
  sync = () => this.s.updateDiagram(this.d).subscribe();
  gen = () => this.s.generateBackend().subscribe();

  down(e: MouseEvent, n: any) {
    if(['INPUT','BUTTON'].includes((e.target as any).tagName)||this.relO) return;
    const p = this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    const sp = p.matrixTransform(this.svg.getScreenCTM()!.inverse());
    this.drag = n; this.offX = sp.x - n.x; this.offY = sp.y - n.y;
  }

  move(e: MouseEvent) {
    if(!this.drag) return;
    const p = this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    const sp = p.matrixTransform(this.svg.getScreenCTM()!.inverse());
    this.drag.x = sp.x - this.offX; this.drag.y = sp.y - this.offY;
  }

  up = () => this.drag = null;

  addClass() {
    const id = (Math.max(0,...this.d.classes.map(c=>+c.id))+1)+'';
    this.d.classes.push({id,name:'NuevaClase',attributes:[],x:50,y:50});
  }

  remClass(n: any) {
    this.d.relations = this.d.relations.filter(r => r.originId!==n.id && r.targetId!==n.id);
    this.d.classes = this.d.classes.filter(c => c.id!==n.id);
  }

  startRel = (n: any) => { this.relO = n; this.menu = true; this.type = null; }
  setType = (t: any) => { this.type = t; this.menu = false; }
  cancel = () => { this.relO = this.type = null; this.menu = false; }

  click(n: any, e: MouseEvent) {
    if(['INPUT','BUTTON'].includes((e.target as any).tagName)) return;
    if(this.relO && this.type && this.relO.id!==n.id) {
      const id = 'r'+(Math.max(0,...this.d.relations.map(r=>+r.id.slice(1)))+1);
      this.d.relations.push({id,type:this.type,originId:this.relO.id,targetId:n.id,multiplicity:'1..*'});
      this.relO = this.type = null;
    }
  }

  remRel = (r: any) => this.d.relations = this.d.relations.filter(x=>x.id!==r.id);
}
"""
}

# ------------------------
# Crear archivos
# ------------------------
for relative_path, content in FILES.items():
    full_path = os.path.join(OUTPUT_FEATURE_DIR, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)

print(f"✅ Feature 'board' actualizado con BoardPageComponent completo en {OUTPUT_FEATURE_DIR}")
