const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

const testAssignments = [
  {
    title: "True/False Test Assignment",
    description: "A simple true/false test to verify content loading",
    type: "true-false",
    subtype: null,
    category: "Test",
    difficulty: "beginner",
    timeLimit: 15,
    points: 5,
    instructions: "Read each statement carefully and choose true or false.",
    criteria: null,
    autoGrade: true,
    showFeedback: true,
    dueDate: "2025-12-31T23:59:59.000Z",
    availableFrom: "2025-01-01T00:00:00.000Z",
    availableTo: "2025-12-31T23:59:59.000Z",
    quarter: "Q1",
    published: true,
    maxAttempts: 2,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: null,
    lateSubmissionPenalty: null,
    negativeScoreThreshold: null,
    recommendedCourses: [],
    prerequisites: [],
    recommendations: null,
    difficultyLevel: null,
    learningObjectives: [],
    courseId: "2be51194-77fe-4ea6-82fc-84947167217f",
    unitId: null,
    partId: null,
    sectionId: null,
    topicId: null,
    createdById: "b1432721-9cf9-4374-96c6-07d8e403e23d",
    questions: {
      type: "true-false",
      questions: [
        {
          question: "The Earth is round.",
          correctAnswer: "true",
          explanation: "The Earth is approximately spherical in shape."
        }
      ]
    }
  },
  {
    title: "Matching Exercise Test",
    description: "A matching exercise to test content loading",
    type: "matching",
    subtype: null,
    category: "Test",
    difficulty: "intermediate",
    timeLimit: 20,
    points: 8,
    instructions: "Match the countries with their capitals.",
    criteria: null,
    autoGrade: true,
    showFeedback: true,
    dueDate: "2025-12-31T23:59:59.000Z",
    availableFrom: "2025-01-01T00:00:00.000Z",
    availableTo: "2025-12-31T23:59:59.000Z",
    quarter: "Q1",
    published: true,
    maxAttempts: 2,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: null,
    lateSubmissionPenalty: null,
    negativeScoreThreshold: null,
    recommendedCourses: [],
    prerequisites: [],
    recommendations: null,
    difficultyLevel: null,
    learningObjectives: [],
    courseId: "2be51194-77fe-4ea6-82fc-84947167217f",
    unitId: null,
    partId: null,
    sectionId: null,
    topicId: null,
    createdById: "b1432721-9cf9-4374-96c6-07d8e403e23d",
    questions: {
      type: "matching",
      questions: [
        {
          leftItems: ["France", "Germany", "Spain"],
          rightItems: ["Paris", "Berlin", "Madrid"],
          instructions: "Match each country with its capital city."
        }
      ]
    }
  },
  {
    title: "Writing Assignment Test",
    description: "A writing assignment to test content loading",
    type: "writing",
    subtype: null,
    category: "Test",
    difficulty: "intermediate",
    timeLimit: 60,
    points: 15,
    instructions: "Write a short essay on the given topic.",
    criteria: "200-300 words",
    autoGrade: false,
    showFeedback: true,
    dueDate: "2025-12-31T23:59:59.000Z",
    availableFrom: "2025-01-01T00:00:00.000Z",
    availableTo: "2025-12-31T23:59:59.000Z",
    quarter: "Q1",
    published: true,
    maxAttempts: 1,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: null,
    lateSubmissionPenalty: null,
    negativeScoreThreshold: null,
    recommendedCourses: [],
    prerequisites: [],
    recommendations: null,
    difficultyLevel: null,
    learningObjectives: [],
    courseId: "2be51194-77fe-4ea6-82fc-84947167217f",
    unitId: null,
    partId: null,
    sectionId: null,
    topicId: null,
    createdById: "b1432721-9cf9-4374-96c6-07d8e403e23d",
    questions: {
      type: "writing",
      questions: [
        {
          question: "Write about your favorite hobby and explain why you enjoy it.",
          criteria: "200-300 words"
        }
      ]
    }
  },
  {
    title: "Speaking Assignment Test",
    description: "A speaking assignment to test content loading",
    type: "speaking",
    subtype: null,
    category: "Test",
    difficulty: "intermediate",
    timeLimit: 5,
    points: 10,
    instructions: "Record yourself speaking on the given topic.",
    criteria: null,
    autoGrade: false,
    showFeedback: true,
    dueDate: "2025-12-31T23:59:59.000Z",
    availableFrom: "2025-01-01T00:00:00.000Z",
    availableTo: "2025-12-31T23:59:59.000Z",
    quarter: "Q1",
    published: true,
    maxAttempts: 2,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: null,
    lateSubmissionPenalty: null,
    negativeScoreThreshold: null,
    recommendedCourses: [],
    prerequisites: [],
    recommendations: null,
    difficultyLevel: null,
    learningObjectives: [],
    courseId: "2be51194-77fe-4ea6-82fc-84947167217f",
    unitId: null,
    partId: null,
    sectionId: null,
    topicId: null,
    createdById: "b1432721-9cf9-4374-96c6-07d8e403e23d",
    questions: {
      type: "speaking",
      questions: [
        {
          question: "Describe your hometown in detail. Include information about the people, places, and activities.",
          timeLimit: 5
        }
      ]
    }
  },
  {
    title: "Listening Assignment Test",
    description: "A listening assignment to test content loading",
    type: "listening",
    subtype: null,
    category: "Test",
    difficulty: "intermediate",
    timeLimit: 30,
    points: 12,
    instructions: "Listen to the audio and answer the questions.",
    criteria: null,
    autoGrade: true,
    showFeedback: true,
    dueDate: "2025-12-31T23:59:59.000Z",
    availableFrom: "2025-01-01T00:00:00.000Z",
    availableTo: "2025-12-31T23:59:59.000Z",
    quarter: "Q1",
    published: true,
    maxAttempts: 2,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    trackAttempts: true,
    trackConfidence: true,
    trackTimeSpent: true,
    engagementDeadline: null,
    lateSubmissionPenalty: null,
    negativeScoreThreshold: null,
    recommendedCourses: [],
    prerequisites: [],
    recommendations: null,
    difficultyLevel: null,
    learningObjectives: [],
    courseId: "2be51194-77fe-4ea6-82fc-84947167217f",
    unitId: null,
    partId: null,
    sectionId: null,
    topicId: null,
    createdById: "b1432721-9cf9-4374-96c6-07d8e403e23d",
    questions: {
      type: "listening",
      questions: [
        {
          question: "Listen to the conversation about travel plans and answer the following questions.",
          bulkQuestions: "1. Where are they planning to go?\n2. When is the trip?\n3. How long will they stay?"
        }
      ]
    }
  }
];

async function createTestAssignments() {
  console.log('Creating test assignments for different types...');
  
  for (const assignment of testAssignments) {
    try {
      const response = await axios.post(`${baseURL}/assignments`, assignment);
      console.log(`✅ Created: ${assignment.title} (${assignment.type})`);
    } catch (error) {
      console.error(`❌ Failed to create ${assignment.title}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n🎉 Test assignments creation complete!');
}

createTestAssignments(); 