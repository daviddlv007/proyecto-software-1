export interface Attribute {
  name: string;
  type: 'String' | 'Integer' | 'Real' | 'Boolean' | 'Date'; // 👈 restringido a los 5
  scope?: '+' | '-' | '#';
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
  type: 'asociación' | 'herencia' | 'composición' | 'agregación' | 'dependencia';
  originId: string;
  targetId: string;
  originMultiplicity?: string;
  targetMultiplicity?: string;
}




// En tu archivo board.model.ts, agrega:
export interface BoardConfig {
  id: string;
  enabled: boolean;
  updated_at: string;
}

export interface BoardDiagram {
  classes: ClassNode[];
  relations: RelationEdge[];
  enabled?: boolean; // Opcional para compatibilidad
}
