#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

# Carpeta actual del orquestador
BASE_DIR = Path(__file__).parent.resolve()

# Lista de scripts que realmente generan archivos
SCRIPTS = [
    BASE_DIR / "generate_board.py"
]

def run_scripts(scripts):
    for script in scripts:
        print(f"▶ Ejecutando {script} ...")
        result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print(f"❌ Error en {script}:\n{result.stderr}")
            break

if __name__ == "__main__":
    run_scripts(SCRIPTS)
