# Database Schema Documentation

## Overview
The English Foundation Learning Platform uses PostgreSQL with Prisma ORM. The database supports multi-school architecture with role-based access control, comprehensive resource management, and detailed analytics tracking.

---

## Core Models

### User
Represents all users in the system with role-based access.

```sql
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  role          Role     @default(STUDENT)
  school        School   @relation(fields: [schoolId], references: [id])
  schoolId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  courses       Course[]
  units         Unit[]
  assignments   Assignment[]
  resourcesCreated Resource[] @relation("ResourceCreatedBy")
  studentSessions StudentSession[] @relation("StudentSessions")
  studentActivities StudentActivity[] @relation("StudentActivities")
  assignmentAttempts AssignmentAttempt[] @relation("AssignmentAttempts")

  @@unique([email, schoolId])
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `email`: User's email address
- `password`: Hashed password
- `firstName`, `lastName`: User's name
- `role`: User role (ADMIN, TEACHER, STUDENT)
- `schoolId`: Associated school
- `createdAt`, `updatedAt`: Timestamps

### School
Represents different educational institutions.

```sql
model School {
  id            String   @id @default(uuid())
  name          String
  code          String   @unique
  address       String?
  phone         String?
  email         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  users         User[]
  subjects      Subject[]
  courses       Course[]
  units         Unit[]
  assignments   Assignment[]
  resources     Resource[]
  studentSessions StudentSession[]
  studentActivities StudentActivity[]
  assignmentAttempts AssignmentAttempt[]
}
```

---

## Academic Structure

### Subject
Represents academic subjects within a school.

```sql
model Subject {
  id            String   @id @default(uuid())
  name          String
  school        School   @relation(fields: [schoolId], references: [id])
  schoolId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  courses       Course[]

  @@unique([name, schoolId])
}
```

### Course
Represents courses within a subject.

```sql
model Course {
  id            String   @id @default(uuid())
  name          String
  description   String?
  subject       Subject  @relation(fields: [subjectId], references: [id])
  subjectId     String
  school        School   @relation(fields: [schoolId], references: [id])
  schoolId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  units         Unit[]
  assignments   Assignment[]
  resources     Resource[]

  @@unique([name, schoolId])
}
```

### Unit
Represents units within a course.

```sql
model Unit {
  id            String   @id @default(uuid())
  name          String
  course        Course   @relation(fields: [courseId], references: [id])
  courseId      String
  school        School   @relation(fields: [schoolId], references: [id])
  schoolId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  assignments   Assignment[]
  resources     Resource[]

  @@unique([name, courseId])
}
```

---

## Content Management

### Assessment
Represents assessments that students can complete.

```sql
model Assessment {
  id          String   @id @default(uuid())
  title       String
  description String?
  type        String   // Assessment type: 'multiple-choice', 'true-false', 'matching', 'drag-and-drop', 'writing', 'writing-long', 'speaking', 'assignment', 'listening'
  subtype     String?  // For drag-and-drop: 'ordering', 'categorization', 'fill-blank', 'labeling', 'image-caption'
  category    String?  // e.g., 'Grammar', 'Listening', 'Speaking', 'Vocabulary', etc.
  difficulty  String?  // 'beginner', 'intermediate', 'advanced'
  timeLimit   Int?     // Time limit in minutes (null = no limit)
  points      Int      @default(1) // Points per question or total points
  
  // Content and questions
  questions   Json?    // Question data structure varies by type
  instructions String? // Specific instructions for the assessment
  
  // Grading and feedback
  criteria    String?  // Grading criteria/rubric for manually graded assessments
  autoGrade   Boolean  @default(true) // Whether assessment can be auto-graded
  showFeedback Boolean @default(true) // Whether to show feedback after submission
  
  // Scheduling
  dueDate     DateTime? // For assignments
  availableFrom DateTime? // When assessment becomes available
  availableTo   DateTime? // When assessment becomes unavailable
  quarter     String   @default("Q1") // "Q1", "Q2", "Q3", "Q4"
  
  // Settings
  published   Boolean  @default(true)
  maxAttempts Int?     // Maximum allowed attempts (null = unlimited)
  shuffleQuestions Boolean @default(false) // Whether to shuffle question order
  allowReview Boolean  @default(true) // Whether students can review after submission
  
  // Metadata
  tags        String[] // Array of tags for categorization
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  createdById String
  createdBy   User @relation("AssessmentCreator", fields: [createdById], references: [id])
  
  // Assignment relationships (nullable for assessment bank/drafts)
  courseId    String?
  course      Course? @relation(fields: [courseId], references: [id])
  unitId      String?
  unit        Unit? @relation(fields: [unitId], references: [id])
  partId      String?
  part        Part? @relation(fields: [partId], references: [id])
  sectionId   String?
  section     Section? @relation(fields: [sectionId], references: [id])
  topicId     String?
  topic       Topic? @relation(fields: [topicId], references: [id])
  
  // Resources and media
  resources   Resource[]
  mediaFiles  MediaFile[]
  
  // Submissions
  submissions AssessmentSubmission[]

  @@map("assessments")
}
```

### MediaFile
Represents media files associated with assessments.

```sql
model MediaFile {
  id            String     @id @default(uuid())
  type          String     // 'audio', 'video', 'image'
  url           String?    // For external media
  filePath      String?    // For uploaded files
  duration      Int?       // For audio/video duration in seconds
  label         String?    // Original field name or label for robust linking
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Relationships
  assessmentId  String
  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@map("media_files")
}
```

### Resource
Represents learning resources (files, media, etc.).

```sql
model Resource {
  id            String   @id @default(uuid())
  title         String
  description   String?
  type          String   // AUDIO, VIDEO, PDF, IMAGE
  fileName      String
  filePath      String
  fileSize      Int      // in bytes
  mimeType      String
  duration      Int?     // for audio/video in seconds
  thumbnail     String?  // thumbnail path for videos
  isShared      Boolean  @default(false)  // Whether this is a shared template
  isPublic      Boolean  @default(false)
  tags          String[] // array of tags for categorization
  templateId    String?  // Reference to original template if this is a copy
  template      Resource? @relation("ResourceTemplate", fields: [templateId], references: [id])
  copies        Resource[] @relation("ResourceTemplate")
  unit          Unit?    @relation(fields: [unitId], references: [id])
  unitId        String?
  course        Course?  @relation(fields: [courseId], references: [id])
  courseId      String?
  school        School?  @relation(fields: [schoolId], references: [id])
  schoolId      String?
  createdBy     User     @relation("ResourceCreatedBy", fields: [createdById], references: [id])
  createdById   String
  studentActivities StudentActivity[] @relation("ResourceActivities")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Analytics Models

### StudentSession
Tracks student session data for engagement analytics.

```sql
model StudentSession {
  id          String   @id @default(uuid())
  student     User     @relation("StudentSessions", fields: [studentId], references: [id])
  studentId   String
  school      School   @relation(fields: [schoolId], references: [id])
  schoolId    String
  sessionType String   // LOGIN, ASSIGNMENT, QUIZ, RESOURCE_VIEW
  startTime   DateTime @default(now())
  endTime     DateTime?
  duration    Int?     // in seconds
  metadata    Json?    // Additional session data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### StudentActivity
Tracks individual student activities and interactions.

```sql
model StudentActivity {
  id          String   @id @default(uuid())
  student     User     @relation("StudentActivities", fields: [studentId], references: [id])
  studentId   String
  school      School   @relation(fields: [schoolId], references: [id])
  schoolId    String
  activityType String  // PAGE_VIEW, QUESTION_ANSWER, ASSIGNMENT_START, etc.
  page        String?  // URL or page identifier
  assignment  Assignment? @relation("AssignmentActivities", fields: [assignmentId], references: [id])
  assignmentId String?
  questionId  String?  // Question ID if applicable
  resource    Resource? @relation("ResourceActivities", fields: [resourceId], references: [id])
  resourceId  String?
  metadata    Json?    // Additional activity data
  timestamp   DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### AssignmentAttempt
Tracks student attempts at completing assignments.

```sql
model AssignmentAttempt {
  id          String   @id @default(uuid())
  student     User     @relation("AssignmentAttempts", fields: [studentId], references: [id])
  studentId   String
  assignment  Assignment @relation("AssignmentAttempts", fields: [assignmentId], references: [id])
  assignmentId String
  school      School   @relation(fields: [schoolId], references: [id])
  schoolId    String
  status      String   // STARTED, IN_PROGRESS, COMPLETED, ABANDONED
  startTime   DateTime @default(now())
  endTime     DateTime?
  totalTime   Int?     // Total time spent in seconds
  score       Float?   // Final score if applicable
  answers     Json?    // Student's answers
  feedback    Json?    // Feedback data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([studentId, assignmentId])
}
```

---

## Enums

### Role
```sql
enum Role {
  ADMIN
  TEACHER
  STUDENT
}
```

---

## Key Relationships

### Multi-School Architecture
- All major models include `schoolId` for data isolation
- Users are associated with specific schools
- Resources and content are school-scoped

### Hierarchical Structure
```
School → Subject → Course → Unit → Assignment → Question
```

### Resource Sharing
- Resources can be shared across schools (`isShared: true`)
- Shared resources act as templates
- Allocation creates copies linked to specific schools/courses

### Analytics Tracking
- Student sessions track engagement time
- Activities log user interactions
- Assignment attempts record completion data

---

## Indexes and Constraints

### Unique Constraints
- `User`: `[email, schoolId]` - Email unique per school
- `Subject`: `[name, schoolId]` - Subject name unique per school
- `Course`: `[name, schoolId]` - Course name unique per school
- `Unit`: `[name, courseId]` - Unit name unique per course
- `AssignmentAttempt`: `[studentId, assignmentId]` - One attempt per student per assignment

### Foreign Key Relationships
- All models properly reference their parent entities
- Cascade deletes configured where appropriate
- Optional relationships for flexible data modeling

---

## Data Migration Notes

### Schema Evolution
- The schema has evolved from `CoreSubject` to `Subject`
- `coreSubjectId` fields renamed to `subjectId`
- Analytics models added for comprehensive tracking

### Migration Commands
```bash
# Apply schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

---

## Performance Considerations

### Query Optimization
- Indexes on frequently queried fields
- Efficient joins for hierarchical data
- Pagination for large result sets

### Data Retention
- Analytics data can grow large over time
- Consider archiving old session/activity data
- Implement data retention policies

### Backup Strategy
- Regular PostgreSQL backups
- Point-in-time recovery capability
- Test restore procedures regularly 