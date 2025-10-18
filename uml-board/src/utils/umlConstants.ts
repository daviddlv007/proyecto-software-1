export type AttributeType = {
    name: string;
    scope: 'public' | 'protected' | 'private';
    datatype: 'Integer' | 'Float' | 'Boolean' | 'Date' | 'String';
};

export type NodeType = {
    id: string;
    label: string;
    x: number;
    y: number;
    height?: number;
    attributes?: AttributeType[];
    asociativa?: boolean; // true si es tabla intermedia
    relaciona?: [string, string]; // IDs de las clases relacionadas
};

export type EdgeType = {
    id: string;
    source: string;
    target: string;
    tipo: string;
    multiplicidadOrigen: "1" | "*";
    multiplicidadDestino: "1" | "*";
};

export const ATTR_HEIGHT = 28;
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 120;

export const initialNodes: NodeType[] = [
    { id: '1', label: 'Class1', x: 100, y: 100, attributes: [] },
    { id: '2', label: 'Class2', x: 300, y: 200, attributes: [] },
    { id: '3', label: 'Class3', x: 500, y: 300, attributes: [] }
];

export const initialEdges: EdgeType[] = [
    { id: 'e1', source: '1', target: '2', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e2', source: '2', target: '3', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e3', source: '1', target: '3', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e4', source: '1', target: '2', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e5', source: '1', target: '2', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e6', source: '2', target: '1', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e7', source: '2', target: '1', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" },
    { id: 'e8', source: '1', target: '2', tipo: 'asociacion', multiplicidadOrigen: "1", multiplicidadDestino: "*" }
];

// Solo tipos y constantes, sin lógica de UI ni lógica de negocio