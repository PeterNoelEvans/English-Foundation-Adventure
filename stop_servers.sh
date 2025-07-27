#!/bin/bash

echo "🛑 Stopping English Foundation Adventure LMS..."
echo "================================================"

# Stop PM2 processes
echo "🔧 Stopping backend server..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Find and kill Next.js processes
echo "🌐 Stopping frontend server..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Check if any processes are still running
echo "🔍 Checking for remaining processes..."
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Some Next.js processes are still running. Force killing..."
    pkill -9 -f "next dev" 2>/dev/null || true
fi

if pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  Some Node.js server processes are still running. Force killing..."
    pkill -9 -f "node.*server.js" 2>/dev/null || true
fi

echo "✅ All servers stopped!"
echo ""
echo "📋 To start servers again, run:"
echo "  ./start_servers.sh" 