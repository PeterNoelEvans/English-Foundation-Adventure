# English Foundation Learning Platform - Setup Instructions

## Project Summary

This project is a full-stack learning platform for English Foundation, supporting:
- Teacher and student roles with authentication
- Unit management (create, list)
- Multiple question types: multiple choice, drag-and-drop, sortable, matching
- Bulk import of questions (with scoring and feedback JSON)
- Edit and delete questions from the Teacher Dashboard
- Student quiz page that supports all question types and displays answers
- Scoring and feedback fields for future use
- Comprehensive documentation for setup and usage

---

This document outlines the steps to set up the backend, database, and frontend for the English Foundation Learning Platform. It also describes question types, bulk import, and new features for teachers and students.

---

## 1. Prerequisites
- **Node.js** (v16.13 or higher, v22.x recommended)
- **npm** (v8.x or higher)
- **PostgreSQL** (v17 recommended)

---

## 2. Clone or Copy the Project
- Copy the entire project folder (including `.env`, `prisma/`, `src/`, `frontend/`, etc.) to your new computer.

---

## 3. PostgreSQL Setup
1. **Install PostgreSQL 17** from https://www.postgresql.org/download/windows/
2. **Create a new data directory** (optional, for custom location):
   - Example: `D:\PBS\English-Foundation-DB`
3. **Initialize the database cluster** (if using a custom data directory):
   ```sh
   "C:\Program Files\PostgreSQL\17\bin\initdb.exe" -D "D:\PBS\English-Foundation-DB" -U postgres -W
   ```
4. **Start the PostgreSQL server**:
   ```sh
   "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D "D:\PBS\English-Foundation-DB" -l "D:\PBS\English-Foundation-DB\logfile.txt" start
   ```
5. **Connect with pgAdmin**:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: (the one you set during initdb)
6. **Create the database**:
   - Name: `english_foundation`
   - Owner: `postgres`
   - Encoding: `UTF8` (use `template0` if needed)

---

## 4. Environment Variables
- Ensure a `.env` file exists in the project root with:
  ```env
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/english_foundation?schema=public"
  JWT_SECRET="your-super-secret-key-change-this-in-production"
  PORT=3000
  ```
- Replace `YOUR_PASSWORD` with your actual postgres password.

---

## 5. Install Backend Dependencies
In the project root, run:
```sh
npm install
```

---

## 6. Run Prisma Migrations
To set up the database tables, run:
```sh
npx prisma migrate dev --name init
```

---

## 7. Start the Backend Server
In the project root, run:
```sh
npm run dev
```
This will start the backend on port 3000.

---

## 8. Frontend Setup (Next.js + TypeScript)
1. The frontend is in the `frontend` folder and uses Next.js with TypeScript and ESLint.
2. Install frontend dependencies:
   ```sh
   cd frontend
   npm install
   ```
3. Start the frontend on a different port (e.g., 3001):
   ```sh
   npm run dev -- -p 3001
   ```
   or
   ```sh
   npx next dev -p 3001
   ```
4. Access the frontend at `http://localhost:3001/login`.

---

## 9. Question Types & Bulk Import
- Supported types: `multiple_choice`, `drag_and_drop`, `sortable`, `matching`
- Each question can have a `scoring` and `feedback` JSON field for future use.
- Example bulk import JSON:
  ```json
  [
    { "content": "What is 2+2?", "type": "multiple_choice", "options": ["3", "4", "5"], "answer": "4", "unitId": "...", "scoring": {"points": 1}, "feedback": {"correct": "Good!", "incorrect": "Try again."} },
    { "content": "Arrange the words.", "type": "drag_and_drop", "options": {"items": ["fox", "quick", "the", "brown"], "correctOrder": [2,3,1,0]}, "unitId": "..." }
  ]
  ```

---

## 10. Teacher Features
- Create, edit, delete, and bulk import questions of any type
- Add scoring and feedback JSON to questions

---

## 11. Student Features
- Student quiz page: `/student-quiz`
- Supports all question types
- Displays student answers after submission

---

## 12. Notes & Troubleshooting
- **Port Conflicts:** Backend and frontend must run on different ports (e.g., 3000 for backend, 3001 for frontend).
- **API Base URL:** The frontend's API calls are set to `http://localhost:3000/api` by default. Update this in `frontend/src/api/index.ts` if you change the backend port.
- **If you see 'Cannot GET /login':** Make sure you are visiting the frontend port, not the backend.
- **If you see 'address already in use':** Make sure only one server is running on each port.
- **If you move the project, update the `.env` file with the correct database password and connection details for the new machine.**

---

## 13. Useful Commands
- Check Node.js version: `node -v`
- Check npm version: `npm -v`
- Check PostgreSQL service: Use `services.msc` or `pg_ctl` commands

---

## Next Steps
- Push your code to GitHub:
  ```sh
  git init
  git remote add origin https://github.com/PeterNoelEvans/English-Foundation-Adventure.git
  git add .
  git commit -m "Initial commit with full backend/frontend, question types, and docs"
  git branch -M main
  git push -u origin main
  ```
- Deploy to your preferred platform (Vercel, Heroku, etc.)
- Continue building advanced features (real-time scoring, analytics, more interactive UIs)
- For help, refer to the README or contact the project maintainer. 