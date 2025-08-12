# Assignment Availability Guide

## Overview
The assignment availability feature allows teachers to control when students can access assignments. This provides flexibility for scheduling assignments and managing course content.

## Features

### For Teachers

#### Creating Assignments with Availability Dates
1. **Navigate to Teacher Portal** → **Assignments** → **Create Assignment**
2. **Fill in basic assignment details** (title, type, questions, etc.)
3. **Set availability dates** (optional):
   - **Available From**: When students can start the assignment
   - **Available To**: When students can no longer access the assignment
4. **Set Published status**: 
   - ✅ **Published**: Assignment is visible to students (if within availability dates)
   - ⏸️ **Draft**: Assignment is not visible to students
5. **Create Assignment**

#### Managing Assignment Availability
- **View availability status** in the assignments list
- **Edit assignments** to modify availability dates
- **Toggle published status** to make assignments visible/hidden

#### Availability Status Display
- **Always available**: No availability dates set
- **Time-limited**: Shows "From [date] To [date]"
- **Future availability**: Shows "From [date]" (not yet available)
- **Past availability**: Shows "To [date]" (no longer available)

### For Students

#### Viewing Available Assignments
- **Navigate to Student Portal** → **My Assignments**
- **Only see assignments that are**:
  - Published by the teacher
  - Currently within availability dates (if set)
  - For courses you're enrolled in

#### Assignment Information Display
- **Assignment details** including type, status, due date
- **Availability information** (if time-limited)
- **Course information** and resources

## Technical Implementation

### Backend Filtering
The student assignment query filters assignments based on:
```javascript
// Only show assignments that are:
// 1. Published = true
// 2. Within availability dates (if set)
// 3. For enrolled courses
```

### Database Schema
```prisma
model Assessment {
  // ... other fields
  availableFrom DateTime? // When assignment becomes available
  availableTo   DateTime? // When assignment becomes unavailable
  published     Boolean   @default(true) // Whether assignment is visible
}
```

### Frontend Features
- **Teacher Portal**: Availability date inputs in assignment creation/editing
- **Student Portal**: Availability information display
- **Status indicators**: Visual feedback for assignment availability

## Use Cases

### Scenario 1: Scheduled Assignment Release
1. Teacher creates assignment for "Week 3 Grammar Quiz"
2. Sets **Available From**: Monday 9:00 AM
3. Sets **Available To**: Friday 5:00 PM
4. Students see assignment only during the specified week

### Scenario 2: Open-Ended Assignment
1. Teacher creates assignment for "Final Project"
2. Sets **Available From**: Project start date
3. Leaves **Available To** empty
4. Students can access assignment from start date onwards

### Scenario 3: Draft Assignment
1. Teacher creates assignment but sets **Published** to false
2. Assignment is saved but not visible to students
3. Teacher can edit and publish later

## Best Practices

### For Teachers
- **Plan ahead**: Set availability dates when creating assignments
- **Use drafts**: Create assignments as drafts, then publish when ready
- **Clear communication**: Set reasonable availability windows
- **Monitor usage**: Check assignment status and student progress

### For Students
- **Check availability**: Look at assignment availability dates
- **Plan your time**: Note due dates and availability windows
- **Contact teacher**: If you need access outside availability dates

## Troubleshooting

### Common Issues

**Q: Students can't see my assignment**
- Check if assignment is **Published**
- Verify **Available From** date is in the past
- Ensure **Available To** date is in the future (if set)

**Q: Assignment disappeared from student view**
- Check if **Available To** date has passed
- Verify assignment is still **Published**

**Q: Need to extend assignment availability**
- Edit the assignment and update **Available To** date
- Or remove the **Available To** date for open-ended access

### Support
For technical issues or questions about assignment availability, contact your system administrator. 