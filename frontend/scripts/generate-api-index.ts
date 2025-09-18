import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// --- Resolver __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuración ---
const API_DIR = join(__dirname, '../src/app/shared/models');
const OUTPUT_FILE = join(API_DIR, 'index.ts');
const COMPONENTS_FILE = join(API_DIR, 'api.ts');

// --- Leer api.ts ---
const apiContent = fs.readFileSync(COMPONENTS_FILE, 'utf-8');

// --- Buscar todos los schemas usando components["schemas"]["..."] ---
const regex = /components\["schemas"\]\["(\w+)"\]/g;
const modelNamesSet = new Set<string>();
let match;
while ((match = regex.exec(apiContent)) !== null) {
  modelNamesSet.add(match[1]);
}

const modelNames = Array.from(modelNamesSet);

// --- Generar index.ts limpio ---
let indexContent = `// Reexports para usar tipos limpios en Angular\n`;
indexContent += `import type { components } from './api';\n\n`;

modelNames.forEach((name) => {
  indexContent += `export type ${name} = components["schemas"]["${name}"];\n`;
});

// --- Escribir archivo ---
fs.writeFileSync(OUTPUT_FILE, indexContent, 'utf-8');

console.log(`✅ index.ts generado correctamente con ${modelNames.length} modelos:`);
console.log(modelNames.join(', '));
