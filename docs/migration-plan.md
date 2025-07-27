# Migration Plan - Current to Future-Proof LMS

## Overview
This document outlines the step-by-step migration plan from the current LMS system to the new future-proof architecture with multi-organization support, classroom structure, and assessment banks.

## Current State Analysis

### What We Have
- Single-tenant system with organization field on users
- Basic grade level support (P1-P6, M1-M6)
- Simple course structure
- Basic session tracking (with logout issues)
- Single database for all organizations

### What We Need
- Multi-organization support with separate instances
- Classroom-based structure (P1/1, P1/2, etc.)
- Assessment bank system
- Multiple resources per assessment
- Robust session tracking with heartbeat
- Separate databases per organization

## Migration Strategy

### Phase 1: Preparation (Week 1-2)

#### 1.1 Database Setup
```bash
# Create separate databases for each organization
sudo -u postgres psql
CREATE DATABASE pbs_lms;
CREATE DATABASE hospital_lms;
CREATE DATABASE coding_lms;
\q

# Set up environment files
cp .env .env.pbs
cp .env .env.hospital
cp .env .env.coding

# Update each .env file with appropriate database URLs
```

#### 1.2 Environment Configuration
```bash
# .env.pbs
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/pbs_lms"
ORGANIZATION_ID="pbs-org-id"
ORGANIZATION_NAME="PBS"
ORGANIZATION_CODE="PBS"

# .env.hospital
PORT=3001
DATABASE_URL="postgresql://user:pass@localhost:5432/hospital_lms"
ORGANIZATION_ID="hospital-org-id"
ORGANIZATION_NAME="Hospital"
ORGANIZATION_CODE="HOSPITAL"

# .env.coding
PORT=3002
DATABASE_URL="postgresql://user:pass@localhost:5432/coding_lms"
ORGANIZATION_ID="coding-org-id"
ORGANIZATION_NAME="Coding School"
ORGANIZATION_CODE="CODING"
```

#### 1.3 PM2 Configuration
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
      max_memory_restart: '1G',
      error_file: './logs/pbs-error.log',
      out_file: './logs/pbs-out.log',
      log_file: './logs/pbs-combined.log'
    },
    {
      name: 'hospital-lms',
      script: 'server.js',
      env_file: '.env.hospital',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/hospital-error.log',
      out_file: './logs/hospital-out.log',
      log_file: './logs/hospital-combined.log'
    },
    {
      name: 'coding-lms',
      script: 'server.js',
      env_file: '.env.coding',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/coding-error.log',
      out_file: './logs/coding-out.log',
      log_file: './logs/coding-combined.log'
    }
  ]
};
```

### Phase 2: Schema Migration (Week 2-3)

#### 2.1 Apply New Schema
```bash
# For each organization database
DATABASE_URL="postgresql://user:pass@localhost:5432/pbs_lms" npx prisma migrate dev --name init-future-proof
DATABASE_URL="postgresql://user:pass@localhost:5432/hospital_lms" npx prisma migrate dev --name init-future-proof
DATABASE_URL="postgresql://user:pass@localhost:5432/coding_lms" npx prisma migrate dev --name init-future-proof
```

#### 2.2 Data Migration Scripts
Create migration scripts to transfer data from the old system:

```javascript
// scripts/migrate-data.js
const { PrismaClient } = require('@prisma/client');

