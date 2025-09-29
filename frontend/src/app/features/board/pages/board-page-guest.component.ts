import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardDiagram, ClassNode, RelationEdge, Attribute } from '../models/board.model';
import { BoardGeneratorService } from '../services/board-generator.service';
import { BoardStorageService } from '../data-access/board-storage.service';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="board-container">
  <!-- Header Section -->
  <div class="header">
    <h2 class="title">Pizarra UML (Invitado)</h2>
    
    <!-- Board Status Control -->
    <div class="status-control">
      <div class="status-info">
        <span class="status-label">Estado de la pizarra:</span>
        <span class="status-badge" [class.enabled]="boardEnabled" [class.disabled]="!boardEnabled">
          {{ boardEnabled ? 'HABILITADA' : 'DESHABILITADA' }}
        </span>
      </div>
      <div *ngIf="!isAdmin" class="admin-notice">
        <i class="icon-info">ℹ️</i> Solo los administradores pueden cambiar el estado
      </div>
    </div>
  </div>

  <!-- Toolbar Section -->
  <div class="toolbar">
    <div class="toolbar-group">
      <button class="toolbar-btn btn-secondary" (click)="gen()" [disabled]="!boardEnabled">
        <i class="icon">⚡</i> Generar
      </button>
      <button class="toolbar-btn btn-success" (click)="addClass()" [disabled]="!boardEnabled">
        <i class="icon">➕</i> Clase
      </button>
    </div>

    <div class="toolbar-group">
      <button class="toolbar-btn" (click)="undo()" [disabled]="!boardEnabled || !canUndo">
        <i class="icon">⏪</i> Deshacer
      </button>
      <button class="toolbar-btn" (click)="redo()" [disabled]="!boardEnabled || !canRedo">
        <i class="icon">⏩</i> Rehacer
      </button>
    </div>

    <div class="toolbar-group">
      <button class="toolbar-btn" (click)="autoAlign()" [disabled]="!boardEnabled">
        <i class="icon">🔲</i> Alinear
      </button>
      <button class="toolbar-btn" (click)="zoom(1.2)" [disabled]="!boardEnabled">
        <i class="icon">➕</i> Zoom
      </button>
      <button class="toolbar-btn" (click)="zoom(0.8)" [disabled]="!boardEnabled">
        <i class="icon">➖</i> Zoom
      </button>
    </div>

    <div class="toolbar-group">
      <button class="toolbar-btn btn-warning" (click)="checkDiagram()" [disabled]="!boardEnabled">
        <i class="icon">✔</i> Analizar
      </button>
    </div>

    <div class="toolbar-group file-upload">
      <label class="file-input-label">
        <input 
          type="file" 
          accept=".xmi,.xml" 
          (change)="onFileSelect($event)" 
          [disabled]="!boardEnabled"
          class="file-input" />
        <i class="icon">📁</i> Importar XMI
      </label>
    </div>
  </div>

  <!-- Gemini Response Section -->
  <div *ngIf="geminiResponse" class="response-panel">
    <div class="response-header">
      <h3 class="response-title">Respuesta del Analizador</h3>
    </div>
    <div class="response-content">
      <pre class="response-text">{{ geminiResponse }}</pre>
    </div>
  </div>

  <!-- Board Wrapper with Overlay -->
  <div class="board-wrapper">
    <!-- Overlay SOLO para el área del diagrama -->
    <div *ngIf="!boardEnabled" class="board-overlay">
      <div class="overlay-content">
        <div class="overlay-icon">🚫</div>
        <h3 class="overlay-title">Pizarra Deshabilitada</h3>
        <p class="overlay-message">La edición no está disponible en este momento</p>
      </div>
    </div>

