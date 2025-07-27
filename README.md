# English Foundation Learning Platform

A comprehensive full-stack learning management system designed for English Foundation education, featuring multi-school support, advanced analytics, and diverse assignment types.

## 🚀 Features

### 🏫 Multi-School Architecture
- **Organization-based authentication** with role-based access control
- **School-specific data isolation** ensuring privacy and security
- **Scalable infrastructure** supporting multiple educational institutions

### 👨‍🏫 Teacher Dashboard
- **Subject & Course Management** - Create and organize academic content
- **Resource Management** - Upload and share multimedia resources
- **Assignment Creation** - Build diverse question types with auto-scoring
- **Student Analytics** - Track engagement and progress metrics
- **Bulk Import** - Efficiently import questions and content

### 📚 Student Experience
- **Interactive Quizzes** - Engaging assignment types with immediate feedback
- **Resource Access** - Download and view learning materials
- **Progress Tracking** - Monitor completion rates and performance
- **Session Analytics** - Automatic engagement tracking

### 📊 Analytics & Insights
- **Real-time Tracking** - Monitor student sessions and activities
- **Engagement Metrics** - Calculate persistence and frequency scores
- **Performance Analytics** - Track assignment completion and scores
- **School-wide Reports** - Comprehensive institutional insights

### 🎯 Assignment Types
- **12 Auto-Scored Types** - Multiple choice, matching, sequencing, drag-and-drop, and more
- **6 Manual Grading Types** - Essays, audio/video uploads, drawings, and annotations
- **Flexible Scoring** - Configurable points, partial credit, and rubrics
- **Rich Feedback** - Detailed responses and guidance for students

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Multer** for file uploads
- **PM2** for process management

### Frontend
- **Next.js** with TypeScript
- **React** with modern hooks
- **Tailwind CSS** for styling
- **Responsive design** for all devices

### Infrastructure
- **Multi-school data isolation**
- **File upload system** with validation
- **Analytics tracking** with real-time processing
- **Role-based access control**

## 📋 Prerequisites

- Node.js (v16.13 or higher, v22.x recommended)
- npm (v8.x or higher)
- PostgreSQL (v16 or higher)
- PM2 (for production deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/PeterNoelEvans/English-Foundation-Adventure.git
cd English-Foundation-Adventure
```

### 2. Install Dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Database Setup
```bash
# Install PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb english_foundation

# Set up schema
npx prisma db push
npx prisma generate
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/english_foundation?schema=public"
JWT_SECRET="your-super-secret-key-change-this-in-production"
PORT=3000
```

### 5. Start Development Servers
```bash
# Backend (Terminal 1)
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev -- -p 3001
```

### 6. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

## 🏭 Production Deployment

### Using PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start both applications
pm2 start ecosystem.config.js

# Monitor applications
pm2 status
pm2 logs
```

### Environment Variables
Set production environment variables:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-production-secret-key"
NODE_ENV="production"
```

## 📚 Documentation

- **[Setup Instructions](docs/setup_instructions.md)** - Comprehensive setup guide
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Database structure and relationships
- **[Assignment Types](docs/ASSIGNMENT_TYPES.md)** - Detailed assignment type guide

## 🏗 Project Structure

```
English-Foundation-Adventure/
├── src/                    # Backend source code
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── pages/         # Next.js pages
│   │   ├── components/    # React components
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── prisma/                # Database schema and migrations
├── uploads/               # File upload directory
├── docs/                  # Documentation
└── ecosystem.config.js    # PM2 configuration
```

## 🔐 Authentication & Roles

### User Roles
- **ADMIN** - Full system access and school management
- **TEACHER** - Content creation and student management
- **STUDENT** - Assignment completion and resource access

### Organizations
- **PBS School** - Primary educational institution
- **Hospital School** - Medical facility education
- **Coding School** - Technology-focused learning

## 📊 Analytics Features

### Student Tracking
- **Session duration** and frequency monitoring
- **Activity patterns** and user behavior analysis
- **Assignment completion** rates and performance
- **Engagement scoring** based on multiple factors

### School Analytics
- **Overall engagement** rates and trends
- **Top performing** students identification
- **Resource usage** statistics
- **Completion rate** analysis

## 🎨 Assignment Types

### Auto-Scored (12 Types)
1. **Multiple Choice** - Single/multiple answer selection
2. **True/False** - Binary choice questions
3. **Fill-in-the-Blank** - Text input with exact matching
4. **Matching Pairs** - Connect related items
5. **Sequencing** - Arrange items in correct order
6. **Drag and Drop** - Interactive ordering
7. **Categorization** - Sort items into groups
8. **Hotspot** - Click on image areas
9. **Connect-the-Dots** - Draw connections
10. **Labeling** - Label image parts
11. **Gap Fill** - Complete with word bank
12. **Sentence Building** - Construct from fragments

### Manual Grading (6 Types)
1. **Short Answer** - Brief text responses
2. **Audio Recording** - Voice response uploads
3. **Image Upload** - Photo submissions
4. **Video Upload** - Video presentations
5. **Drawing/Annotation** - Canvas-based work
6. **Open-Ended Essay** - Extended written responses

## 🔧 Development

### Available Scripts
```bash
# Backend
npm run dev          # Start development server
npm run start        # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:push  # Push schema to database

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Code Style
- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **TypeScript** for type safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review [setup instructions](docs/setup_instructions.md)
- Open an issue on GitHub

## 🚀 Roadmap

### Upcoming Features
- **AI-Powered Grading** - Automated essay and audio assessment
- **Real-time Collaboration** - Live student-teacher interaction
- **Mobile Application** - React Native mobile app
- **Advanced Analytics** - Predictive insights and recommendations
- **Virtual Labs** - Interactive science experiments
- **Accessibility Enhancements** - Full WCAG compliance

### Performance Improvements
- **Caching Layer** - Redis integration for faster responses
- **CDN Integration** - Global content delivery
- **Database Optimization** - Query performance improvements
- **Image Processing** - Automatic thumbnail generation

---

**Built with ❤️ for English Foundation Education** 