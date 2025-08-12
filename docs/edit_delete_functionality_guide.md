# Resource Management Extensions

## Grouped Resources and Appending Files

- Resources are grouped automatically when uploaded within a small time window.
- Additionally, you can set a label during upload; any resources sharing the same label are grouped, even across sessions.
- Planned: an "Append files" action on grouped resources to add more files later.

### Upload Fields
- title (string)
- description (string)
- subjectId (uuid)
- courseId (uuid, optional)
- unitId (uuid, optional)
- tags (array)
- isPublic (boolean)
- isShared (boolean)
- label (string, optional) — use this to append to a group later

## Editing Resources

- Edit title/description from the Teacher portal via Edit on each resource.
- Planned extensions: tags editing and moving the resource to a different course/unit.

## Supported File Types

- Audio: MP3, WAV, OGG, AAC, MP4 audio
- Video: MP4, WebM, OGG, AVI, MOV
- Documents: PDF
- Images: JPEG, PNG, GIF, WebP, SVG
- Text/Code: txt, md, html, css, js, json

## Cloning Resources Across Organizations

- Use the Clone action to copy a resource to another organization.
- Select target organization and subject; optionally pick course/unit and include assignments.

# 📝 Edit & Delete Functionality Guide

## 🎯 **Overview**
This guide documents the comprehensive edit and delete functionality that has been added to the teacher portal. Teachers can now edit and delete almost all content types including units, courses, subjects, questions, and resources.

## 🔧 **Backend API Endpoints Added**

### **Units Management**
- **PATCH `/units/:id`** - Update a unit
- **DELETE `/units/:id`** - Delete a unit

### **Courses Management**
- **PATCH `/courses/:id`** - Update a course
- **DELETE `/courses/:id`** - Delete a course

### **Subjects Management**
- **PATCH `/subjects/:id`** - Update a subject
- **DELETE `/subjects/:id`** - Delete a subject

### **Resources Management** (Already existed)
- **PATCH `/resources/:id`** - Update a resource
- **DELETE `/resources/:id`** - Delete a resource

### **Questions Management** (Already existed)
- **PATCH `/questions/:id`** - Update a question
- **DELETE `/questions/:id`** - Delete a question

## 🎨 **Frontend Features Added**

### **1. Units Section**
- **Edit Button**: Yellow "Edit" button next to each unit
- **Delete Button**: Red "Delete" button with confirmation dialog
- **Edit Modal**: Full-screen modal with form to edit unit details
- **Validation**: Ensures unit number uniqueness within course
- **Success/Error Messages**: Clear feedback for all actions

### **2. Course Structure Section**
- **Edit Button**: Yellow "Edit" button next to each course
- **Delete Button**: Red "Delete" button with confirmation dialog
- **Edit Modal**: Full-screen modal with form to edit course details
- **Validation**: Ensures course uniqueness (subject + year level)
- **Success/Error Messages**: Clear feedback for all actions

### **3. Subjects Section** (Already had basic functionality)
- **Edit Button**: Yellow "Edit" button next to each subject
- **Delete Button**: Red "Delete" button with confirmation dialog
- **Inline Editing**: Edit subject name directly in the list
- **Validation**: Ensures subject name uniqueness within organization

### **4. Resources Section** (Already had functionality)
- **Delete Button**: Red delete button (🗑️ icon) for each resource
- **File Cleanup**: Automatically deletes associated files when resource is deleted

### **5. Questions Section** (Already had functionality)
- **Edit Button**: Blue "Edit" button for inline editing
- **Delete Button**: Red "Delete" button with confirmation
- **Inline Editing**: Edit question content directly in the list

## 🛡️ **Safety Features**

### **Validation Rules**
- **Units**: Cannot delete if they contain parts/sections
- **Courses**: Cannot delete if they contain units
- **Subjects**: Cannot delete if they contain courses
- **Resources**: Cannot delete if they're shared with other teachers
- **Questions**: Can be deleted freely (no dependencies)

### **Confirmation Dialogs**
- All delete actions require user confirmation
- Clear warning messages about irreversible actions
- Option to cancel at any time