<svg #svg width="1200" height="700" class="uml-board"
     (mousemove)="move($event)" (mouseup)="up()" (mouseleave)="up()"
     [class.board-disabled]="!boardEnabled"
     [attr.viewBox]="'0 0 ' + (1200/zoomLevel) + ' ' + (700/zoomLevel)">
      
      <g *ngFor="let r of d.relations; let i = index">
        <line [attr.x1]="x1(r,i)" [attr.y1]="y1(r,i)" [attr.x2]="x2(r,i)" [attr.y2]="y2(r,i)"
              stroke="black" [attr.stroke-dasharray]="r.type==='dependencia'?'5,5':null" stroke-width="2"></line>
        <g *ngIf="r.type === 'herencia'" [attr.transform]="'translate(' + x2(r,i) + ',' + y2(r,i) + ') rotate(' + angle(r,i) + ')'">
          <polygon points="0,0 -14,-7 -14,7" fill="white" stroke="black" stroke-width="2"></polygon>
        </g>
        <g *ngIf="r.type === 'composición'" [attr.transform]="'translate(' + x1(r,i) + ',' + y1(r,i) + ') rotate(' + angle(r,i) + ')'">
          <polygon points="0,0 10,-5 20,0 10,5" fill="black" stroke="black" stroke-width="1"></polygon>
        </g>
        <g *ngIf="r.type === 'agregación'" [attr.transform]="'translate(' + x1(r,i) + ',' + y1(r,i) + ') rotate(' + angle(r,i) + ')'">
          <polygon points="0,0 10,-5 20,0 10,5" fill="white" stroke="black" stroke-width="1"></polygon>
        </g>
        <g *ngIf="r.type === 'dependencia'" [attr.transform]="'translate(' + x2(r,i) + ',' + y2(r,i) + ') rotate(' + angle(r,i) + ')'">
          <polyline points="0,0 -10,-5 0,0 -10,5" fill="none" stroke="black" stroke-width="2"></polyline>
        </g>
      </g>

      <g *ngFor="let n of d.classes" class="uml-class" [attr.transform]="'translate(' + n.x + ',' + n.y + ')'"
         (mousedown)="down($event, n)" (click)="click(n, $event)">
        <rect [attr.width]="classWidth" [attr.height]="50 + n.attributes.length * 20" fill="white" stroke="black" />
        <rect [attr.width]="classWidth" height="30" fill="white" stroke="black" />
        <foreignObject [attr.width]="classWidth" height="30">
          <input 
            [(ngModel)]="n.name" 
            (change)="onDiagramChange()" 
            [disabled]="!boardEnabled"
            class="class-input" />
        </foreignObject>
        <ng-container *ngFor="let a of n.attributes; let i = index">
          <foreignObject [attr.y]="30 + i * 20" [attr.width]="classWidth" height="20">
            <div class="attribute-row">
              <select 
                [(ngModel)]="a.scope" 
                (change)="onDiagramChange()" 
                [disabled]="!boardEnabled"
                class="scope-select">
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="#">#</option>
              </select>
              <input 
                [(ngModel)]="a.name" 
                (change)="onDiagramChange()" 
                [disabled]="!boardEnabled"
                placeholder="Nombre" 
                class="attr-input" />
              <select 
                [(ngModel)]="a.type" 
                (change)="onDiagramChange()" 
                [disabled]="!boardEnabled"
                class="type-select">
                <option *ngFor="let t of types" [value]="t">{{ t }}</option>
              </select>
            </div>
          </foreignObject>
        </ng-container>
        <foreignObject [attr.y]="30 + n.attributes.length * 20" [attr.width]="classWidth" height="80" class="action-buttons">
          <button (click)="addAttribute(n)" [disabled]="!boardEnabled" class="class-btn">+ Atributo</button>
          <button (click)="remClass(n)" [disabled]="!boardEnabled" class="class-btn btn-remove">- Clase</button>
          <button (click)="startRel(n)" [disabled]="!boardEnabled" class="class-btn">+ Relación</button>
          <button (click)="duplicateClass(n)" [disabled]="!boardEnabled" class="class-btn">📄 Duplicar</button>
        </foreignObject>
      </g>

      <g *ngFor="let r of d.relations; let i = index">
        <text [attr.x]="multX(r, i, 'origin')" [attr.y]="multY(r, i, 'origin')" font-size="12" text-anchor="middle" alignment-baseline="middle">{{ r.originMultiplicity }}</text>
        <text [attr.x]="multX(r, i, 'target')" [attr.y]="multY(r, i, 'target')" font-size="12" text-anchor="middle" alignment-baseline="middle">{{ r.targetMultiplicity }}</text>
        <foreignObject [attr.x]="(x1(r,i)+x2(r,i))/2 - 10" [attr.y]="(y1(r,i)+y2(r,i))/2 - 10" width="20" height="20">
          <button (click)="remRel(r)" [disabled]="!boardEnabled" class="relation-remove-btn">×</button>
        </foreignObject>
      </g>

      <foreignObject *ngIf="relO && menu" [attr.x]="relO.x + classWidth + 10" [attr.y]="relO.y" width="140" height="150">
        <div class="relation-menu">
          <button *ngFor="let t of relationTypes" (click)="setType(t)" [disabled]="!boardEnabled" class="relation-type-btn">{{ getRelationTypeDisplayName(t) }}</button>
          <button (click)="cancel()" class="relation-cancel-btn">Cancelar</button>
        </div>
      </foreignObject>
    </svg>
  </div>
