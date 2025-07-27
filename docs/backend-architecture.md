# Backend Architecture - Future-Proof LMS

## Overview
This document outlines the backend architecture for the multi-organization, classroom-based LMS with assessment banks, multiple resources, and robust session tracking.

## Technology Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with session tracking
- **File Storage**: Local filesystem (configurable for cloud storage)
- **Email**: Configurable email service (SendGrid, Mailgun, etc.)
- **Deployment**: PM2 with separate instances per organization

## Core Architecture Principles

### 1. Multi-Organization Support
- **Option B (Recommended)**: Separate instances per organization
- Each organization has its own database, config, and subdomain
- Shared codebase for easy updates and maintenance
- Environment-based configuration per organization

### 2. Classroom-Based Structure
- All queries are scoped to classroom and organization
- Students and teachers only see data from their assigned classrooms
- Support for P1-P6 and M1-M6 with up to 6 classes per level

### 3. Assessment Bank System
- Assessments can exist in "draft" or "unattached" state
- Teachers can create assessments without immediate assignment
- Assessment assignment can be changed at any time
- Support for multiple resources per assessment

### 4. Robust Session Tracking
- Heartbeat/ping mechanism for reliable session data
- Auto-expiry of inactive sessions
- IP and user agent tracking for security

## API Structure

### Authentication & Users
```
POST   /api/auth/login              # Login with session creation
POST   /api/auth/logout             # Logout with session ending
POST   /api/auth/register           # User registration
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Password reset
GET    /api/auth/me                 # Get current user
PATCH  /api/auth/me                 # Update user profile
POST   /api/session/ping            # Session heartbeat
```

### Organizations & Classrooms
```
GET    /api/organizations           # List organizations (admin only)
GET    /api/classrooms              # List classrooms for current org
POST   /api/classrooms              # Create classroom (admin/teacher)
GET    /api/classrooms/:id          # Get classroom details
PATCH  /api/classrooms/:id          # Update classroom
DELETE /api/classrooms/:id          # Delete classroom
GET    /api/classrooms/:id/students # Get students in classroom
```

### Course Structure
```
GET    /api/core-subjects           # List core subjects
POST   /api/core-subjects           # Create core subject
GET    /api/subjects                # List subjects (filtered by org/classroom)
POST   /api/subjects                # Create subject
GET    /api/subjects/:id            # Get subject with full structure
PATCH  /api/subjects/:id            # Update subject
DELETE /api/subjects/:id            # Archive subject
POST   /api/subjects/:id/auto-structure # Auto-create from TOC
```

### Units, Parts, Sections
```
GET    /api/subjects/:id/units      # Get units for subject
POST   /api/subjects/:id/units      # Create unit
GET    /api/units/:id/parts         # Get parts for unit
POST   /api/units/:id/parts         # Create part
GET    /api/parts/:id/sections      # Get sections for part
POST   /api/parts/:id/sections      # Create section
```

### Assessments
```
GET    /api/assessments             # List assessments (with filters)
POST   /api/assessments             # Create assessment (draft or assigned)
GET    /api/assessments/bank        # Get assessment bank (unattached)
GET    /api/assessments/:id         # Get assessment details
PATCH  /api/assessments/:id         # Update assessment
DELETE /api/assessments/:id         # Delete assessment
POST   /api/assessments/:id/assign  # Assign assessment to course structure
POST   /api/assessments/:id/publish # Publish assessment
POST   /api/assessments/:id/duplicate # Duplicate assessment
```

### Resources
```
GET    /api/resources               # List resources (with filters)
POST   /api/resources               # Upload/create resource
GET    /api/resources/:id           # Get resource details
PATCH  /api/resources/:id           # Update resource
DELETE /api/resources/:id           # Delete resource
POST   /api/resources/:id/reorder   # Reorder resources
GET    /api/resources/:id/download  # Download resource file
```

### Student Management
```
GET    /api/students                # List students (filtered by classroom)
POST   /api/students                # Create student
GET    /api/students/:id            # Get student details
PATCH  /api/students/:id            # Update student
PATCH  /api/students/:id/promote    # Promote to next level
GET    /api/students/:id/progress   # Get student progress
GET    /api/students/:id/sessions   # Get student session data
```

### Assessment Submissions
```
GET    /api/submissions             # List submissions (teacher view)
POST   /api/submissions             # Submit assessment (student)
GET    /api/submissions/:id         # Get submission details
PATCH  /api/submissions/:id         # Grade submission (teacher)
GET    /api/submissions/:id/attempts # Get submission attempts
```

### Session Analytics
```
GET    /api/sessions/analytics      # Get session analytics
GET    /api/sessions/:userId        # Get user session data
GET    /api/sessions/:userId/frequency # Get login pattern analysis
GET    /api/sessions/class/:classroomId # Get class session data
```

## Database Query Patterns

### 1. Organization Scoping
All queries must be scoped to the current organization:
```javascript
// Get current organization from JWT or config
const organizationId = req.user.organizationId || process.env.ORGANIZATION_ID;

// Always include organization filter
const data = await prisma.model.findMany({
  where: { organizationId }
});
```

