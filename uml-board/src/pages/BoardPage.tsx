import React, { useState, useEffect, useRef } from 'react';
import type { NodeType, EdgeType, BoardType } from '../utils/umlConstants';
import { initialBoards, NODE_HEIGHT, NODE_WIDTH, ATTR_HEIGHT } from '../utils/umlConstants';
import Node from '../components/Node';
import EdgeLayer from '../components/EdgeLayer';
import { generarBackend } from '../utils/backendGenerator';
import { generarFrontend } from '../utils/frontendGenerator';
import { importDiagramFromImage } from '../services/diagramImportService';

//me falta agregar unnos import aqui
//--------------------------------------------
//import UmlPrompt from './UmlPrompt';
//import './stylesUmlPrompt.css';

const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    marginRight: "8px",
    minWidth: "120px"
};

const toolbarStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3000,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "12px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px"
};

const sectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginRight: "16px",
    flexWrap: "wrap"
};

const titleStyle: React.CSSProperties = {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    margin: 0,
    marginRight: "24px",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)"
};

const statusStyle: React.CSSProperties = {
    color: "#fff",
    fontSize: 12,
    background: "rgba(255,255,255,0.2)",
    padding: "4px 8px",
    borderRadius: 12,
    marginRight: "16px"
};

const BoardPage = () => {

    //new import de klaus
    //const [isPromptOpen, setIsPromptOpen] = useState(false);

    // Estado simple de múltiples pizarras usando la estructura de constantes
    const [boards, setBoards] = useState<BoardType[]>(initialBoards);
    const [currentBoardId, setCurrentBoardId] = useState<string>('1');
    const [showBoardMenu, setShowBoardMenu] = useState<boolean>(false);
    
    console.log('🔧 Component render - showBoardMenu:', showBoardMenu);
    
    // Estado actual basado en la pizarra activa
    const currentBoard = boards.find(b => b.id === currentBoardId) || boards[0];
    const [nodes, setNodes] = useState<NodeType[]>(currentBoard.nodes);
    const [edges, setEdges] = useState<EdgeType[]>(currentBoard.edges);
    const [zoom, setZoom] = useState<number>(currentBoard.zoom);
    const [panOffset, setPanOffset] = useState<{ x: number; y: number }>(currentBoard.panOffset);
    
    // Estados de interacción
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
    const [relationMode, setRelationMode] = useState<{ sourceId: string | null; type: string | null } | null>(null);
    const [manyToManyMode, setManyToManyMode] = useState<{ sourceId: string | null } | null>(null);
    const [currentMode, setCurrentMode] = useState<'normal' | 'relation' | 'manyToMany'>('normal');
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

    // Estados para importación de imágenes
    const [importing, setImporting] = useState<boolean>(false);
    const [importProgress, setImportProgress] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar estado local cuando cambie la pizarra activa
    useEffect(() => {
        const currentBoard = boards.find(b => b.id === currentBoardId) || boards[0];
        setNodes(currentBoard.nodes);
        setEdges(currentBoard.edges);
        setZoom(currentBoard.zoom);
        setPanOffset(currentBoard.panOffset);
        console.log(`Synced to board: ${currentBoard.name} (${currentBoard.nodes.length} nodes)`);
    }, [currentBoardId, boards]);

    // Auto-guardar cambios en la pizarra actual (REMOVIDO para evitar bucle infinito)
    // Este useEffect causaba bucles infinitos al actualizar boards constantemente
    // TODO: Implementar auto-guardado de manera más eficiente

    // Funciones para manejo de pizarras múltiples

    const switchToBoard = (boardId: string) => {
        console.log('🔄 switchToBoard called with:', boardId);
        console.log('Current boardId:', currentBoardId);
        
        if (boardId === currentBoardId) {
            console.log('⚠️ Already on this board, returning early');
            return; // Ya estamos en esa pizarra
        }
        
        console.log('✅ Switching to board:', boardId);
        
        // Guardar el estado actual en la pizarra antes de cambiar
        setBoards(prevBoards => 
            prevBoards.map(board => 
                board.id === currentBoardId 
                    ? { ...board, nodes, edges, zoom, panOffset }
                    : board
            )
        );
        console.log('💾 Saved current board state');
        
        // Cambiar la pizarra actual (useEffect se encargará del resto)
        setCurrentBoardId(boardId);
        setShowBoardMenu(false);
        console.log('🎯 Board switch completed');
    };

    const createNewBoard = () => {
        console.log('🆕 createNewBoard called!');
        console.log('Current boards count:', boards.length);
        
        // Crear nueva pizarra
        const newBoardId = `board-${Date.now()}`;
        const newBoard: BoardType = {
            id: newBoardId,
            name: `Nueva Pizarra ${boards.length + 1}`,
            nodes: [],
            edges: [],
            zoom: 1,
            panOffset: { x: 0, y: 0 }
        };
        console.log('🔨 Created new board:', newBoard);
        
        // Agregar la nueva pizarra y cambiar a ella
        setBoards(prevBoards => {
            // Primero guardar el estado actual
            const updatedBoards = prevBoards.map(board => 
                board.id === currentBoardId 
                    ? { ...board, nodes, edges, zoom, panOffset }
                    : board
            );
            // Luego agregar la nueva pizarra
            return [...updatedBoards, newBoard];
        });
        console.log('📋 Added new board to list');
        setCurrentBoardId(newBoardId); // useEffect sincronizará el estado
        setShowBoardMenu(false);
        
        console.log(`✨ Created board "${newBoard.name}" with ID: ${newBoardId}`);
    };

    const deleteBoardConfirm = (boardId: string) => {
        if (boards.length <= 1) {
            alert('No puedes eliminar la última pizarra');
            return;
        }
        
        if (window.confirm('¿Estás seguro de que quieres eliminar esta pizarra?')) {
            setBoards(prev => prev.filter(b => b.id !== boardId));
            
            if (currentBoardId === boardId) {
                // Si estamos eliminando la pizarra actual, cambiar a la primera disponible
                const remainingBoards = boards.filter(b => b.id !== boardId);
                if (remainingBoards.length > 0) {
                    switchToBoard(remainingBoards[0].id);
                }
            }
        }
        setShowBoardMenu(false);
    };

    const renameBoardPrompt = (boardId: string) => {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            const newName = window.prompt('Nuevo nombre para la pizarra:', board.name);
            if (newName && newName.trim()) {
                setBoards(prev => prev.map(b => 
                    b.id === boardId ? { ...b, name: newName.trim() } : b
                ));
            }
        }
        setShowBoardMenu(false);
    };

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

    // Movimiento de nodos y panning
    const handleMouseDown = (e: React.MouseEvent, node: NodeType) => {
        e.stopPropagation();
        setDraggingId(node.id);
        setDragOffset({ x: (e.clientX / zoom) - panOffset.x - node.x, y: (e.clientY / zoom) - panOffset.y - node.y });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Solo iniciar panning si no estamos arrastrando un nodo
        if (!draggingId && e.button === 0) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        setDragOffset(null);
        setIsPanning(false);
        setPanStart(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId && dragOffset) {
            // Mover nodo
            const newX = (e.clientX / zoom) - panOffset.x - dragOffset.x;
            const newY = (e.clientY / zoom) - panOffset.y - dragOffset.y;
            setNodes(nodes.map(n =>
                n.id === draggingId ? { ...n, x: newX, y: newY } : n
            ));
        } else if (isPanning && panStart) {
            // Hacer panning del canvas
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
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

    //------------------------------------------------------------------------
    /*const handleCreateNodeFromPrompt = (newNode: NodeType) => {
  setNodes((prevNodes) => [...prevNodes, newNode]);
};

const handleCreateEdgeFromPrompt = (newEdge: EdgeType) => {
  setEdges((prevEdges) => [...prevEdges, newEdge]);
};

const handleUpdateNodeFromPrompt = (nodeId: string, updates: Partial<NodeType>) => {
  setNodes((prevNodes) => 
    prevNodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    )
  );
};

const handleUpdateEdgeFromPrompt = (edgeId: string, updates: Partial<EdgeType>) => {
  setEdges((prevEdges) => 
    prevEdges.map(edge => 
      edge.id === edgeId ? { ...edge, ...updates } : edge
    )
  );
};*/
//------------------------------------------------------------------------------
    // Relaciones
    const handleStartRelation = (id: string, type: string) => {
        setRelationMode({ sourceId: id, type });
        setCurrentMode('relation');
    };
    const handleSelectAsTarget = (id: string) => {
        if (relationMode && relationMode.sourceId && relationMode.sourceId !== id) {
            // Parsear el tipo de relación y multiplicidades
            let tipo: string;
            let multiplicidadOrigen: "1" | "*" = "1";
            let multiplicidadDestino: "1" | "*" = "*";
            
            if (relationMode.type && relationMode.type.includes(':')) {
                // Formato: tipo:multiplicidadOrigen:multiplicidadDestino
                const parts = relationMode.type.split(':');
                tipo = parts[0];
                multiplicidadOrigen = parts[1] as "1" | "*";
                multiplicidadDestino = parts[2] as "1" | "*";
            } else {
                // Formato tradicional (sin multiplicidad especificada)
                tipo = relationMode.type || "asociacion";
            }
            
            // Validar tipo
            const validTypes = ["asociacion", "agregacion", "composicion", "herencia", "dependencia"];
            if (!validTypes.includes(tipo)) {
                tipo = "asociacion";
            }
            
            setEdges([
                ...edges,
                {
                    id: `e${edges.length + 1}`,
                    source: relationMode.sourceId,
                    target: id,
                    tipo: tipo as 'asociacion' | 'agregacion' | 'composicion' | 'herencia' | 'dependencia',
                    multiplicidadOrigen,
                    multiplicidadDestino
                }
            ]);
            setRelationMode(null);
            setCurrentMode('normal');
        }
    };

    // Muchos a muchos
    const handleStartManyToMany = () => {
        setManyToManyMode({ sourceId: null });
        setCurrentMode('manyToMany');
    };
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
            setCurrentMode('normal');
        }
    };

    const cancelCurrentMode = () => {
        setRelationMode(null);
        setManyToManyMode(null);
        setCurrentMode('normal');
    };

    // Funciones de zoom
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 2));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Función para centrar todas las entidades
    const handleFitAll = () => {
        if (nodes.length === 0) return;
        
        const margin = 50;
        const minX = Math.min(...nodes.map(n => n.x)) - margin;
        const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + margin;
        const minY = Math.min(...nodes.map(n => n.y)) - margin;
        const maxY = Math.max(...nodes.map(n => n.y + (n.height || NODE_HEIGHT))) + margin;
        
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight - 70; // Restar altura del toolbar
        
        const scaleX = viewWidth / contentWidth;
        const scaleY = viewHeight / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 1.5); // Máximo 150%
        
        setZoom(newZoom);
        setPanOffset({
            x: (viewWidth - contentWidth * newZoom) / 2 - minX * newZoom,
            y: (viewHeight - contentHeight * newZoom) / 2 - minY * newZoom
        });
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
        generarBackend(nodes, edges, currentBoard.name);
    };

    const handleGenerarFrontend = () => {
        generarFrontend(nodes, edges, currentBoard.name);
    };

    // Funciones para importación de imágenes
    const handleImportImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        
        // Validaciones
        if (!file.type.startsWith('image/')) {
            alert('❌ Solo se permiten archivos de imagen');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('❌ El archivo debe ser menor a 5MB');
            return;
        }

        setImporting(true);
        console.log(`📤 Iniciando importación de: ${file.name}`);

        try {
            const result = await importDiagramFromImage(
                file,
                (stage) => setImportProgress(stage)
            );

            if (result.success && result.nodes && result.edges) {
                // Los nodos e edges ya vienen con IDs únicos del servicio
                // Solo necesitamos agregar prefijo para evitar conflictos con nodos existentes
                const importTimestamp = Date.now();
                
                const importedNodes = result.nodes.map(node => ({
                    ...node,
                    id: `imported_${importTimestamp}_${node.id}`,
                    // Actualizar relaciona para entidades asociativas
                    relaciona: node.relaciona ? node.relaciona.map(relId => 
                        `imported_${importTimestamp}_${relId}`
                    ) : undefined
                }));

                const importedEdges = result.edges.map(edge => ({
                    ...edge,
                    id: `imported_${importTimestamp}_${edge.id}`,
                    source: `imported_${importTimestamp}_${edge.source}`,
                    target: `imported_${importTimestamp}_${edge.target}`
                }));

                setNodes(prev => [...prev, ...importedNodes]);
                setEdges(prev => [...prev, ...importedEdges]);

                console.log(`✅ Importación exitosa: ${importedNodes.length} clases, ${importedEdges.length} relaciones`);
                console.log(`📊 Nodos importados:`, importedNodes.map(n => n.id));
                console.log(`🔗 Edges importados:`, importedEdges.map(e => `${e.source} → ${e.target}`));
                alert(`✅ Diagrama importado exitosamente!\n${importedNodes.length} clases y ${importedEdges.length} relaciones agregadas`);

                // Ajustar vista para mostrar todo el contenido
                setTimeout(() => handleFitAll(), 100);

            } else {
                console.error('❌ Error en importación:', result.error);
                alert(`❌ Error importando diagrama: ${result.error}`);
            }

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setImporting(false);
            setImportProgress('');
            // Limpiar input file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div
            style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#f5f5f5', paddingTop: '70px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={(e) => {
                // Solo cerrar el menú si el clic no fue en la barra de herramientas
                const toolbar = e.currentTarget.querySelector('[data-toolbar="true"]');
                if (toolbar && !toolbar.contains(e.target as Node)) {
                    handleCanvasMouseDown(e);
                    // Cerrar menú de pizarras al hacer clic en el canvas
                    if (showBoardMenu) {
                        console.log('🔸 Closing menu due to canvas click');
                        setShowBoardMenu(false);
                    }
                }
            }}
        >
            {/* Barra de herramientas superior */}
            <div style={toolbarStyle} data-toolbar="true">
                <h1 style={titleStyle}>🎨 UML Designer</h1>
                
                {/* Selector de pizarras */}
                <div style={{ position: 'relative', marginRight: '16px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evitar que el clic llegue al contenedor
                            console.log('🔵 Board menu button clicked!');
                            console.log('Current showBoardMenu:', showBoardMenu);
                            const newShowBoardMenu = !showBoardMenu;
                            console.log('Will set showBoardMenu to:', newShowBoardMenu);
                            setShowBoardMenu(newShowBoardMenu);
                            
                            // Verificar después de un momento que se aplicó
                            setTimeout(() => {
                                console.log('After state update - showBoardMenu should be:', newShowBoardMenu);
                            }, 100);
                        }}
                        style={{
                            ...buttonStyle,
                            background: "#4a90e2",
                            color: "#fff",
                            minWidth: "200px",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                        title="Seleccionar pizarra"
                    >
                        <span>📋 {currentBoard.name} ({boards.length} pizarras)</span>
                        <span style={{ marginLeft: "8px" }}>▼</span>
                    </button>
                    
                    {showBoardMenu && (
                        <div
                            style={{
                                position: 'fixed',
                                top: '60px',
                                left: boards.length > 1 ? '300px' : '250px',
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 4000,
                                minWidth: '250px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}
                            onMouseEnter={() => console.log('🎯 Menu is being rendered! showBoardMenu=', showBoardMenu)}
                            onClick={(e) => e.stopPropagation()} // Evitar que clics en el menú lo cierren
                        >
                            <div
                                style={{
                                    padding: '8px 16px',
                                    borderBottom: '1px solid #eee',
                                    background: '#f8f9fa',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#333'
                                }}
                            >
                                Pizarras disponibles
                            </div>
                            
                            {boards.map(board => (
                                <div
                                    key={board.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        background: board.id === currentBoardId ? '#e3f2fd' : 'transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div
                                        onClick={() => {
                                            console.log('🔴 Board item clicked!', board.name, board.id);
                                            console.log('Current board ID:', currentBoardId);
                                            switchToBoard(board.id);
                                        }}
                                        style={{
                                            flex: 1,
                                            fontWeight: board.id === currentBoardId ? 'bold' : 'normal',
                                            color: board.id === currentBoardId ? '#1976d2' : '#333'
                                        }}
                                    >
                                        📋 {board.name}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            renameBoardPrompt(board.id);
                                        }}
                                        title="Renombrar pizarra"
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            padding: '4px 8px',
                                            marginRight: '4px',
                                            borderRadius: '4px',
                                            color: '#666'
                                        }}
                                    >
                                        ✏️
                                    </button>
                                    {boards.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteBoardConfirm(board.id);
                                            }}
                                            title="Eliminar pizarra"
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                color: '#c00'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <div
                                onClick={() => {
                                    console.log('🟢 Create New Board clicked from menu!');
                                    createNewBoard();
                                }}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    background: '#f8f9fa',
                                    borderTop: '1px solid #eee',
                                    color: '#1976d2',
                                    fontWeight: 'bold',
                                    borderRadius: '0 0 8px 8px'
                                }}
                            >
                                ➕ Crear Nueva Pizarra
                            </div>
                        </div>
                    )}
                </div>
                
                <div style={statusStyle}>
                    {currentMode === 'manyToMany' ? '🔗 Modo Relación M:N' : 
                     currentMode === 'relation' ? '➡️ Modo Relación' : 
                     `📋 Pizarra ${currentBoardId} de ${boards.length} (${nodes.length} clases)`}
                </div>

                {/* Grupo único de herramientas */}
                <div style={sectionStyle}>
                    <button
                        onClick={() => {
                            console.log('🟡 Add Node button clicked!');
                            addNode();
                        }}
                        style={{ ...buttonStyle, background: "#1976d2", color: "#fff" }}
                        title="Crear una nueva clase"
                    >
                        ➕ Nueva Clase
                    </button>
                    <button
                        onClick={handleImportImage}
                        style={{ 
                            ...buttonStyle, 
                            background: importing ? "#ccc" : "#8e24aa", 
                            color: "#fff",
                            opacity: importing ? 0.7 : 1
                        }}
                        disabled={importing}
                        title="Importar diagrama desde imagen"
                    >
                        {importing ? "⏳ Importando..." : "📸 Importar Imagen"}
                    </button>
                    <button
                        onClick={handleStartManyToMany}
                        style={{ ...buttonStyle, background: "#388e3c", color: "#fff" }}
                        disabled={currentMode !== 'normal'}
                        title="Crear relación muchos a muchos"
                    >
                        🔗 Relación M:N
                    </button>
                    <button
                        onClick={handleGenerarBackend}
                        style={{ ...buttonStyle, background: "#ff9800", color: "#fff" }}
                        title="Generar código del backend"
                    >
                        ⚙️ Backend
                    </button>
                    <button
                        onClick={handleGenerarFrontend}
                        style={{ ...buttonStyle, background: "#2196f3", color: "#fff" }}
                        title="Generar código del frontend"
                    >
                        📱 Frontend
                    </button>
                    
                    {/* Separador para zoom */}
                    <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.3)", margin: "0 8px" }}></div>
                    
                    {/* Controles de zoom */}
                    <button
                        onClick={handleZoomOut}
                        style={{ ...buttonStyle, background: "#9c27b0", color: "#fff", minWidth: "40px", padding: "10px" }}
                        title="Alejar"
                    >
                        🔍-
                    </button>
                    <span style={{ color: "#fff", fontSize: 12, minWidth: "45px", textAlign: "center" }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        style={{ ...buttonStyle, background: "#9c27b0", color: "#fff", minWidth: "40px", padding: "10px" }}
                        title="Acercar"
                    >
                        🔍+
                    </button>
                    <button
                        onClick={handleResetZoom}
                        style={{ ...buttonStyle, background: "#9c27b0", color: "#fff", minWidth: "50px", padding: "10px" }}
                        title="Restablecer zoom"
                    >
                        🎯
                    </button>
                    <button
                        onClick={handleFitAll}
                        style={{ ...buttonStyle, background: "#9c27b0", color: "#fff", minWidth: "50px", padding: "10px" }}
                        title="Ajustar todo en pantalla"
                    >
                        📐
                    </button> 
//-------------------------------                                     
                    <button 
  className="toolbar-button"
  title="Asistente UML"
  //onClick={() => setIsPromptOpen(true)}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
</button>
//---------------------------------
                </div>

                {/* Espacio flexible */}
                <div style={{ flex: 1 }}></div>

                {/* Instrucciones y cancelar (solo cuando aplica) */}
                {currentMode !== 'normal' && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {currentMode === 'manyToMany' && (
                            <span style={{ color: "#fff", fontSize: 12 }}>
                                {!manyToManyMode?.sourceId ? 
                                    '1️⃣ Selecciona la primera clase' : 
                                    '2️⃣ Selecciona la segunda clase'}
                            </span>
                        )}
                        <button
                            onClick={cancelCurrentMode}
                            style={{ ...buttonStyle, background: "#f44336", color: "#fff", marginRight: "0" }}
                            title="Cancelar operación actual"
                        >
                            ❌ Cancelar
                        </button>
                    </div>
                )}
            </div>

            {/* Área de trabajo con zoom */}
            <div style={{ 
                transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'top left',
                width: '100%',
                height: '100%'
            }}>
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

            {/* Input file oculto para importar imágenes */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Modal para progreso de importación */}
            {importing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 5000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '30px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Importando Diagrama</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
                            {importProgress || 'Procesando...'}
                        </p>
                        <div style={{
                            width: '100%',
                            height: '4px',
                            background: '#f0f0f0',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, #8e24aa, #1976d2)',
                                animation: 'loading 2s infinite'
                            }}></div>
                        </div>
                    </div>
                </div>
            )}
            
         <UmlPromptPage 
 // isOpen={isPromptOpen} 
  //onClose={() => setIsPromptOpen(false)}
  //onCreateNode={handleCreateNodeFromPrompt}
 // onCreateEdge={handleCreateEdgeFromPrompt}
  //onUpdateNode={handleUpdateNodeFromPrompt}
  //onUpdateEdge={handleUpdateEdgeFromPrompt}
 // existingNodes={nodes}
  //existingEdges={edges}
/>
        </div>

    );
};

export default BoardPage;