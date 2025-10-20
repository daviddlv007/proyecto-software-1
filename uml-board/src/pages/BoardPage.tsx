import React, { useState } from 'react';
import type { NodeType, EdgeType } from '../utils/umlConstants';
import { initialNodes, initialEdges, NODE_HEIGHT, ATTR_HEIGHT } from '../utils/umlConstants';
import Node from '../components/Node';
import EdgeLayer from '../components/EdgeLayer';
import { generarBackend } from '../utils/backendGenerator';
import { generarFrontend } from '../utils/frontendGenerator';

const buttonStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 3000,
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
};

const BoardPage = () => {
    const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
    const [edges, setEdges] = useState<EdgeType[]>(initialEdges);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
    const [relationMode, setRelationMode] = useState<{ sourceId: string | null; type: string | null } | null>(null);
    const [manyToManyMode, setManyToManyMode] = useState<{ sourceId: string | null } | null>(null);

    // Centraliza borrado de nodo y edges
    const removeNodeAndEdges = (nodeId: string) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    };

    // Centraliza borrado de edge y tabla asociativa
    const deleteEdge = (edgeId: string) => {
        if (edgeId.startsWith('assoc-')) {
            const tablaId = edgeId.split('-')[1];
            removeNodeAndEdges(tablaId);
        } else {
            setEdges(prev => prev.filter(e => e.id !== edgeId));
        }
    };

    // Movimiento de nodos
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

    // Atributos
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

    // Relaciones
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
                    tipo: (
                        relationMode.type === "asociacion" ||
                        relationMode.type === "agregacion" ||
                        relationMode.type === "composicion" ||
                        relationMode.type === "herencia" ||
                        relationMode.type === "dependencia"
                            ? relationMode.type
                            : "asociacion"
                    ),
                    multiplicidadOrigen: "1",
                    multiplicidadDestino: "*"
                }
            ]);
            setRelationMode(null);
        }
    };

    // Muchos a muchos
    const handleStartManyToMany = () => setManyToManyMode({ sourceId: null });
    const handleSelectManyToManySource = (id: string) => setManyToManyMode({ sourceId: id });
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

    // Crear clase
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

    const handleGenerarBackend = () => {
        generarBackend(nodes, edges);
    };

    const handleGenerarFrontend = () => {
        generarFrontend(nodes, edges);
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
                style={{ ...buttonStyle, top: "16px", left: "16px", background: "#1976d2", color: "#fff" }}
            >+ Clase</button>
            <button
                onClick={handleStartManyToMany}
                style={{ ...buttonStyle, top: "16px", right: "16px", background: "#388e3c", color: "#fff" }}
            >
                Crear relación muchos a muchos
            </button>
            <button
                onClick={handleGenerarBackend}
                style={{ ...buttonStyle, top: "60px", left: "16px", background: "#ff9800", color: "#fff" }}
            >
                Generar backend
            </button>
            <button
                onClick={handleGenerarFrontend}
                style={{ ...buttonStyle, top: "104px", left: "16px", background: "#2196f3", color: "#fff" }}
            >
                Generar frontend
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
                    onDeleteNode={removeNodeAndEdges}
                />
            ))}
        </div>
    );
};

export default BoardPage;