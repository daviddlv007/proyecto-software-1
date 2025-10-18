import React, { useState } from 'react';
import type { NodeType, EdgeType } from '../utils/umlConstants';
import { NODE_WIDTH, NODE_HEIGHT } from '../utils/umlConstants';

function getRectEdgePoint(x1: number, y1: number, x2: number, y2: number, width: number, height: number) {
    const w = width / 2, h = height / 2, dx = x2 - x1, dy = y2 - y1;
    let t = 1;
    if (dx === 0) t = h / Math.abs(dy);
    else if (dy === 0) t = w / Math.abs(dx);
    else t = Math.min(w / Math.abs(dx), h / Math.abs(dy));
    return { x: x1 + dx * t, y: y1 + dy * t };
}

function getParallelEdgeInfo(edges: EdgeType[]) {
    // Agrupa ignorando la dirección (A<->B)
    const edgeGroups: Record<string, EdgeType[]> = {};
    edges.forEach(edge => {
        const key = [edge.source, edge.target].sort().join('->');
        if (!edgeGroups[key]) edgeGroups[key] = [];
        edgeGroups[key].push(edge);
    });
    const edgeIndexMap: Record<string, { index: number; total: number; reverse: boolean }> = {};
    Object.keys(edgeGroups).forEach(key => {
        const group = edgeGroups[key];
        group.forEach((edge, idx) => {
            // reverse: si la dirección es opuesta a la clave ordenada
            const [a, b] = key.split('->');
            const reverse = edge.source !== a;
            edgeIndexMap[edge.id] = { index: idx, total: group.length, reverse };
        });
    });
    return edgeIndexMap;
}

type Props = {
    nodes: NodeType[];
    edges: EdgeType[];
    onDeleteEdge?: (edgeId: string) => void;
};

