# 🚀 SETUP RÁPIDO - 3 Pasos Principales

## ⚡ Versión Express (5 minutos)

### Paso 1️⃣: Setup Base de Datos
```bash
cd backend
npm install
node reset-db.js
```
✅ Crea BD | Carga 26 usuarios | Contraseña: Autoridad1

---

### Paso 2️⃣: Iniciar Backend (Terminal 1)
```bash
cd backend
npm run dev
```
✅ Servidor en http://localhost:5000

---

### Paso 3️⃣: Iniciar Frontend (Terminal 2)
```bash
cd material-dashboard-react
npm install
npm start
```
✅ Interfaz en http://localhost:3000

---

## 🔐 Login

```
Usuario: admin
Contraseña: Autoridad1
```

---

## ✅ Sistema Listo

| Aspecto | Estado | URL |
|--------|--------|-----|
| Frontend | ✅ | http://localhost:3000 |
| Backend API | ✅ | http://localhost:5000 |
| Swagger Docs | ✅ | http://localhost:5000/api-docs |
| Base de Datos | ✅ | MySQL (localhost) |
| Usuarios | ✅ | 26 precargados |

---

## 📝 Notas Importantes

1. **MySQL debe estar corriendo** (XAMPP o instalación local)
2. **Abre 2 terminales diferentes** - una para backend, otra para frontend
3. **node reset-db.js** - Borra BD anterior y la recrea limpia (primera vez)
4. **Todos los usuarios usan contraseña:** `Autoridad1`

---

**¿Listo? ¡Ejecuta los 3 pasos arriba!** 🎉

