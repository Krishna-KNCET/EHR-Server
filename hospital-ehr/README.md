# Hospital EHR System

Production-ready Node.js + Express + MongoDB EHR backend with a minimal React dashboard.

## Features
- Clean architecture: routes/controllers/services/models/middleware
- JWT auth with refresh tokens and RBAC
- Patients, Doctors, Medical Records modules
- File uploads (Multer) for lab reports
- Security: rate limit, CORS, sanitization, helmet, NoSQL injection prevention
- Central error handling and standardized responses
- Audit logging of all requests
- Pagination, filtering, soft delete, text search
- Swagger docs at /api/docs
- Docker + docker-compose

## Getting Started (Local)
1. Install backend deps
```
cd hospital-ehr
npm install
```
2. Start MongoDB (option A: Docker Compose)
```
docker compose up -d mongo
```
3. Seed sample data
```
npm run seed
```
4. Run API
```
npm run dev
```
Open http://localhost:4000/health and http://localhost:4000/api/docs

5. Run ML service (required for scan prediction output)
```powershell
cd ..\ml-service
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

6. Frontend (Vite React dashboard)
```
cd hospital-ehr-frontend
npm install
npm run dev
```
Open http://localhost:5173

## Docker (API + Mongo)
```
cd hospital-ehr
docker compose up -d --build
```

## Env Vars
See .env for defaults. Change JWT secrets in production.

## API Overview
- Auth: /api/auth/login, /api/auth/refresh-token, /api/auth/logout
- Patients: /api/patients, /api/patients/:patientId, /api/patients/:patientId/history
- Doctors: /api/doctors/search, /api/doctors/consultations (POST with files), /api/doctors/consultations/:id (PUT)
- Records: /api/records (GET), /api/records/:id (DELETE - soft)
- Admin: /api/admin/doctors (GET/POST), /api/admin/logs (GET)

## Production Notes
- Set secure CORS origins
- Use strong JWT secrets and rotate refresh tokens
- Serve uploads via a private object store in production
- Configure indexes (defined in schemas) and monitor performance
- Use a centralized secrets manager and structured logging collector
