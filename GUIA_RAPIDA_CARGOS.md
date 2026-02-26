# 🚀 Guía Rápida - Cargos

## Acceder al Módulo

1. **Menú Lateral** → "Cargos"
2. Se abre la vista con tabla de todos los cargos

## Crear Nuevo Cargo

```
Botón [Nuevo Cargo] → Ingresar nombre → [Guardar]

Ejemplo:
- Nombre: "Coordinador"
```

## Editar Cargo

```
Click ícono [Lápiz] → Edita nombre → [Guardar]
```

## Eliminar Cargo

```
Click ícono [Papelera] → Confirma → Hecho
```

## Cargos Iniciales

| Cargo |
|-------|
| Gerente |
| Sub Gerente |
| Especialista |
| Técnico |
| Asistente |
| Administrativo |

## API Endpoints

```bash
GET    /api/cargos              # Obtener todos
GET    /api/cargos/:id          # Obtener uno
POST   /api/cargos              # Crear
PUT    /api/cargos/:id          # Actualizar
DELETE /api/cargos/:id          # Eliminar
```

## Campos

- **Nombre**: Requerido, único (case-insensitive)
- **Activo**: Automático (siempre 1)

## Compilación

```bash
npm run build
# Resultado: 502.77 kB ✅
```

## Icono en Menú

**badge** - Distintivo

## Arquitectura

```
Frontend (React)
    ↓
API Service (api.js)
    ↓
Backend Routes (/cargos)
    ↓
Controller (cargoController.js)
    ↓
Database (tabla cargos)
```

---

**Estado**: ✅ Completado
**Bundle**: 502.77 kB
**Toasts**: Implementados ✅
**Validaciones**: Backend + Frontend ✅