### 2. Classroom Filtering
For student/teacher data, always filter by classroom:
```javascript
const classroomId = req.user.classroomId;
const data = await prisma.model.findMany({
  where: { 
    organizationId,
    classroomId 
  }
});
```

### 3. Assessment-Subject Mapping
Use utility functions for assessment queries:
```javascript
// Utility function for getting assessments by subject
async function getAssessmentsBySubject(subjectId, includeUnattached = false) {
  const where = {
    subjectId,
    // Include full chain for proper filtering
    subject: {
      organizationId: req.user.organizationId
    }
  };
  
  if (!includeUnattached) {
    where.resources = { some: {} }; // Only attached assessments
  }
  
  return await prisma.assessment.findMany({ where });
}
```

## Security Implementation

### 1. Authentication
- JWT tokens with organization and role claims
- Session tracking with heartbeat mechanism
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### 2. Authorization
- Role-based access control (ADMIN, TEACHER, STUDENT, PARENT)
- Classroom-based data isolation
- Organization-based data isolation
- Resource-level permissions

### 3. Input Validation
- Express-validator for all endpoints
- File upload validation and sanitization
- SQL injection prevention via Prisma
- XSS protection

## File Upload System

### 1. Resource Files
- Support for multiple file types (audio, video, images, documents)
- File size limits and type validation
- Unique filename generation
- Thumbnail generation for media files
- Label-based linking for robust assessment integration

### 2. Media Files
- Assessment-specific media files
- Label field for reliable linking
- Support for multiple media files per assessment
- Automatic cleanup on assessment deletion

## Session Management

### 1. Session Creation
```javascript
// On login
const session = await prisma.userSession.create({
  data: {
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
});
```

### 2. Heartbeat System
```javascript
// Ping endpoint for session heartbeat
app.post('/api/session/ping', auth, async (req, res) => {
  await prisma.userSession.updateMany({
    where: {
      userId: req.user.userId,
      endTime: null
    },
    data: { lastActive: new Date() }
  });
  res.json({ success: true });
});
```

### 3. Auto-Expiry
```javascript
// Scheduled job to close inactive sessions
async function closeInactiveSessions() {
  const timeoutMinutes = 10;
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
  
  await prisma.userSession.updateMany({
    where: {
      endTime: null,
      lastActive: { lt: cutoffTime }
    },
    data: {
      endTime: new Date(),
      duration: Math.floor((new Date().getTime() - lastActive.getTime()) / 1000)
    }
  });
}
```

## Error Handling

### 1. Global Error Handler
```javascript
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ 
      error: 'Database operation failed',
      details: error.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});
```

### 2. Validation Errors
```javascript
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};
```

## Performance Optimization

### 1. Database Indexing
- Indexes on frequently queried fields (organizationId, classroomId, userId)
- Composite indexes for complex queries
- Indexes on session tracking fields

### 2. Query Optimization
- Use Prisma's include for related data
- Implement pagination for large datasets
- Cache frequently accessed data

### 3. File Handling
- Stream large file uploads
- Implement file compression
- Use CDN for static assets

## Deployment Strategy

### 1. Environment Configuration
```bash
# .env.pbs
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/pbs_lms"
ORGANIZATION_ID="pbs-org-id"
JWT_SECRET="your-secret"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="your-key"

# .env.hospital
PORT=3001
DATABASE_URL="postgresql://user:pass@localhost:5432/hospital_lms"
ORGANIZATION_ID="hospital-org-id"
JWT_SECRET="your-secret"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="your-key"
```

### 2. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pbs-lms',
      script: 'server.js',
      env_file: '.env.pbs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'hospital-lms',
      script: 'server.js',
      env_file: '.env.hospital',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### 3. Database Setup
```sql
-- Create separate databases for each organization
CREATE DATABASE pbs_lms;
CREATE DATABASE hospital_lms;
CREATE DATABASE coding_lms;

-- Run migrations for each database
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## Monitoring & Logging

### 1. Application Logs
- Structured logging with Winston
- Log levels: error, warn, info, debug
- Log rotation and archiving

### 2. Performance Monitoring
- Response time tracking
- Database query monitoring
- Memory and CPU usage tracking

### 3. Error Tracking
- Error aggregation and alerting
- Stack trace analysis
- User impact assessment

## Testing Strategy

### 1. Unit Tests
- Test individual functions and utilities
- Mock database and external services
- Test error handling and edge cases

### 2. Integration Tests
- Test API endpoints
- Test database operations
- Test authentication and authorization

### 3. End-to-End Tests
- Test complete user workflows
- Test cross-browser compatibility
- Test performance under load

## Future Enhancements

### 1. Real-time Features
- WebSocket support for live updates
- Real-time notifications
- Collaborative editing

### 2. Advanced Analytics
- Learning analytics dashboard
- Progress tracking and reporting
- Predictive analytics

### 3. Mobile Support
- Mobile-responsive design
- Progressive Web App (PWA)
- Native mobile apps

### 4. Integration Capabilities
- Third-party LMS integrations
- SSO support
- API for external tools 