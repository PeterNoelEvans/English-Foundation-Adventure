#!/bin/bash

echo "🚀 Starting English Foundation Adventure LMS..."
echo "================================================"

# Navigate to project directory
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Comprehensive cleanup - stop all existing processes
echo "🛑 Performing comprehensive cleanup..."
echo "  - Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo "  - Stopping Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

echo "  - Stopping Node.js server processes..."
pkill -f "node.*server.js" 2>/dev/null || true

echo "  - Force killing any remaining processes..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "node.*server.js" 2>/dev/null || true

# Wait a moment for processes to fully stop
sleep 2

# Check if ports are free
echo "🔍 Checking port availability..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is still in use. Force killing processes on port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is still in use. Force killing processes on port 3001..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start backend with PM2
echo "🔧 Starting backend server..."
pm2 start src/server.js --name english-foundation-backend

# Wait a moment for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check backend status
echo "📊 Backend status:"
pm2 status

# Check if backend started successfully
if pm2 list | grep -q "english-foundation-backend.*online"; then
    echo "✅ Backend started successfully!"
else
    echo "❌ Backend failed to start. Check logs with: pm2 logs english-foundation-backend"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
echo "🌐 Starting Next.js development server..."
npm run dev &

# Wait a moment for frontend to start
sleep 5

# Start Cloudflare tunnel
echo "🌍 Starting Cloudflare tunnel..."
cd ..
cloudflared tunnel run --token eyJhIjoiMTlmY2NkODg1MzVkNzZmNzhmOTBiYzFhNDlmZGNlMDMiLCJ0IjoiM2M2N2ZmYjMtOGM2Zi00MzE5LWJiM2ItZTU1NjMwYWQ4MDM4IiwicyI6Ik5EVXhOamswTWpRdFl6STBOaTAwWWpaakxUaG1ZMk10WXpOak0yWXdaRE00TW1ReCJ9 &
TUNNEL_PID=$!

# Wait for tunnel to start
sleep 3

echo ""
echo "🎉 Servers are starting..."
echo "================================================"
echo "🔧 Backend: http://localhost:3000"
echo "🌐 Frontend: Check terminal output for port (usually 3000, 3001, or 3002)"
echo "🌍 Tunnel: https://lms-pne.uk"
echo ""
echo "📋 Useful commands:"
echo "  Check backend status: pm2 status"
echo "  View backend logs: pm2 logs english-foundation-backend"
echo "  Stop backend: pm2 stop english-foundation-backend"
echo "  Stop frontend: Ctrl+C in this terminal"
echo "  Stop tunnel: pkill -f cloudflared"
echo ""
echo "🔍 To verify everything is working:"
echo "  1. Open your browser and go to https://lms-pne.uk"
echo "  2. You should see the login page"
echo "  3. Try logging in to verify backend connectivity"
echo "  4. Test registration from another computer"
echo ""
echo "✅ Startup complete!" 