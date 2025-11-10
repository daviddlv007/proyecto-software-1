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

    const prompt = `Analiza este diagrama de clases UML y extrae ÚNICAMENTE la estructura en formato JSON válido.

RESPONDE SOLO CON EL JSON, sin explicaciones adicionales.

INSTRUCCIONES CRÍTICAS PARA RELACIONES M:N:
- EXAMINA CUIDADOSAMENTE TODAS LAS LÍNEAS del diagrama
- DETECTA TODAS las relaciones, especialmente relaciones muchos-a-muchos (M:N)
- IDENTIFICA tablas intermedias/asociativas que conectan entidades principales
- NO incluyas atributos "id" en las clases, se asumen implícitamente
- Para multiplicidades usa formato exacto: "1", "*", "0..*", "1..*"

⚠️ ANÁLISIS OBLIGATORIO DE CADA TABLA INTERMEDIA:
Para CADA entidad que empiece con "Detalle" (DetalleVenta, DetalleCompra, etc.):
1. BUSCA TODAS las líneas que conectan con esa entidad
2. VERIFICA que tenga conexiones a EXACTAMENTE 2 entidades principales
3. SI ves solo 1 conexión, BUSCA MÁS CUIDADOSAMENTE la segunda línea
4. EJEMPLO: DetalleCompra debe conectar con Compra Y con Producto

ANÁLISIS SISTEMÁTICO REQUERIDO:
1. IDENTIFICA todas las clases/entidades en el diagrama
2. DETECTA qué entidades son principales vs intermedias/asociativas
3. ENCUENTRA todas las líneas que conectan clases (no omitas ninguna línea, por pequeña que sea)
4. DETERMINA multiplicidades de cada relación con precisión
5. CLASIFICA cada relación según su tipo UML
6. VERIFICA que cada línea visible se convierta en una relación en el JSON

⚠️ INSTRUCCIÓN CRÍTICA: EXAMINA CADA LÍNEA DEL DIAGRAMA
- Busca líneas sólidas que conecten cajas de entidades
- Incluye líneas cortas, largas, horizontales, verticales, diagonales
- No omitas líneas que parezcan menos prominentes visualmente
- Cada línea visible debe resultar en una relación en el JSON
- Si ves una caja conectada a otra caja, debe existir una relación

DETECCIÓN ESPECIAL DE RELACIONES M:N:
Las relaciones muchos-a-muchos se pueden representar de 2 formas:
A) LÍNEA DIRECTA con multiplicidad * en ambos lados
B) VÍA TABLA INTERMEDIA: EntidadA → TablaIntermedia ← EntidadB

REGLA CRÍTICA PARA TABLAS INTERMEDIAS:
- Si ves una entidad con nombre como "Detalle[Algo]", "Intermedia", etc.
- Esa entidad debe estar conectada a EXACTAMENTE 2 entidades principales
- CADA conexión debe tener multiplicidad * (muchos)
- EJEMPLO: DetalleVenta debe conectar con Venta Y con Producto
- EJEMPLO: DetalleCompra debe conectar con Compra Y con Producto

PARA CADA TABLA INTERMEDIA DETECTADA, crear 2 relaciones:
- EntidadPrincipal1 → TablaIntermedia (multiplicidad 1..*)
- EntidadPrincipal2 → TablaIntermedia (multiplicidad 1..*)
- NO crear relación directa entre EntidadPrincipal1 y EntidadPrincipal2

NOMBRES TÍPICOS DE TABLAS INTERMEDIAS:
- Detalle + NombreEntidad: "DetalleVenta", "DetalleCompra", "DetallePedido"
- Nombres compuestos: "EstudianteCurso", "UsuarioRol", "ProductoCategoria"
- Palabras clave: "intermedia", "relacion", "inscripcion", "asociacion"

CRITERIOS DE CLASIFICACIÓN:
- ENTIDAD PRINCIPAL: Tiene atributos de negocio significativos, puede existir independientemente
- TABLA INTERMEDIA: Principalmente contiene claves foráneas + algunos atributos adicionales

PATRONES DE RELACIONES Y DETECCIÓN VISUAL:

⚠️ CRUCIAL: IDENTIFICAR TIPO DE RELACIÓN POR ELEMENTOS VISUALES:

1. **ASOCIACIÓN** (type: "association"):
   - Línea simple/recta entre entidades
   - Sin símbolos especiales en los extremos
   - Puede tener multiplicidad (1, *, 1..*, 0..*)
   - Es el tipo MÁS COMÚN en diagramas de clases

2. **HERENCIA/GENERALIZACIÓN** (type: "inheritance"):
   - Línea con FLECHA CON TRIÁNGULO VACÍO (hueco) ►
   - El triángulo apunta hacia la clase padre/superclase
   - Representa relación "es-un" (is-a)
   - Ejemplos: Persona ← Empleado, Vehiculo ← Auto

3. **COMPOSICIÓN** (type: "composition"):
   - Línea con ROMBO NEGRO/RELLENO ♦ en un extremo
   - Relación "parte-de" FUERTE (si se elimina el todo, se eliminan las partes)
   - El rombo está en la clase "contenedora" 
   - Ejemplos: Casa ♦─ Habitación, Auto ♦─ Motor

4. **AGREGACIÓN** (type: "aggregation"):
   - Línea con ROMBO BLANCO/VACÍO ◊ en un extremo
   - Relación "parte-de" DÉBIL (las partes pueden existir independientemente)
   - El rombo está en la clase "contenedora"
   - Ejemplos: Universidad ◊─ Estudiante, Equipo ◊─ Jugador

INSTRUCCIONES CRÍTICAS PARA DETECCIÓN:
- EXAMINA CUIDADOSAMENTE los extremos de cada línea
- BUSCA símbolos específicos: triángulos (►), rombos rellenos (♦), rombos vacíos (◊)
- Si NO VES ningún símbolo especial → type: "association"
- Si VES triángulo vacío/hueco → type: "inheritance" 
- Si VES rombo negro/relleno → type: "composition"
- Si VES rombo blanco/vacío → type: "aggregation"

EJEMPLOS VISUALES A BUSCAR:
- ASOCIACIÓN: ClaseA ------ ClaseB (línea simple)
- HERENCIA: ClasePadre <---- ClaseHija (triángulo vacío)
- COMPOSICIÓN: Todo [rombo relleno]------ Parte  
- AGREGACIÓN: Contenedor [rombo vacío]------ Elemento

DIRECCIONALIDAD SEMÁNTICA:
- ACTORES → ACCIONES: Cliente → Venta, Usuario → Pedido
- CLASIFICADORES → CLASIFICADOS: Categoria → Producto
- PRINCIPALES → DETALLES: Venta → DetalleVenta
- PRODUCTOS → DETALLES: Producto → DetalleVenta

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
