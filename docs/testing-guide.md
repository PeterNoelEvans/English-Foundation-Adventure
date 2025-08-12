# Testing Guide

## Overview
This testing suite provides comprehensive validation of the assignment availability feature and database relationship integrity. It helps catch common errors and ensures the system works correctly.

## Test Suites

### 1. Database Relationship Tests (`test-database-relationships.js`)
**Purpose**: Validates database schema integrity and relationship queries.

**Tests Covered**:
- ✅ **Schema Validation**: Verifies Course model has correct fields
- ✅ **Relationship Integrity**: Tests Course → Subject → Organization chain
- ✅ **Valid Assignment Filtering**: Tests correct relationship queries
- ✅ **Invalid Field Prevention**: Ensures invalid fields are rejected
- ✅ **Error Handling**: Validates proper error responses

**Common Errors Caught**:
- `Unknown argument 'organizationId'` on Course model
- `Unknown argument 'yearLevel'` on Course model
- Incorrect relationship paths in queries
- Missing or broken foreign key relationships

### 2. Assignment Availability Tests (`test-assignment-availability.js`)
**Purpose**: Tests the complete assignment availability feature.

**Tests Covered**:
- ✅ **Assignment Creation**: Tests creating assignments with availability dates
- ✅ **Availability Filtering**: Tests date-based visibility rules
- ✅ **Assignment Editing**: Tests updating availability dates
- ✅ **Publishing Controls**: Tests draft vs published assignments
- ✅ **Student Visibility**: Tests what students can see
- ✅ **Invalid Field Handling**: Tests error handling

**Features Tested**:
- Teacher can set `availableFrom` and `availableTo` dates
- Students only see assignments within availability windows
- Future assignments are hidden from students
- Draft assignments are hidden from students
- Assignment editing preserves availability settings

## Running Tests

### Quick Database Test
```bash
npm run test:quick
```
Runs only the database relationship tests (fastest).

### Database Tests Only
```bash
npm run test:database
```
Runs comprehensive database relationship validation.

### Assignment Tests Only
```bash
npm run test:assignments
```
Runs assignment availability feature tests (requires backend running).

### Full Test Suite
```bash
npm run test
```
Runs all tests (both database and assignment tests).

## Test Output

### Successful Test Run
```
🧪 Starting Database Relationship Tests...

==================================================
Running: Schema Validation
==================================================
✅ Course model schema validation passed

==================================================
Running: Relationship Integrity
==================================================
✅ All relationships verified

🎉 ALL DATABASE RELATIONSHIP TESTS PASSED!
✅ Your database schema is correctly configured
✅ All relationship queries are working properly
✅ Invalid field access is properly prevented
```

### Failed Test Run
```
❌ Invalid organizationId query correctly rejected
❌ Course organization relationship test failed: Course -> Subject -> Organization relationship broken
⚠️ Some database relationship tests failed.
🔧 Please check the schema and fix any relationship issues.
```

## Error Prevention

### Database Relationship Errors
The tests specifically catch these common errors:

1. **Invalid OrganizationId Query**:
   ```javascript
   // ❌ WRONG - Course doesn't have organizationId
   course: { organizationId: student.organizationId }
   
   // ✅ CORRECT - Use the relationship path
   course: { subject: { organizationId: student.organizationId } }
   ```

2. **Invalid YearLevel Query**:
   ```javascript
   // ❌ WRONG - Course doesn't have yearLevel
   course: { yearLevel: 'P1' }
   
   // ✅ CORRECT - Use Classroom for yearLevel
   classroom: { yearLevel: 'P1' }
   ```

3. **Broken Relationships**:
   ```javascript
   // ❌ WRONG - Missing relationship chain
   course: { organizationId: orgId }
   
   // ✅ CORRECT - Full relationship chain
   course: { subject: { organizationId: orgId } }
   ```

### Assignment Availability Errors
The tests catch these assignment-related issues:

1. **Missing Availability Dates**:
   ```javascript
   // ❌ WRONG - No availability control
   const assignment = { title: 'Test', published: true }
   
   // ✅ CORRECT - With availability dates
   const assignment = { 
     title: 'Test', 
     published: true,
     availableFrom: new Date(),
     availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
   }
   ```

2. **Incorrect Filtering**:
   ```javascript
   // ❌ WRONG - No date filtering
   where: { published: true }
   
   // ✅ CORRECT - With date filtering
   where: {
     published: true,
     OR: [
       { availableFrom: null, availableTo: null },
       { availableFrom: { lte: new Date() }, availableTo: null },
       { availableFrom: null, availableTo: { gte: new Date() } },
       { availableFrom: { lte: new Date() }, availableTo: { gte: new Date() } }
     ]
   }
   ```

## Continuous Integration

### Pre-commit Hook
Add this to your `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run test:database
if [ $? -ne 0 ]; then
  echo "❌ Database tests failed. Please fix before committing."
  exit 1
fi
echo "✅ Database tests passed."
```

### CI/CD Pipeline
Add this to your CI pipeline:
```yaml
- name: Run Database Tests
  run: npm run test:database

- name: Run Assignment Tests
  run: npm run test:assignments
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Troubleshooting

### Common Test Failures

1. **Database Connection Issues**:
   ```bash
   # Check if database is running
   pg_isready -h localhost -p 5432
   
   # Check environment variables
   echo $DATABASE_URL
   ```

2. **Schema Mismatch**:
   ```bash
   # Regenerate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

3. **Backend Not Running**:
   ```bash
   # Start backend for assignment tests
   npm run dev
   
   # In another terminal, run tests
   npm run test:assignments
   ```

### Test Data Cleanup
If tests fail and leave test data:
```bash
# Connect to database and clean up
psql $DATABASE_URL
DELETE FROM organizations WHERE name = 'Test Organization';
```

## Best Practices

### Running Tests Regularly
1. **Before Committing**: Run `npm run test:database`
2. **Before Deploying**: Run `npm run test`
3. **After Schema Changes**: Run `npm run test:database`
4. **After Feature Changes**: Run `npm run test:assignments`

### Test Maintenance
1. **Update Tests**: When adding new features, add corresponding tests
2. **Review Failures**: Always investigate test failures
3. **Keep Tests Fast**: Database tests should run quickly
4. **Isolate Tests**: Each test should be independent

### Debugging Failed Tests
1. **Check Logs**: Look for specific error messages
2. **Verify Data**: Ensure test data is created correctly
3. **Check Relationships**: Verify foreign key relationships
4. **Test Manually**: Try the failing operation manually

## Future Enhancements

### Planned Test Additions
- [ ] Performance tests for large datasets
- [ ] Concurrent user tests
- [ ] Edge case validation
- [ ] API response format tests
- [ ] Frontend integration tests

### Test Coverage Goals
- [ ] 100% database relationship coverage
- [ ] 100% assignment availability feature coverage
- [ ] 90% error condition coverage
- [ ] 80% edge case coverage

## Support

For test-related issues:
1. Check the test logs for specific error messages
2. Verify database schema matches expectations
3. Ensure all dependencies are installed
4. Check environment variables are set correctly

For feature-related issues:
1. Run the specific test suite for that feature
2. Check the test output for detailed error information
3. Compare with the expected behavior in the test
4. Update tests if the feature behavior has changed 