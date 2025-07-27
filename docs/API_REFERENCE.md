# API Reference

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
All API requests (except login/register) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "password123",
  "organization": "pbs-school"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "firstName": "John",
    "lastName": "Doe",
    "schoolId": "pbs-school"
  }
}
```

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@school.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "STUDENT",
  "organization": "pbs-school"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid",
    "email": "newuser@school.com",
    "role": "STUDENT"
  }
}
```

### GET /auth/me
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "firstName": "John",
    "lastName": "Doe",
    "schoolId": "pbs-school"
  }
}
```

---

## Subject Management

### GET /subjects
Get all subjects (teachers only).

**Response:**
```json
{
  "subjects": [
    {
      "id": "subject-uuid",
      "name": "Mathematics",
      "courses": []
    }
  ]
}
```

### POST /subjects
Create a new subject (teachers only).

**Request Body:**
```json
{
  "name": "Science"
}
```

### PATCH /subjects/:id
Update a subject (teachers only).

**Request Body:**
```json
{
  "name": "Updated Science"
}
```

### DELETE /subjects/:id
Delete a subject (teachers only).

---

## Course Management

### GET /courses
Get all courses for the teacher's school.

**Response:**
```json
{
  "courses": [
    {
      "id": "course-uuid",
      "name": "Algebra Basics",
      "description": "Introduction to algebra",
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics"
      },
      "subjectId": "subject-uuid",
      "schoolId": "pbs-school"
    }
  ]
}
```

### POST /courses
Create a new course (teachers only).

**Request Body:**
```json
{
  "name": "Algebra Basics",
  "description": "Introduction to algebra",
  "subjectId": "subject-uuid"
}
```

### PATCH /courses/:id
Update a course (teachers only).

### DELETE /courses/:id
Delete a course (teachers only).

---

## Unit Management

### GET /units
Get all units for the teacher's school.

**Response:**
```json
{
  "units": [
    {
      "id": "unit-uuid",
      "name": "Unit 1: Introduction",
      "course": {
        "id": "course-uuid",
        "name": "Algebra Basics",
        "subject": {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      },
      "courseId": "course-uuid",
      "schoolId": "pbs-school"
    }
  ]
}
```

### POST /units
Create a new unit (teachers only).

**Request Body:**
```json
{
  "name": "Unit 1: Introduction",
  "courseId": "course-uuid",
  "schoolId": "pbs-school"
}
```

---

## Resource Management

### GET /resources
Get all resources for the teacher's school.

**Query Parameters:**
- `courseId` (optional): Filter by course
- `unitId` (optional): Filter by unit
- `type` (optional): Filter by resource type (AUDIO, VIDEO, PDF, IMAGE)

**Response:**
```json
{
  "resources": [
    {
      "id": "resource-uuid",
      "title": "Math Lecture",
      "description": "Introduction to algebra",
      "type": "VIDEO",
      "fileName": "lecture.mp4",
      "filePath": "/uploads/file-1234567890.mp4",
      "fileSize": 10485760,
      "mimeType": "video/mp4",
      "isShared": false,
      "isPublic": true,
      "tags": ["algebra", "basics"],
      "course": {
        "id": "course-uuid",
        "name": "Algebra Basics"
      },
      "unit": {
        "id": "unit-uuid",
        "name": "Unit 1: Introduction"
      },
      "createdBy": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

### POST /resources
Upload a new resource (teachers only).

**Request Body:** (multipart/form-data)
```
file: [binary file]
title: "Math Lecture"
description: "Introduction to algebra"
courseId: "course-uuid" (optional)
unitId: "unit-uuid" (optional)
tags: ["algebra", "basics"] (optional)
isPublic: true (optional)
isShared: false (optional)
```

### GET /resources/shared
Get all shared resource templates.

### POST /resources/allocate
Allocate a shared resource to a course (teachers only).

**Request Body:**
```json
{
  "resourceId": "resource-uuid",
  "courseId": "course-uuid",
  "unitId": "unit-uuid" (optional)
}
```

### PATCH /resources/:id
Update a resource (teachers only).

### DELETE /resources/:id
Delete a resource (teachers only).

---

## Assignment Management

### GET /questions
Get all questions for the teacher's school.

**Response:**
```json
{
  "questions": [
    {
      "id": "question-uuid",
      "content": "What is 2+2?",
      "type": "multiple_choice",
      "options": ["3", "4", "5"],
      "answer": "4",
      "unit": {
        "id": "unit-uuid",
        "name": "Unit 1: Introduction"
      },
      "scoring": {"points": 1},
      "feedback": {"correct": "Good!", "incorrect": "Try again."}
    }
  ]
}
```

### POST /questions
Create a new question (teachers only).

**Request Body:**
```json
{
  "content": "What is 2+2?",
  "type": "multiple_choice",
  "options": ["3", "4", "5"],
  "answer": "4",
  "unitId": "unit-uuid",
  "scoring": {"points": 1},
  "feedback": {"correct": "Good!", "incorrect": "Try again."}
}
```

### POST /questions/bulk
Bulk import questions (teachers only).

**Request Body:**
```json
[
  {
    "content": "What is 2+2?",
    "type": "multiple_choice",
    "options": ["3", "4", "5"],
    "answer": "4",
    "unitId": "unit-uuid"
  }
]
```

### PATCH /questions/:id
Update a question (teachers only).

### DELETE /questions/:id
Delete a question (teachers only).

---

## Analytics Endpoints

### POST /analytics/session/start
Start a new student session.

**Request Body:**
```json
{
  "sessionType": "GENERAL",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080"
  }
}
```

### PATCH /analytics/session/:sessionId/end
End a student session.

### POST /analytics/activity
Track student activity.

**Request Body:**
```json
{
  "activityType": "PAGE_VIEW",
  "page": "/student-quiz",
  "assignmentId": "assignment-uuid" (optional),
  "resourceId": "resource-uuid" (optional),
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### POST /analytics/assignment/start
Start an assignment attempt.

**Request Body:**
```json
{
  "assignmentId": "assignment-uuid"
}
```

### PATCH /analytics/assignment/:attemptId/complete
Complete an assignment attempt.

**Request Body:**
```json
{
  "answers": {"question1": "answer1"},
  "score": 85.5,
  "feedback": {"general": "Good work!"}
}
```

### GET /analytics/student/:studentId
Get student analytics (teachers/admins only).

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)

**Response:**
```json
{
  "analytics": {
    "student": {
      "id": "student-uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "sessions": {
      "total": 15,
      "totalTime": 7200,
      "averageTime": 480
    },
    "assignments": {
      "completed": 8,
      "started": 10,
      "abandoned": 2,
      "completionRate": 80
    },
    "activities": {
      "total": 150,
      "breakdown": {
        "PAGE_VIEW": 50,
        "ASSIGNMENT_START": 10,
        "ASSIGNMENT_COMPLETE": 8
      }
    }
  }
}
```

### GET /analytics/school
Get school-wide analytics (admins only).

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error"
}
```

---

## Question Types

### Multiple Choice
```json
{
  "type": "multiple_choice",
  "content": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "answer": "Paris"
}
```

### True/False
```json
{
  "type": "true_false",
  "content": "The Earth is round.",
  "answer": true
}
```

### Fill-in-the-Blank
```json
{
  "type": "fill_in_blank",
  "content": "The capital of France is _____.",
  "answer": "Paris"
}
```

### Matching Pairs
```json
{
  "type": "matching_pairs",
  "content": "Match the countries with their capitals:",
  "options": {
    "pairs": [
      {"left": "France", "right": "Paris"},
      {"left": "Germany", "right": "Berlin"}
    ]
  }
}
```

### Sequencing
```json
{
  "type": "sequencing",
  "content": "Arrange the events in chronological order:",
  "options": {
    "items": ["World War II", "World War I", "Cold War"],
    "correctOrder": [1, 0, 2]
  }
}
```

### Drag and Drop
```json
{
  "type": "drag_and_drop",
  "content": "Drag the words to form a sentence:",
  "options": {
    "items": ["The", "cat", "sat", "on", "the", "mat"],
    "correctOrder": [0, 1, 2, 3, 4, 5]
  }
}
``` 