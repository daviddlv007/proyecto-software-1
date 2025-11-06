/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import './StylesUmlPrompt.css';
import { processUMLPrompt } from '../services/aiPromptService';
import type { DiagramAction } from '../services/aiPromptService';
import type { NodeType, EdgeType } from '../utils/umlConstants';

interface UmlPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNode: (node: NodeType) => Promise<void>;
  onCreateEdge: (edge: EdgeType) => Promise<void>;
  onUpdateNode: (nodeId: string, updates: Partial<NodeType>) => Promise<void>;
  onUpdateEdge: (edgeId: string, updates: Partial<EdgeType>) => Promise<void>;
  existingNodes: NodeType[];
  existingEdges: EdgeType[];
}

const UmlPrompt: React.FC<UmlPromptProps> = ({
  isOpen,
  onClose,
  onCreateNode,
  onCreateEdge,
  onUpdateNode,
  existingNodes,
  existingEdges,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const executeActions = async (actions: DiagramAction[]) => {
    for (const action of actions) {
      try {
        if (action.type === 'create' && action.target === 'class') {
          const newNode: NodeType = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: action.data.label || 'NuevaClase',
            x: 200 + Math.random() * 300,
            y: 200 + Math.random() * 300,
            attributes: action.data.attributes || [],
            asociativa: false,
          };
          await onCreateNode(newNode);
          console.log('✅ Clase creada:', newNode.label);
        } 
        else if (action.type === 'create' && action.target === 'attribute') {
          const targetNode = existingNodes.find(n => n.id === action.data.classId);
          if (targetNode) {
            const newAttributes = [
              ...(targetNode.attributes || []),
              {
                name: action.data.name,
                datatype: action.data.datatype as 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date',
                scope: action.data.scope as 'public' | 'private' | 'protected',
              },
            ];
            await onUpdateNode(targetNode.id, { attributes: newAttributes });
            console.log('✅ Atributo agregado a:', targetNode.label);
          }
        } 
        else if (action.type === 'create' && action.target === 'edge') {
          const sourceNode = existingNodes.find(n => n.label === action.data.sourceLabel);
          const targetNode = existingNodes.find(n => n.label === action.data.targetLabel);
          
          if (sourceNode && targetNode) {
            const newEdge: EdgeType = {
              id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              source: sourceNode.id,
              target: targetNode.id,
              tipo: action.data.tipo || 'asociacion',
              multiplicidadOrigen: action.data.multiplicidadOrigen || '1',
              multiplicidadDestino: action.data.multiplicidadDestino || '*',
            };
            await onCreateEdge(newEdge);
            console.log(`✅ Relación creada: ${sourceNode.label} → ${targetNode.label}`);
          } else {
            console.warn(`⚠️ No se encontraron las clases: ${action.data.sourceLabel} o ${action.data.targetLabel}`);
          }
        } 
        else if (action.type === 'update' && action.target === 'class') {
          await onUpdateNode(action.data.id, action.data);
          console.log('✅ Clase actualizada:', action.data.id);
        } 
        else if (action.type === 'delete' && action.target === 'class') {
          console.log('🗑️ Eliminar clase:', action.data.id);
        }
      } catch (err) {
        console.error('❌ Error ejecutando acción:', action, err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🚀 Procesando prompt:', prompt);
      const actions = await processUMLPrompt(prompt, existingNodes, existingEdges);
      console.log('📋 Acciones a ejecutar:', actions);
      
      await executeActions(actions);
      
      setPrompt('');
      onClose();
      console.log('✅ Proceso completado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="uml-prompt-overlay" onClick={onClose}>
      <div className="uml-prompt-modal" onClick={e => e.stopPropagation()}>
        <div className="uml-prompt-content">
          <div className="uml-prompt-header">
            <h2 className="uml-prompt-title">✨ Asistente UML Inteligente</h2>
            <button className="uml-prompt-close" onClick={onClose}>
              ×
            </button>
          </div>

          <p className="uml-prompt-description">
            Describe en tus propias palabras qué quieres hacer con tu diagrama. La IA interpretará
            tu solicitud mijooo
          </p>

          <textarea
            className="uml-prompt-textarea"
            placeholder="Podes poner algo asi: 'Crea una clase Producto con atributos nombre tipo String, precio tipo Float y stock tipo Integer. Luego haz que Producto tenga una relación de composición con Categoría.'"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />

          {error && (
            <div style={{ 
              color: '#e53e3e', 
              marginTop: '15px', 
              padding: '12px', 
              background: '#fff5f5', 
              borderRadius: '8px',
              fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {isProcessing && (
            <div className="uml-prompt-loading">
              <div className="uml-prompt-spinner" />
              <span>Procesando tu solicitud con IA...</span>
            </div>
          )}

          <div className="uml-prompt-footer">
            <button
              className="uml-prompt-button uml-prompt-button-cancel"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              className="uml-prompt-button uml-prompt-button-submit"
              onClick={handleSubmit}
              disabled={isProcessing || !prompt.trim()}
            >
              {isProcessing ? 'Procesando...' : '✨ Procesar (Ctrl+Enter)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UmlPrompt;
