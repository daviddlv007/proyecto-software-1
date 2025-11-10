// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, currentNodes, currentEdges } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar el contexto
    const contextClasses = currentNodes.map((n: any) => ({
      id: n.id,
      nombre: n.label,
      atributos: n.attributes?.map((a: any) => `${a.name}: ${a.datatype} (${a.scope})`) || [],
    }));

    const contextRelations = currentEdges.map((e: any) => ({
      id: e.id,
      desde: currentNodes.find((n: any) => n.id === e.source)?.label || 'desconocido',
      hacia: currentNodes.find((n: any) => n.id === e.target)?.label || 'desconocido',
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

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Error desconocido' } }));
      throw new Error(`Error OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de la IA');
    }

    // Limpiar markdown
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

    return new Response(
      JSON.stringify({ actions, usage: result.usage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-uml-prompt' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