async function migrateOrganizationData() {
  const oldPrisma = new PrismaClient({
    datasources: { db: { url: process.env.OLD_DATABASE_URL } }
  });
  
  const newPrisma = new PrismaClient({
    datasources: { db: { url: process.env.NEW_DATABASE_URL } }
  });

  try {
    // Migrate organizations
    const organizations = [
      { name: 'PBS', code: 'PBS', domain: 'pbs.yourdomain.com' },
      { name: 'Hospital', code: 'HOSPITAL', domain: 'hospital.yourdomain.com' },
      { name: 'Coding School', code: 'CODING', domain: 'coding.yourdomain.com' }
    ];

    for (const org of organizations) {
      await newPrisma.organization.create({
        data: org
      });
    }

    // Migrate users with organization mapping
    const oldUsers = await oldPrisma.user.findMany();
    
    for (const user of oldUsers) {
      const organization = await newPrisma.organization.findFirst({
        where: { code: user.organization || 'PBS' }
      });

      await newPrisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: organization.id,
          // Map grade level to classroom
          classroom: user.gradeLevel ? {
            connectOrCreate: {
              where: {
                organizationId_yearLevel_classNum: {
                  organizationId: organization.id,
                  yearLevel: user.gradeLevel,
                  classNum: '1' // Default to class 1
                }
              },
              create: {
                organizationId: organization.id,
                yearLevel: user.gradeLevel,
                classNum: '1',
                name: `${user.gradeLevel} Class 1`
              }
            }
          } : undefined
        }
      });
    }

    // Migrate subjects and course structure
    // ... (detailed migration logic)

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}
```

### Phase 3: Backend Updates (Week 3-4)

#### 3.1 Update Authentication System
```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with organization and classroom info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
        classroom: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      classroomId: user.classroomId,
      organization: user.organization,
      classroom: user.classroom
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { auth };
```

#### 3.2 Update API Routes
```javascript
// src/routes/assessments.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get assessments with organization and classroom filtering
router.get('/', auth, requireRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { classroomId, subjectId, includeUnattached } = req.query;
    
    const where = {
      organizationId: req.user.organizationId
    };

    if (classroomId) {
      where.classroomId = classroomId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Only show attached assessments unless specifically requested
    if (!includeUnattached) {
      where.resources = { some: {} };
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        resources: {
          orderBy: { order: 'asc' }
        },
        mediaFiles: true,
        classroom: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assessment with multiple resources
router.post('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { title, description, type, resources, classroomId, subjectId, ...otherFields } = req.body;

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        type,
        createdById: req.user.userId,
        organizationId: req.user.organizationId,
        classroomId,
        subjectId,
        ...otherFields,
        resources: resources ? {
          create: resources.map((resource, index) => ({
            title: resource.title,
            type: resource.type,
            filePath: resource.filePath,
            label: resource.label || `resource_${index}`,
            order: index,
            createdById: req.user.userId
          }))
        } : undefined
      },
      include: {
        resources: true,
        mediaFiles: true
      }
    });

    res.status(201).json({ assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

### Phase 4: Frontend Updates (Week 4-5)

#### 4.1 Update API Client
```javascript
// frontend/src/api/index.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000
});

// Add organization context to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add session heartbeat
setInterval(() => {
  const token = localStorage.getItem('token');
  if (token) {
    api.post('/session/ping').catch(() => {
      // Silent fail for heartbeat
    });
  }
}, 60000); // Every minute

export default api;
```

#### 4.2 Update Registration Form
```typescript
// frontend/src/pages/register.tsx
const Register: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    classroomId: '',
  });

  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    // Fetch classrooms for the current organization
    api.get('/classrooms').then(res => {
      setClassrooms(res.data.classrooms);
    });
  }, []);

  // ... rest of component
};
```

### Phase 5: Testing & Deployment (Week 5-6)

#### 5.1 Testing Strategy
```bash
# Test each organization instance
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@pbs.com","password":"password"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@hospital.com","password":"password"}'

curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@coding.com","password":"password"}'
```

#### 5.2 Deployment Steps
```bash
# 1. Stop current services
pm2 stop all

# 2. Deploy new code
git pull origin main

# 3. Install dependencies
npm install

# 4. Run migrations for each organization
DATABASE_URL="postgresql://user:pass@localhost:5432/pbs_lms" npx prisma migrate deploy
DATABASE_URL="postgresql://user:pass@localhost:5432/hospital_lms" npx prisma migrate deploy
DATABASE_URL="postgresql://user:pass@localhost:5432/coding_lms" npx prisma migrate deploy

# 5. Start new services
pm2 start ecosystem.config.js

# 6. Monitor logs
pm2 logs
```

### Phase 6: DNS & Proxy Configuration (Week 6)

#### 6.1 Nginx Configuration
```nginx
# /etc/nginx/sites-available/lms
server {
    listen 80;
    server_name pbs.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name hospital.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        # ... same proxy settings
    }
}

server {
    listen 80;
    server_name coding.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        # ... same proxy settings
    }
}
```

#### 6.2 SSL Configuration
```bash
# Install SSL certificates for each subdomain
sudo certbot --nginx -d pbs.yourdomain.com
sudo certbot --nginx -d hospital.yourdomain.com
sudo certbot --nginx -d coding.yourdomain.com
```

## Rollback Plan

### If Migration Fails
1. **Immediate Rollback**: Stop new services and restart old service
2. **Database Rollback**: Restore from backup
3. **Code Rollback**: Revert to previous git commit
4. **Investigation**: Analyze failure and fix issues
5. **Retry**: Attempt migration again with fixes

### Backup Strategy
```bash
# Create backups before migration
pg_dump old_lms > backup_old_lms_$(date +%Y%m%d_%H%M%S).sql

# Create backups of new databases after migration
pg_dump pbs_lms > backup_pbs_lms_$(date +%Y%m%d_%H%M%S).sql
pg_dump hospital_lms > backup_hospital_lms_$(date +%Y%m%d_%H%M%S).sql
pg_dump coding_lms > backup_coding_lms_$(date +%Y%m%d_%H%M%S).sql
```

## Success Criteria

### Technical Success
- [ ] All three organization instances running independently
- [ ] Data properly migrated and accessible
- [ ] Session tracking working with heartbeat
- [ ] Multiple resources per assessment functional
- [ ] Classroom-based filtering working
- [ ] Assessment bank system operational

### User Success
- [ ] Users can log in to their organization-specific domain
- [ ] Teachers can create and manage assessments with multiple resources
- [ ] Students can access their classroom-specific content
- [ ] Session analytics providing reliable data
- [ ] No data leakage between organizations

### Performance Success
- [ ] Response times under 500ms for most operations
- [ ] Database queries optimized and indexed
- [ ] File uploads working efficiently
- [ ] Memory usage stable across all instances

## Post-Migration Tasks

### 1. Monitoring Setup
- Set up monitoring for all three instances
- Configure alerts for downtime or errors
- Monitor database performance

### 2. User Training
- Update user documentation
- Provide training for new features
- Create video tutorials for assessment bank usage

### 3. Optimization
- Analyze performance metrics
- Optimize slow queries
- Implement caching where beneficial

### 4. Feature Rollout
- Gradually enable new features
- Collect user feedback
- Iterate based on usage patterns

## Timeline Summary

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2  | Preparation | Database setup, environment config, PM2 setup |
| 2-3  | Schema Migration | Apply new schema, data migration scripts |
| 3-4  | Backend Updates | Update auth, API routes, session management |
| 4-5  | Frontend Updates | Update API client, forms, UI components |
| 5-6  | Testing & Deployment | Testing, deployment, monitoring |
| 6    | DNS & SSL | Nginx config, SSL certificates |

**Total Duration**: 6 weeks
**Risk Level**: Medium (due to data migration complexity)
**Success Probability**: High (with proper testing and rollback plan) 