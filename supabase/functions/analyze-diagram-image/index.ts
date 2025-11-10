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
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl es requerida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Analiza este diagrama de clases UML y extrae la estructura en formato JSON válido.

RESPONDE SOLO CON EL JSON, sin explicaciones adicionales.

INSTRUCCIONES:
- Detecta todas las clases, atributos y relaciones
- NO incluyas atributos "id" en las clases
- Para multiplicidades usa formato exacto: "1", "*", "0..*", "1..*"

Formato requerido:
{
  "classes": [
    {
      "name": "NombreClase",
      "attributes": [
        {"name": "atributo", "type": "String", "visibility": "private"}
      ],
      "methods": []
    }
  ],
  "relationships": [
    {
      "type": "association",
      "source": "ClaseOrigen",
      "target": "ClaseDestino", 
      "multiplicity": "1..*"
    }
  ]
}`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
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
    let content = result.choices[0]?.message?.content || '';

    // Limpiar markdown
    if (content.startsWith('```json')) {
      content = content.replace('```json', '').replace('```', '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace('```', '').trim();
    }

    const parsedData = JSON.parse(content);

    return new Response(
      JSON.stringify({ data: parsedData, usage: result.usage }),
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
