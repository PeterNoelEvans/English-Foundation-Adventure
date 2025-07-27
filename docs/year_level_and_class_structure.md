# Year Level and Class Structure System

## Overview

The English Foundation Adventure LMS has been updated to properly separate year levels from courses, implementing a clear classroom-based structure that supports academic progression.

## Key Changes

### 1. Year Level vs Course Separation

**Before (Incorrect):**
- "P1 English" was treated as a course
- Year levels were embedded in course names
- Confusion between academic levels and curriculum content

**After (Correct):**
- **Year Levels**: P1, P2, P3, P4, P5, P6, M1, M2, M3, M4, M5, M6
- **Classes**: P1/1, P1/2, P1/3, etc. (up to 6 classes per year level)
- **Courses**: Named after textbooks (e.g., "Project Explore 2", "Let's Find Out")

### 2. Registration Process

Students now register with:
1. **Year Level**: Primary 1-6 (P1-P6) or Mattayom 1-6 (M1-M6)
2. **Class Number**: 1-6 (e.g., Class 1, Class 2, etc.)
3. **Organization**: School/organization context

Example: A student registers as "Primary 1, Class 2" which creates classroom "P1/2".

### 3. Course Structure

**Course Names**: Based on textbook names
- "Project Explore 2"
- "Let's Find Out"
- "Grammar Essentials"
- "Creative Writing"

**Course Assignment**: Courses can be assigned to multiple classrooms
- A single course (e.g., "Project Explore 2") can be used by multiple P2 classes
- Different courses can be assigned to different year levels as needed

## Database Schema Changes

### Course Model Updates
```prisma
model Course {
  id          String   @id @default(uuid())
  name        String   // e.g., "Project Explore 2", "Let's Find Out"
  description String?
  // Removed: yearLevel field
  // Added: unique constraint on (subjectId, name)
  
  @@unique([subjectId, name])
}
```

### Classroom Model
```prisma
model Classroom {
  id          String   @id @default(uuid())
  yearLevel   String   // e.g., "P1", "M2"
  classNum    String   // e.g., "1", "2", "3"
  name        String   // e.g., "Primary 1 Class 1"
  
  // Many-to-many relationship with courses
  courses     Course[]
  students    User[]
  
  @@unique([organizationId, yearLevel, classNum])
}
```

## API Endpoints

### Registration
```
POST /api/auth/register
{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "yearLevel": "P1",
  "classNum": "2",
  "organization": "pbs"
}
```

### Year Level Progression
```
POST /api/classrooms/:classroomId/progress
{
  "newYearLevel": "P2",
  "newClassNum": "2"  // Optional, defaults to current class number
}
```

### Classroom Management
```
GET /api/classrooms                    // List all classrooms
GET /api/classrooms/:id/students       // Get students in classroom
POST /api/classrooms/:id/courses       // Assign courses to classroom
```

## Frontend Updates

### Registration Form
- Separate dropdowns for Year Level and Class Number
- Clear labeling and examples
- Validation for proper combinations

### Teacher Interface
- Course creation now focuses on textbook names
- Removed year level requirement from course creation
- Added class management section

### Course Display
- Shows course name and subject only
- Year level information comes from classroom assignments

## Year Level Progression Process

### End of Academic Year Workflow

1. **Teacher/Admin Access**: Navigate to Class Management section
2. **Select Classroom**: Choose the class to progress (e.g., P1/1)
3. **Set New Year Level**: Specify the target year level (e.g., P2)
4. **Optional Class Change**: Change class number if needed (e.g., P2/2)
5. **Bulk Update**: All students in the class are moved simultaneously

### Example Progression
```
P1/1 (15 students) → P2/1 (15 students)
P1/2 (18 students) → P2/2 (18 students)
M1/1 (20 students) → M2/1 (20 students)
```

## Benefits of New Structure

### 1. Clear Academic Progression
- Students naturally progress through year levels
- Class structure maintained across academic years
- Clear separation of academic levels from curriculum

### 2. Flexible Course Assignment
- Same textbook can be used across multiple classes
- Different textbooks can be used for different year levels
- Easy to update curriculum without affecting student records

### 3. Better Organization
- Students grouped by actual classroom structure
- Teachers can manage entire classes efficiently
- Support for mixed-class subjects (e.g., coding classes)

### 4. Scalability
- Supports up to 6 classes per year level
- Easy to add new year levels or classes
- Maintains data integrity across transitions

## Migration Notes

### Existing Data
- Existing courses with year levels in names should be renamed
- Students should be reassigned to proper classrooms
- Course assignments should be updated to use new structure

### Recommendations
1. Review existing course names and update to textbook-based names
2. Create proper classroom structure for existing students
3. Assign courses to appropriate classrooms
4. Test year level progression with sample data

## Future Enhancements

### 1. Mixed-Class Subjects
- Support for subjects where students come from various classes
- Special handling for coding, art, music, etc.
- Flexible enrollment options

### 2. Academic Year Management
- Academic year boundaries and transitions
- Historical data preservation
- Graduation tracking

### 3. Advanced Class Management
- Class size limits and balancing
- Teacher assignments per class
- Schedule management

## Troubleshooting

### Common Issues

1. **Course Creation Fails**
   - Ensure course name is unique within the subject
   - Remove year level from course name
   - Use textbook-based naming

2. **Student Registration Issues**
   - Verify year level and class number combinations
   - Check organization context
   - Ensure classroom exists or can be created

3. **Year Level Progression Errors**
   - Verify classroom exists and has students
   - Check target year level validity
   - Ensure proper permissions

### Support
For technical support or questions about the new structure, refer to the API documentation or contact the development team. 