#!/bin/bash

echo "🚀 Starting English Foundation Adventure LMS (Cluster Mode)..."
echo "================================================"

# Navigate to project directory
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Stop any existing PM2 processes
echo "🛑 Stopping any existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start backend with PM2 in cluster mode
echo "🔧 Starting backend server in cluster mode..."
pm2 start src/server.js --name english-foundation-backend --instances max

# Wait a moment for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check backend status
echo "📊 Backend status:"
pm2 status

# Check if backend started successfully
if pm2 list | grep -q "english-foundation-backend.*online"; then
    echo "✅ Backend started successfully in cluster mode!"
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

echo ""
echo "🎉 Servers are starting..."
echo "================================================"
echo "🔧 Backend: http://localhost:3000 (Cluster Mode)"
echo "🌐 Frontend: Check terminal output for port (usually 3000, 3001, or 3002)"
echo ""
echo "📋 Useful commands:"
echo "  Check backend status: pm2 status"
echo "  View backend logs: pm2 logs english-foundation-backend"
echo "  Stop backend: pm2 stop english-foundation-backend"
echo "  Stop frontend: Ctrl+C in this terminal"
echo ""
echo "🔍 Cluster Mode Benefits:"
echo "  - Better performance under load"
echo "  - Utilizes multiple CPU cores"
echo "  - Automatic load balancing"
echo ""
echo "✅ Startup complete!" 