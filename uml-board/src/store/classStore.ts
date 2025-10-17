import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  type Connection, 
  type Edge, 
  type Node, 
  type NodeChange, 
  type EdgeChange 
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

type AttrType = 'Integer'|'Float'|'String'|'Boolean'|'Date';
type Scope = 'public'|'private'|'protected';
type Multiplicity = '1'|'1..*';

interface ClassData { label: string; attributes: { id: string; name: string; type: AttrType; scope: Scope }[] }
interface EdgeData { sourceMultiplicity: Multiplicity; targetMultiplicity: Multiplicity }

interface Store {
  nodes: Node<ClassData>[];
  edges: Edge<EdgeData>[];
  addClass: () => void;
  updateNode: (id: string, data: Partial<ClassData>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: Connection) => void;
  updateEdge: (edgeId: string, d: Partial<EdgeData>) => void;
}

export const useClassStore = create<Store>((set, get) => ({
  nodes: [],
  edges: [],
  addClass: () => set(s => ({
    nodes: [
      ...s.nodes,
      {
        id: uuidv4(),
        type: 'classNode',
        data: { label: `Class${s.nodes.length + 1}`, attributes: [] },
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
      }
    ]
  })),
  updateNode: (id: string, data: Partial<ClassData>) => set(s => ({
    nodes: s.nodes.map((n: Node<ClassData>) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
  })),
  onNodesChange: (changes: NodeChange[]) => set(s => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  onEdgesChange: (changes: EdgeChange[]) => set(s => ({
    edges: applyEdgeChanges(changes, s.edges).map(e => ({
      ...e,
      data: {
        sourceMultiplicity: ((e.data as EdgeData)?.sourceMultiplicity ?? '1') as Multiplicity,
        targetMultiplicity: ((e.data as EdgeData)?.targetMultiplicity ?? '1') as Multiplicity
      }
    })) as Edge<EdgeData>[]
  })),
  onConnect: (params: Connection) => {
    const edge: Edge<EdgeData> = {
      ...params,
      id: `${params.source}-${params.target}-${Date.now()}`,
      type: 'step',
      updatable: true,
      data: { sourceMultiplicity: '1', targetMultiplicity: '1' },
      source: params.source ?? '', // asegura string
      target: params.target ?? '', // asegura string
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle
    };
    set(s => ({ edges: addEdge(edge, s.edges) }));
  },
  updateEdge: (edgeId: string, d: Partial<EdgeData>) => set(s => ({
    edges: s.edges.map((e: Edge<EdgeData>) => 
      e.id === edgeId
        ? {
            ...e,
            data: {
              sourceMultiplicity: (d.sourceMultiplicity ?? (e.data ? e.data.sourceMultiplicity : '1') ?? '1') as Multiplicity,
              targetMultiplicity: (d.targetMultiplicity ?? (e.data ? e.data.targetMultiplicity : '1') ?? '1') as Multiplicity
            }
          }
        : e
    )
  }))
}));