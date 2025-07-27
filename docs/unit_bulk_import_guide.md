# Unit Bulk Import Guide

## Overview
The bulk import feature allows teachers to create multiple units at once by importing a JSON file. This is especially useful when setting up a new course with many units.

## How to Use

### 1. Access the Feature
1. Log into your teacher portal
2. Navigate to the "Units" tab
3. Scroll down to the "Bulk Import Units" section

### 2. Select a Course
- Choose the course where you want to create the units
- Units will be associated with the selected course

### 3. Prepare Your JSON Data
The JSON should be an array of unit objects with the following structure:

```json
[
  {
    "title": "Unit Title",
    "number": 1,
    "description": "Unit description (optional)"
  }
]
```

### Required Fields
- **title**: The name of the unit (required)
- **number**: The unit number/order (required, must be a positive integer)

### Optional Fields
- **description**: A description of the unit content (optional)

### 4. Import the Units
1. Paste your JSON data into the text area
2. Click "Import Units"
3. Review the import results

## Example JSON

```json
[
  {
    "title": "Introduction to Grammar",
    "number": 1,
    "description": "Basic grammar concepts and sentence structure fundamentals"
  },
  {
    "title": "Parts of Speech",
    "number": 2,
    "description": "Understanding nouns, verbs, adjectives, and adverbs"
  },
  {
    "title": "Sentence Structure",
    "number": 3,
    "description": "Building proper sentences with subject-verb agreement"
  }
]
```

## Validation Rules

- Unit numbers must be unique within the same course
- Unit numbers must be positive integers
- Unit titles are required
- Descriptions are optional

## Error Handling

The system will:
- Validate all units before creating any
- Show detailed error messages for any issues
- Create successful units even if some fail
- Provide a summary of results

## Tips

1. **Plan your unit numbers**: Make sure they follow a logical sequence
2. **Use descriptive titles**: Clear titles help students understand the content
3. **Include descriptions**: Descriptions help with organization and planning
4. **Test with a small batch**: Try importing 2-3 units first to verify the format
5. **Backup your data**: Keep a copy of your JSON data before importing

## Troubleshooting

### Common Issues

1. **"Unit numbers already exist"**: Check that your unit numbers don't conflict with existing units in the course
2. **"Invalid JSON format"**: Use a JSON validator to check your syntax
3. **"Course not found"**: Make sure you've selected a valid course

### Getting Help

If you encounter issues:
1. Check the error messages in the import results
2. Verify your JSON format using an online JSON validator
3. Try importing a smaller batch to isolate the problem
4. Contact your system administrator if problems persist 