</div>
  `,
  styles: [
    `/* Container Styles */
    .board-container {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Header Styles */
    .header {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .title {
      color: #2d3748;
      margin: 0 0 15px 0;
      font-size: 1.8em;
      font-weight: 600;
    }

    /* Status Control Styles */
    .status-control {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-label {
      font-weight: 600;
      color: #4a5568;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9em;
      text-transform: uppercase;
    }

    .status-badge.enabled {
      background: #c6f6d5;
      color: #276749;
      border: 1px solid #9ae6b4;
    }

    .status-badge.disabled {
      background: #fed7d7;
      color: #c53030;
      border: 1px solid #feb2b2;
    }

    .toggle-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .toggle-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .toggle-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .btn-success {
      background: #38a169;
    }

    .btn-danger {
      background: #e53e3e;
    }

    .admin-notice {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85em;
      color: #718096;
    }

    /* Toolbar Styles */
    .toolbar {
      background: white;
      border-radius: 12px;
      padding: 15px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .toolbar-group {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-right: 15px;
      border-right: 1px solid #e2e8f0;
    }

    .toolbar-group:last-child {
      border-right: none;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #4a5568;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9em;
      font-weight: 500;
    }

    .toolbar-btn:hover:not(:disabled) {
      background: #f7fafc;
      border-color: #cbd5e0;
      transform: translateY(-1px);
    }

    .toolbar-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #4299e1;
      color: white;
      border-color: #4299e1;
    }

    .btn-secondary {
      background: #ed8936;
      color: white;
      border-color: #ed8936;
    }

    .btn-warning {
      background: #ecc94b;
      color: #744210;
      border-color: #ecc94b;
    }

    /* File Upload Styles */
    .file-upload {
      margin-left: auto;
    }

    .file-input-label {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px dashed #cbd5e0;
      border-radius: 6px;
      background: #f7fafc;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9em;
    }

    .file-input-label:hover {
      background: #edf2f7;
      border-color: #a0aec0;
    }

    .file-input {
      display: none;
    }

    /* Response Panel Styles */
    .response-panel {
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .response-header {
      background: #f7fafc;
      padding: 12px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .response-title {
      margin: 0;
      font-size: 1.1em;
      color: #2d3748;
      font-weight: 600;
    }

    .response-content {
      padding: 15px 20px;
      max-height: 200px;
      overflow: auto;
    }

    .response-text {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #4a5568;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Board Wrapper Styles */
    .board-wrapper {
      position: relative;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-height: 744px;
    }

    .uml-board {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.3s ease;
    }

    .uml-board.board-disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Board Overlay Styles */
    .board-overlay {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .overlay-content {
      background: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    .overlay-icon {
      font-size: 3em;
      margin-bottom: 15px;
    }

    .overlay-title {
      color: #e53e3e;
      margin: 0 0 10px 0;
      font-size: 1.5em;
    }

    .overlay-message {
      color: #718096;
      margin: 0;
    }

    /* UML Class Styles - RESTAURADOS LOS ESTILOS ORIGINALES */
    .uml-class .action-buttons { 
      opacity: 0; 
      transition: opacity 0.3s ease; 
      pointer-events: none; 
    }
    
    .uml-class:hover .action-buttons { 
      opacity: 1; 
      pointer-events: all; 
    }
    
    .class-input {
      width: 100%;
      text-align: center;
      border: none;
      background: transparent;
      outline: none;
      font-weight: 600;
      font-size: 0.95em;
    }

    .attribute-row {
      display: flex;
      gap: 2px;
      width: 100%;
      height: 100%;
    }

    /* ESTILOS RESTAURADOS PARA LOS SELECTS - IMPORTANTE */
    .scope-select, .type-select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      border: none;
      background: transparent;
      outline: none;
      padding-left: 4px;
      width: 100%;
      height: 100%;
      font-size: 0.85em;
      cursor: pointer;
    }

    .scope-select {
      width: 20%;
    }

    .type-select {
      width: 40%;
    }

    .attr-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85em;
      width: 40%;
      padding-left: 4px;
    }

    .class-btn {
      width: 100%;
      border: none;
      background: #f7fafc;
      padding: 4px;
      cursor: pointer;
      font-size: 0.8em;
      transition: background 0.2s ease;
    }

    .class-btn:hover:not(:disabled) {
      background: #edf2f7;
    }

    .btn-remove {
      color: #e53e3e;
    }

    .relation-remove-btn {
      width: 100%;
      height: 100%;
      border: none;
      background: rgba(229, 62, 62, 0.1);
      color: #e53e3e;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
    }

    .relation-remove-btn:hover:not(:disabled) {
      background: rgba(229, 62, 62, 0.2);
    }

    .relation-menu {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .relation-type-btn, .relation-cancel-btn {
      padding: 6px 8px;
      border: none;
      background: white;
      cursor: pointer;
      text-align: left;
      font-size: 0.85em;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .relation-type-btn:hover:not(:disabled) {
      background: #f7fafc;
    }

    .relation-cancel-btn {
      background: #fed7d7;
      color: #c53030;
      margin-top: 2px;
    }

    /* Estados deshabilitados */
    button:disabled { 
      opacity: 0.5; 
      cursor: not-allowed; 
    }
    
    .uml-class input:disabled, 
    .uml-class select:disabled { 
      background-color: #f0f0f0; 
      cursor: not-allowed; 
    }`
  ]
})
export class BoardPageGuestComponent implements OnInit, AfterViewInit, OnDestroy {
  d: BoardDiagram = { classes: [], relations: [] };
  types: Attribute['type'][] = ['String', 'Integer', 'Real', 'Boolean', 'Date'];
  // Relaciones en español para la interfaz, pero manteniendo los valores internos en inglés
  relationTypes: RelationEdge['type'][] = ['asociación','herencia','composición','agregación','dependencia'];
  drag: ClassNode | null = null;
  offX = 0; offY = 0;
  svg!: SVGSVGElement;
  relO: ClassNode | null = null;
  type: RelationEdge['type'] | null = null;
  menu = false;
  gap = 70;
  classWidth = 200;
  multOffset = 10;
  multFactor = 0.15;
  zoomLevel = 1;
  private history: BoardDiagram[] = [];
private redoStack: BoardDiagram[] = [];
private maxHistorySize = 50;
  geminiResponse: string = '';
  private autoSaveTimeout: any = null;
private isUndoRedoInProgress = false;
  // Nuevas propiedades para el control de habilitación
  boardEnabled: boolean = true;
  isAdmin: boolean = true; // Cambiar según tu lógica de autenticación

  constructor(private storage: BoardStorageService, private generator: BoardGeneratorService) {}

  async ngOnInit() {
    // 1. Cargar diagrama inicial
    const diagram = await this.storage.loadDiagram();
    if (diagram) {
      this.d = diagram;
    }

    // 2. Cargar configuración de habilitación
    this.boardEnabled = await this.storage.loadBoardConfig();

    // 3. Iniciar polling para diagrama y configuración
    this.storage.startPolling((diagram: BoardDiagram) => {
      console.log('Diagram updated via polling:', diagram);
      this.d = { ...diagram };
    }, 2000);

    this.storage.startConfigPolling((enabled: boolean) => {
      console.log('Board config updated via polling:', enabled);
      this.boardEnabled = enabled;
    }, 2000);
  }

  ngOnDestroy() {
    this.storage.stopPolling();
    this.storage.stopConfigPolling();
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }

  ngAfterViewInit() { 
    this.svg = document.querySelector('svg')!; 
  }

  // Nuevo método para alternar el estado
  async toggleBoard() {
    if (!this.isAdmin) return;
    
    const newState = !this.boardEnabled;
    await this.storage.saveBoardConfig(newState);
    this.boardEnabled = newState;
  }

  // Propiedades computadas para los botones de deshacer/rehacer
get canUndo(): boolean {
  return this.history.length > 0 && this.boardEnabled;
}

get canRedo(): boolean {
  return this.redoStack.length > 0 && this.boardEnabled;
}

  // Modificar onDiagramChange para verificar el estado
  onDiagramChange() {
   if (!this.boardEnabled || this.isUndoRedoInProgress) return;
    
    this.saveHistory();
    
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.sync();
    }, 500);
  }

  // Método para obtener el nombre de visualización de los tipos de relación
  getRelationTypeDisplayName(type: RelationEdge['type']): string {
    const displayNames: { [key in RelationEdge['type']]: string } = {
      'asociación': 'Asociación',
      'herencia': 'Herencia',
      'composición': 'Composición',
      'agregación': 'Agregación',
      'dependencia': 'Dependencia'
    };
    return displayNames[type] || type;
  }

  // Métodos auxiliares para cálculos de posición
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
  
  angle(r: RelationEdge, i:number) { 
    const dx = this.x2(r,i)-this.x1(r,i), dy = this.y2(r,i)-this.y1(r,i); 
    return Math.atan2(dy,dx)*(180/Math.PI); 
  }

  private mult(r: RelationEdge, i:number, which:'origin'|'target') {
    const x1v = this.x1(r,i), y1v = this.y1(r,i), x2v = this.x2(r,i), y2v = this.y2(r,i);
    const dx = x2v-x1v, dy = y2v-y1v, len = Math.sqrt(dx*dx + dy*dy);
    const factor = which==='origin'?this.multFactor:1-this.multFactor;
    const offset = this.multOffset;
    return { x: x1v + dx*factor + (dy/len)*offset, y: y1v + dy*factor - (dx/len)*offset };
  }

  multX = (r: RelationEdge,i:number,which:'origin'|'target') => this.mult(r,i,which).x;
  multY = (r: RelationEdge,i:number,which:'origin'|'target') => this.mult(r,i,which).y;

  // Métodos de interacción con el diagrama
  n = (id: string) => this.d.classes.find(c => c.id === id)!;

  down(e: MouseEvent, n: ClassNode) {
    if (!this.boardEnabled) return;
    if (['INPUT','BUTTON','SELECT'].includes((e.target as HTMLElement).tagName) || this.relO) return;
    const p=this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    const sp=p.matrixTransform(this.svg.getScreenCTM()!.inverse());
    this.drag = n; this.offX = sp.x - n.x; this.offY = sp.y - n.y;
  }

  move(e: MouseEvent) { 
    if(!this.drag || !this.boardEnabled) return; 
    const p=this.svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; 
    const sp=p.matrixTransform(this.svg.getScreenCTM()!.inverse()); 
    this.drag.x = sp.x - this.offX; 
    this.drag.y = sp.y - this.offY; 
  }

  up = () => { 
    if (this.drag && this.boardEnabled) {
      this.onDiagramChange(); // Sincronizar después de soltar el arrastre
    }
    this.drag = null; 
  }

  addClass() { 
    if (!this.boardEnabled) return;
    this.saveHistory(); 
    const id = this.generateUniqueId(); 
    this.d.classes.push({id, name:'NuevaClase', attributes:[], x:50, y:50}); 
    this.onDiagramChange();
  }

  addAttribute(n: ClassNode) {
    if (!this.boardEnabled) return;
    this.saveHistory();
    n.attributes.push({ name: '', type: 'String', scope: '+' });
    this.onDiagramChange();
  }

  remClass(n: ClassNode) { 
    if (!this.boardEnabled) return;
    this.saveHistory();
    this.d.relations = this.d.relations.filter(r=>r.originId!==n.id && r.targetId!==n.id); 
    this.d.classes = this.d.classes.filter(c=>c.id!==n.id); 
    this.onDiagramChange();
  }

  startRel = (n: ClassNode) => { 
    if (!this.boardEnabled) return;
    this.relO=n; this.menu=true; this.type=null; 
  };
  
  setType = (t: RelationEdge['type']) => { 
    if (!this.boardEnabled) return;
    this.type=t; 
    this.menu=false; 
  };
  
  cancel = () => { this.relO=this.type=null; this.menu=false; };
  
  click(n: ClassNode, e: MouseEvent) {
    if (!this.boardEnabled) return;
    if (['INPUT','BUTTON','SELECT'].includes((e.target as HTMLElement).tagName)) return;
    if(this.relO && this.type && this.relO.id!==n.id) {
      this.saveHistory();
      const id = 'r'+(Math.max(0,...this.d.relations.map(r=>+r.id.slice(1)))+1);
      const multiplicities = this.type==='herencia' ? { originMultiplicity:'1', targetMultiplicity:'1' } : { originMultiplicity:'1', targetMultiplicity:'*' };
      this.d.relations.push({id, type:this.type, originId:this.relO.id, targetId:n.id, ...multiplicities});
      this.relO = this.type = null;
      this.onDiagramChange();
    }
  }

  remRel = (r: RelationEdge) => { 
    if (!this.boardEnabled) return;
    this.saveHistory();
    this.d.relations = this.d.relations.filter(x=>x.id!==r.id); 
    this.onDiagramChange();
  }

  // Métodos de utilidad
  sync = () => { 
    if (this.boardEnabled) this.storage.saveDiagram(this.d); 
  }

  gen() { 
    if (this.boardEnabled) this.generator.generateSpringBootProject(this.d); 
  }
  
saveHistory() { 
  // Guardar copia profunda del estado actual
  const stateCopy = JSON.parse(JSON.stringify(this.d));
  this.history.push(stateCopy);
  
  // Limitar el tamaño del historial
  if (this.history.length > this.maxHistorySize) {
    this.history.shift();
  }
  
  // Limpiar redo stack cuando se hace una nueva acción
  this.redoStack = [];
}
  
 undo() { 
  if (!this.boardEnabled || this.history.length === 0) return; 
  
  // Guardar estado actual en redo stack
  this.redoStack.push(JSON.parse(JSON.stringify(this.d)));
  
  // Restaurar último estado del historial
  const lastState = this.history.pop()!;
  this.d = lastState;
  
  // No llamar onDiagramChange() aquí para evitar bucle infinito
  this.sync(); // Solo sincronizar con el servidor
}

redo() { 
  if (!this.boardEnabled || this.redoStack.length === 0) return; 
  
  // Guardar estado actual en historial
  this.history.push(JSON.parse(JSON.stringify(this.d)));
  
  // Restaurar estado del redo stack
  const nextState = this.redoStack.pop()!;
  this.d = nextState;
  
  // No llamar onDiagramChange() aquí para evitar bucle infinito
  this.sync(); // Solo sincronizar con el servidor
}

  autoAlign() { 
    if (!this.boardEnabled) return;
    this.saveHistory(); 
    this.d.classes.forEach((c,i) => { 
      c.x = 50 + (i%5)*(this.classWidth + 50); 
      c.y = 50 + Math.floor(i/5)*150; 
    }); 
    this.onDiagramChange();
  }

  duplicateClass(n: ClassNode) { 
    if (!this.boardEnabled) return;
    this.saveHistory(); 
    const id = this.generateUniqueId(); 
    this.d.classes.push({ ...JSON.parse(JSON.stringify(n)), id, x: n.x + 20, y: n.y + 20 }); 
    this.onDiagramChange();
  }

zoom(factor: number) { 
  if (!this.boardEnabled) return;
  this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel * factor));
  // El viewBox se actualiza automáticamente mediante el binding en el template
}

  checkDiagram() {
    if (!this.boardEnabled) return;
    
    const payload = { contents: [{ parts: [{ text: `Analiza el siguiente diagrama UML (clases, atributos, relaciones) y responde en español: 1. Solo indica posibles mejoras de diseño lógico. 2. Sé conciso, máximo 10 líneas. 3. No describas el JSON ni el formato de datos, solo el diseño. 4. Prioriza errores de tipos de atributos, nombres y relaciones semánticas. Diagrama: ${JSON.stringify(this.d, null, 2)}` }] }] };
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': 'APIKEYSECRETA' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      const firstCandidate = data?.candidates?.[0];
      this.geminiResponse = firstCandidate?.content?.parts?.map((p:{text:string})=>p.text).join('\n') || 'No se recibió texto de la respuesta.';
    })
    .catch(err => this.geminiResponse = 'Error: '+err);
  }

  private generateUniqueId(): string {
    const existingIds = new Set(this.d.classes.map(c => c.id));
    let newId = '';
    let counter = 1;
    
    do {
      newId = counter.toString();
      counter++;
    } while (existingIds.has(newId));
    
    return newId;
  }

  onFileSelect(event: any) { 
    if (!this.boardEnabled) return;
    const file: File = event.target.files[0]; 
    if(file) this.importXMI(file); 
  }

  importXMI(file: File) {
    if (!this.boardEnabled) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(reader.result as string, 'application/xml');

      if (xml.querySelector('parsererror')) {
        alert('Error: El archivo XML no es válido');
        return;
      }

      this.d = this.xmiToBoardDiagram(xml);
      this.saveHistory();
      this.d = { ...this.d };
      this.onDiagramChange();
    };

    reader.onerror = () => {
      alert('Error leyendo el archivo');
    };

    reader.readAsText(file);
  }

  private xmiToBoardDiagram(xml: Document): BoardDiagram {
    const diagram: BoardDiagram = { classes: [], relations: [] };
    const validTypes: Attribute['type'][] = ['String', 'Integer', 'Real', 'Boolean', 'Date'];

    try {
      const classMap = new Map<string, ClassNode>();
      const usedIds = new Set<string>();

      const generateUniqueId = (baseId: string): string => {
        let uniqueId = baseId;
        let counter = 1;
        while (usedIds.has(uniqueId)) {
          uniqueId = `${baseId}_${counter}`;
          counter++;
        }
        usedIds.add(uniqueId);
        return uniqueId;
      };

      const classElements = Array.from(xml.querySelectorAll('packagedElement')).filter(el =>
        ['uml:Class', 'Class'].includes(el.getAttribute('type') || el.getAttribute('xmi:type') || '')
      );

      classElements.forEach((cls, i) => {
        const xmiId = cls.getAttribute('xmi:id') || cls.getAttribute('id');
        const id = generateUniqueId(xmiId || `c${i + 1}`);
        const name = cls.getAttribute('name') || `Clase${i + 1}`;
        
        const attributes: Attribute[] = Array.from(cls.querySelectorAll('ownedAttribute')).map(attr => {
          const typeAttr = attr.getAttribute('type');
          let type: Attribute['type'] = 'String';
          if (typeAttr) {
            const simpleType = typeAttr.split('.').pop() || 'String';
            type = validTypes.includes(simpleType as Attribute['type']) ? simpleType as Attribute['type'] : 'String';
          }
          return { name: attr.getAttribute('name') || 'atributo', type, scope: '+' };
        });

        const classNode: ClassNode = {
          id,
          name,
          attributes,
          x: 100 + (i % 3) * 250,
          y: 100 + Math.floor(i / 3) * 200,
        };

        diagram.classes.push(classNode);
        classMap.set(id, classNode);
      });

      let relationCount = 0;

      const allRelations = Array.from(xml.querySelectorAll('packagedElement')).filter(el => {
        const type = el.getAttribute('xmi:type');
        return type && type !== 'uml:Class' && ['uml:Generalization', 'uml:Association', 'uml:Dependency'].includes(type);
      });

      allRelations
        .filter(rel => rel.getAttribute('xmi:type') === 'uml:Generalization')
        .forEach(gen => {
          const parentId = gen.getAttribute('parent');
          const childId = gen.getAttribute('child');
          if (parentId && childId && classMap.has(parentId) && classMap.has(childId)) {
            diagram.relations.push({
              id: `r${relationCount++}`,
              type: 'herencia',
              originId: childId,
              targetId: parentId,
              originMultiplicity: '1',
              targetMultiplicity: '1',
            });
          }
        });

      allRelations
        .filter(rel => rel.getAttribute('xmi:type') === 'uml:Association')
        .forEach(assoc => {
          const ends = Array.from(assoc.querySelectorAll('ownedEnd'));
          if (ends.length >= 2) {
            const end1 = ends[0];
            const end2 = ends[1];
            const type1 = end1.getAttribute('type');
            const type2 = end2.getAttribute('type');
            const aggregation1 = end1.getAttribute('aggregation');
            const aggregation2 = end2.getAttribute('aggregation');

            if (type1 && type2 && classMap.has(type1) && classMap.has(type2)) {
              let type: RelationEdge['type'] = 'asociación';
              let originId = type1;
              let targetId = type2;

              if (aggregation1 === 'composite' || aggregation2 === 'composite') {
                type = 'composición';
                if (aggregation1 === 'composite') [originId, targetId] = [type2, type1];
              } else if (aggregation1 === 'shared' || aggregation2 === 'shared') {
                type = 'agregación';
                if (aggregation1 === 'shared') [originId, targetId] = [type2, type1];
              }

              diagram.relations.push({
                id: `r${relationCount++}`,
                type,
                originId,
                targetId,
                originMultiplicity: end1.getAttribute('multiplicity') || '1',
                targetMultiplicity: end2.getAttribute('multiplicity') || '*',
              });
            }
          }
        });

      allRelations
        .filter(rel => rel.getAttribute('xmi:type') === 'uml:Dependency')
        .forEach(dep => {
          const clientId = dep.getAttribute('client');
          const supplierId = dep.getAttribute('supplier');
          if (clientId && supplierId && classMap.has(clientId) && classMap.has(supplierId)) {
            diagram.relations.push({
              id: `r${relationCount++}`,
              type: 'dependencia',
              originId: clientId,
              targetId: supplierId,
              originMultiplicity: '1',
              targetMultiplicity: '1',
            });
          }
        });

      return diagram;
    } catch (error) {
      return { classes: [], relations: [] };
    }
  }
}