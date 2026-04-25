# Plataforma LMS — Medicina Preventiva

Sistema de gestión de aprendizaje para el área de medicina preventiva.

## Stack
- **Frontend**: React 18 + Vite + TailwindCSS — desplegado en **Vercel**
- **Backend**: Node.js + Express + JWT — desplegado en **Railway**
- **Base de datos**: PostgreSQL en **Supabase**
- **Archivos**: **Cloudinary** (videos e infografías)
- **PDF**: PDFKit (generación de constancias)

## Estructura

```
medicina-preventiva/
├── frontend/   # React + Vite
└── backend/    # Node.js + Express
```

## Inicio rápido

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Llenar variables
node index.js
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # Llenar VITE_API_URL
npm run dev
```

## Base de datos

Ejecutar [`backend/schema.sql`](backend/schema.sql) en el SQL Editor de Supabase.

Crear el primer admin directamente en la base de datos:
```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@hospital.com', '$2a$10$...bcrypt_hash...', 'admin');
```
O usar la ruta `POST /auth/register` desde un cliente REST con el token de un admin existente.

## Variables de entorno

### Backend (`.env`)
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a Supabase PostgreSQL |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `PORT` | Puerto del servidor (default: 4000) |
| `FRONTEND_URL` | URL del frontend para CORS |

### Frontend (`.env`)
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Upload preset sin firma |

## Despliegue

### Frontend → Vercel
1. Importar el repo en Vercel
2. Configurar `Root Directory: frontend`
3. Agregar variables de entorno
4. Deploy automático

### Backend → Railway
1. Importar el repo
2. Configurar `Root Directory: backend`
3. Agregar variables de entorno
4. Railway detecta el `Procfile` automáticamente

## Funcionalidades
- ✅ Login con roles (admin / empleado)
- ✅ Cursos con videos e infografías
- ✅ Seguimiento de progreso
- ✅ Examen automático con temporizador
- ✅ Generación de constancias en PDF
- ✅ Calendario mensual y anual
- ✅ Matriz de competencias digitales (8 áreas, niveles 1-5)
- ✅ Panel de administración completo
- ✅ Chatbot FAQ flotante
