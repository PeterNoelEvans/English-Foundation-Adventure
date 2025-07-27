# Quick Startup Commands

## 🚀 After Power Outage or Restart

### Option 1: Use the Automated Script (Recommended)
```bash
cd /mnt/LMS-database/repos/English-Foundation-Adventure
./start_servers.sh
```

### Option 2: Manual Startup
```bash
# Navigate to project
cd /mnt/LMS-database/repos/English-Foundation-Adventure

# Start backend
pm2 start src/server.js --name english-foundation-backend

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## 🛑 Stop Everything
```bash
./stop_servers.sh
```

## 📊 Check Status
```bash
# Check backend
pm2 status

# Check frontend
ps aux | grep next
```

## 🔧 Troubleshooting
```bash
# If backend won't start
pm2 stop all
pm2 delete all
pm2 start src/server.js --name english-foundation-backend

# If frontend won't start
cd frontend
rm -rf .next
npm run dev

# If database issues
sudo systemctl start postgresql
```

## 🌐 Access URLs
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:3000 (or port shown in terminal)

## 📋 Essential Commands
```bash
# View backend logs
pm2 logs english-foundation-backend

# Restart backend
pm2 restart english-foundation-backend

# Check what's using ports
sudo netstat -tulpn | grep :3000
``` 