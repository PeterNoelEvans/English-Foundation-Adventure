# Startup Guide - After Power Outage or System Restart

## Overview
This guide will help you restart both the frontend and backend servers for the English Foundation Adventure LMS after a power outage or system restart.

## Prerequisites
- Make sure you're logged into your server as the correct user (peter)
- Ensure you have access to the project directory

## Step 1: Navigate to Project Directory

```bash
cd /mnt/LMS-database/repos/English-Foundation-Adventure
```

## Step 2: Check Current Status

First, let's see what's currently running:

```bash
# Check if PM2 processes are running
pm2 status

# Check if any Node.js processes are running
ps aux | grep node

# Check if any Next.js processes are running
ps aux | grep next
```

## Step 3: Start Backend Server

### Option A: Using PM2 (Recommended)
```bash
# Start the backend server with PM2
pm2 start src/server.js --name english-foundation-backend

# Check if it's running
pm2 status

# View logs if needed
pm2 logs english-foundation-backend
```

### Option B: Manual Start (if PM2 fails)
```bash
# Navigate to project root
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# Start server manually
node src/server.js
```

## Step 4: Start Frontend Server

### Navigate to Frontend Directory
```bash
cd /mnt/LMS-database/repos/English-Foundation-Adventure/frontend
```

### Install Dependencies (if needed)
```bash
# Only run this if you get dependency errors
npm install
```

### Start Development Server
```bash
# Start the Next.js development server
npm run dev
```

## Step 5: Verify Everything is Running

### Check Backend
```bash
# Check PM2 status
pm2 status

# Test backend API (should return some response)
curl http://localhost:3000/api/health
# or
curl http://localhost:3000/units
```

### Check Frontend
- Open your browser and go to: `http://localhost:3000` (or the port shown in terminal)
- You should see the login page
- Try logging in to verify everything works

## Step 6: Troubleshooting

### If Backend Won't Start

1. **Check for port conflicts:**
```bash
# Check what's using port 3000
sudo netstat -tulpn | grep :3000
# or
sudo lsof -i :3000
```

2. **Kill conflicting processes:**
```bash
# If something is using the port, kill it
sudo kill -9 [PID]
```

3. **Restart PM2:**
```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Start fresh
pm2 start src/server.js --name english-foundation-backend
```

### If Frontend Won't Start

1. **Check for port conflicts:**
```bash
# Check what's using port 3000, 3001, 3002
sudo netstat -tulpn | grep :300
```

2. **Clear Next.js cache:**
```bash
cd frontend
rm -rf .next
npm run dev
```

3. **Reinstall dependencies:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### If Database Issues

1. **Check database connection:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

2. **Check Prisma connection:**
```bash
# Test database connection
npx prisma db pull
```

## Step 7: Quick Start Script

You can create a quick start script to automate this process:

```bash
# Create a startup script
nano /mnt/LMS-database/repos/English-Foundation-Adventure/start_servers.sh
```

Add this content to the script:

```bash
#!/bin/bash

echo "Starting English Foundation Adventure LMS..."

# Navigate to project directory
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# Start backend with PM2
echo "Starting backend server..."
pm2 start src/server.js --name english-foundation-backend

# Wait a moment for backend to start
sleep 3

# Check backend status
echo "Backend status:"
pm2 status

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &

echo "Servers are starting..."
echo "Backend: http://localhost:3000"
echo "Frontend: Check terminal for the correct port (usually 3000, 3001, or 3002)"
echo ""
echo "To stop servers:"
echo "  Backend: pm2 stop english-foundation-backend"
echo "  Frontend: Ctrl+C in the frontend terminal"
```

Make it executable:
```bash
chmod +x start_servers.sh
```

Run it:
```bash
./start_servers.sh
```

## Step 8: Stopping Servers

### Stop Backend
```bash
pm2 stop english-foundation-backend
# or stop all PM2 processes
pm2 stop all
```

### Stop Frontend
- Press `Ctrl+C` in the frontend terminal
- Or find the process and kill it:
```bash
ps aux | grep next
kill -9 [PID]
```

## Step 9: Monitoring

### View Backend Logs
```bash
pm2 logs english-foundation-backend
```

### View Frontend Logs
- Check the terminal where you started `npm run dev`

### Monitor System Resources
```bash
# Check CPU and memory usage
htop

# Check disk space
df -h
```

## Common Issues and Solutions

### Issue: "Port already in use"
**Solution:** Kill the process using the port or use a different port

### Issue: "Module not found"
**Solution:** Run `npm install` in the frontend directory

### Issue: "Database connection failed"
**Solution:** Check if PostgreSQL is running and accessible

### Issue: "PM2 not found"
**Solution:** Install PM2 globally: `npm install -g pm2`

## Emergency Contacts

If you encounter issues not covered in this guide:
1. Check the logs: `pm2 logs` and frontend terminal
2. Restart the system: `sudo reboot`
3. Contact system administrator

## Quick Reference Commands

```bash
# Start everything
cd /mnt/LMS-database/repos/English-Foundation-Adventure
pm2 start src/server.js --name english-foundation-backend
cd frontend && npm run dev

# Check status
pm2 status
ps aux | grep next

# Stop everything
pm2 stop all
# Ctrl+C in frontend terminal
``` 