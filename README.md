# JobTrack Pro — MERN Applicant Tracking System

A production-style MERN portfolio project for candidates and recruiters.

## Included
- JWT authentication + bcrypt password hashing
- Candidate / Recruiter / Admin roles
- Job CRUD and full-text search index
- Job type/location filters and pagination API
- Candidate applications with duplicate protection
- Skill match scoring
- Application pipeline and recruiter dashboard
- Resume upload
- Profile management
- Recruiter analytics
- Socket.IO real-time messaging foundation
- Helmet, CORS, rate limiting, validation-ready architecture
- Responsive modern UI

## Run locally

### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` in `.env`.

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## ⚠️ Security note
This zip does **not** include a `.env` file. A previous copy of this project
had a real MongoDB Atlas connection string (with password) and JWT secret
committed to `.env` — if you ever pushed that to GitHub or shared it, **rotate
that Atlas password and generate a new JWT secret now**. Never commit `.env`
to version control (see `.gitignore`).

## Demo data
```bash
cd backend
npm run seed
```
Creates a demo recruiter (`recruiter@demo.com` / `Password123`) and two sample jobs.

## Notes
This version intentionally keeps external integrations (SMTP provider, cloud file storage, maps, and payment gateway) configurable instead of embedding credentials. Resume uploads use local `backend/uploads` for development.
