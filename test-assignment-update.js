const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
let teacherToken = '';
let testTeacherId = '';
let testOrganizationId = '';
let testSubjectId = '';
let testCourseId = '';
let testAssignmentId = '';

// Test data
const testData = {
  teacher: {
    email: 'peter@pbs.ac.th',
    password: 'password123', // You'll need to provide the correct password
    firstName: 'Peter',
    lastName: 'Evans',
    role: 'TEACHER'
  },
  organization: {
    name: 'Test Organization',
    code: 'TEST'
  },
  subject: {
    name: 'Test Subject',
    description: 'Test subject for assignment update tests'
  },
  course: {
    name: 'Test Course',
    description: 'Test course for assignment update tests'
  },
  assignment: {
    title: 'Test Assignment for Update',
    description: 'Test assignment for update testing',
    type: 'multiple-choice',
    published: true,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    correctAnswerIndex: 1,
    explanation: '2 + 2 equals 4'
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
    await prisma.assessment.deleteMany({
      where: {
        createdById: testTeacherId
      }
    });
    
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

async function authenticateTeacher() {
  console.log('🔐 Authenticating teacher...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.teacher.email,
      password: testData.teacher.password
    });
    
    teacherToken = response.data.token;
    console.log('✅ Teacher authenticated successfully');
  } catch (error) {
    console.error('❌ Teacher authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testAssignmentCreation() {
  console.log('\n📝 Testing assignment creation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/assignments`, {
      ...testData.assignment,
      courseId: testCourseId
    }, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    
    testAssignmentId = response.data.assignment.id;
    console.log('✅ Assignment created successfully');
    return true;
  } catch (error) {
    console.error('❌ Assignment creation failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAssignmentUpdateWithValidDates() {
  console.log('\n✏️ Testing assignment update with valid dates...');
  
  try {
    const updateData = {
      title: 'Updated Test Assignment',
      description: 'Updated description',
      published: true,
      availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
    };
    
    const response = await axios.patch(`${BASE_URL}/assignments/${testAssignmentId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    
    const updatedAssignment = response.data.assignment;
    
    if (updatedAssignment.title !== 'Updated Test Assignment') {
      throw new Error('Assignment title not updated');
    }
    
    if (updatedAssignment.description !== 'Updated description') {
      throw new Error('Assignment description not updated');
    }
    
    console.log('✅ Assignment updated with valid dates successfully');
    return true;
  } catch (error) {
    console.error('❌ Assignment update with valid dates failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAssignmentUpdateWithEmptyDates() {
  console.log('\n✏️ Testing assignment update with empty dates...');
  
  try {
    const updateData = {
      title: 'Assignment with Empty Dates',
      description: 'Testing empty date handling',
      published: true,
      availableFrom: '', // Empty string
      availableTo: '',   // Empty string
      dueDate: ''        // Empty string
    };
    
    const response = await axios.patch(`${BASE_URL}/assignments/${testAssignmentId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    
    const updatedAssignment = response.data.assignment;
    
    if (updatedAssignment.title !== 'Assignment with Empty Dates') {
      throw new Error('Assignment title not updated');
    }
    
    // Check that empty dates are converted to null
    if (updatedAssignment.availableFrom !== null) {
      throw new Error('Empty availableFrom should be converted to null');
    }
    
    if (updatedAssignment.availableTo !== null) {
      throw new Error('Empty availableTo should be converted to null');
    }
    
    if (updatedAssignment.dueDate !== null) {
      throw new Error('Empty dueDate should be converted to null');
    }
    
    console.log('✅ Assignment updated with empty dates successfully');
    return true;
  } catch (error) {
    console.error('❌ Assignment update with empty dates failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAssignmentUpdateWithNullDates() {
  console.log('\n✏️ Testing assignment update with null dates...');
  
  try {
    const updateData = {
      title: 'Assignment with Null Dates',
      description: 'Testing null date handling',
      published: true,
      availableFrom: null,
      availableTo: null,
      dueDate: null
    };
    
    const response = await axios.patch(`${BASE_URL}/assignments/${testAssignmentId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    
    const updatedAssignment = response.data.assignment;
    
    if (updatedAssignment.title !== 'Assignment with Null Dates') {
      throw new Error('Assignment title not updated');
    }
    
    // Check that null dates remain null
    if (updatedAssignment.availableFrom !== null) {
      throw new Error('availableFrom should remain null');
    }
    
    if (updatedAssignment.availableTo !== null) {
      throw new Error('availableTo should remain null');
    }
    
    if (updatedAssignment.dueDate !== null) {
      throw new Error('dueDate should remain null');
    }
    
    console.log('✅ Assignment updated with null dates successfully');
    return true;
  } catch (error) {
    console.error('❌ Assignment update with null dates failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAssignmentUpdateWithUndefinedDates() {
  console.log('\n✏️ Testing assignment update with undefined dates...');
  
  try {
    const updateData = {
      title: 'Assignment with Undefined Dates',
      description: 'Testing undefined date handling',
      published: true
      // Not including date fields (undefined)
    };
    
    const response = await axios.patch(`${BASE_URL}/assignments/${testAssignmentId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    
    const updatedAssignment = response.data.assignment;
    
    if (updatedAssignment.title !== 'Assignment with Undefined Dates') {
      throw new Error('Assignment title not updated');
    }
    
    console.log('✅ Assignment updated with undefined dates successfully');
    return true;
  } catch (error) {
    console.error('❌ Assignment update with undefined dates failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAssignmentUpdateTests() {
  console.log('🧪 Starting Assignment Update Tests...\n');
  
  const tests = [
    { name: 'Assignment Creation', fn: testAssignmentCreation },
    { name: 'Update with Valid Dates', fn: testAssignmentUpdateWithValidDates },
    { name: 'Update with Empty Dates', fn: testAssignmentUpdateWithEmptyDates },
    { name: 'Update with Null Dates', fn: testAssignmentUpdateWithNullDates },
    { name: 'Update with Undefined Dates', fn: testAssignmentUpdateWithUndefinedDates }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  try {
    // Setup
    await createTestData();
    await authenticateTeacher();
    
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
      console.log('\n🎉 ALL ASSIGNMENT UPDATE TESTS PASSED!');
      console.log('✅ Assignment update functionality is working correctly');
      console.log('✅ Date handling is properly implemented');
      console.log('✅ Empty and null dates are handled correctly');
    } else {
      console.log('\n⚠️ Some assignment update tests failed.');
      console.log('🔧 Please check the logs above and fix any issues.');
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
  runAssignmentUpdateTests().catch(console.error);
}

module.exports = {
  runAssignmentUpdateTests,
  testData,
  createTestData,
  cleanupTestData,
  authenticateTeacher
}; 