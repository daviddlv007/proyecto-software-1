import React, { useState } from 'react';
import type { NodeType } from '../utils/umlConstants';
import { NODE_WIDTH, NODE_HEIGHT, ATTR_HEIGHT } from '../utils/umlConstants';

type Props = {
    node: NodeType;
    onMouseDown: (e: React.MouseEvent, node: NodeType) => void;
    addAttribute: (id: string) => void;
    onStartRelation: (id: string, type: string) => void;
    relationMode: boolean;
    isRelationOrigin: boolean;
    onSelectAsTarget: (id: string) => void;
};

const nodeStyle = (n: NodeType, relationMode: boolean): React.CSSProperties => ({
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
    cursor: relationMode ? 'pointer' : 'move',
    background: relationMode ? '#e6f7ff' : '#fff',
    boxSizing: 'border-box'
});

const attrStyle = {
    textAlign: 'left' as const,
    paddingLeft: 8,
    height: ATTR_HEIGHT,
    lineHeight: `${ATTR_HEIGHT}px`,
    borderBottom: '1px solid #eee'
};

const RELATION_TYPES = [
    { label: 'Asociación', value: 'asociacion' },
    { label: 'Agregación', value: 'agregacion' },
    { label: 'Composición', value: 'composicion' },
    { label: 'Herencia', value: 'herencia' }
];

const Node: React.FC<Props> = ({
    node,
    onMouseDown,
    addAttribute,
    onStartRelation,
    relationMode,
    isRelationOrigin,
    onSelectAsTarget
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            style={nodeStyle(node, relationMode)}
            onMouseDown={e => {
                if (!relationMode) {
                    onMouseDown(e, node);
                }
            }}
            onClick={() => {
                if (relationMode && !isRelationOrigin) onSelectAsTarget(node.id);
            }}
        >
            <div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>
                {node.label}
            </div>
            <div style={{ width: '100%' }}>
                {(node.attributes ?? []).map((attr, idx) => (
                    <div key={idx} style={attrStyle}>{attr}</div>
                ))}
            </div>
            <button
                onClick={e => {
                    e.stopPropagation();
                    addAttribute(node.id);
                }}
                title="Agregar atributo"
                style={{ position: 'absolute', bottom: 8, right: 40 }}
            >+</button>
            <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                <button
                    onClick={e => {
                        e.stopPropagation();
                        setShowMenu(v => !v);
                    }}
                    title="Crear relación"
                >⇄</button>
                {showMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 32,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ccc',
                            zIndex: 20,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {RELATION_TYPES.map(rt => (
                            <div
                                key={rt.value}
                                style={{
                                    padding: '6px 16px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    borderBottom: '1px solid #eee',
                                    background: 'inherit'
                                }}
                                onClick={() => {
                                    setShowMenu(false);
                                    onStartRelation(node.id, rt.value);
                                }}
                            >
                                {rt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Node;