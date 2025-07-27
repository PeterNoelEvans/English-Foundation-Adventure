# English Foundation Learning Platform - Setup Instructions

## Project Summary

This project is a comprehensive full-stack learning platform for English Foundation, supporting:
- **Multi-school architecture** with organization-based authentication
- **Teacher and student roles** with role-based access control
- **Subject and Course management** with hierarchical organization
- **Resource management** with file uploads (audio, video, PDF, images) and sharing
- **Assignment system** with multiple question types and auto-scoring
- **Student analytics** with engagement tracking and persistence monitoring
- **Modern UI** with Tailwind CSS and responsive design
- **Process management** with PM2 for production deployment

---

## 1. Prerequisites
- **Node.js** (v16.13 or higher, v22.x recommended)
- **npm** (v8.x or higher)
- **PostgreSQL** (v16 or higher recommended)
- **PM2** (for production process management)

---

## 2. Clone or Copy the Project
- Copy the entire project folder (including `.env`, `prisma/`, `src/`, `frontend/`, etc.) to your new computer.

---

## 3. PostgreSQL Setup

### Ubuntu/Linux Setup:
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create custom data directory (optional)
sudo mkdir -p /mnt/LMS-database/data/postgresql
sudo chown postgres:postgres /mnt/LMS-database/data/postgresql

# Initialize database cluster
sudo -u postgres pg_createcluster 16 main /mnt/LMS-database/data/postgresql/main

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"

# Create database
sudo -u postgres createdb english_foundation
```

### Windows Setup:
1. **Install PostgreSQL** from https://www.postgresql.org/download/windows/
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

## 5. Install Dependencies

### Backend Dependencies:
```bash
npm install
```

### Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

### Install PM2 (for production):
```bash
sudo npm install -g pm2
```

---

## 6. Database Setup
```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## 7. Development Mode

### Start Backend:
```bash
npm run dev
```

### Start Frontend (in another terminal):
```bash
cd frontend
npm run dev -- -p 3001
```

### Access the application:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`

---

## 8. Production Mode with PM2

### Start both applications:
```bash
pm2 start ecosystem.config.js
```

### Useful PM2 commands:
```bash
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 restart all               # Restart all apps
pm2 stop all                  # Stop all apps
pm2 delete all                # Remove all apps
```

---

## 9. Features Overview

### Authentication & Organization:
- **Multi-school support** with organization-based login
- **Role-based access** (ADMIN, TEACHER, STUDENT)
- **JWT authentication** with secure token management

### Teacher Dashboard:
- **Subject Management** - Create and manage subjects
- **Course Structure** - Create courses with descriptions
- **Resource Management** - Upload and share resources (audio, video, PDF, images)
- **Assignment Creation** - Create various question types
- **Student Analytics** - View engagement and progress data
- **Bulk Import** - Import questions in JSON format

### Student Features:
- **Quiz Interface** - Take assignments with various question types
- **Resource Access** - View and download learning materials
- **Progress Tracking** - Monitor assignment completion

### Analytics & Tracking:
- **Session tracking** - Monitor active time and engagement
- **Activity logging** - Track user interactions and page views
- **Assignment attempts** - Record completion times and scores
- **Engagement metrics** - Calculate student engagement scores

---

## 10. Question Types Supported

### Auto-Scored Types:
- **Multiple Choice** (single/multiple answers)
- **True/False**
- **Fill-in-the-Blank**
- **Matching Pairs**
- **Sequencing/Ordering**
- **Drag-and-Drop**
- **Categorization**
- **Hotspot/Clickable Image**
- **Connect-the-Dots**
- **Labeling**
- **Gap Fill with Word Bank**
- **Sentence Building**

### Manual Grading Types:
- **Short Answer**
- **Audio Recording Upload**
- **Image Upload**
- **Video Upload**
- **Drawing/Annotation**
- **Open-Ended Essay**

---

## 11. Resource Management

### Supported File Types:
- **Audio**: MP3, WAV, OGG, AAC, MP4 audio
- **Video**: MP4, WebM, OGG, AVI, MOV
- **Documents**: PDF
- **Images**: JPEG, PNG, GIF, WebP, SVG

### Features:
- **File upload** with progress tracking
- **Resource sharing** across courses
- **Metadata tracking** (file size, type, duration)
- **Public/private visibility** settings
- **Course/unit association**

---

## 12. Analytics System

### Student Analytics:
- **Session duration** and frequency
- **Assignment completion rates**
- **Activity patterns** and user behavior
- **Engagement scoring** based on multiple factors

### School Analytics:
- **Overall engagement rates**
- **Top performing students**
- **Assignment completion trends**
- **Resource usage statistics**

---

## 13. Troubleshooting

### Common Issues:
- **Port Conflicts**: Ensure backend (3000) and frontend (3001) use different ports
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **PM2 Issues**: Check logs with `pm2 logs` and restart if needed
- **File Uploads**: Ensure `/uploads` directory exists and has proper permissions

### Useful Commands:
```bash
# Check Node.js version
node -v

# Check npm version
npm -v

# Check PostgreSQL status (Ubuntu)
sudo systemctl status postgresql

# Check PostgreSQL status (Windows)
# Use services.msc or pg_ctl commands

# View PM2 logs
pm2 logs

# Restart specific app
pm2 restart english-foundation-backend
pm2 restart english-foundation-frontend
```

---

## 14. Deployment

### GitHub Setup:
```bash
git init
git remote add origin https://github.com/PeterNoelEvans/English-Foundation-Adventure.git
git add .
git commit -m "Initial commit with comprehensive features"
git branch -M main
git push -u origin main
```

### Production Considerations:
- **Environment variables** - Set production DATABASE_URL and JWT_SECRET
- **SSL certificates** - Configure HTTPS for production
- **Database backups** - Set up regular PostgreSQL backups
- **Monitoring** - Use PM2 monitoring or external services
- **File storage** - Consider cloud storage for uploads in production

---

## 15. Next Steps
- **Assignment Types**: Implement additional question types as needed
- **AI Integration**: Add AI-powered scoring for open-ended responses
- **Real-time Features**: Add live collaboration and chat features
- **Mobile App**: Develop React Native mobile application
- **Advanced Analytics**: Implement predictive analytics and insights

For help, refer to the README or contact the project maintainer. 