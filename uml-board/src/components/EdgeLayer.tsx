import React from 'react';
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
};

const EdgeLayer: React.FC<Props> = ({ nodes, edges }) => {
    const edgeIndexMap = getParallelEdgeInfo(edges);

    return (
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {edges.map(edge => {
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
                            <g key={edge.id}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                                {/* Rombo blanco en el origen */}
                                <polygon
                                    points={getDiamondPoints(x1, y1, x2, y2, 14)}
                                    fill="#fff"
                                    stroke="#000"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    case 'composicion':
                        return (
                            <g key={edge.id}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                                {/* Rombo negro en el origen */}
                                <polygon
                                    points={getDiamondPoints(x1, y1, x2, y2, 14)}
                                    fill="#000"
                                    stroke="#000"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    case 'herencia':
                        return (
                            <g key={edge.id}>
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
                            </g>
                        );
                    default: // asociacion
                        return (
                            <g key={edge.id}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
                            </g>
                        );
                }
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