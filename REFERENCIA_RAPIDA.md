# ⚡ HOJA DE REFERENCIA RÁPIDA

## 🎯 TU SISTEMA EN 1 PÁGINA

---

## 🚀 INICIO RÁPIDO (3 comandos)

```bash
# Terminal 1
cd backend && npm install && node reset-db.js && npm run dev

# Terminal 2
cd material-dashboard-react && npm install && npm start

# Navegador
http://localhost:3000
Usuarios: admin / Autoridad1
```

---

## 📋 CHECKLIST SETUP

- [ ] Node.js v20+ (`node -v`)
- [ ] MySQL corriendo (XAMPP)
- [ ] `cd backend && npm install`
- [ ] `node reset-db.js` ✅ 26 usuarios cargados
- [ ] `npm run dev` en Terminal 1
- [ ] `cd ../material-dashboard-react && npm install && npm start` en Terminal 2
- [ ] http://localhost:3000 abre y login funciona

---

## 🔐 LOGIN

```
Usuario: admin (o cualquiera de los 25 más)
Contraseña: Autoridad1 (todos iguales)
```

---

## 🌐 URLs

| Elemento | URL |
|----------|-----|
| App | http://localhost:3000 |
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/api-docs |

---

## 📦 BD (Automática)

Ejecuta `node reset-db.js`:
- ✅ Elimina BD vieja
- ✅ Crea BD limpia
- ✅ Carga 26 usuarios
- ✅ Crea tablas (users, comisiones)

---

## 💻 Comandos Útiles

```bash
# Backend
npm run dev           # Iniciar (nodemon)
node reset-db.js      # BD nueva limpia
node insert-users.js  # Insertar usuarios

# Frontend
npm start             # Iniciar
npm run build        # Build producción
```

---

## 🔌 PUERTOS

| Servicio | Puerto |
|----------|--------|
| Frontend | 3000 |
| Backend | 5000 |
| MySQL | 3306 |

---

## 📊 STATS

```
Usuarios: 26
Comisiones: CRUD completo
Campos por comisión: 14
Endpoints: 7 (5 CRUD + 2 auth)
Tablas BD: 2 (users, comisiones)
```

---

## 🔑 ENV FILES

### backend/.env
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=comisiones_db
JWT_SECRET=7f3c9e8d2a5b1c4f6e9a2d7c3f8b1e4a9d2c5f8a1b4e7c3d6f9a2e5b8c1d4f
PORT=5000
```

### frontend/.env
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🛠️ TECH STACK

- Frontend: React 18 + Material-UI 5 + React Router 6
- Backend: Node.js 20 + Express 4 + JWT
- DB: MySQL 5.7+
- Auth: Bcrypt (passwords) + JWT (tokens)
- Docs: Swagger/OpenAPI

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| MySQL no conecta | Abre XAMPP, inicia MySQL |
| Puerto ocupado | `netstat -ano \| findstr :3000` + `taskkill /PID X /F` |
| npm no existe | Descarga Node.js nodejs.org |
| Login falla | Usuario: admin, Contraseña: Autoridad1 |
| BD vacía | Ejecuta `node reset-db.js` |
| Frontend no conecta a API | Verifica backend esté en Terminal 1 |

---

## 📚 DOCUMENTACIÓN

```
PASO_A_PASO.md         ← Lee PRIMERO (10 pasos, 15 min)
SETUP_RAPIDO.md        ← Próximas veces (3 pasos, 5 min)
ARQUITECTURA.md        ← Entiende el sistema (diagramas)
GUIA_SETUP.md          ← Referencia detallada
README_MIGRACION.md    ← Para migrar a otro servidor
```

---

## ✨ FUNCIONALIDADES

```
✅ Login seguro (JWT)
✅ 26 usuarios precargados
✅ CRUD comisiones (crear, leer, editar, borrar)
✅ 14 campos por comisión
✅ Datos aislados por usuario
✅ API documentada (Swagger)
✅ Material Design UI
✅ Responsive (funciona en móvil)
```

---

## 🎯 PRÓXIMOS PASOS

1. Lee **PASO_A_PASO.md** (15 min)
2. Ejecuta los 3 comandos arriba
3. Login con admin/Autoridad1
4. ¡Listo! Sistema funcionando

---

## 📞 REFERENCIA RÁPIDA

```bash
# Una línea por terminal (copiar/pegar):

# Terminal 1:
cd backend && npm install && node reset-db.js && npm run dev

# Terminal 2:
cd material-dashboard-react && npm install && npm start
```

---

**Estado:** ✅ 100% FUNCIONAL  
**Tiempo setup:** ⏱️ 15 minutos  
**Usuarios:** 👥 26 precargados  
**Contraseña:** 🔑 Autoridad1  
**Listo:** 🚀 ¡SÍ!

