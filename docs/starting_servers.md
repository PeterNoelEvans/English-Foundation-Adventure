# Starting Servers Guide

This guide will help you start all necessary servers for the English Foundation Learning Platform after rebooting your computer.

---

## 1. Start PostgreSQL Database Server

**Option A: Using Windows Services**
1. Press `Windows + R`, type `services.msc`, and press Enter.
2. Find `postgresql-x64-17` in the list.
3. Right-click and select **Start** (or **Restart** if already running).

**Option B: Using Command Line**
1. Open Command Prompt as Administrator.
2. Run:
   ```sh
   net start postgresql-x64-17
   ```

---

## 2. Start the Backend Server
1. Open a new Command Prompt window.
2. Navigate to your project root directory:
   ```sh
   cd D:\PBS\English-Foundation-Mattayom
   ```
3. Start the backend:
   ```sh
   npm run dev
   ```
4. You should see:
   ```
   Server is running on port 3000
   ```

---

## 3. Start the Frontend (Next.js) Server
1. Open another Command Prompt window.
2. Navigate to the frontend directory:
   ```sh
   cd D:\PBS\English-Foundation-Mattayom\frontend
   ```
3. Start the frontend on port 3001:
   ```sh
   npm run dev -- -p 3001
   ```
4. Visit [http://localhost:3001](http://localhost:3001) in your browser.

---

## 4. Troubleshooting
- **Port already in use:**
  - Make sure no other process is using port 3000 (backend) or 3001 (frontend).
  - Use Task Manager to end any `node.exe` processes if needed.
- **Database connection errors:**
  - Ensure PostgreSQL is running and your `.env` file has the correct credentials.
- **Prisma errors:**
  - If you see Prisma errors, try running:
    ```sh
    npx prisma generate
    npx prisma migrate dev
    ```

---

## 5. Quick Reference
- **Backend:** [http://localhost:3000](http://localhost:3000)
- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **PostgreSQL:** Use pgAdmin or psql for database management.

---

If you get stuck, check the backend terminal for error messages and refer to the troubleshooting section above. 