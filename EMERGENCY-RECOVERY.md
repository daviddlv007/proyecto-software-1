# PLAN DE RECUPERACIÓN DE EMERGENCIA
# Si perdiste tu trabajo, sigue estos pasos:

## 1. DETENTE - No hagas más cambios
- No ejecutes más comandos
- No cierres la terminal
- No reinicies

## 2. Verificar qué tienes disponible:
```bash
# Ver referencias Git disponibles
git reflog --all
git fsck --lost-found

# Buscar commits perdidos
git log --graph --oneline --all $(git fsck --no-reflogs | awk '/dangling commit/ {print $3}')

# Ver backups locales
ls -la ~/.local/share/Trash/files/ 2>/dev/null || true
ls -la /tmp/ | grep -i git
```

## 3. Recuperación por orden de prioridad:

### A) Recuperar desde reflog:
```bash
git reflog
git checkout HEAD@{n}  # donde n es el número del commit que quieres
git branch recovery-branch
```

### B) Recuperar desde GitHub/remote:
```bash
git fetch origin
git reset --hard origin/main
```

### C) Recuperar desde backups:
```bash
# Si tienes backups
ls ~/backups/
# Restaurar el más reciente
```

### D) Recuperar desde VS Code:
- Ctrl+Shift+P → "Local History: Find Entry to Restore"
- Revisar archivos abiertos recientes

## 4. Una vez recuperado:
```bash
# Crear respaldo inmediato
git add .
git commit -m "RECUPERADO - backup de emergencia"
git push origin main

# Crear rama de trabajo
git checkout -b work-safe-$(date +%Y%m%d)
```

## CONTACTOS DE EMERGENCIA:
- GitHub Support: support@github.com
- Documentación Git Recovery: https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery

## NUNCA HAGAS:
❌ git reset --hard sin backup
❌ rm -rf .git/
❌ git clean -fd sin verificar
❌ git filter-branch sin entender
❌ Comandos de IA sin revisar