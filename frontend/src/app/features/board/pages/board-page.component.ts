import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../data-access/board.service';
import { BoardDiagram, ClassNode, RelationEdge, Attribute } from '../models/board.model';
import { BoardGeneratorService } from '../services/board-generator.service';

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
      <button (click)="undo()">⏪ Deshacer</button>
      <button (click)="redo()">⏩ Rehacer</button>
      <button (click)="autoAlign()">🔲 Alinear clases</button>
      <button (click)="zoom(1.2)">➕ Zoom</button>
      <button (click)="zoom(0.8)">➖ Zoom</button>

      <svg
        #svg
        width="1200"
        height="700"
        style="border:1px solid #000"
        (mousemove)="move($event)"
        (mouseup)="up()"
        (mouseleave)="up()"
      >
        <!-- Líneas de relaciones -->
        <g *ngFor="let r of d.relations; let i = index">
          <line
            [attr.x1]="x1(r,i)"
            [attr.y1]="y1(r,i)"
            [attr.x2]="x2(r,i)"
            [attr.y2]="y2(r,i)"
            stroke="black"
            [attr.stroke-dasharray]="r.type==='dependency'?'5,5':null"
            stroke-width="2"
          ></line>

          <g *ngIf="r.type === 'inheritance'"
             [attr.transform]="'translate(' + x2(r,i) + ',' + y2(r,i) + ') rotate(' + angle(r,i) + ')'">
            <polygon points="0,0 -14,-7 -14,7" fill="white" stroke="black" stroke-width="2"></polygon>
          </g>

          <g *ngIf="r.type === 'composition'"
             [attr.transform]="'translate(' + x1(r,i) + ',' + y1(r,i) + ') rotate(' + angle(r,i) + ')'">
            <polygon points="0,0 10,-5 20,0 10,5" fill="black" stroke="black" stroke-width="1"></polygon>
          </g>

          <g *ngIf="r.type === 'aggregation'"
             [attr.transform]="'translate(' + x1(r,i) + ',' + y1(r,i) + ') rotate(' + angle(r,i) + ')'">
            <polygon points="0,0 10,-5 20,0 10,5" fill="white" stroke="black" stroke-width="1"></polygon>
          </g>

          <g *ngIf="r.type === 'dependency'"
             [attr.transform]="'translate(' + x2(r,i) + ',' + y2(r,i) + ') rotate(' + angle(r,i) + ')'">
            <polyline points="0,0 -10,-5 0,0 -10,5" fill="none" stroke="black" stroke-width="2"></polyline>
          </g>
        </g>

        <!-- Clases -->
        <g
          *ngFor="let n of d.classes"
          class="uml-class"
          [attr.transform]="'translate(' + n.x + ',' + n.y + ')'"
          (mousedown)="down($event, n)"
          (click)="click(n, $event)"
        >
          <rect [attr.width]="classWidth" [attr.height]="50 + n.attributes.length * 20" fill="white" stroke="black" />
          <rect [attr.width]="classWidth" height="30" fill="white" stroke="black" />
          <foreignObject [attr.width]="classWidth" height="30">
            <input [(ngModel)]="n.name" style="width:100%; text-align:center;" />
          </foreignObject>

          <ng-container *ngFor="let a of n.attributes; let i = index">
            <foreignObject [attr.y]="30 + i * 20" [attr.width]="classWidth" height="20">
              <div style="display:flex; gap:2px; width:100%;">
                <select [(ngModel)]="a.scope" style="width:20%;">
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="#">#</option>
                </select>
                <input [(ngModel)]="a.name" placeholder="Nombre" style="width:40%;" />
                <select [(ngModel)]="a.type" style="width:40%;">
                  <option *ngFor="let t of types" [value]="t">{{ t }}</option>
                </select>
              </div>
            </foreignObject>
          </ng-container>

          <foreignObject [attr.y]="30 + n.attributes.length * 20" [attr.width]="classWidth" height="80" class="action-buttons">
            <button (click)="saveHistory(); n.attributes.push({ name: '', type: 'String', scope: '+' })" style="width:100%; border:none;">+ Atributo</button>
            <button (click)="saveHistory(); remClass(n)" style="width:100%; border:none;">- Clase</button>
            <button (click)="saveHistory(); startRel(n)" style="width:100%; border:none;">+ Relación</button>
            <button (click)="duplicateClass(n)" style="width:100%; border:none;">📄 Duplicar</button>
          </foreignObject>
        </g>

        <!-- Multiplicidades y eliminar relación -->
        <g *ngFor="let r of d.relations; let i = index">
          <text [attr.x]="multX(r, i, 'origin')" [attr.y]="multY(r, i, 'origin')" font-size="12" text-anchor="middle" alignment-baseline="middle">{{ r.originMultiplicity }}</text>
          <text [attr.x]="multX(r, i, 'target')" [attr.y]="multY(r, i, 'target')" font-size="12" text-anchor="middle" alignment-baseline="middle">{{ r.targetMultiplicity }}</text>
          <foreignObject [attr.x]="(x1(r,i)+x2(r,i))/2 - 10" [attr.y]="(y1(r,i)+y2(r,i))/2 - 10" width="20" height="20">
            <button (click)="saveHistory(); remRel(r)" style="width:100%; height:100%; border:none; background:none;">x</button>
          </foreignObject>
        </g>

        <!-- Menú relación -->
        <foreignObject *ngIf="relO && menu" [attr.x]="relO.x + classWidth + 10" [attr.y]="relO.y" width="140" height="150">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <button *ngFor="let t of relationTypes" (click)="saveHistory(); setType(t)">{{ t }}</button>
            <button (click)="cancel()">Cancelar</button>
          </div>
        </foreignObject>
      </svg>
    </div>
  `,
  styles: [`
    .uml-class .action-buttons { opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
    .uml-class:hover .action-buttons { opacity: 1; pointer-events: all; }
    .uml-class input { border: none; background: transparent; outline: none; }
    .uml-class select { -webkit-appearance: none; -moz-appearance: none; appearance: none; border: none; background: transparent; outline: none; padding-left: 4px; }
  `],
})
export class BoardPageComponent implements OnInit, AfterViewInit {
  d: BoardDiagram = { classes: [], relations: [] };
  types: Attribute['type'][] = ['String', 'Integer', 'Real', 'Boolean', 'Date'];
  relationTypes: RelationEdge['type'][] = ['association','inheritance','composition','aggregation','dependency'];

  drag: ClassNode | null = null;
  offX = 0;
  offY = 0;
  svg!: SVGSVGElement;
  relO: ClassNode | null = null;
  type: RelationEdge['type'] | null = null;
  menu = false;
  gap = 70;
  classWidth = 200;
  multOffset = 10;
  multFactor = 0.15;
  zoomLevel = 1;

  history: BoardDiagram[] = [];
  redoStack: BoardDiagram[] = [];

  constructor(
    private s: BoardService,
    private generator: BoardGeneratorService
  ) {}

  ngOnInit() {
    this.s.getDiagram().subscribe(di => this.d = di);
    this.s.updateDiagram({
      classes: [
        { id: '1', name: 'Usuario', attributes: [{ name: 'id', type: 'Integer', scope: '+' }, { name: 'email', type: 'String', scope: '+' }], x: 100, y: 100 },
        { id: '2', name: 'Producto', attributes: [{ name: 'id', type: 'Integer', scope: '+' }, { name: 'precio', type: 'Real', scope: '+' }], x: 300, y: 200 },
      ],
      relations: [],
    });
  }

  ngAfterViewInit() { this.svg = document.querySelector('svg')!; }

  n = (id: string) => this.d.classes.find(c => c.id === id)!;
  sync = () => this.s.updateDiagram(this.d).subscribe();

  // ⚡ Método de generación Spring Boot
  gen() {
    this.generator.generateSpringBootProject(this.d);
  }

  saveHistory() {
    this.history.push(JSON.parse(JSON.stringify(this.d)));
    this.redoStack = [];
  }

  undo() {
    if (!this.history.length) return;
    this.redoStack.push(JSON.parse(JSON.stringify(this.d)));
    this.d = this.history.pop()!;
  }

  redo() {
    if (!this.redoStack.length) return;
    this.history.push(JSON.parse(JSON.stringify(this.d)));
    this.d = this.redoStack.pop()!;
  }

  autoAlign() {
    this.saveHistory();
    this.d.classes.forEach((c,i) => {
      c.x = 50 + (i%5)*(this.classWidth + 50);
      c.y = 50 + Math.floor(i/5)*150;
    });
  }

  duplicateClass(n: ClassNode) {
    this.saveHistory();
    const id = (Math.max(0,...this.d.classes.map(c => +c.id)) + 1).toString();
    this.d.classes.push({ ...JSON.parse(JSON.stringify(n)), id, x: n.x + 20, y: n.y + 20 });
  }

  zoom(factor: number) {
    this.zoomLevel *= factor;
    this.svg.setAttribute('viewBox', `0 0 ${1200/this.zoomLevel} ${700/this.zoomLevel}`);
  }

  private edgePoint(n: ClassNode, tx: number, ty: number) {
    const w = this.classWidth, h = 50 + n.attributes.length * 20;
    const cx = n.x + w/2, cy = n.y + h/2;
    const dx = tx - cx, dy = ty - cy;
    if(dx===0) return { x: cx, y: dy>0 ? n.y + h : n.y };
    if(dy===0) return { x: dx>0 ? n.x + w : n.x, y: cy };
    const scale = Math.min(Math.abs((dx>0?w/2:-w/2)/dx), Math.abs((dy>0?h/2:-h/2)/dy));
    return { x: cx + dx*scale, y: cy + dy*scale };
  }

  x1 = (r: RelationEdge, i:number) => this.edgePoint(this.n(r.originId), this.n(r.targetId).x + this.classWidth/2, this.n(r.targetId).y + (50 + this.n(r.targetId).attributes.length*20)/2 + i*this.gap).x;
  y1 = (r: RelationEdge, i:number) => this.edgePoint(this.n(r.originId), this.n(r.targetId).x + this.classWidth/2, this.n(r.targetId).y + (50 + this.n(r.targetId).attributes.length*20)/2 + i*this.gap).y;
  x2 = (r: RelationEdge, i:number) => this.edgePoint(this.n(r.targetId), this.n(r.originId).x + this.classWidth/2, this.n(r.originId).y + (50 + this.n(r.originId).attributes.length*20)/2 + i*this.gap).x;
  y2 = (r: RelationEdge, i:number) => this.edgePoint(this.n(r.targetId), this.n(r.originId).x + this.classWidth/2, this.n(r.originId).y + (50 + this.n(r.originId).attributes.length*20)/2 + i*this.gap).y;

  angle(r: RelationEdge, i:number) { const dx = this.x2(r,i)-this.x1(r,i), dy = this.y2(r,i)-this.y1(r,i); return Math.atan2(dy,dx)*(180/Math.PI); }

  private mult(r: RelationEdge, i:number, which:'origin'|'target') {
    const x1v = this.x1(r,i), y1v = this.y1(r,i), x2v = this.x2(r,i), y2v = this.y2(r,i);
    const dx = x2v-x1v, dy = y2v-y1v, len = Math.sqrt(dx*dx + dy*dy);
    const factor = which==='origin'?this.multFactor:1-this.multFactor;
    const offset = this.multOffset;
    return { x: x1v + dx*factor + (dy/len)*offset, y: y1v + dy*factor - (dx/len)*offset };
  }

  multX = (r: RelationEdge,i:number,which:'origin'|'target') => this.mult(r,i,which).x;
  multY = (r: RelationEdge,i:number,which:'origin'|'target') => this.mult(r,i,which).y;

  down(e: MouseEvent, n: ClassNode) {
    if (['INPUT','BUTTON','SELECT'].includes((e.target as HTMLElement).tagName) || this.relO) return;
    const p=this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    const sp=p.matrixTransform(this.svg.getScreenCTM()!.inverse());
    this.drag = n; this.offX = sp.x - n.x; this.offY = sp.y - n.y;
  }

  move(e: MouseEvent) {
    if(!this.drag) return;
    const p=this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    const sp=p.matrixTransform(this.svg.getScreenCTM()!.inverse());
    this.drag.x = sp.x - this.offX; this.drag.y = sp.y - this.offY;
  }

  up = () => this.drag = null;

  addClass() {
    this.saveHistory();
    const id = (Math.max(0,...this.d.classes.map(c=>+c.id)) + 1).toString();
    this.d.classes.push({id, name:'NuevaClase', attributes:[], x:50, y:50});
  }

  remClass(n: ClassNode) {
    this.d.relations = this.d.relations.filter(r=>r.originId!==n.id && r.targetId!==n.id);
    this.d.classes = this.d.classes.filter(c=>c.id!==n.id);
  }

  startRel = (n: ClassNode) => { this.relO=n; this.menu=true; this.type=null; };
  setType = (t: RelationEdge['type']) => { this.type=t; this.menu=false; };
  cancel = () => { this.relO=this.type=null; this.menu=false; };

  click(n: ClassNode, e: MouseEvent) {
    if (['INPUT','BUTTON','SELECT'].includes((e.target as HTMLElement).tagName)) return;
    if(this.relO && this.type && this.relO.id!==n.id) {
      const id = 'r'+(Math.max(0,...this.d.relations.map(r=>+r.id.slice(1)))+1);
      const multiplicities = this.type==='inheritance' ? { originMultiplicity:'1', targetMultiplicity:'1' } : { originMultiplicity:'1', targetMultiplicity:'*' };
      this.d.relations.push({id, type:this.type, originId:this.relO.id, targetId:n.id, ...multiplicities});
      this.relO = this.type = null;
    }
  }

  remRel = (r: RelationEdge) => this.d.relations = this.d.relations.filter(x=>x.id!==r.id);
}