### **Permission Checks**
- Teachers can only edit/delete their own content
- Organization-level isolation (teachers can't see other schools' content)
- Role-based access control (TEACHER role required)

## 🎯 **User Experience Features**

### **Visual Feedback**
- **Selected State**: Units show blue highlighting when selected
- **Edit Mode**: Clear visual indicators for editing state
- **Success Messages**: Green confirmation messages
- **Error Messages**: Red error messages with specific details

### **Modal Design**
- **Full-screen overlay**: Dark background for focus
- **Centered positioning**: Easy to access and use
- **Form validation**: Real-time validation feedback
- **Cancel option**: Always available to exit without saving

### **Button Styling**
- **Edit**: Yellow color (`text-yellow-600`)
- **Delete**: Red color (`text-red-600`)
- **Select**: Blue color (`text-blue-600`)
- **Hover effects**: Clear visual feedback on interaction

## 📋 **Usage Instructions**

### **Editing a Unit**
1. Navigate to the "Units" tab
2. Click the yellow "Edit" button next to any unit
3. Modify the unit details in the modal:
   - **Title**: Unit name
   - **Number**: Unit order (must be unique within course)
   - **Course**: Select the course this unit belongs to
   - **Description**: Optional description
4. Click "Update Unit" to save or "Cancel" to discard changes

### **Deleting a Unit**
1. Navigate to the "Units" tab
2. Click the red "Delete" button next to any unit
3. Confirm the deletion in the dialog
4. Unit will be permanently deleted (if no content exists)

### **Editing a Course**
1. Navigate to the "Course Structure" tab
2. Click the yellow "Edit" button next to any course
3. Modify the course details in the modal:
   - **Course Name**: Display name
   - **Subject**: Select the subject this course belongs to
   - **Year Level**: Select the grade level
   - **Description**: Optional description
4. Click "Update Course" to save or "Cancel" to discard changes

### **Deleting a Course**
1. Navigate to the "Course Structure" tab
2. Click the red "Delete" button next to any course
3. Confirm the deletion in the dialog
4. Course will be permanently deleted (if no units exist)

### **Editing a Subject**
1. Navigate to the "Subjects" tab
2. Click the yellow "Edit" button next to any subject
3. Modify the subject name in the inline form
4. Click "Save" to update or "Cancel" to discard changes

### **Deleting a Subject**
1. Navigate to the "Subjects" tab
2. Click the red "Delete" button next to any subject
3. Confirm the deletion in the dialog
4. Subject will be permanently deleted (if no courses exist)

## ⚠️ **Important Notes**

### **Data Integrity**
- **Cascading Deletes**: Content is protected from accidental deletion
- **Dependency Checks**: System prevents deletion of content with dependencies
- **Validation**: All inputs are validated before saving

### **Performance**
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Clear loading indicators during operations

### **Security**
- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Role-based access control enforced
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries used

## 🔄 **API Response Formats**

### **Success Responses**
```json
{
  "message": "Unit updated successfully",
  "unit": {
    "id": "uuid",
    "title": "Unit Title",
    "number": 1,
    "description": "Unit description",
    "courseId": "course-uuid"
  }
}
```

### **Error Responses**
```json
{
  "message": "Cannot delete unit that contains content",
  "errors": [
    {
      "field": "title",
      "message": "Unit title cannot be empty"
    }
  ]
}
```

## 🚀 **Future Enhancements**

### **Planned Features**
- **Bulk Operations**: Select multiple items for bulk edit/delete
- **Undo Functionality**: Ability to undo recent deletions
- **Version History**: Track changes to content over time
- **Audit Log**: Log all edit/delete operations for compliance
- **Soft Deletes**: Option to restore deleted content

### **UI Improvements**
- **Drag & Drop**: Reorder units/courses by dragging
- **Inline Editing**: More inline editing options
- **Keyboard Shortcuts**: Quick access via keyboard
- **Bulk Selection**: Checkbox selection for multiple items

---

**Last Updated**: $(date)
**Version**: 1.0
**Compatibility**: Teacher Portal v2.0+ 