const EdgeLayer: React.FC<Props> = ({ nodes, edges, onDeleteEdge }) => {
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

    const edgeIndexMap = getParallelEdgeInfo(edges);

    return (
        <svg
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none' // <-- Esto está bien, pero los hijos <g> deben tener 'all'
            }}
        >
            {edges
                .filter(edge => {
                    // Si el destino es una tabla asociativa, y esa tabla tiene relaciona, omite la línea normal
                    const tgtNode = nodes.find(n => n.id === edge.target);
                    if (tgtNode?.asociativa && tgtNode.relaciona) {
                        // Si el edge conecta a una tabla asociativa y su origen está en relaciona, omite
                        return !tgtNode.relaciona.includes(edge.source);
                    }
                    // Si el origen es una tabla asociativa, y esa tabla tiene relaciona, omite la línea normal
                    const srcNode = nodes.find(n => n.id === edge.source);
                    if (srcNode?.asociativa && srcNode.relaciona) {
                        return !srcNode.relaciona.includes(edge.target);
                    }
                    return true;
                })
                .map(edge => {
                    const src = nodes.find(n => n.id === edge.source);
                    const tgt = nodes.find(n => n.id === edge.target);
                    if (!src || !tgt) return null;

                    const srcHeight = src.height ?? NODE_HEIGHT;
                    const tgtHeight = tgt.height ?? NODE_HEIGHT;
                    const info = edgeIndexMap[edge.id] || { index: 0, total: 1, reverse: false };
                    let offset = 0;
                    if (info.total > 1) {
                        const separation = 18;
                        offset = (info.index - (info.total - 1) / 2) * separation;
                        if (info.reverse) offset = -offset; // Invierte para la dirección opuesta
                    }

                    const x1c = src.x + NODE_WIDTH / 2, y1c = src.y + srcHeight / 2;
                    const x2c = tgt.x + NODE_WIDTH / 2, y2c = tgt.y + tgtHeight / 2;
                    const dx = x2c - x1c, dy = y2c - y1c, len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / len, ny = dx / len;
                    const x1c_off = x1c + nx * offset, y1c_off = y1c + ny * offset;
                    const x2c_off = x2c + nx * offset, y2c_off = y2c + ny * offset;
                    const { x: x1, y: y1 } = getRectEdgePoint(x1c_off, y1c_off, x2c_off, y2c_off, NODE_WIDTH, srcHeight);
                    const { x: x2, y: y2 } = getRectEdgePoint(x2c_off, y2c_off, x1c_off, y1c_off, NODE_WIDTH, tgtHeight);

                    // Dibuja según el tipo UML
                    switch (edge.tipo) {
                        case 'agregacion':
                            return (
                                <g
                                    key={edge.id}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    style={{ pointerEvents: 'all' }}
                                >
                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                                    <polygon
                                        points={getDiamondPoints(x1, y1, x2, y2, 14)}
                                        fill="#fff"
                                        stroke="#000"
                                        strokeWidth={2}
                                    />
                                    {hoveredEdge === edge.id && onDeleteEdge && (
                                        <foreignObject
                                            x={((x1 + x2) / 2) - 12}
                                            y={((y1 + y2) / 2) - 12}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'all' }}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onDeleteEdge(edge.id);
                                                }}
                                                title="Eliminar relación"
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: 'none',
                                                    background: '#fff',
                                                    color: '#c00',
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    opacity: 0.85,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >✕</button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        case 'composicion':
                            return (
                                <g
                                    key={edge.id}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    style={{ pointerEvents: 'all' }}
                                >
                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                                    <polygon
                                        points={getDiamondPoints(x1, y1, x2, y2, 14)}
                                        fill="#000"
                                        stroke="#000"
                                        strokeWidth={2}
                                    />
                                    {hoveredEdge === edge.id && onDeleteEdge && (
                                        <foreignObject
                                            x={((x1 + x2) / 2) - 12}
                                            y={((y1 + y2) / 2) - 12}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'all' }}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onDeleteEdge(edge.id);
                                                }}
                                                title="Eliminar relación"
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: 'none',
                                                    background: '#fff',
                                                    color: '#c00',
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    opacity: 0.85,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >✕</button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        case 'dependencia':
                            return (
                                <g
                                    key={edge.id}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    style={{ pointerEvents: 'all' }}
                                >
                                    <line
                                        x1={x1} y1={y1}
                                        x2={getArrowBase(x1, y1, x2, y2, 18).x}
                                        y2={getArrowBase(x1, y1, x2, y2, 18).y}
                                        stroke="#000"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                    />
                                    <polyline
                                        points={getOpenArrowPoints(x2, y2, x1, y1, 18)}
                                        fill="none"
                                        stroke="#000"
                                        strokeWidth={2}
                                    />
                                    {hoveredEdge === edge.id && onDeleteEdge && (
                                        <foreignObject
                                            x={((x1 + x2) / 2) - 12}
                                            y={((y1 + y2) / 2) - 12}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'all' }}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onDeleteEdge(edge.id);
                                                }}
                                                title="Eliminar relación"
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: 'none',
                                                    background: '#fff',
                                                    color: '#c00',
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    opacity: 0.85,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >✕</button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        case 'herencia':
                            return (
                                <g
                                    key={edge.id}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    style={{ pointerEvents: 'all' }}
                                >
                                    <line
                                        x1={x1} y1={y1}
                                        x2={getArrowBase(x1, y1, x2, y2, 18).x}
                                        y2={getArrowBase(x1, y1, x2, y2, 18).y}
                                        stroke="#000"
                                        strokeWidth={2}
                                    />
                                    {/* Triángulo blanco en el destino */}
                                    <polygon
                                        points={getTrianglePoints(x2, y2, x1, y1, 18)}
                                        fill="#fff"
                                        stroke="#000"
                                        strokeWidth={2}
                                    />
                                    {hoveredEdge === edge.id && onDeleteEdge && (
                                        <foreignObject
                                            x={((x1 + x2) / 2) - 12}
                                            y={((y1 + y2) / 2) - 12}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'all' }}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onDeleteEdge(edge.id);
                                                }}
                                                title="Eliminar relación"
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: 'none',
                                                    background: '#fff',
                                                    color: '#c00',
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    opacity: 0.85,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >✕</button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        default: // asociacion
                            return (
                                <g
                                    key={edge.id}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    style={{ pointerEvents: 'all' }} // <-- Permite eventos en el grupo
                                >
                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                                    {/* Multiplicidad en el origen */}
                                    <text
                                        x={x1 + (x2 - x1) * 0.08}
                                        y={y1 + (y2 - y1) * 0.08 - 6}
                                        fontSize={14}
                                        fill="#333"
                                        textAnchor="middle"
                                    >
                                        {edge.multiplicidadOrigen}
                                    </text>
                                    {/* Multiplicidad en el destino */}
                                    <text
                                        x={x2 - (x2 - x1) * 0.08}
                                        y={y2 - (y2 - y1) * 0.08 - 6}
                                        fontSize={14}
                                        fill="#333"
                                        textAnchor="middle"
                                    >
                                        {edge.multiplicidadDestino}
                                    </text>
                                    {/* Botón eliminar solo en hover */}
                                    {hoveredEdge === edge.id && onDeleteEdge && (
                                        <foreignObject
                                            x={((x1 + x2) / 2) - 12}
                                            y={((y1 + y2) / 2) - 12}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'all' }}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onDeleteEdge(edge.id);
                                                }}
                                                title="Eliminar relación"
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: 'none',
                                                    background: '#fff',
                                                    color: '#c00',
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    opacity: 0.85,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0
                                                }}
                                            >✕</button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                    }
                })}

            {/* Renderizado especial para tablas asociativas */}
            {nodes.filter(n => n.asociativa && n.relaciona).map(tabla => {
                const [idA, idB] = tabla.relaciona!;
                const nodeA = nodes.find(n => n.id === idA);
                const nodeB = nodes.find(n => n.id === idB);
                if (!nodeA || !nodeB) return null;

                // Posiciones centrales
                const ax = nodeA.x + NODE_WIDTH / 2;
                const ay = nodeA.y + (nodeA.height ?? NODE_HEIGHT) / 2;
                const bx = nodeB.x + NODE_WIDTH / 2;
                const by = nodeB.y + (nodeB.height ?? NODE_HEIGHT) / 2;
                const tx = tabla.x + NODE_WIDTH / 2;
                const ty = tabla.y + (tabla.height ?? NODE_HEIGHT) / 2;

                // Offset perpendicular para evitar solapamiento
                const dx = bx - ax, dy = by - ay;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const offset = 24; // píxeles de desplazamiento
                const ox = -dy / len * offset;
                const oy = dx / len * offset;

                // Puntos desplazados
                const ax_off = ax + ox, ay_off = ay + oy;
                const bx_off = bx + ox, by_off = by + oy;
                const mx = (ax_off + bx_off) / 2;
                const my = (ay_off + by_off) / 2;

                // Multiplicidad
                const edgeA = edges.find(e => (e.source === tabla.id && e.target === idA) || (e.target === tabla.id && e.source === idA));
                const edgeB = edges.find(e => (e.source === tabla.id && e.target === idB) || (e.target === tabla.id && e.source === idB));

                return (
                    <g key={`assoc-${tabla.id}-${idA}-${idB}`}>
                        {/* Línea principal desplazada entre las dos clases */}
                        <line x1={ax_off} y1={ay_off} x2={bx_off} y2={by_off} stroke="#888" />
                        {/* Multiplicidad en los extremos */}
                        <text
                            x={ax_off + (bx_off - ax_off) * 0.18}
                            y={ay_off + (by_off - ay_off) * 0.18 - 6}
                            fontSize={14}
                            fill="#333"
                            textAnchor="middle"
                        >
                            {edgeA?.multiplicidadDestino ?? '*'}
                        </text>
                        <text
                            x={bx_off - (bx_off - ax_off) * 0.18}
                            y={by_off - (by_off - ay_off) * 0.18 - 6}
                            fontSize={14}
                            fill="#333"
                            textAnchor="middle"
                        >
                            {edgeB?.multiplicidadDestino ?? '*'}
                        </text>
                        {/* Línea interlineada desde el punto medio a la tabla intermedia */}
                        <line x1={mx} y1={my} x2={tx} y2={ty} stroke="#000" strokeDasharray="4 2" />
                    </g>
                );
            })}
        </svg>
    );
};

