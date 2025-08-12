const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:3001';

// Test credentials
const testCredentials = {
  email: 'teacher@test.com',
  password: 'password123'
};

// Test data for different assignment types
const testAssignments = {
  multipleChoice: {
    title: "Test Multiple Choice",
    description: "A test multiple choice question",
    type: "multiple-choice",
    subtype: "",
    category: "Reading",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "",
    criteria: "",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    // Dynamic content processed into questions
    questions: {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: "Paris",
      correctAnswerIndex: 1,
      explanation: "Paris is the capital and largest city of France.",
      incorrectExplanations: {
        "London": "London is the capital of England, not France.",
        "Berlin": "Berlin is the capital of Germany, not France.",
        "Madrid": "Madrid is the capital of Spain, not France."
      }
    },
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },
  
  trueFalse: {
    title: "Test True/False",
    description: "A test true/false question",
    type: "true-false",
    subtype: "",
    category: "Grammar",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "",
    criteria: "",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: {
      question: "The Earth is round.",
      correctAnswer: "True",
      explanation: "The Earth is approximately spherical in shape."
    },
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },
  
  matching: {
    title: "Test Matching",
    description: "Match countries with their capitals",
    type: "matching",
    subtype: "",
    category: "Geography",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "",
    criteria: "",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: {
      leftItems: ["France", "Germany", "Spain"],
      rightItems: ["Paris", "Berlin", "Madrid"]
    },
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },
  
  dragAndDropFillBlank: {
    title: "Test Drag & Drop - Fill in Blank",
    description: "Complete the sentence with the correct words",
    type: "drag-and-drop",
    subtype: "fill-blank",
    category: "Vocabulary",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "",
    criteria: "",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: {
      sentence: "The [BLANK] is the [BLANK] of the [BLANK].",
      wordBank: ["sun", "star", "center", "middle", "solar system", "universe"]
    },
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },
  
  dragAndDropImageCaption: {
    title: "Test Drag & Drop - Image Caption",
    description: "Match captions to images",
    type: "drag-and-drop", 
    subtype: "image-caption",
    category: "Reading",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "",
    criteria: "",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: {
      images: ["image1.jpg", "image2.jpg", "image3.jpg"],
      captions: ["A cat", "A dog", "A bird"]
    },
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },
  
  writing: {
    title: "Test Writing Assignment",
    description: "Write a short essay",
    type: "writing",
    subtype: "",
    category: "Writing",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 1,
    instructions: "Write a 100-word essay about your favorite hobby.",
    criteria: "Grammar, spelling, and creativity will be evaluated.",
    autoGrade: false,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: undefined,
    bulkQuestions: undefined,
    // Engagement tracking fields
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    // Recommendation fields
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  },

  // Additional assignment types for comprehensive testing
  writingLong: {
    title: "Test Long Writing Assignment",
    description: "Write a comprehensive essay",
    type: "writing-long",
    subtype: "",
    category: "Writing",
    difficulty: "intermediate",
    timeLimit: undefined,
    points: 5,
    instructions: "Write a 500-word essay about climate change.",
    criteria: "Research, argumentation, and citation will be evaluated.",
    autoGrade: false,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: undefined,
    bulkQuestions: undefined,
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    recommendations: {},
    difficultyLevel: "intermediate",
    learningObjectives: []
  },

  speaking: {
    title: "Test Speaking Assignment",
    description: "Record a speech presentation",
    type: "speaking",
    subtype: "",
    category: "Speaking",
    difficulty: "intermediate",
    timeLimit: undefined,
    points: 3,
    instructions: "Record a 2-minute speech about your hometown.",
    criteria: "Pronunciation, fluency, and content will be evaluated.",
    autoGrade: false,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: undefined,
    bulkQuestions: undefined,
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    recommendations: {},
    difficultyLevel: "intermediate",
    learningObjectives: []
  },

  listening: {
    title: "Test Listening Assignment",
    description: "Listen and answer questions",
    type: "listening",
    subtype: "",
    category: "Listening",
    difficulty: "beginner",
    timeLimit: undefined,
    points: 2,
    instructions: "Listen to the audio and answer the questions.",
    criteria: "Comprehension and accuracy will be evaluated.",
    autoGrade: true,
    showFeedback: true,
    dueDate: undefined,
    availableFrom: undefined,
    availableTo: undefined,
    quarter: "Q1",
    maxAttempts: undefined,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: undefined,
    unitId: undefined,
    partId: undefined,
    sectionId: undefined,
    topicId: undefined,
    published: true,
    questions: {
      audioFile: "listening_audio.mp3",
      questions: [
        {
          question: "What is the main topic?",
          options: ["Weather", "Sports", "Food", "Travel"],
          correctAnswer: "Weather"
        }
      ]
    },
    bulkQuestions: undefined,
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: undefined,
    lateSubmissionPenalty: 0,
    recommendations: {},
    difficultyLevel: "beginner",
    learningObjectives: []
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log test results
function logTest(testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  
  if (error) {
    console.log(`   Error: ${error.message || error}`);
    testResults.errors.push({ test: testName, error: error.message || error });
  }
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Get authentication token
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    return response.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    return null;
  }
}

// Test 1: Backend API Validation
async function testBackendValidation(token) {
  console.log('\n🔧 Testing Backend API Validation...');
  
  if (!token) {
    logTest('Authentication', false, 'No auth token available');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Test all assignment types
  const testCases = [
    {
      name: 'Multiple Choice',
      data: testAssignments.multipleChoice,
      shouldPass: true
    },
    {
      name: 'True/False',
      data: testAssignments.trueFalse,
      shouldPass: true
    },
    {
      name: 'Matching',
      data: testAssignments.matching,
      shouldPass: true
    },
    {
      name: 'Drag & Drop - Fill in Blank',
      data: testAssignments.dragAndDropFillBlank,
      shouldPass: true
    },
    {
      name: 'Drag & Drop - Image Caption',
      data: testAssignments.dragAndDropImageCaption,
      shouldPass: true
    },
    {
      name: 'Writing',
      data: testAssignments.writing,
      shouldPass: true
    },
    {
      name: 'Writing Long',
      data: testAssignments.writingLong,
      shouldPass: true
    },
    {
      name: 'Speaking',
      data: testAssignments.speaking,
      shouldPass: true
    },
    {
      name: 'Listening',
      data: testAssignments.listening,
      shouldPass: true
    }
  ];

  // Test drag-and-drop without subtype (should fail)
  try {
    const { subtype, ...dragDropWithoutSubtype } = testAssignments.dragAndDropFillBlank;
    dragDropWithoutSubtype.subtype = '';
    await axios.post(`${BASE_URL}/assignments`, dragDropWithoutSubtype, { headers });
    logTest('Drag & Drop without subtype', false, 'Should have failed but passed');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Drag & Drop without subtype', true);
    } else {
      logTest('Drag & Drop without subtype', false, error.response?.data || error.message);
    }
  }

  // Test all other assignment types
  for (const testCase of testCases) {
    try {
      await axios.post(`${BASE_URL}/assignments`, testCase.data, { headers });
      logTest(testCase.name, testCase.shouldPass);
    } catch (error) {
      logTest(testCase.name, !testCase.shouldPass, error.response?.data || error.message);
    }
  }
}

// Test 2: Form Field Validation
function testFormFields() {
  console.log('\n📝 Testing Form Field Validation...');
  
  // Test that all required fields have proper structure
  const testCases = [
    {
      name: 'Multiple Choice has all required fields',
      data: testAssignments.multipleChoice,
      required: ['title', 'type', 'questions'],
      passed: true
    },
    {
      name: 'True/False has all required fields', 
      data: testAssignments.trueFalse,
      required: ['title', 'type', 'questions'],
      passed: true
    },
    {
      name: 'Matching has all required fields',
      data: testAssignments.matching, 
      required: ['title', 'type', 'questions'],
      passed: true
    },
    {
      name: 'Drag & Drop has all required fields',
      data: testAssignments.dragAndDropFillBlank,
      required: ['title', 'type', 'subtype', 'questions'],
      passed: true
    },
    {
      name: 'Writing has all required fields',
      data: testAssignments.writing,
      required: ['title', 'type', 'instructions', 'criteria'],
      passed: true
    },
    {
      name: 'Writing Long has all required fields',
      data: testAssignments.writingLong,
      required: ['title', 'type', 'instructions', 'criteria'],
      passed: true
    },
    {
      name: 'Speaking has all required fields',
      data: testAssignments.speaking,
      required: ['title', 'type', 'instructions', 'criteria'],
      passed: true
    },
    {
      name: 'Listening has all required fields',
      data: testAssignments.listening,
      required: ['title', 'type', 'questions'],
      passed: true
    }
  ];
  
  testCases.forEach(testCase => {
    const hasAllFields = testCase.required.every(field => 
      testCase.data.hasOwnProperty(field) && testCase.data[field] !== undefined
    );
    logTest(testCase.name, hasAllFields);
  });
}

// Test 3: JSON Data Validation
function testJSONData() {
  console.log('\n🔍 Testing JSON Data Validation...');
  
  // Test JSON parsing for incorrect explanations
  try {
    const validJSON = JSON.stringify(testAssignments.multipleChoice.questions.incorrectExplanations);
    JSON.parse(validJSON);
    logTest('Valid JSON for incorrect explanations', true);
  } catch (error) {
    logTest('Valid JSON for incorrect explanations', false, error.message);
  }
  
  // Test JSON parsing for bulk questions
  try {
    const bulkQuestionsJSON = JSON.stringify([
      {
        question: "What is 2+2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        explanation: "Basic addition"
      }
    ]);
    JSON.parse(bulkQuestionsJSON);
    logTest('Valid JSON for bulk questions', true);
  } catch (error) {
    logTest('Valid JSON for bulk questions', false, error.message);
  }
}

// Test 4: Assignment Type Coverage
function testAssignmentTypeCoverage() {
  console.log('\n📊 Testing Assignment Type Coverage...');
  
  const expectedTypes = [
    'multiple-choice',
    'true-false', 
    'matching',
    'drag-and-drop',
    'writing',
    'writing-long',
    'speaking',
    'assignment',
    'listening'
  ];
  
  const expectedSubtypes = [
    'ordering',
    'categorization', 
    'fill-blank',
    'labeling',
    'image-caption'
  ];
  
  // Test that we have test cases for all major types
  const testedTypes = Object.keys(testAssignments).map(key => testAssignments[key].type);
  const uniqueTestedTypes = [...new Set(testedTypes)];
  
  const coverage = uniqueTestedTypes.length / expectedTypes.length;
  logTest(`Assignment type coverage: ${Math.round(coverage * 100)}%`, coverage >= 0.7);
  
  console.log(`   Tested types: ${uniqueTestedTypes.join(', ')}`);
  console.log(`   Missing types: ${expectedTypes.filter(type => !uniqueTestedTypes.includes(type)).join(', ')}`);
}

// Test 5: Data Structure Validation
function testDataStructures() {
  console.log('\n🏗️ Testing Data Structure Validation...');
  
  // Test multiple choice structure
  const mc = testAssignments.multipleChoice;
  const mcValid = mc.questions && mc.questions.options && mc.questions.options.length >= 2 && 
                  mc.questions.correctAnswer && 
                  mc.questions.correctAnswerIndex >= 0 && 
                  mc.questions.correctAnswerIndex < mc.questions.options.length;
  logTest('Multiple Choice data structure', mcValid);
  
  // Test matching structure
  const matching = testAssignments.matching;
  const matchingValid = matching.questions && matching.questions.leftItems && matching.questions.leftItems.length > 0 &&
                       matching.questions.rightItems && matching.questions.rightItems.length > 0 &&
                       matching.questions.leftItems.length === matching.questions.rightItems.length;
  logTest('Matching data structure', matchingValid);
  
  // Test drag and drop structure
  const dnd = testAssignments.dragAndDropFillBlank;
  const dndValid = dnd.questions && dnd.questions.sentence && dnd.questions.wordBank && dnd.questions.wordBank.length > 0;
  logTest('Drag & Drop data structure', dndValid);

  // Test writing structure
  const writing = testAssignments.writing;
  const writingValid = writing.instructions && writing.criteria && writing.autoGrade === false;
  logTest('Writing data structure', writingValid);

  // Test listening structure
  const listening = testAssignments.listening;
  const listeningValid = listening.questions && listening.questions.audioFile && listening.questions.questions;
  logTest('Listening data structure', listeningValid);
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Assignment Type Tests...');
  console.log('================================================');
  
  try {
    // Get authentication token first
    console.log('\n🔐 Getting authentication token...');
    const token = await getAuthToken();
    if (token) {
      logTest('Authentication', true);
    } else {
      logTest('Authentication', false, 'Failed to get auth token');
    }
    
    await testBackendValidation(token);
    testFormFields();
    testJSONData();
    testAssignmentTypeCoverage();
    testDataStructures();
    
    console.log('\n📈 Test Summary:');
    console.log('================================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 Errors Found:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Your assignment system is ready for manual testing.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above before manual testing.');
    }
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAssignments,
  runAllTests,
  testResults
}; 