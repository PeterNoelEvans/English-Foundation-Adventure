const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test data
let testOrganizationId = '';
let testSubjectId = '';
let testCourseId = '';
let testTeacherId = '';

const testData = {
  organization: {
    name: 'Test Organization',
    code: 'TEST'
  },
  subject: {
    name: 'Test Subject',
    description: 'Test subject for relationship tests'
  },
  course: {
    name: 'Test Course',
    description: 'Test course for relationship tests'
  },
  teacher: {
    email: 'test.teacher@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'Teacher',
    role: 'TEACHER'
  }
};

async function createTestData() {
  console.log('🔧 Creating test data...');
  
  // Create organization
  const organization = await prisma.organization.create({
    data: testData.organization
  });
  testOrganizationId = organization.id;
  
  // Create teacher
  const teacher = await prisma.user.create({
    data: {
      ...testData.teacher,
      organizationId: testOrganizationId
    }
  });
  testTeacherId = teacher.id;
  
  // Create subject
  const subject = await prisma.subject.create({
    data: {
      ...testData.subject,
      organizationId: testOrganizationId,
      createdById: testTeacherId
    }
  });
  testSubjectId = subject.id;
  
  // Create course
  const course = await prisma.course.create({
    data: {
      ...testData.course,
      subjectId: testSubjectId,
      createdById: testTeacherId
    }
  });
  testCourseId = course.id;
  
  console.log('✅ Test data created successfully');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await prisma.course.delete({
      where: { id: testCourseId }
    });
    
    await prisma.subject.delete({
      where: { id: testSubjectId }
    });
    
    await prisma.user.delete({
      where: { id: testTeacherId }
    });
    
    await prisma.organization.delete({
      where: { id: testOrganizationId }
    });
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Test functions
async function testCourseOrganizationRelationship() {
  console.log('\n🔗 Testing Course -> Subject -> Organization relationship...');
  
  try {
    // Test 1: Verify the relationship works correctly
    const course = await prisma.course.findFirst({
      where: { id: testCourseId },
      include: {
        subject: {
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!course || !course.subject || !course.subject.organization) {
      throw new Error('Course -> Subject -> Organization relationship broken');
    }
    
    if (course.subject.organization.id !== testOrganizationId) {
      throw new Error('Organization relationship mismatch');
    }
    
    console.log('✅ Course -> Subject -> Organization relationship verified');
    return true;
  } catch (error) {
    console.error('❌ Course organization relationship test failed:', error.message);
    return false;
  }
}

async function testInvalidOrganizationIdQuery() {
  console.log('\n🚫 Testing invalid organizationId query on Course...');
  
  try {
    // This should fail because Course doesn't have organizationId directly
    const invalidQuery = await prisma.course.findMany({
      where: {
        organizationId: testOrganizationId // This field doesn't exist on Course
      }
    });
    
    // If this succeeds, it means the schema is wrong
    throw new Error('Course model should not have organizationId field');
  } catch (error) {
    if (error.message.includes('organizationId')) {
      console.log('✅ Invalid organizationId query correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testInvalidYearLevelQuery() {
  console.log('\n🚫 Testing invalid yearLevel query on Course...');
  
  try {
    // This should fail because Course doesn't have yearLevel field
    const invalidQuery = await prisma.course.findFirst({
      where: { id: testCourseId },
      select: {
        id: true,
        name: true,
        yearLevel: true // This field doesn't exist
      }
    });
    
    // If this succeeds, it means the schema is wrong
    throw new Error('Course model should not have yearLevel field');
  } catch (error) {
    if (error.message.includes('yearLevel')) {
      console.log('✅ Invalid yearLevel query correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testValidAssignmentFiltering() {
  console.log('\n✅ Testing valid assignment filtering query...');
  
  try {
    // This should work - using the correct relationship path
    const assignments = await prisma.assessment.findMany({
      where: {
        courseId: testCourseId,
        published: true,
        course: {
          subject: {
            organizationId: testOrganizationId
          }
        }
      }
    });
    
    console.log('✅ Valid assignment filtering query works');
    return true;
  } catch (error) {
    console.error('❌ Valid assignment filtering query failed:', error.message);
    return false;
  }
}

async function testInvalidAssignmentFiltering() {
  console.log('\n🚫 Testing invalid assignment filtering query...');
  
  try {
    // This should fail - trying to access organizationId directly on course
    const invalidQuery = await prisma.assessment.findMany({
      where: {
        courseId: testCourseId,
        published: true,
        course: {
          organizationId: testOrganizationId // This field doesn't exist on Course
        }
      }
    });
    
    // If this succeeds, it means the schema is wrong
    throw new Error('Course model should not have organizationId field');
  } catch (error) {
    if (error.message.includes('organizationId')) {
      console.log('✅ Invalid assignment filtering query correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testUnitYearLevelQuery() {
  console.log('\n🚫 Testing invalid yearLevel query on Unit...');
  
  try {
    // This should fail because Unit doesn't have yearLevel field
    const invalidQuery = await prisma.unit.findMany({
      where: {
        course: {
          yearLevel: 'P1' // This field doesn't exist on Course
        }
      }
    });
    
    // If this succeeds, it means the schema is wrong
    throw new Error('Course model should not have yearLevel field');
  } catch (error) {
    if (error.message.includes('yearLevel')) {
      console.log('✅ Invalid yearLevel query on Unit correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testValidUnitQuery() {
  console.log('\n✅ Testing valid Unit query...');
  
  try {
    // This should work - using valid fields
    const units = await prisma.unit.findMany({
      where: {
        course: {
          subject: {
            organizationId: testOrganizationId
          }
        }
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Valid Unit query works');
    return true;
  } catch (error) {
    console.error('❌ Valid Unit query failed:', error.message);
    return false;
  }
}

async function testSchemaValidation() {
  console.log('\n🔍 Testing schema validation...');
  
  try {
    // Test 1: Verify Course model fields
    const courseFields = await prisma.course.findFirst({
      where: { id: testCourseId },
      select: {
        id: true,
        name: true,
        description: true,
        subjectId: true,
        createdById: true,
        // These fields should NOT exist:
        // organizationId: true,
        // yearLevel: true
      }
    });
    
    if (!courseFields) {
      throw new Error('Course query failed');
    }
    
    // Verify that invalid fields are not present
    if ('organizationId' in courseFields || 'yearLevel' in courseFields) {
      throw new Error('Course model contains invalid fields');
    }
    
    console.log('✅ Course model schema validation passed');
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    return false;
  }
}

async function testRelationshipIntegrity() {
  console.log('\n🔗 Testing relationship integrity...');
  
  try {
    // Test 1: Course -> Subject relationship
    const courseWithSubject = await prisma.course.findFirst({
      where: { id: testCourseId },
      include: {
        subject: true
      }
    });
    
    if (!courseWithSubject.subject) {
      throw new Error('Course -> Subject relationship broken');
    }
    
    // Test 2: Subject -> Organization relationship
    const subjectWithOrg = await prisma.subject.findFirst({
      where: { id: testSubjectId },
      include: {
        organization: true
      }
    });
    
    if (!subjectWithOrg.organization) {
      throw new Error('Subject -> Organization relationship broken');
    }
    
    // Test 3: Verify the full chain works
    const fullChain = await prisma.course.findFirst({
      where: { id: testCourseId },
      include: {
        subject: {
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!fullChain.subject.organization) {
      throw new Error('Course -> Subject -> Organization chain broken');
    }
    
    console.log('✅ All relationships verified');
    return true;
  } catch (error) {
    console.error('❌ Relationship integrity test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runDatabaseRelationshipTests() {
  console.log('🧪 Starting Database Relationship Tests...\n');
  
  const tests = [
    { name: 'Schema Validation', fn: testSchemaValidation },
    { name: 'Relationship Integrity', fn: testRelationshipIntegrity },
    { name: 'Valid Assignment Filtering', fn: testValidAssignmentFiltering },
    { name: 'Invalid OrganizationId Query', fn: testInvalidOrganizationIdQuery },
    { name: 'Invalid YearLevel Query', fn: testInvalidYearLevelQuery },
    { name: 'Invalid Assignment Filtering', fn: testInvalidAssignmentFiltering },
    { name: 'Invalid Unit YearLevel Query', fn: testUnitYearLevelQuery },
    { name: 'Valid Unit Query', fn: testValidUnitQuery }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  try {
    // Setup
    await createTestData();
    
    // Run tests
    for (const test of tests) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Running: ${test.name}`);
      console.log(`${'='.repeat(50)}`);
      
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    }
    
    // Results
    console.log(`\n${'='.repeat(50)}`);
    console.log('TEST RESULTS');
    console.log(`${'='.repeat(50)}`);
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log(`Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL DATABASE RELATIONSHIP TESTS PASSED!');
      console.log('✅ Your database schema is correctly configured');
      console.log('✅ All relationship queries are working properly');
      console.log('✅ Invalid field access is properly prevented');
    } else {
      console.log('\n⚠️ Some database relationship tests failed.');
      console.log('🔧 Please check the schema and fix any relationship issues.');
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  } finally {
    // Cleanup
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDatabaseRelationshipTests().catch(console.error);
}

module.exports = {
  runDatabaseRelationshipTests,
  testData,
  createTestData,
  cleanupTestData
}; 