export default EdgeLayer;

// Helpers para polígonos UML:
function getDiamondPoints(x1: number, y1: number, x2: number, y2: number, size: number) {
    // Dibuja un rombo perfecto en el origen (x1, y1)
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    // Centro del rombo a una distancia 'size' desde el origen
    const p0 = [x1, y1];
    const p1 = [x1 + nx * (size / 2) - ny * (size / 3), y1 + ny * (size / 2) + nx * (size / 3)];
    const p2 = [x1 + nx * size, y1 + ny * size];
    const p3 = [x1 + nx * (size / 2) + ny * (size / 3), y1 + ny * (size / 2) - nx * (size / 3)];
    return [p0, p1, p2, p3].map(p => p.join(',')).join(' ');
}

function getTrianglePoints(x2: number, y2: number, x1: number, y1: number, size: number) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    const px = -ny, py = nx;
    // Base del triángulo
    const bx = x2 - nx * size, by = y2 - ny * size;
    return [
        [x2, y2],
        [bx + px * size * 0.5, by + py * size * 0.5],
        [bx - px * size * 0.5, by - py * size * 0.5]
    ].map(p => p.join(',')).join(' ');
}

function getArrowBase(x1: number, y1: number, x2: number, y2: number, size: number) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    return { x: x2 - nx * size, y: y2 - ny * size };
}

function getOpenArrowPoints(x2: number, y2: number, x1: number, y1: number, size: number) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len, ny = dy / len;
    const px = -ny, py = nx;
    // Dos líneas formando la flecha abierta
    const bx = x2 - nx * size, by = y2 - ny * size;
    return [
        [bx + px * size * 0.4, by + py * size * 0.4, x2, y2, bx - px * size * 0.4, by - py * size * 0.4]
    ].map(p => `${p[0]},${p[1]} ${p[2]},${p[3]} ${p[4]},${p[5]}`).join(' ');
}