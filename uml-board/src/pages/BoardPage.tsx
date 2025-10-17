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
                    attributes: [...(n.attributes ?? []), `Atributo${(n.attributes?.length ?? 0) + 1}`],
                    height: (n.height ?? NODE_HEIGHT) + ATTR_HEIGHT
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
                    tipo: relationMode.type // <-- Cambiado de 'type' a 'tipo'
                }
            ]);
            setRelationMode(null);
        }
    };

    return (
        <div
            style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <EdgeLayer nodes={nodes} edges={edges} />
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
                />
            ))}
        </div>
    );
};

export default BoardPage;