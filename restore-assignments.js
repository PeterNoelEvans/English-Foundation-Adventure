const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreAssignments() {
  try {
    console.log('🔄 Restoring assignments...');
    
    // Get the default user ID and course ID
    const user = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });
    
    const course = await prisma.course.findFirst();
    
    if (!user || !course) {
      console.error('❌ No user or course found');
      return;
    }
    
    console.log('✅ Found user:', user.firstName, user.lastName);
    console.log('✅ Found course:', course.name);
    
    // Create sample assignments
    const assignments = [
      {
        title: "Capital Cities Quiz",
        description: "Test your knowledge of world capital cities with this interactive quiz.",
        type: "multiple-choice",
        category: "Geography",
        difficulty: "intermediate",
        instructions: "Choose the correct capital city for each country.",
        points: 10,
        published: true,
        autoGrade: true,
        showFeedback: true,
        allowReview: true,
        shuffleQuestions: false,
        quarter: "Q1",
        maxAttempts: 3,
        timeLimit: 30,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        availableFrom: new Date(),
        availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        questions: {
          type: "multiple-choice",
          questions: [
            {
              question: "What is the capital of France?",
              options: ["London", "Paris", "Berlin", "Madrid"],
              correctAnswer: "Paris",
              explanation: "Paris is the capital and largest city of France."
            },
            {
              question: "What is the capital of Australia?",
              options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
              correctAnswer: "Canberra",
              explanation: "Canberra is the capital city of Australia."
            },
            {
              question: "What is the capital of Japan?",
              options: ["Tokyo", "Osaka", "Kyoto", "Yokohama"],
              correctAnswer: "Tokyo",
              explanation: "Tokyo is the capital and largest city of Japan."
            }
          ]
        },
        createdById: user.id,
        courseId: course.id
      },
      {
        title: "English Grammar Review",
        description: "Review essential English grammar concepts with this comprehensive assessment.",
        type: "multiple-choice",
        category: "Grammar",
        difficulty: "beginner",
        instructions: "Select the correct grammatical form for each sentence.",
        points: 15,
        published: true,
        autoGrade: true,
        showFeedback: true,
        allowReview: true,
        shuffleQuestions: true,
        quarter: "Q1",
        maxAttempts: 2,
        timeLimit: 45,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        availableFrom: new Date(),
        availableTo: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        questions: {
          type: "multiple-choice",
          questions: [
            {
              question: "Which sentence is grammatically correct?",
              options: [
                "I goes to school every day.",
                "I go to school every day.",
                "I going to school every day.",
                "I am go to school every day."
              ],
              correctAnswer: "I go to school every day.",
              explanation: "The simple present tense uses the base form of the verb."
            },
            {
              question: "Choose the correct form: 'She _____ to the store yesterday.'",
              options: ["go", "goes", "went", "going"],
              correctAnswer: "went",
              explanation: "Past tense of 'go' is 'went'."
            },
            {
              question: "Which word is a pronoun?",
              options: ["quickly", "happy", "they", "run"],
              correctAnswer: "they",
              explanation: "'They' is a pronoun that refers to people or things."
            }
          ]
        },
        createdById: user.id,
        courseId: course.id
      }
    ];
    
    console.log('📝 Creating assignments...');
    
    for (const assignmentData of assignments) {
      const assignment = await prisma.assessment.create({
        data: assignmentData
      });
      console.log(`✅ Created assignment: ${assignment.title}`);
    }
    
    console.log('🎉 All assignments restored successfully!');
    
    // Show the count
    const count = await prisma.assessment.count();
    console.log(`📊 Total assignments in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error restoring assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAssignments(); 