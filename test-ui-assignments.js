const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  teacher: {
    email: 'teacher@test.com',
    password: 'password123'
  },
  assignments: {
    multipleChoice: {
      title: 'Test Multiple Choice',
      description: 'A test multiple choice question',
      type: 'multiple-choice',
      question: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswerIndex: 1,
      explanation: 'Paris is the capital and largest city of France.'
    },
    trueFalse: {
      title: 'Test True/False',
      description: 'A test true/false question',
      type: 'true-false',
      question: 'The Earth is round.',
      correctAnswer: 'True',
      explanation: 'The Earth is approximately spherical in shape.'
    },
    matching: {
      title: 'Test Matching',
      description: 'Match countries with their capitals',
      type: 'matching',
      leftItems: ['France', 'Germany', 'Spain'],
      rightItems: ['Paris', 'Berlin', 'Madrid']
    },
    dragAndDrop: {
      title: 'Test Drag & Drop',
      description: 'Complete the sentence',
      type: 'drag-and-drop',
      subtype: 'fill-blank',
      sentence: 'The [BLANK] is the [BLANK] of the [BLANK].',
      wordBank: ['sun', 'star', 'center', 'solar system']
    }
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  
  if (error) {
    console.log(`   Error: ${error}`);
    results.errors.push({ test: testName, error });
  }
  
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function testLogin(page) {
  console.log('\n🔐 Testing Login...');
  
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', testData.teacher.email);
    await page.type('input[type="password"]', testData.teacher.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to teacher dashboard
    await page.waitForNavigation();
    
    // Check if we're on the teacher dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/teacher') || currentUrl === BASE_URL + '/') {
      logTest('Teacher Login', true);
      return true;
    } else {
      logTest('Teacher Login', false, 'Failed to redirect to teacher dashboard');
      return false;
    }
  } catch (error) {
    logTest('Teacher Login', false, error.message);
    return false;
  }
}

async function testCreateAssignmentForm(page) {
  console.log('\n📝 Testing Create Assignment Form...');
  
  try {
    // Click create assignment button
    await page.waitForSelector('button:contains("Create Assignment")');
    await page.click('button:contains("Create Assignment")');
    
    // Wait for form to appear
    await page.waitForSelector('#assignment-title');
    logTest('Create Assignment Form Opens', true);
    
    // Test form field accessibility
    const formFields = [
      '#assignment-title',
      '#assignment-type',
      '#assignment-description'
    ];
    
    for (const field of formFields) {
      const element = await page.$(field);
      if (element) {
        logTest(`Form field ${field} exists`, true);
      } else {
        logTest(`Form field ${field} exists`, false, `Field ${field} not found`);
      }
    }
    
    return true;
  } catch (error) {
    logTest('Create Assignment Form Opens', false, error.message);
    return false;
  }
}

async function testMultipleChoiceAssignment(page) {
  console.log('\n🔘 Testing Multiple Choice Assignment...');
  
  try {
    const assignment = testData.assignments.multipleChoice;
    
    // Fill in basic fields
    await page.type('#assignment-title', assignment.title);
    await page.type('#assignment-description', assignment.description);
    
    // Select multiple choice type
    await page.select('#assignment-type', assignment.type);
    
    // Wait for dynamic content to load
    await page.waitForSelector('#assignment-question');
    
    // Fill in question
    await page.type('#assignment-question', assignment.question);
    
    // Fill in options
    for (let i = 0; i < assignment.options.length; i++) {
      const optionSelector = `#assignment-option-${i}`;
      await page.waitForSelector(optionSelector);
      await page.type(optionSelector, assignment.options[i]);
    }
    
    // Select correct answer
    const radioSelector = `input[name="correctAnswer"][value="${assignment.correctAnswerIndex}"]`;
    await page.click(radioSelector);
    
    // Fill in explanation
    await page.type('#assignment-explanation', assignment.explanation);
    
    logTest('Multiple Choice Form Fields', true);
    
    // Test form submission
    await page.click('button:contains("Create Assignment")');
    
    // Wait for success message or error
    try {
      await page.waitForSelector('.success-message, .error-message', { timeout: 5000 });
      const successElement = await page.$('.success-message');
      if (successElement) {
        logTest('Multiple Choice Assignment Creation', true);
      } else {
        logTest('Multiple Choice Assignment Creation', false, 'No success message found');
      }
    } catch (error) {
      logTest('Multiple Choice Assignment Creation', false, 'No response message found');
    }
    
  } catch (error) {
    logTest('Multiple Choice Assignment', false, error.message);
  }
}

async function testFormValidation(page) {
  console.log('\n✅ Testing Form Validation...');
  
  try {
    // Test required field validation
    await page.click('button:contains("Create Assignment")');
    
    // Check for validation errors
    const validationErrors = await page.$$('.error-message, .validation-error');
    if (validationErrors.length > 0) {
      logTest('Form Validation Shows Errors', true);
    } else {
      logTest('Form Validation Shows Errors', false, 'No validation errors shown');
    }
    
    // Test that form fields have proper attributes
    const fieldsWithIds = await page.$$eval('input, select, textarea', elements => 
      elements.filter(el => el.id && el.name).length
    );
    
    const totalFields = await page.$$eval('input, select, textarea', elements => elements.length);
    
    if (fieldsWithIds === totalFields) {
      logTest('All Form Fields Have IDs and Names', true);
    } else {
      logTest('All Form Fields Have IDs and Names', false, 
        `${fieldsWithIds}/${totalFields} fields have proper attributes`);
    }
    
  } catch (error) {
    logTest('Form Validation', false, error.message);
  }
}

async function testDynamicContent(page) {
  console.log('\n🔄 Testing Dynamic Content...');
  
  try {
    // Test that changing assignment type shows different fields
    const assignmentTypes = ['multiple-choice', 'true-false', 'matching', 'drag-and-drop'];
    
    for (const type of assignmentTypes) {
      await page.select('#assignment-type', type);
      await page.waitForTimeout(500); // Wait for dynamic content
      
      // Check if appropriate fields are shown
      let expectedField = '';
      switch (type) {
        case 'multiple-choice':
          expectedField = '#assignment-question';
          break;
        case 'true-false':
          expectedField = '#assignment-question';
          break;
        case 'matching':
          expectedField = '.matching-section';
          break;
        case 'drag-and-drop':
          expectedField = '.drag-drop-section';
          break;
      }
      
      if (expectedField) {
        const element = await page.$(expectedField);
        if (element) {
          logTest(`Dynamic content for ${type}`, true);
        } else {
          logTest(`Dynamic content for ${type}`, false, `Expected field ${expectedField} not found`);
        }
      }
    }
    
  } catch (error) {
    logTest('Dynamic Content', false, error.message);
  }
}

async function runUITests() {
  console.log('🧪 Starting UI Tests for Assignment Creation...');
  console.log('================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless testing
    slowMo: 100 // Slow down actions for visibility
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test login
    const loginSuccess = await testLogin(page);
    if (!loginSuccess) {
      console.log('❌ Login failed, skipping other tests');
      return;
    }
    
    // Test form functionality
    const formSuccess = await testCreateAssignmentForm(page);
    if (formSuccess) {
      await testMultipleChoiceAssignment(page);
      await testFormValidation(page);
      await testDynamicContent(page);
    }
    
    console.log('\n📈 UI Test Summary:');
    console.log('================================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 UI Test Errors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('💥 UI Test runner failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runUITests();
}

module.exports = {
  runUITests,
  testData,
  results
}; 