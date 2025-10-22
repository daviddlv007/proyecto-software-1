/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import type { NodeType, AttributeType, EdgeType } from '../utils/umlConstants';
import { v4 as uuidv4 } from 'uuid';

interface UmlPromptPageProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNode: (node: NodeType) => void;
  onCreateEdge: (edge: EdgeType) => void;
  onUpdateNode: (nodeId: string, updates: Partial<NodeType>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<EdgeType>) => void;
  existingNodes: NodeType[];
  existingEdges: EdgeType[];
}

const UmlPromptPage: React.FC<UmlPromptPageProps> = ({
  isOpen,
  onClose,
  onCreateNode,
  onCreateEdge,
  onUpdateNode,
  // onUpdateEdge,
  existingNodes,
  // existingEdges
}) => {
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [parsedCommand, setParsedCommand] = useState<any>(null);

  if (!isOpen) return null;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setFeedback('');
  };

  const parsePrompt = (promptText: string): any => {
    // Palabras clave para detectar acciones
    const createClassKeywords = ['crear clase', 'nueva clase', 'agrega clase', 'crea una clase'];
    const editClassKeywords = [
      'editar clase',
      'modificar clase',
      'cambiar clase',
      'actualizar clase',
    ];
    const createRelationKeywords = [
      'crear relación',
      'nueva relación',
      'agregar relación',
      'conectar',
    ];
    // const editRelationKeywords = ['editar relación', 'modificar relación', 'cambiar relación'];

    const promptLower = promptText.toLowerCase();

    // Detectar creación de clase
    if (createClassKeywords.some(keyword => promptLower.includes(keyword))) {
      // Extraer nombre de clase
      const classNameMatch =
        promptText.match(/clase\s+(\w+)/i) ||
        promptText.match(/llamada\s+(\w+)/i) ||
        promptText.match(/nombre[:]?\s+(\w+)/i);

      if (classNameMatch && classNameMatch[1]) {
        const className = classNameMatch[1];

        // Buscar atributos en el texto
        const attributes: AttributeType[] = [];

        // Buscar atributos con formato "atributo: tipo" o "con atributo tipo"
        const attrRegex =
          /(?:con|agregar|crear)\s+(?:atributo|campo)\s+(\w+)\s+(?:tipo|de tipo)?\s+(\w+)/gi;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(promptText)) !== null) {
          const attrName = attrMatch[1];
          const rawType = attrMatch[2].toLowerCase();

          // Mapear tipos mencionados a los tipos permitidos
          let datatype: 'Integer' | 'Float' | 'Boolean' | 'Date' | 'String' = 'String';

          if (['entero', 'int', 'integer', 'numero'].includes(rawType)) {
            datatype = 'Integer';
          } else if (['flotante', 'decimal', 'float', 'double'].includes(rawType)) {
            datatype = 'Float';
          } else if (['booleano', 'bool', 'boolean'].includes(rawType)) {
            datatype = 'Boolean';
          } else if (['fecha', 'date', 'datetime'].includes(rawType)) {
            datatype = 'Date';
          } else if (['texto', 'string', 'cadena'].includes(rawType)) {
            datatype = 'String';
          }

          attributes.push({
            name: attrName,
            scope: 'private', // Por defecto privado
            datatype,
          });
        }

        // Posiciones por defecto (se pueden ajustar)
        const x = 100 + Math.random() * 300;
        const y = 100 + Math.random() * 300;

        return {
          action: 'createClass',
          details: {
            label: className,
            attributes: attributes.length > 0 ? attributes : undefined,
            x,
            y,
          },
        };
      }
    }

    // Detectar creación de relación
    if (createRelationKeywords.some(keyword => promptLower.includes(keyword))) {
      const sourceMatch =
        promptText.match(/entre\s+(\w+)\s+y/i) ||
        promptText.match(/desde\s+(\w+)\s+hasta/i) ||
        promptText.match(/de\s+(\w+)\s+a/i);

      const targetMatch =
        promptText.match(/y\s+(\w+)/i) ||
        promptText.match(/hasta\s+(\w+)/i) ||
        promptText.match(/a\s+(\w+)/i);

      if (sourceMatch && targetMatch) {
        const sourceClass = sourceMatch[1];
        const targetClass = targetMatch[1];

        // Determinar tipo de relación
        let tipo: 'asociacion' | 'agregacion' | 'composicion' | 'herencia' | 'dependencia' =
          'asociacion';

        if (promptLower.includes('agregación') || promptLower.includes('agregacion')) {
          tipo = 'agregacion';
        } else if (promptLower.includes('composición') || promptLower.includes('composicion')) {
          tipo = 'composicion';
        } else if (promptLower.includes('herencia') || promptLower.includes('hereda')) {
          tipo = 'herencia';
        } else if (promptLower.includes('dependencia') || promptLower.includes('depende')) {
          tipo = 'dependencia';
        }

        // Determinar multiplicidad
        let multiplicidadOrigen: '1' | '*' = '1';
        let multiplicidadDestino: '1' | '*' = '1';

        if (
          promptLower.includes('muchos a muchos') ||
          promptLower.includes('n a n') ||
          promptLower.includes('n:n')
        ) {
          multiplicidadOrigen = '*';
          multiplicidadDestino = '*';
        } else if (
          promptLower.includes('uno a muchos') ||
          promptLower.includes('1 a n') ||
          promptLower.includes('1:n')
        ) {
          multiplicidadOrigen = '1';
          multiplicidadDestino = '*';
        } else if (
          promptLower.includes('muchos a uno') ||
          promptLower.includes('n a 1') ||
          promptLower.includes('n:1')
        ) {
          multiplicidadOrigen = '*';
          multiplicidadDestino = '1';
        }

        return {
          action: 'createRelation',
          details: {
            sourceClass,
            targetClass,
            tipo,
            multiplicidadOrigen,
            multiplicidadDestino,
          },
        };
      }
    }

    // Detectar edición de clase existente
    if (editClassKeywords.some(keyword => promptLower.includes(keyword))) {
      const classNameMatch = promptText.match(/clase\s+(\w+)/i);

      if (classNameMatch && classNameMatch[1]) {
        const className = classNameMatch[1];
        const updates: any = { attributes: [] };

        // Buscar cambios en atributos
        const addAttrRegex = /agregar\s+(?:atributo|campo)\s+(\w+)\s+(?:tipo|de tipo)?\s+(\w+)/gi;
        let attrMatch;

        while ((attrMatch = addAttrRegex.exec(promptText)) !== null) {
          const attrName = attrMatch[1];
          const rawType = attrMatch[2].toLowerCase();

          let datatype: 'Integer' | 'Float' | 'Boolean' | 'Date' | 'String' = 'String';

          if (['entero', 'int', 'integer', 'numero'].includes(rawType)) {
            datatype = 'Integer';
          } else if (['flotante', 'decimal', 'float', 'double'].includes(rawType)) {
            datatype = 'Float';
          } else if (['booleano', 'bool', 'boolean'].includes(rawType)) {
            datatype = 'Boolean';
          } else if (['fecha', 'date', 'datetime'].includes(rawType)) {
            datatype = 'Date';
          }

          updates.attributes.push({
            name: attrName,
            scope: 'private',
            datatype,
          });
        }

        // Cambiar el nombre de la clase
        const renameMatch = promptText.match(/renombrar\s+(?:a|como)\s+(\w+)/i);
        if (renameMatch && renameMatch[1]) {
          updates.newName = renameMatch[1];
        }

        return {
          action: 'editClass',
          details: {
            className,
            updates,
          },
        };
      }
    }

    return null;
  };

  const executeCommand = () => {
    setProcessing(true);

    try {
      const parsedResult = parsePrompt(prompt);
      setParsedCommand(parsedResult);

      if (!parsedResult) {
        setFeedback('No pude entender el comando. Por favor, intenta con otra frase.');
        setProcessing(false);
        return;
      }

      switch (parsedResult.action) {
        case 'createClass': {
          const newNode: NodeType = {
            id: uuidv4(),
            label: parsedResult.details.label,
            x: parsedResult.details.x,
            y: parsedResult.details.y,
            attributes: parsedResult.details.attributes || [],
          };

          onCreateNode(newNode);
          setFeedback(`Clase "${newNode.label}" creada exitosamente.`);
          break;
        }

        case 'createRelation': {
          const { sourceClass, targetClass, tipo, multiplicidadOrigen, multiplicidadDestino } =
            parsedResult.details;

          // Encontrar los nodos por nombre
          const sourceNode = existingNodes.find(
            node => node.label.toLowerCase() === sourceClass.toLowerCase()
          );

          const targetNode = existingNodes.find(
            node => node.label.toLowerCase() === targetClass.toLowerCase()
          );

          if (!sourceNode || !targetNode) {
            setFeedback(
              `Error: No pude encontrar una o ambas clases (${sourceClass}, ${targetClass}).`
            );
            break;
          }

          const newEdge: EdgeType = {
            id: uuidv4(),
            source: sourceNode.id,
            target: targetNode.id,
            tipo,
            multiplicidadOrigen,
            multiplicidadDestino,
          };

          onCreateEdge(newEdge);
          setFeedback(`Relación creada exitosamente entre "${sourceClass}" y "${targetClass}".`);
          break;
        }

        case 'editClass': {
          const { className, updates } = parsedResult.details;

          // Encontrar el nodo por nombre
          const nodeToUpdate = existingNodes.find(
            node => node.label.toLowerCase() === className.toLowerCase()
          );

          if (!nodeToUpdate) {
            setFeedback(`Error: No pude encontrar la clase "${className}".`);
            break;
          }

          const nodeUpdates: Partial<NodeType> = {};

          if (updates.newName) {
            nodeUpdates.label = updates.newName;
          }

          if (updates.attributes && updates.attributes.length > 0) {
            const currentAttributes = nodeToUpdate.attributes || [];
            nodeUpdates.attributes = [...currentAttributes, ...updates.attributes];
          }

          onUpdateNode(nodeToUpdate.id, nodeUpdates);
          setFeedback(`Clase "${className}" actualizada exitosamente.`);
          break;
        }

        default:
          setFeedback('No pude procesar el comando. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error procesando el prompt:', error);
      setFeedback('Ocurrió un error al procesar la instrucción.');
    }

    setProcessing(false);
  };

  return (
    <div className='uml-prompt-overlay'>
      <div className='uml-prompt-container'>
        <div className='uml-prompt-header'>
          <h2>Asistente UML</h2>
          <button className='close-button' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='uml-prompt-body'>
          <p className='instructions'>
            Describe lo que quieres crear o editar en el diagrama UML usando lenguaje natural.
            <br />
            <br />
            <strong>Ejemplos:</strong>
            <br />
            "Crea una clase llamada Usuario con atributo nombre tipo String y atributo edad tipo
            Integer"
            <br />
            "Crear relación de herencia entre Auto y Vehículo"
            <br />
            "Editar clase Producto y agregar atributo precio tipo Float"
          </p>

          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder='Escribe tu instrucción aquí...'
            rows={5}
            className='uml-prompt-input'
          />

          {parsedCommand && (
            <div className='parsed-command'>
              <h4>Interpretación:</h4>
              <pre>{JSON.stringify(parsedCommand, null, 2)}</pre>
            </div>
          )}

          {feedback && (
            <div className={`feedback ${feedback.includes('Error') ? 'error' : 'success'}`}>
              {feedback}
            </div>
          )}
        </div>

        <div className='uml-prompt-footer'>
          <button
            className='process-button'
            onClick={executeCommand}
            disabled={processing || !prompt.trim()}
          >
            {processing ? 'Procesando...' : 'Procesar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UmlPromptPage;
