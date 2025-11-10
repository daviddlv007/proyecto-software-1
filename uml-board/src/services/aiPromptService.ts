/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodeType, EdgeType } from '../utils/umlConstants';

// URL de la Edge Function de Supabase (SOLO PROXY para OpenAI)
const SUPABASE_FUNCTION_URL = 'https://izsllyjacdhfeoexwpvh.supabase.co/functions/v1/process-uml-prompt';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c2xseWphY2RoZmVvZXh3cHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODk2NjQsImV4cCI6MjA3NjY2NTY2NH0.VYW4TKIdKLj2JcL3lxOCTBT6QwOhMrG_P6WWFSAnRDM';

export interface DiagramAction {
  type: 'create' | 'update' | 'delete';
  target: 'class' | 'attribute' | 'edge';
  data: any;
}

/**
 * Procesa un prompt en lenguaje natural usando OpenAI para generar acciones sobre el diagrama UML
 */
export const processUMLPrompt = async (
  prompt: string,
  currentNodes: NodeType[],
  currentEdges: EdgeType[]
): Promise<DiagramAction[]> => {
  // TODA LA LÓGICA EN EL CLIENTE - Preparar contexto y prompt
  const contextClasses = currentNodes.map(n => ({
    id: n.id,
    nombre: n.label,
    atributos: n.attributes?.map(a => `${a.name}: ${a.datatype} (${a.scope})`) || [],
  }));

  const contextRelations = currentEdges.map(e => ({
    id: e.id,
    desde: currentNodes.find(n => n.id === e.source)?.label || 'desconocido',
    hacia: currentNodes.find(n => n.id === e.target)?.label || 'desconocido',
    tipo: e.tipo,
    multiplicidad: `${e.multiplicidadOrigen}:${e.multiplicidadDestino}`,
  }));

  const systemPrompt = `Eres un asistente experto en diagramas UML de clases. Tu tarea es interpretar instrucciones en lenguaje natural y convertirlas en acciones específicas sobre un diagrama de clases.

CONTEXTO ACTUAL DEL DIAGRAMA:
Clases existentes: ${JSON.stringify(contextClasses, null, 2)}

Relaciones existentes: ${JSON.stringify(contextRelations, null, 2)}

TIPOS DE ACCIONES DISPONIBLES:
1. Crear clase: { type: 'create', target: 'class', data: { label: string, attributes: [{name: string, datatype: 'String'|'Integer'|'Float'|'Boolean'|'Date', scope: 'public'|'private'|'protected'}] } }
2. Agregar atributo a clase existente: { type: 'create', target: 'attribute', data: { classId: string, name: string, datatype: string, scope: string } }
3. Crear relación entre clases: { type: 'create', target: 'edge', data: { sourceLabel: string, targetLabel: string, tipo: 'asociacion'|'herencia'|'composicion'|'agregacion'|'dependencia', multiplicidadOrigen: '1'|'*', multiplicidadDestino: '1'|'*' } }

REGLAS: Responde ÚNICAMENTE con un array JSON válido de acciones, sin explicaciones ni markdown.`;

  console.log('🤖 Procesando prompt con OpenAI...');
  console.log('📝 Prompt del usuario:', prompt);

  try {
    // Llamar a la Edge Function como PROXY PURO
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4o', // Cambiado a gpt-4o para mayor precisión
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(`Error en Edge Function: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de la IA');
    }

    // PROCESAMIENTO EN EL CLIENTE - Limpiar markdown
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const actions = JSON.parse(jsonText);

    if (!Array.isArray(actions)) {
      throw new Error('La respuesta debe ser un array de acciones');
    }

    // Logging
    if (result.usage) {
      const cost =
        ((result.usage.prompt_tokens || 0) * 0.00015 + (result.usage.completion_tokens || 0) * 0.0006) / 1000;
      console.log(`✅ Análisis completado`);
      console.log(`💰 Costo estimado: $${cost.toFixed(6)} USD`);
      console.log(`🔢 Tokens usados: ${result.usage.total_tokens || 0}`);
    }

    console.log('🎯 Acciones generadas:', JSON.stringify(actions, null, 2));
    console.log(`📊 Total de acciones: ${actions.length}`);

    return actions;
  } catch (error) {
    console.error('❌ Error procesando prompt:', error);
    if (error instanceof Error) {
      throw new Error(
        `No se pudo procesar tu solicitud: ${error.message}. Por favor intenta con una instrucción más clara.`
      );
    }
    throw new Error('Error desconocido al procesar la solicitud');
  }
};

export function validateOpenAIToken(): boolean {
  // Ya no necesitamos validar token local, está en Supabase
  return true;
}
