# Migración a Supabase Edge Functions - OpenAI API

## ✅ Completado

Se ha migrado exitosamente la lógica de OpenAI API a Supabase Edge Functions para proteger el token.

## 🔧 Configuración Final Requerida

### 1. Configurar tu Token de OpenAI en Supabase

Necesitas actualizar el secreto con tu token real de OpenAI:

```bash
cd /home/ubuntu/proyectos/proyecto-software-1
npx supabase secrets set OPENAI_API_KEY=sk-tu-token-real-de-openai-aqui
```

### 2. Verificar las Edge Functions

Las funciones ya están desplegadas en:
- `https://izsllyjacdhfeoexwpvh.supabase.co/functions/v1/process-uml-prompt`
- `https://izsllyjacdhfeoexwpvh.supabase.co/functions/v1/analyze-diagram-image`

Puedes verlas en el Dashboard: https://supabase.com/dashboard/project/izsllyjacdhfeoexwpvh/functions

## 📋 Cambios Realizados

### Frontend (Cliente)
- ✅ `aiPromptService.ts`: Ahora llama a edge function en lugar de OpenAI directamente
- ✅ `diagramImportService.ts`: Ahora llama a edge function para análisis de imágenes
- ✅ **NINGÚN TOKEN expuesto en el código frontend**

### Backend (Supabase Edge Functions)
- ✅ `process-uml-prompt`: Procesa prompts de texto usando OpenAI API
- ✅ `analyze-diagram-image`: Analiza imágenes de diagramas usando OpenAI Vision
- ✅ Token seguro en variables de entorno de Supabase

## 🔒 Seguridad

- ✅ Token NUNCA expuesto en el cliente
- ✅ Token NUNCA en el repositorio GitHub
- ✅ Token almacenado de forma segura en Supabase
- ✅ Funciones serverless manejan todas las llamadas a OpenAI

## 🚀 Despliegue

Ahora puedes desplegar tu frontend sin problemas:

```bash
# Merge a main cuando estés listo
git checkout main
git merge feature/serverless-openai
git push

# O crear Pull Request en GitHub
```

## 📝 Notas Importantes

1. La rama `feature/serverless-openai` contiene todos los cambios
2. El token placeholder se configuró con `sk-proj-tu-token-real-aqui` - **REEMPLÁZALO**
3. Las edge functions usan CORS abierto (`*`) - considera restringirlo en producción
4. Los costos de OpenAI ahora se facturan desde el servidor, no desde el cliente

## 🧪 Probar Localmente (Opcional)

Si quieres probar las edge functions localmente:

```bash
# Iniciar Supabase local
npx supabase start

# Las funciones estarán disponibles en:
# http://127.0.0.1:54321/functions/v1/process-uml-prompt
# http://127.0.0.1:54321/functions/v1/analyze-diagram-image
```

## ❓ Solución de Problemas

Si las funciones no funcionan:

1. Verifica que el token de OpenAI esté correctamente configurado
2. Revisa los logs en Supabase Dashboard → Functions → Logs
3. Asegúrate de que el token tenga créditos disponibles en OpenAI

---

**Migración completada exitosamente! 🎉**
