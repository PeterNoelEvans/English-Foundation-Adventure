# Transferring and Deploying the LMS to a Linux Server

This guide will help you transfer your multi-school LMS project from Windows to a Linux server and set it up for production or development use.

---

## 1. Prepare the Linux Server
- Ensure you have SSH access and sudo privileges.
- Update the system:
  ```sh
  sudo apt update && sudo apt upgrade -y
  ```
- Install required packages:
  ```sh
  sudo apt install -y git curl build-essential
  ```

## 2. Install Node.js and npm
- Recommended: Use Node Version Manager (nvm):
  ```sh
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  source ~/.bashrc
  nvm install --lts
  nvm use --lts
  node -v
  npm -v
  ```

## 3. Install PostgreSQL
- Install PostgreSQL:
  ```sh
  sudo apt install -y postgresql postgresql-contrib
  ```
- Start and enable the service:
  ```sh
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
  ```
- Switch to the postgres user and create the database and user:
  ```sh
  sudo -i -u postgres
  psql
  CREATE DATABASE english_foundation;
  CREATE USER myuser WITH PASSWORD 'mypassword';
  GRANT ALL PRIVILEGES ON DATABASE english_foundation TO myuser;
  \q
  exit
  ```
- Update your `.env` file with the new connection string:
  ```env
  DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/english_foundation?schema=public"
  ```

## 4. Transfer Project Files
- On your Windows machine, zip your project folder (excluding node_modules and .next):
  - Use `zip` or your preferred tool.
- Copy the zip file to your Linux server (using `scp`, SFTP, or a cloud drive):
  ```sh
  scp project.zip user@your-server-ip:/home/user/
  ```
- SSH into your server and unzip:
  ```sh
  unzip project.zip
  cd your-project-folder
  ```

## 5. Install Dependencies
- In the project root:
  ```sh
  npm install
  ```
- In the frontend directory:
  ```sh
  cd frontend
  npm install
  cd ..
  ```

## 6. Apply Database Migrations
- Run:
  ```sh
  npx prisma migrate deploy
  ```

## 7. Start the Backend and Frontend
- Backend (from project root):
  ```sh
  npm run dev
  # or for production
  npm run build && npm start
  ```
- Frontend (from frontend directory):
  ```sh
  npm run dev -- --port 3001
  # or for production
  npm run build && npm start -- --port 3001
  ```

## 8. (Optional) Set Up as a Systemd Service
- For production, create a systemd service for backend and frontend to run them in the background and restart on failure.
- Example for backend (`/etc/systemd/system/lms-backend.service`):
  ```ini
  [Unit]
  Description=LMS Backend
  After=network.target

  [Service]
  Type=simple
  User=youruser
  WorkingDirectory=/home/youruser/your-project-folder
  ExecStart=/home/youruser/.nvm/versions/node/vXX.X.X/bin/node src/server.js
  Restart=always
  Environment=NODE_ENV=production
  EnvironmentFile=/home/youruser/your-project-folder/.env

  [Install]
  WantedBy=multi-user.target
  ```
- Reload systemd and start the service:
  ```sh
  sudo systemctl daemon-reload
  sudo systemctl enable lms-backend
  sudo systemctl start lms-backend
  ```

## 9. (Optional) Set Up a Reverse Proxy (Nginx)
- Install Nginx:
  ```sh
  sudo apt install -y nginx
  ```
- Configure Nginx to proxy requests to your backend/frontend and handle SSL (Let’s Encrypt).

## 10. Troubleshooting
- Check logs with `journalctl -u lms-backend` or `pm2 logs` if using PM2.
- Use `psql` to connect to PostgreSQL and check database status.
- Ensure all environment variables are set correctly.

---

## 11. (Optional) Add Tailwind CSS to the Frontend

Tailwind CSS is a utility-first CSS framework for rapid UI development. To add Tailwind to your frontend after transferring to Linux:

### 1. Install Tailwind and Dependencies
Navigate to your frontend directory:
```sh
cd frontend
```
Install Tailwind and its dependencies:
```sh
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind
Edit `tailwind.config.js` and set the `content` array to include your source files:
```js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
Adjust the paths if your structure is different (e.g., use `./src/pages/...` if your pages are in `src/pages`).

### 3. Add Tailwind to Your CSS
Replace the contents of `frontend/styles/globals.css` (or your main CSS file) with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Restart Your Dev Server
After setup, restart your frontend dev server:
```sh
npm run dev -- --port 3001
```

### 5. Start Using Tailwind Classes
You can now use Tailwind utility classes in your React components, e.g.:
```jsx
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Click me
</button>
```

---

Tailwind will work the same way on Linux as on Windows. Just make sure to run `npm install` in your `frontend` directory after transferring your project.

## Notes
- Always keep your `.env` file secure and never commit it to version control.
- For production, consider using a process manager like PM2 or systemd.
- Regularly back up your database and project files.

---

**You are now ready to run your LMS on a Linux server!** 