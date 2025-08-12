#!/bin/bash

echo "🔄 Restarting English Foundation Adventure LMS..."
echo "================================================"

# Navigate to project directory
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# First, stop all servers
echo "🛑 Step 1: Stopping all servers..."
./stop_servers.sh

# Wait a moment
echo ""
echo "⏳ Step 2: Waiting for cleanup to complete..."
sleep 3

# Then start all servers
echo ""
echo "🚀 Step 3: Starting all servers..."
./start_servers.sh

echo ""
echo "✅ Restart complete!" 