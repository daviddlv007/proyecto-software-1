import React, { useState } from 'react';

type NodeType = {
	id: string;
	label: string;
	x: number;
	y: number;
	height?: number;
	attributes?: string[];
};

type EdgeType = {
	id: string;
	source: string;
	target: string;
};

const ATTR_HEIGHT = 28; // altura por atributo

const initialNodes: NodeType[] = [
	{ id: '1', label: 'Class1', x: 100, y: 100, attributes: [] },
	{ id: '2', label: 'Class2', x: 300, y: 200, attributes: [] },
	{ id: '3', label: 'Class3', x: 500, y: 300, attributes: [] }
];

const initialEdges: EdgeType[] = [
	{ id: 'e1', source: '1', target: '2' },
	{ id: 'e2', source: '2', target: '3' },
	{ id: 'e3', source: '1', target: '3' },
	{ id: 'e4', source: '1', target: '2' },
  { id: 'e5', source: '1', target: '2' }, // Nueva relación paralela entre Class1 y Class2
  { id: 'e6', source: '2', target: '1' }, // Relación en sentido contrario entre Class2 y Class1
  { id: 'e7', source: '2', target: '1' }, // Relación en sentido contrario entre Class2 y Class1
  { id: 'e8', source: '1', target: '2' }
];

const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;

function getRectEdgePoint(x1: number, y1: number, x2: number, y2: number, width: number, height: number) {
	const w = width / 2;
	const h = height / 2;
	const dx = x2 - x1;
	const dy = y2 - y1;
	let t = 1;
	if (dx === 0) t = h / Math.abs(dy);
	else if (dy === 0) t = w / Math.abs(dx);
	else t = Math.min(w / Math.abs(dx), h / Math.abs(dy));
	return { x: x1 + dx * t, y: y1 + dy * t };
}

const Debug = () => {
	const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
	const [edges] = useState<EdgeType[]>(initialEdges);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

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

	// Agrupa relaciones paralelas entre los mismos nodos, sin importar dirección
	const getParallelEdgeInfo = () => {
		const edgeGroups: Record<string, EdgeType[]> = {};
		edges.forEach(edge => {
			// Clave única para el par de nodos, sin importar dirección
			const key = [edge.source, edge.target].sort().join('->');
			if (!edgeGroups[key]) edgeGroups[key] = [];
			edgeGroups[key].push(edge);
		});
		const edgeIndexMap: Record<string, { index: number; total: number; reverse: boolean; groupKey: string }> = {};
		Object.keys(edgeGroups).forEach(key => {
			const group = edgeGroups[key];
			group.forEach((edge, idx) => {
				const reverse = edge.source > edge.target; // true si es en sentido "contrario" al orden
				edgeIndexMap[edge.id] = {
					index: idx,
					total: group.length,
					reverse,
					groupKey: key
				};
			});
		});
		return edgeIndexMap;
	};

	const edgeIndexMap = getParallelEdgeInfo();

	const renderEdges = () => (
		<svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
			{edges.map(edge => {
				const src = nodes.find(n => n.id === edge.source);
				const tgt = nodes.find(n => n.id === edge.target);
				if (!src || !tgt) return null;

				const srcHeight = src.height ?? NODE_HEIGHT;
				const tgtHeight = tgt.height ?? NODE_HEIGHT;

				const info = edgeIndexMap[edge.id] || { index: 0, total: 1, reverse: false, groupKey: '' };

				let offset = 0;
				if (info.total > 1) {
					const separation = 18;
					offset = (info.index - (info.total - 1) / 2) * separation;
				}

				// Si hay relaciones en ambas direcciones, separa los offsets en sentidos opuestos
				const reverseKey = `${edge.target}->${edge.source}`;
				const hasReverse = !!edgeIndexMap[Object.keys(edgeIndexMap).find(id =>
					edgeIndexMap[id].groupKey === reverseKey
				) ?? ''];

				// Si hay relaciones en ambas direcciones, invierte el offset para las reversas
				if (hasReverse && info.reverse) {
					offset = -offset;
				}

				const x1c = src.x + NODE_WIDTH / 2;
				const y1c = src.y + srcHeight / 2;
				const x2c = tgt.x + NODE_WIDTH / 2;
				const y2c = tgt.y + tgtHeight / 2;

				const dx = x2c - x1c;
				const dy = y2c - y1c;
				const len = Math.sqrt(dx * dx + dy * dy) || 1;
				const nx = -dy / len;
				const ny = dx / len;

				const x1c_off = x1c + nx * offset;
				const y1c_off = y1c + ny * offset;
				const x2c_off = x2c + nx * offset;
				const y2c_off = y2c + ny * offset;

				const { x: x1, y: y1 } = getRectEdgePoint(x1c_off, y1c_off, x2c_off, y2c_off, NODE_WIDTH, srcHeight);
				const { x: x2, y: y2 } = getRectEdgePoint(x2c_off, y2c_off, x1c_off, y1c_off, NODE_WIDTH, tgtHeight);

				return (
					<g key={edge.id}>
						<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={2} />
						<circle cx={x1} cy={y1} r={5} fill="#000" />
						<circle cx={x2} cy={y2} r={5} fill="#000" />
					</g>
				);
			})}
		</svg>
	);

	return (
		<div
			style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{renderEdges()}
			{nodes.map(n => (
				<div
					key={n.id}
					style={{
						position: 'absolute',
						left: n.x,
						top: n.y,
						width: NODE_WIDTH,
						height: n.height ?? NODE_HEIGHT,
						border: '1px solid #000',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'flex-start',
						cursor: 'move',
						background: '#fff',
						boxSizing: 'border-box'
					}}
					onMouseDown={e => handleMouseDown(e, n)}
				>
					<div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>
						{n.label}
					</div>
					<div style={{ width: '100%' }}>
						{(n.attributes ?? []).map((attr, idx) => (
							<div key={idx} style={{
								textAlign: 'left',
								paddingLeft: 8,
								height: ATTR_HEIGHT,
								lineHeight: `${ATTR_HEIGHT}px`,
								borderBottom: '1px solid #eee'
							}}>
								{attr}
							</div>
						))}
					</div>
					{/* Botón ícono "+" en la esquina inferior derecha */}
					<button
						onClick={e => {
							e.stopPropagation();
							addAttribute(n.id);
						}}
						title="Agregar atributo"
						style={{
							position: 'absolute',
							bottom: 8,
							right: 8
						}}
					>
						+
					</button>
				</div>
			))}
		</div>
	);
};

export default Debug;
