#!/usr/bin/env python3
import os
import yaml
from jinja2 import Environment, FileSystemLoader

# ------------------------
# Config paths
# ------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_YAML = os.path.join(BASE_DIR, '..', 'contracts', 'api.yaml')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
OUTPUT_FEATURE_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'app', 'features', 'feature-1')
OUTPUT_HOME_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'app', 'features', 'home')
OUTPUT_LAYOUTS_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'app', 'layouts')
OUTPUT_INTERCEPTORS_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'app', 'core', 'interceptors')


# ------------------------
# Load OpenAPI YAML
# ------------------------
with open(API_YAML, 'r') as f:
    spec = yaml.safe_load(f)

schemas = spec.get('components', {}).get('schemas', {})

# ------------------------
# Filter entities to include
# ------------------------
def include_entity(name):
    return not name.endswith('Input') and name != 'Error'

entities = [name for name in schemas if include_entity(name)]

# ------------------------
# Jinja environment (delimiters %% %%)
# ------------------------
env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    variable_start_string='%%',
    variable_end_string='%%'
)

# ------------------------
# Ensure directories exist
# ------------------------
dirs = [
    os.path.join(OUTPUT_FEATURE_DIR, 'models'),
    os.path.join(OUTPUT_FEATURE_DIR, 'data-access'),
    os.path.join(OUTPUT_FEATURE_DIR, 'ui'),
    os.path.join(OUTPUT_FEATURE_DIR, 'pages'),
    os.path.join(OUTPUT_HOME_DIR, 'pages'),
    OUTPUT_LAYOUTS_DIR
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# ------------------------
# Type mapping
# ------------------------
type_map = {
    'integer': 'number',
    'string': 'string',
    'boolean': 'boolean',
    'number': 'number'
}

# ------------------------
# Generate UI components (generic card + table)
# ------------------------
for tmpl_name in ['card.component.ts.jinja', 'table.component.ts.jinja']:
    template = env.get_template(tmpl_name)
    output_file = os.path.join(OUTPUT_FEATURE_DIR, 'ui', tmpl_name.replace('.jinja',''))
    with open(output_file, 'w') as f:
        f.write(template.render())

# ------------------------
# Generate models, services, and pages
# ------------------------
for name in entities:
    props = schemas[name].get('properties', {})
    ts_props = {k: type_map.get(v.get('type','any'),'any') for k,v in props.items()}

    # Model
    model_tmpl = env.get_template('model.ts.jinja')
    with open(os.path.join(OUTPUT_FEATURE_DIR, 'models', f'{name}.ts'), 'w') as f:
        f.write(model_tmpl.render(entity_name=name, properties=ts_props))

    # Service
    service_tmpl = env.get_template('service.ts.jinja')
    with open(os.path.join(OUTPUT_FEATURE_DIR, 'data-access', f'{name}.service.ts'), 'w') as f:
        f.write(service_tmpl.render(entity_name=name, entity_file_name=name))

    # Pages folder for this entity
    entity_pages_dir = os.path.join(OUTPUT_FEATURE_DIR, 'pages', name)
    os.makedirs(entity_pages_dir, exist_ok=True)

    # Pages: list, create, edit
    for mode in ['list', 'create', 'edit']:
        page_tmpl = env.get_template(f'{mode}.page.ts.jinja')
        output_path = os.path.join(entity_pages_dir, f'{name}.{mode}.page.ts')
        with open(output_path, 'w') as f:
            f.write(page_tmpl.render(
                entity_name=name,
                entity_file_name=name,
                properties=ts_props,
                mode=mode
            ))

# ------------------------
# Generate feature routes
# ------------------------
routes_tmpl = env.get_template('routes.ts.jinja')
with open(os.path.join(OUTPUT_FEATURE_DIR, 'feature-1.routes.ts'), 'w') as f:
    f.write(routes_tmpl.render(entities=entities))

# ------------------------
# Generate Home page
# ------------------------
home_pages_dir = os.path.join(OUTPUT_HOME_DIR, 'pages')
os.makedirs(home_pages_dir, exist_ok=True)

home_tmpl = env.get_template('home.page.ts.jinja')
home_output_file = os.path.join(home_pages_dir, 'home.page.ts')
with open(home_output_file, 'w') as f:
    f.write(home_tmpl.render(entities=entities))

# ------------------------
# Generate App Layout (with sidebar)
# ------------------------
layout_tmpl = env.get_template('app-layout.component.ts.jinja')
layout_output_file = os.path.join(OUTPUT_LAYOUTS_DIR, 'app-layout.component.ts')
with open(layout_output_file, 'w') as f:
    f.write(layout_tmpl.render(entities=entities))

print("✅ Generación completa: Angular CRUD + Home page + Layout con sidebar")


# ------------------------
# Generar interceptor en core/interceptors
# ------------------------

os.makedirs(OUTPUT_INTERCEPTORS_DIR, exist_ok=True)

interceptor_tmpl = env.get_template('trailing-slash.interceptor.ts.jinja')
interceptor_output_file = os.path.join(OUTPUT_INTERCEPTORS_DIR, 'trailing-slash.interceptor.ts')
with open(interceptor_output_file, 'w') as f:
    f.write(interceptor_tmpl.render())
