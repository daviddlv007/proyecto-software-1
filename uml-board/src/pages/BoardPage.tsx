import React, { useState } from 'react';
import type { NodeType, EdgeType } from '../utils/umlConstants';
import { initialNodes, initialEdges, NODE_WIDTH, NODE_HEIGHT, ATTR_HEIGHT } from '../utils/umlConstants';
import Node from '../components/Node';
import EdgeLayer from '../components/EdgeLayer';

const BoardPage = () => {
    const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
    const [edges, setEdges] = useState<EdgeType[]>(initialEdges); // Cambia a setEdges para poder agregar
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
    const [relationMode, setRelationMode] = useState<{ sourceId: string | null; type: string | null } | null>(null);
    const [manyToManyMode, setManyToManyMode] = useState<{ sourceId: string | null } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, node: NodeType) => {
        setDraggingId(node.id);
        setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        setDragOffset(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId && dragOffset) {
            setNodes(nodes.map(n =>
                n.id === draggingId ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } : n
            ));
        }
    };

    const addAttribute = (id: string) => {
        setNodes(nodes.map(n =>
            n.id === id
                ? {
                    ...n,
                    attributes: [
                        ...(n.attributes ?? []),
                        { name: `Atributo${(n.attributes?.length ?? 0) + 1}`, scope: 'private', datatype: 'String' }
                    ],
                    height: (n.height ?? NODE_HEIGHT) + ATTR_HEIGHT
                }
                : n
        ));
    };

    const deleteAttribute = (nodeId: string, attrIdx: number) => {
        setNodes(nodes.map(n =>
            n.id === nodeId
                ? {
                    ...n,
                    attributes: n.attributes?.filter((_, idx) => idx !== attrIdx),
                    height: (n.height ?? NODE_HEIGHT) - ATTR_HEIGHT
                }
                : n
        ));
    };

    const handleStartRelation = (id: string, type: string) => {
        setRelationMode({ sourceId: id, type });
    };

    const handleSelectAsTarget = (id: string) => {
        if (relationMode && relationMode.sourceId && relationMode.sourceId !== id) {
            setEdges([
                ...edges,
                {
                    id: `e${edges.length + 1}`,
                    source: relationMode.sourceId,
                    target: id,
                    tipo: relationMode.type ?? "asociacion",
                    multiplicidadOrigen: "1",
                    multiplicidadDestino: "*"
                }
            ]);
            setRelationMode(null);
        }
    };

    // Handler para crear relación muchos a muchos
    const handleStartManyToMany = () => {
        setManyToManyMode({ sourceId: null });
    };

    // Cuando seleccionas la primera clase
    const handleSelectManyToManySource = (id: string) => {
        setManyToManyMode({ sourceId: id });
    };

    // Cuando seleccionas la segunda clase
    const handleSelectManyToManyTarget = (id: string) => {
        if (manyToManyMode?.sourceId && manyToManyMode.sourceId !== id) {
            const newTableId = `T${nodes.length + 1}`;
            const newTableLabel = `Intermedia_${manyToManyMode.sourceId}_${id}`;
            setNodes([
                ...nodes,
                {
                    id: newTableId,
                    label: newTableLabel,
                    x: 200,
                    y: 200,
                    attributes: [],
                    asociativa: true,
                    relaciona: [manyToManyMode.sourceId, id]
                }
            ]);
            setEdges([
                ...edges,
                {
                    id: `e${edges.length + 1}`,
                    source: manyToManyMode.sourceId,
                    target: newTableId,
                    tipo: "asociacion",
                    multiplicidadOrigen: "1",
                    multiplicidadDestino: "*"
                },
                {
                    id: `e${edges.length + 2}`,
                    source: id,
                    target: newTableId,
                    tipo: "asociacion",
                    multiplicidadOrigen: "1",
                    multiplicidadDestino: "*"
                }
            ]);
            setManyToManyMode(null);
        }
    };

    const editNodeLabel = (id: string, newLabel: string) => {
        setNodes(nodes.map(n =>
            n.id === id ? { ...n, label: newLabel } : n
        ));
    };

    const editAttribute = (
        nodeId: string,
        attrIdx: number,
        field: 'name' | 'scope' | 'datatype',
        newValue: string
    ) => {
        setNodes(nodes.map(n =>
            n.id === nodeId
                ? {
                    ...n,
                    attributes: n.attributes?.map((attr, idx) =>
                        idx === attrIdx ? { ...attr, [field]: newValue } : attr
                    )
                }
                : n
        ));
    };

    const deleteEdge = (edgeId: string) => {
        if (edgeId.startsWith('assoc-')) {
            // Extrae el id de la tabla asociativa
            const parts = edgeId.split('-');
            const tablaId = parts[1];
            // Elimina el nodo asociativo
            setNodes(nodes.filter(n => n.id !== tablaId));
            // Elimina todos los edges que conectan a la tabla asociativa
            setEdges(edges.filter(e => e.source !== tablaId && e.target !== tablaId));
        } else {
            setEdges(edges.filter(e => e.id !== edgeId));
        }
    };

    const addNode = () => {
        setNodes([
            ...nodes,
            {
                id: `${nodes.length + 1}`,
                label: `Clase${nodes.length + 1}`,
                x: 100 + nodes.length * 40,
                y: 100 + nodes.length * 40,
                attributes: [],
            }
        ]);
    };

    return (
        <div
            style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <button
                onClick={addNode}
                style={{
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 3000,
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
            >+ Clase</button>
            <button
                onClick={handleStartManyToMany}
                style={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 3000,
                    background: '#388e3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
            >
                Crear relación muchos a muchos
            </button>
            <EdgeLayer nodes={nodes} edges={edges} onDeleteEdge={deleteEdge} />
            {nodes.map(n => (
                <Node
                    key={n.id}
                    node={n}
                    onMouseDown={handleMouseDown}
                    addAttribute={addAttribute}
                    onStartRelation={handleStartRelation}
                    relationMode={!!relationMode}
                    isRelationOrigin={relationMode?.sourceId === n.id}
                    onSelectAsTarget={handleSelectAsTarget}
                    onClick={() => {
                        if (manyToManyMode) {
                            if (!manyToManyMode.sourceId) handleSelectManyToManySource(n.id);
                            else handleSelectManyToManyTarget(n.id);
                        }
                    }}
                    onEditLabel={editNodeLabel}
                    onEditAttribute={editAttribute}
                    onDeleteAttribute={deleteAttribute}
                    onDeleteNode={id => setNodes(nodes.filter(node => node.id !== id))}
                />
            ))}
        </div>
    );
};

export default BoardPage;