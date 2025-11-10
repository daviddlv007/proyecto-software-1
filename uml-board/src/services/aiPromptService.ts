/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodeType, EdgeType } from '../utils/umlConstants';

// URL de la Edge Function de Supabase
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
  // Preparar el contexto de manera segura
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

  console.log('🤖 Procesando prompt con OpenAI...');
  console.log('📝 Prompt del usuario:', prompt);

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        prompt, 
        currentNodes: contextClasses, 
        currentEdges: contextRelations 
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Error desconocido' }));
      throw new Error(`Error en Edge Function: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    if (result.usage) {
      const cost =
        ((result.usage.prompt_tokens || 0) * 0.00015 + (result.usage.completion_tokens || 0) * 0.0006) / 1000;
      console.log(`✅ Análisis completado`);
      console.log(`💰 Costo estimado: $${cost.toFixed(6)} USD`);
      console.log(`🔢 Tokens usados: ${result.usage.total_tokens || 0}`);
    }

    const actions = result.actions;

    if (!Array.isArray(actions)) {
      throw new Error('La respuesta debe ser un array de acciones');
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