import yaml
from pathlib import Path
import re


# --- Directorio base del script ---
BASE_DIR = Path(__file__).parent.parent

# --- Configuración ---
API_FILE = BASE_DIR / "api.yaml"
DST_DOMAIN_DIR = BASE_DIR / "domains/library"
DST_DOMAIN_DIR.mkdir(parents=True, exist_ok=True)

# --- Leer contrato OpenAPI ---
with open(API_FILE) as f:
    api_spec = yaml.safe_load(f)

schemas = api_spec.get("components", {}).get("schemas", {})
model_classes = [name for name in schemas.keys() if not name.endswith(("Input", "Error"))]

# --- Función camelCase -> snake_case ---
def camel_to_snake(name):
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

# --- Mapear tipos OpenAPI a Django ---
type_map = {
    "integer": "models.IntegerField()",
    "string": lambda p: f"models.CharField(max_length={p.get('maxLength', 255)})",
    "boolean": "models.BooleanField()",
    "number": "models.FloatField()"
}

def map_type(prop_name, prop_info, model_names):
    fk = prop_info.get("x-foreign-key")
    if fk:
        related_model = fk.split('.')[0]
        return f"models.ForeignKey('{related_model}', on_delete=models.CASCADE)"
    oatype = prop_info.get("type")
    f = type_map.get(oatype, "models.TextField()")
    return f(prop_info) if callable(f) else f

# --- Función helper para escribir archivos ---
def write_file(path, content):
    path.write_text(content)

# --- 1️⃣ Generar models.py ---
models_lines = ["from django.db import models\n"]

for name in model_classes:
    props = schemas[name].get("properties", {})
    lines = [f"class {name}(models.Model):"]

    for prop_name, prop_info in props.items():
        if prop_name == "id":
            # Siempre generar AutoField primario para el id
            lines.append("    id = models.AutoField(primary_key=True)")
            continue

        field_name = camel_to_snake(prop_name)
        lines.append(f"    {field_name} = {map_type(prop_name, prop_info, model_classes)}")

    lines += [
        f"    class Meta:\n        db_table = '{name.lower()}s'",
        f"    def __str__(self):\n        return str(self.id)\n"
    ]
    models_lines.extend(lines)

write_file(DST_DOMAIN_DIR / "models.py", "\n".join(models_lines))

# --- 2️⃣ Generar serializers.py (reemplazar esta sección en tu script) ---
serializers_lines = [
    "from rest_framework import serializers",
    f"from .models import {', '.join(model_classes)}\n"
]

for model in model_classes:
    props = schemas[model].get("properties", {})
    fields_list = list(props.keys())
    lines = [f"class {model}Serializer(serializers.ModelSerializer):"]

    for prop_name, prop_info in props.items():
        fk = prop_info.get("x-foreign-key")
        field_name = camel_to_snake(prop_name)

        if fk:
            # ForeignKey expuesto con nombre camelCase pero vinculado a source snake_case
            related_model = fk.split('.')[0]
            lines.append(
                f"    {prop_name} = serializers.PrimaryKeyRelatedField("
                f"source='{field_name}', queryset={related_model}.objects.all())"
            )

        elif field_name != prop_name:
            # Campo renombrado: elegimos tipo de serializer según el tipo OpenAPI
            ptype = prop_info.get("type")
            if ptype == "boolean":
                lines.append(f"    {prop_name} = serializers.BooleanField(source='{field_name}')")
            elif ptype == "integer":
                lines.append(f"    {prop_name} = serializers.IntegerField(source='{field_name}')")
            elif ptype == "number":
                lines.append(f"    {prop_name} = serializers.FloatField(source='{field_name}')")
            else:
                # string u otros → CharField (respetamos maxLength si existe)
                maxlen = prop_info.get("maxLength")
                if maxlen:
                    lines.append(f"    {prop_name} = serializers.CharField(source='{field_name}', max_length={maxlen})")
                else:
                    lines.append(f"    {prop_name} = serializers.CharField(source='{field_name}')")

    lines += [
        f"    class Meta:",
        f"        model = {model}",
        f"        fields = {fields_list}\n"
    ]
    serializers_lines.extend(lines)

write_file(DST_DOMAIN_DIR / "serializers.py", "\n".join(serializers_lines))


# --- 3️⃣ Generar views.py ---
views_lines = [
    "from rest_framework import viewsets",
    f"from .models import {', '.join(model_classes)}",
    f"from .serializers import {', '.join([m+'Serializer' for m in model_classes])}\n"
]
views_lines += [
    f"class {m}ViewSet(viewsets.ModelViewSet):\n"
    f"    queryset = {m}.objects.all()\n"
    f"    serializer_class = {m}Serializer\n" for m in model_classes
]
write_file(DST_DOMAIN_DIR / "views.py", "\n".join(views_lines))

# --- 4️⃣ Generar urls.py ---
urls_lines = [
    "from django.urls import path, include",
    "from rest_framework.routers import DefaultRouter",
    f"from .views import {', '.join([m+'ViewSet' for m in model_classes])}\n",
    "router = DefaultRouter()"
]
urls_lines += [f"router.register(r'{m.lower()}s', {m}ViewSet)" for m in model_classes]
urls_lines += ["\nurlpatterns = [", "    path('', include(router.urls)),", "]"]
write_file(DST_DOMAIN_DIR / "urls.py", "\n".join(urls_lines))

# --- 5️⃣ Generar __init__.py ---
write_file(DST_DOMAIN_DIR / "__init__.py", "# Domain package for library\n")

print("¡Dominio library generado exitosamente!")
print(f"Modelos generados: {model_classes}")
