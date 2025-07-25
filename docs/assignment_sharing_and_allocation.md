# Assignment Sharing and Allocation Strategy

## Overview
This document explains the **Copy-on-Allocate** strategy for assignment sharing and allocation in a multi-school Learning Management System (LMS). This approach enables centralized assignment templates, flexible allocation to schools/courses, and school-level customization.

---

## Why Copy-on-Allocate?
- **Centralized Quality Control:** Admins create and maintain master assignment templates in a central library.
- **Customization:** When a school/course needs an assignment, a copy is made. Schools can then customize their copy without affecting others.
- **No Accidental Propagation:** Changes to a template do not affect already allocated assignments.
- **Easy Tracking:** You can track which schools/courses are using which assignments.

---

## How It Works

### 1. Assignment Library (Templates)
- Admins create assignment templates in a central library.
- Templates are marked as `isShared: true` and are not tied to a specific school or course (e.g., `schoolId: null`).
- Templates contain all content, questions, and configuration for the assignment type.

### 2. Allocation (Copying to Schools/Courses)
- When an admin allocates an assignment to a school/course, the backend **copies** the template assignment’s data into a new `Assignment` row.
- The new assignment is linked to the target `schoolId` and `courseId`.
- The copy is marked as `isShared: false`.
- Optionally, a `templateId` field can be used to track the origin template.

#### Example Flow
1. **Admin creates a template:**
   - Assignment: “Algebra Basics Quiz”
   - `isShared: true`, `schoolId: null`, `courseId: null`
2. **Admin allocates to a course:**
   - POST `/api/admin/assignments/allocate`
   - Body: `{ "assignmentId": "template-uuid", "schoolId": "school-uuid", "courseId": "course-uuid" }`
3. **Backend logic:**
   - Fetch the template assignment
   - Create a new assignment with the same data, but:
     - `schoolId` = target school
     - `courseId` = target course
     - `isShared: false`
     - Optionally, `templateId` = original template’s id
4. **Result:**
   - The new assignment is now editable and used only by the target school/course

---

## Assignment Completion
- **Templates** in the library are not completed by students—they are just blueprints.
- **Allocated assignments** (the copies in each course/school) are what students actually complete and submit.

---

## Example Prisma Model Update
Add an optional `templateId` to the `Assignment` model for tracking:

```prisma
model Assignment {
  id          String   @id @default(uuid())
  title       String
  type        String
  data        Json?
  isShared    Boolean  @default(false)
  templateId  String?  // <-- Add this line
  unit        Unit?    @relation(fields: [unitId], references: [id])
  unitId      String?
  course      Course?  @relation(fields: [courseId], references: [id])
  courseId    String?
  school      School   @relation(fields: [schoolId], references: [id])
  schoolId    String
  createdBy   User     @relation("AssignmentCreatedBy", fields: [createdById], references: [id])
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Summary Table

| Feature                | Template Assignment (Library) | Allocated Assignment (School/Course) |
|------------------------|------------------------------|--------------------------------------|
| Who creates/edits?     | Admin (or trusted teachers)  | School’s teachers (after allocation) |
| Who can use?           | Any school/course            | Only the assigned school/course      |
| Can be customized?     | Yes, by admin                | Yes, by school’s teachers            |
| Used for student work? | No                           | Yes                                  |
| Shared?                | Yes                          | No (unless re-shared)                |

---

## Best Practices
- Restrict editing of templates to admin users only.
- Allow teachers to edit only their school’s allocated assignments.
- Use the `templateId` field to track assignment origins and usage.
- Provide clear UI/UX for admins to allocate assignments and for teachers to customize their copies. 