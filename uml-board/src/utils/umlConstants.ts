export type NodeType = {
    id: string;
    label: string;
    x: number;
    y: number;
    height?: number;
    attributes?: string[];
};

export type EdgeType = {
    id: string;
    source: string;
    target: string;
    tipo: string; // <-- Agregado
};

export const ATTR_HEIGHT = 28;
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 100;

export const initialNodes: NodeType[] = [
    { id: '1', label: 'Class1', x: 100, y: 100, attributes: [] },
    { id: '2', label: 'Class2', x: 300, y: 200, attributes: [] },
    { id: '3', label: 'Class3', x: 500, y: 300, attributes: [] }
];

export const initialEdges: EdgeType[] = [
    { id: 'e1', source: '1', target: '2', tipo: 'asociacion' },
    { id: 'e2', source: '2', target: '3', tipo: 'asociacion' },
    { id: 'e3', source: '1', target: '3', tipo: 'asociacion' },
    { id: 'e4', source: '1', target: '2', tipo: 'asociacion' },
    { id: 'e5', source: '1', target: '2', tipo: 'asociacion' },
    { id: 'e6', source: '2', target: '1', tipo: 'asociacion' },
    { id: 'e7', source: '2', target: '1', tipo: 'asociacion' },
    { id: 'e8', source: '1', target: '2', tipo: 'asociacion' }
];

// Solo tipos y constantes, sin lógica de UI ni lógica de negocio