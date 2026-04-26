# Deployment Guide (Vercel + Render/Railway + Supabase)

Este documento deja el proyecto listo para salir de local a producción.

## 1) Arquitectura objetivo

- **Frontend**: Vercel (root: `frontend`)
- **Backend**: Render o Railway (root: `backend`)
- **Base de datos**: Supabase (Postgres)

## 2) Variables de entorno

### Backend (`backend/.env`)

Variables mínimas:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=4000
FRONTEND_URL=https://tu-frontend.vercel.app
```

Notas:
- `FRONTEND_URL` acepta **una o varias URLs separadas por coma**.
  Ejemplo:
  ```env
  FRONTEND_URL=http://localhost:5173,https://tu-frontend.vercel.app
  ```
- En producción, el proveedor suele inyectar `PORT`; no lo hardcodees en la plataforma.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://tu-backend.onrender.com
```

## 3) Backend en Render

1. Conecta el repo en Render.
2. Crea un **Web Service**.
3. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Agrega variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (opcional si Render la define automáticamente)
   - `FRONTEND_URL` (URL pública de Vercel)
5. Deploy.
6. Verifica salud:
   - `https://TU_BACKEND/health`

## 4) Backend en Railway (alternativa)

1. Crea proyecto y conecta repo.
2. Servicio desde carpeta `backend`.
3. Configura comandos:
   - Build: `npm install`
   - Start: `npm start`
4. Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
5. Deploy y validar `/health`.

## 5) Frontend en Vercel

1. Importa repo en Vercel.
2. Configura proyecto:
   - **Root Directory**: `frontend`
   - Framework: Vite (autodetectado)
3. Environment variable:
   - `VITE_API_URL=https://TU_BACKEND_PUBLICO`
4. Deploy.

## 6) Enlace cruzado frontend/backend

- En backend, `FRONTEND_URL` debe apuntar a la URL pública de Vercel.
- En frontend, `VITE_API_URL` debe apuntar a la URL pública del backend.
- Si cambias dominio, redeploy en ambos.

## 7) Checklist de pruebas post-deploy

1. **Login**
   - Iniciar sesión con usuario válido.
2. **Cursos**
   - Listar cursos.
   - Abrir detalle de curso.
3. **Subida de archivos** (AdminPanel)
   - Subir imagen y guardar contenido.
   - Subir PDF y guardar contenido.
4. **Visualización de contenidos**
   - Reproducir YouTube/video.
   - Ver imagen/infografía.
   - Abrir PDF/documento/link.
5. **Progreso**
   - Marcar avance/completado y recargar.

## 8) Riesgo actual: `/backend/uploads` en producción

Actualmente los archivos se guardan en disco local del backend (`/uploads`).

Riesgos en PaaS (Render/Railway):
- El filesystem puede ser **efímero** (pérdida de archivos en redeploy/restart).
- Escalado horizontal: cada instancia podría tener archivos distintos.
- Backups y CDN más complicados.

### Recomendación

Migrar archivos a **Supabase Storage** (o S3 compatible) para:
- Persistencia real.
- URLs estables.
- Mejor escalabilidad.
- Control de acceso y lifecycle policies.

> No se implementa en este cambio para mantener bajo riesgo, pero es la mejora recomendada antes de escalar usuarios.
