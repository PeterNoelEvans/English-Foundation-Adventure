import React, { useEffect, useState } from 'react';
import axios from '../api';
import ProgressDashboard from '../components/ProgressDashboard';
import ChatInterface from '../components/ChatInterface';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssignmentFormData {
  id?: string;
  title: string;
  description: string;
  type: string;
  subtype: string;
  category: string;
  difficulty: string;
  timeLimit: string;
  points: number;
  instructions: string;
  criteria: string;
  autoGrade: boolean;
  showFeedback: boolean;
  dueDate: string;
  availableFrom: string;
  availableTo: string;
  quarter: string;
  maxAttempts: string;
  shuffleQuestions: boolean;
  allowReview: boolean;
  tags: string[];
  courseId: string;
  unitId: string;
  partId: string;
  sectionId: string;
  topicId: string;
  published: boolean;
  // Dynamic content properties
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
  incorrectExplanations: Record<string, string>;
  // Recommendation fields
  recommendations: Record<string, string[]>;
  negativeScoreThreshold: number;
  recommendedCourses: string[];
  difficultyLevel: string;
  learningObjectives: string[];
  // Engagement and tracking fields
  trackAttempts: boolean;
  trackConfidence: boolean;
  trackTimeSpent: boolean;
  engagementDeadline: string;
  lateSubmissionPenalty: number;
  statements: string[];
  answers: string[];
  leftItems: string[];
  rightItems: string[];
  sentence: string;
  wordBank: string[];
  images: File[];
  captions: string[];
  orderItems: string[];
  bulkQuestions: string;
  questions?: any;
  matchingMode?: 'manual' | 'bulk';
  bulkMatchingInput?: string;
}

const Teacher: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneableResources, setCloneableResources] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedCloneResource, setSelectedCloneResource] = useState<any>(null);
  const [cloneFormData, setCloneFormData] = useState({
    targetOrganizationId: '',
    targetSubjectId: '',
    targetCourseId: '',
    targetUnitId: '',
    includeAssignments: false
  });
  const [cloningResource, setCloningResource] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showAssignmentResourcesModal, setShowAssignmentResourcesModal] = useState(false);
  const [selectedAssignmentForResources, setSelectedAssignmentForResources] = useState<any>(null);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    subjectId: ''
  });
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: ''
  });
  // Resource upload state
  const [showUploadResource, setShowUploadResource] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    subjectId: '',
    courseId: '',
    unitId: '',
    tags: [],
    isPublic: false,
    isShared: false,
    label: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [editingResourceItem, setEditingResourceItem] = useState<any>(null);
  const [incorrectExplanationsText, setIncorrectExplanationsText] = useState('');
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('b0dab4fe-91b8-4832-a69c-706f46e240e9'); // Python subject ID
  
  // Resource allocation state
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [resourceActiveTab, setResourceActiveTab] = useState<'upload' | 'my-resources' | 'shared' | 'allocate'>('upload');
  const [resourceSearch, setResourceSearch] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [disableGrouping, setDisableGrouping] = useState(false);
  
  // Student management state
  const [showStudentList, setShowStudentList] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  
  // Calculate derived metrics
  const activeClasses = students.length > 0 ? 
    new Set(students.map((student: any) => student.classroom?.name).filter(Boolean)).size : 0;
  
  const averageProgress = students.length > 0 ? 
    Math.round(students.reduce((sum: number, student: any) => sum + (student.progress || 0), 0) / students.length) : 0;

  // Get unique classes for filtering
  const uniqueClasses = students.length > 0 ? 
    Array.from(new Set(students.map((student: any) => student.classroom?.name).filter(Boolean))).sort() : [];
  
  // Unit management state
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [selectedCourseForUnit, setSelectedCourseForUnit] = useState<any>(null);
  const [showManageUnits, setShowManageUnits] = useState(false);
  const [managingCourse, setManagingCourse] = useState<any>(null);
  const [newManagedUnit, setNewManagedUnit] = useState<{ name: string; description: string; order: number }>({ name: '', description: '', order: 1 });
  const [newManagedUnitBump, setNewManagedUnitBump] = useState<boolean>(true);
  const [creatingManagedUnit, setCreatingManagedUnit] = useState<boolean>(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    description: '',
    order: 1
  });
  // When checked, creating a unit at a given number will insert and shift later units
  const [unitBumpInsert, setUnitBumpInsert] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserInfo();
      fetchSubjects();
      fetchCourses();
      fetchResources();
      // For now, fetch all assignments - we'll add subject filtering later
      fetchAssignments();
      fetchStudents();
    };
    
    initializeData();
  }, []);

  const [newAssignment, setNewAssignment] = useState<AssignmentFormData>({
    title: '',
    description: '',
    type: '',
    subtype: '',
    category: '',
    difficulty: '',
    timeLimit: '',
    points: 10,
    instructions: '',
    criteria: '',
    autoGrade: true,
    showFeedback: true,
    dueDate: '',
    availableFrom: '',
    availableTo: '',
    quarter: '',
    maxAttempts: '',
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    courseId: '',
    unitId: '',
    partId: '',
    sectionId: '',
    topicId: '',
    published: false,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswerIndex: 0,
    explanation: '',
    incorrectExplanations: {},
    recommendations: {},
    negativeScoreThreshold: 0,
    recommendedCourses: [],
    difficultyLevel: 'beginner', // Set default value
    learningObjectives: [],
    trackAttempts: true,
    trackConfidence: false,
    trackTimeSpent: true,
    engagementDeadline: '',
    lateSubmissionPenalty: 0,
    statements: [],
    answers: [],
    leftItems: [],
    rightItems: [],
    sentence: '',
    wordBank: [],
    images: [],
    captions: [],
    orderItems: [],
    bulkQuestions: '',
    matchingMode: 'manual',
    bulkMatchingInput: ''
  });

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'course-structure', label: 'Subjects & Courses', icon: '📚' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'assignment-creator', label: 'Assignment Creator', icon: '🎯' },
    { id: 'resources', label: 'Resources', icon: '📁' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'class-view', label: 'Class View', icon: '🏫' },
    { id: 'progress', label: 'Progress Tracking', icon: '📈' },
    { id: 'chat', label: 'Messages', icon: '💬' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Organization Banner */}
      {userInfo && userInfo.organization && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <span className="text-xl font-bold text-blue-600">
                  {userInfo.organization.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {userInfo.organization.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Teacher Portal • {userInfo.organization.code}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-medium text-gray-900">
                {userInfo.firstName} {userInfo.lastName}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Subjects</h3>
          <p className="text-3xl font-bold text-indigo-600">{subjects.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Units</h3>
          <p className="text-3xl font-bold text-green-600">
            {courses.reduce((total, course) => total + (course.units?.length || 0), 0)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Assignments</h3>
          <p className="text-3xl font-bold text-orange-600">{assignments.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-purple-600">{students.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Coding Resources</h3>
          <p className="text-3xl font-bold text-teal-600">
            {resources.filter((resource: any) => resource.subjectId === currentSubjectId).length}
          </p>
        </div>
      </div>
    </div>
  );

  const renderAssignmentCreator = () => (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignment Creator</h2>
        <button
          onClick={() => {
            console.log('🎯 Create New Assignment button clicked');
            setNewAssignment(prev => ({ ...prev, type: '' }));
            setShowCreateAssignment(true);
          }}
          className="btn-primary"
        >
          Create New Assignment
        </button>
      </div>
      
      {showCreateAssignment ? (
        // Assignment Creation Form
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {newAssignment.id ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>
            <button
              onClick={() => {
                setShowCreateAssignment(false);
                setNewAssignment({
                  title: '',
                  description: '',
                  type: 'multiple-choice',
                  subtype: '',
                  category: '',
                  difficulty: 'beginner',
                  timeLimit: '',
                  points: 1,
                  instructions: '',
                  criteria: '',
                  autoGrade: true,
                  showFeedback: true,
                  dueDate: '',
                  availableFrom: '',
                  availableTo: '',
                  quarter: 'Q1',
                  maxAttempts: '',
                  shuffleQuestions: false,
                  allowReview: true,
                  tags: [],
                  courseId: '',
                  unitId: '',
                  partId: '',
                  sectionId: '',
                  topicId: '',
                  published: true,
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: '',
                  correctAnswerIndex: 0,
                  explanation: '',
                  incorrectExplanations: {},
                  recommendations: {},
                  negativeScoreThreshold: 0,
                  recommendedCourses: [],
                  difficultyLevel: 'beginner',
                  learningObjectives: [],
                  trackAttempts: true,
                  trackConfidence: true,
                  trackTimeSpent: true,
                  engagementDeadline: '',
                  lateSubmissionPenalty: 0,
                  statements: [],
                  answers: [],
                  leftItems: [],
                  rightItems: [],
                  sentence: '',
                  wordBank: [],
                  images: [],
                  captions: [],
                  orderItems: [],
                  bulkQuestions: ''
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>
          
          <form onSubmit={handleCreateAssignment} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type *
                </label>
                <select
                  value={newAssignment.type}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="matching">Matching</option>
                  <option value="line-match">Connect Match (Line)</option>
                  <option value="drag-and-drop">Drag & Drop</option>
                  <option value="phoneme-build">Phoneme Builder</option>
                  <option value="writing">Writing (Short)</option>
                  <option value="writing-long">Writing (Long)</option>
                  <option value="speaking">Speaking</option>
                  <option value="listening">Listening</option>
                  <option value="assignment">General Assignment</option>
                  <option value="image-upload">Image Upload (Evidence)</option>
                </select>
              </div>
            </div>
            
            {/* Subtype field for drag-and-drop assignments */}
            {newAssignment.type === 'drag-and-drop' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drag & Drop Type *
                </label>
                <select
                  value={newAssignment.subtype}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, subtype: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a subtype</option>
                  <option value="fill-blank">Fill in the Blank</option>
                  <option value="image-caption">Image Caption Matching</option>
                  <option value="ordering">Ordering</option>
                  <option value="categorization">Categorization</option>
                  <option value="labeling">Labeling</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newAssignment.description}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Instructions for students..."
              />
            </div>
            
            {/* Assignment Settings */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={newAssignment.points}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={newAssignment.difficulty}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  value={newAssignment.timeLimit}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, timeLimit: e.target.value }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarter
                </label>
                <select
                  value={newAssignment.quarter}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, quarter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Quarter</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={newAssignment.maxAttempts}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Course and Unit Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course (Optional)
                </label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.subject?.name || 'Unknown Subject'})
                    </option>
                  ))}
                </select>
                {currentSubjectId === 'b0dab4fe-91b8-4832-a69c-706f46e240e9' && (
                  <p className="text-xs text-blue-600 mt-1">
                                          💡 Tip: Select "Python for Beginners" for Python assignments
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit (Optional)
                </label>
                <select
                  value={newAssignment.unitId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, unitId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!newAssignment.courseId}
                >
                  <option value="">Select a unit (optional)</option>
                  {newAssignment.courseId && courses.find(c => c.id === newAssignment.courseId)?.units?.map((unit: any) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.order}: {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.availableFrom}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, availableFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available To
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.availableTo}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, availableTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Multi-Question Navigation */}
            {allQuestions.length >= 1 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Questions ({allQuestions.length} total)</h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentQuestionIndex > 0) {
                          const newIndex = currentQuestionIndex - 1;
                          setCurrentQuestionIndex(newIndex);
                          const question = allQuestions[newIndex];
                          
                          if (newAssignment.type === 'multiple-choice') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              options: question.options || ['', '', '', ''],
                              correctAnswer: question.correctAnswer || '',
                              correctAnswerIndex: question.options ? question.options.indexOf(question.correctAnswer) : 0,
                              explanation: question.explanation || ''
                            }));
                          } else if (newAssignment.type === 'true-false') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              correctAnswer: question.correctAnswer || '',
                              explanation: question.explanation || ''
                            }));
                          } else if (newAssignment.type === 'matching') {
                            setNewAssignment(prev => ({
                              ...prev,
                              leftItems: question.leftItems || [],
                              rightItems: question.rightItems || []
                            }));
                          } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || ''
                            }));
                          } else if (newAssignment.type === 'speaking') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || ''
                            }));
                          } else if (newAssignment.type === 'listening') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              bulkQuestions: question.bulkQuestions || ''
                            }));
                          }
                        }
                      }}
                      disabled={currentQuestionIndex === 0}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                      {currentQuestionIndex + 1} of {allQuestions.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentQuestionIndex < allQuestions.length - 1) {
                          const newIndex = currentQuestionIndex + 1;
                          setCurrentQuestionIndex(newIndex);
                          const question = allQuestions[newIndex];
                          
                          if (newAssignment.type === 'multiple-choice') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              options: question.options || ['', '', '', ''],
                              correctAnswer: question.correctAnswer || '',
                              correctAnswerIndex: question.options ? question.options.indexOf(question.correctAnswer) : 0,
                              explanation: question.explanation || ''
                            }));
                          } else if (newAssignment.type === 'true-false') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              correctAnswer: question.correctAnswer || '',
                              explanation: question.explanation || ''
                            }));
                          } else if (newAssignment.type === 'matching') {
                            setNewAssignment(prev => ({
                              ...prev,
                              leftItems: question.leftItems || [],
                              rightItems: question.rightItems || []
                            }));
                          } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || ''
                            }));
                          } else if (newAssignment.type === 'speaking') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || ''
                            }));
                          } else if (newAssignment.type === 'listening') {
                            setNewAssignment(prev => ({
                              ...prev,
                              question: question.question || '',
                              bulkQuestions: question.bulkQuestions || ''
                            }));
                          }
                        }
                      }}
                      disabled={currentQuestionIndex === allQuestions.length - 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Next →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Add a new question based on assignment type
                        let newQuestion;
                        if (newAssignment.type === 'multiple-choice') {
                          newQuestion = {
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: '',
                            explanation: ''
                          };
                        } else if (newAssignment.type === 'true-false') {
                          newQuestion = {
                            question: '',
                            correctAnswer: '',
                            explanation: ''
                          };
                        } else if (newAssignment.type === 'matching') {
                          newQuestion = {
                            leftItems: [],
                            rightItems: []
                          };
                        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                          newQuestion = {
                            question: ''
                          };
                        } else if (newAssignment.type === 'speaking') {
                          newQuestion = {
                            question: ''
                          };
                        } else if (newAssignment.type === 'listening') {
                          newQuestion = {
                            question: '',
                            bulkQuestions: ''
                          };
                        } else {
                          // Default for unknown types
                          newQuestion = {
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: '',
                            explanation: ''
                          };
                        }
                        
                        const updatedQuestions = [...allQuestions, newQuestion];
                        setAllQuestions(updatedQuestions);
                        setCurrentQuestionIndex(updatedQuestions.length - 1);
                        
                        // Clear the form for the new question
                        if (newAssignment.type === 'multiple-choice') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: '',
                            correctAnswerIndex: 0,
                            explanation: ''
                          }));
                        } else if (newAssignment.type === 'true-false') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: '',
                            correctAnswer: '',
                            explanation: ''
                          }));
                        } else if (newAssignment.type === 'matching') {
                          setNewAssignment(prev => ({
                            ...prev,
                            leftItems: [],
                            rightItems: []
                          }));
                        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: ''
                          }));
                        } else if (newAssignment.type === 'speaking') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: ''
                          }));
                        } else if (newAssignment.type === 'listening') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: '',
                            bulkQuestions: ''
                          }));
                        }
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      + Add Question
                    </button>
                    {allQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete question ${currentQuestionIndex + 1}?`)) {
                            const updatedQuestions = allQuestions.filter((_, index) => index !== currentQuestionIndex);
                            setAllQuestions(updatedQuestions);
                            
                            // Navigate to a valid question index
                            if (updatedQuestions.length === 0) {
                              // No questions left, clear form
                              setNewAssignment(prev => ({
                                ...prev,
                                question: '',
                                options: ['', '', '', ''],
                                correctAnswer: '',
                                correctAnswerIndex: 0,
                                explanation: ''
                              }));
                            } else {
                              // Navigate to the previous question or the first question
                              const newIndex = currentQuestionIndex > 0 ? currentQuestionIndex - 1 : 0;
                              setCurrentQuestionIndex(newIndex);
                              const question = updatedQuestions[newIndex];
                              if (newAssignment.type === 'multiple-choice') {
                                setNewAssignment(prev => ({
                                  ...prev,
                                  question: question.question || '',
                                  options: question.options || ['', '', '', ''],
                                  correctAnswer: question.correctAnswer || '',
                                  correctAnswerIndex: question.options ? question.options.indexOf(question.correctAnswer) : 0,
                                  explanation: question.explanation || ''
                                }));
                              }
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Question
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Question Quick Navigation */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {allQuestions.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        // Save current question before navigating
                        if (newAssignment.type === 'multiple-choice') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            question: newAssignment.question,
                            options: newAssignment.options,
                            correctAnswer: newAssignment.correctAnswer,
                            explanation: newAssignment.explanation
                          };
                          setAllQuestions(updatedQuestions);
                        } else if (newAssignment.type === 'true-false') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            question: newAssignment.question,
                            correctAnswer: newAssignment.correctAnswer,
                            explanation: newAssignment.explanation
                          };
                          setAllQuestions(updatedQuestions);
                        } else if (newAssignment.type === 'matching') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            leftItems: newAssignment.leftItems,
                            rightItems: newAssignment.rightItems
                          };
                          setAllQuestions(updatedQuestions);
                        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            question: newAssignment.question
                          };
                          setAllQuestions(updatedQuestions);
                        } else if (newAssignment.type === 'speaking') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            question: newAssignment.question
                          };
                          setAllQuestions(updatedQuestions);
                        } else if (newAssignment.type === 'listening') {
                          const updatedQuestions = [...allQuestions];
                          updatedQuestions[currentQuestionIndex] = {
                            question: newAssignment.question,
                            bulkQuestions: newAssignment.bulkQuestions
                          };
                          setAllQuestions(updatedQuestions);
                        }
                        
                        setCurrentQuestionIndex(index);
                        const question = allQuestions[index];
                        if (newAssignment.type === 'multiple-choice') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: question.question || '',
                            options: question.options || ['', '', '', ''],
                            correctAnswer: question.correctAnswer || '',
                            correctAnswerIndex: question.options ? question.options.indexOf(question.correctAnswer) : 0,
                            explanation: question.explanation || ''
                          }));
                        } else if (newAssignment.type === 'true-false') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: question.question || '',
                            correctAnswer: question.correctAnswer || '',
                            explanation: question.explanation || ''
                          }));
                        } else if (newAssignment.type === 'matching') {
                          setNewAssignment(prev => ({
                            ...prev,
                            leftItems: question.leftItems || [],
                            rightItems: question.rightItems || []
                          }));
                        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: question.question || ''
                          }));
                        } else if (newAssignment.type === 'speaking') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: question.question || ''
                          }));
                        } else if (newAssignment.type === 'listening') {
                          setNewAssignment(prev => ({
                            ...prev,
                            question: question.question || '',
                            bulkQuestions: question.bulkQuestions || ''
                          }));
                        }
                      }}
                      className={`px-3 py-1 text-sm rounded ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Q{index + 1}
                    </button>
                  ))}
                </div>
                
                {/* Save Current Question Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedQuestions = [...allQuestions];
                      
                      if (newAssignment.type === 'multiple-choice') {
                        updatedQuestions[currentQuestionIndex] = {
                          question: newAssignment.question,
                          options: newAssignment.options,
                          correctAnswer: newAssignment.correctAnswer,
                          explanation: newAssignment.explanation
                        };
                      } else if (newAssignment.type === 'true-false') {
                        updatedQuestions[currentQuestionIndex] = {
                          question: newAssignment.question,
                          correctAnswer: newAssignment.correctAnswer,
                          explanation: newAssignment.explanation
                        };
                      } else if (newAssignment.type === 'matching') {
                        updatedQuestions[currentQuestionIndex] = {
                          leftItems: newAssignment.leftItems,
                          rightItems: newAssignment.rightItems
                        };
                      } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
                        updatedQuestions[currentQuestionIndex] = {
                          question: newAssignment.question
                        };
                      } else if (newAssignment.type === 'speaking') {
                        updatedQuestions[currentQuestionIndex] = {
                          question: newAssignment.question
                        };
                      } else if (newAssignment.type === 'listening') {
                        updatedQuestions[currentQuestionIndex] = {
                          question: newAssignment.question,
                          bulkQuestions: newAssignment.bulkQuestions
                        };
                      }
                      
                      setAllQuestions(updatedQuestions);
                      alert('Current question saved!');
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    💾 Save Current Question
                  </button>
                </div>
              </div>
            )}
            
            {/* Dynamic Content Fields Based on Assignment Type */}
            {newAssignment.type && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4">
                  {allQuestions.length > 1 ? `Question ${currentQuestionIndex + 1} Content` : 'Assignment Content'}
                </h4>
                
                {/* Multiple Choice Content */}
                {newAssignment.type === 'multiple-choice' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question *
                      </label>
                      <textarea
                        value={newAssignment.question}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your question here..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer Options *
                      </label>
                      {newAssignment.options.map((option, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={index.toString()}
                            checked={newAssignment.correctAnswerIndex === index}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              correctAnswerIndex: parseInt(e.target.value),
                              correctAnswer: newAssignment.options[index]
                            }))}
                            className="mr-3"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newAssignment.options];
                              newOptions[index] = e.target.value;
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                options: newOptions,
                                correctAnswer: newOptions[newAssignment.correctAnswerIndex] || ''
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation
                      </label>
                      <textarea
                        value={newAssignment.explanation}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, explanation: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Explain why this answer is correct..."
                      />
                    </div>
                  </div>
                )}
                
                {/* True/False Content */}
                {newAssignment.type === 'true-false' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statement *
                      </label>
                      <textarea
                        value={newAssignment.question}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the statement to be evaluated..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="trueFalseAnswer"
                            value="true"
                            checked={newAssignment.correctAnswer === 'true'}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, correctAnswer: e.target.value }))}
                            className="mr-2"
                            required
                            id="true-radio"
                          />
                          <label htmlFor="true-radio" className="cursor-pointer">
                          True
                        </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="trueFalseAnswer"
                            value="false"
                            checked={newAssignment.correctAnswer === 'false'}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, correctAnswer: e.target.value }))}
                            className="mr-2"
                            required
                            id="false-radio"
                          />
                          <label htmlFor="false-radio" className="cursor-pointer">
                          False
                        </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation
                      </label>
                      <textarea
                        value={newAssignment.explanation}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, explanation: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Explain why this answer is correct..."
                      />
                    </div>
                  </div>
                )}
                
                {/* Matching Content */}
                {newAssignment.type === 'matching' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={newAssignment.instructions}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Instructions for the matching exercise..."
                      />
                    </div>
                    
                    {/* Bulk Upload Toggle */}
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="matchingMode"
                          value="manual"
                          checked={newAssignment.matchingMode !== 'bulk'}
                          onChange={() => setNewAssignment(prev => ({ ...prev, matchingMode: 'manual' }))}
                          className="mr-2"
                        />
                        Manual Entry
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="matchingMode"
                          value="bulk"
                          checked={newAssignment.matchingMode === 'bulk'}
                          onChange={() => setNewAssignment(prev => ({ ...prev, matchingMode: 'bulk' }))}
                          className="mr-2"
                        />
                        Bulk Upload
                      </label>
                    </div>
                    
                    {/* Manual Entry Mode */}
                    {newAssignment.matchingMode !== 'bulk' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Left Items (Column A)
                          </label>
                          {newAssignment.leftItems.map((item, index) => (
                            <input
                              key={index}
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newLeftItems = [...newAssignment.leftItems];
                                newLeftItems[index] = e.target.value;
                                setNewAssignment(prev => ({ ...prev, leftItems: newLeftItems }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                              placeholder={`Item ${index + 1}`}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewAssignment(prev => ({ 
                              ...prev, 
                              leftItems: [...prev.leftItems, ''] 
                            }))}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Item
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Right Items (Column B)
                          </label>
                          {newAssignment.rightItems.map((item, index) => (
                            <input
                              key={index}
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newRightItems = [...newAssignment.rightItems];
                                newRightItems[index] = e.target.value;
                                setNewAssignment(prev => ({ ...prev, rightItems: newRightItems }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                              placeholder={`Item ${index + 1}`}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewAssignment(prev => ({ 
                              ...prev, 
                              rightItems: [...prev.rightItems, ''] 
                            }))}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Item
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Bulk Upload Mode */}
                    {newAssignment.matchingMode === 'bulk' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bulk Upload Format
                          </label>
                          <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Format:</strong> One pair per line, separated by a delimiter
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Example:</strong>
                            </p>
                            <pre className="text-xs bg-white p-2 rounded border">
{`print() | Makes the turtle write on screen
string | A name used to store a value
pencolor() | Changes the turtle's pen color
variable | A container for storing data`}
                            </pre>
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Delimiters:</strong> | (pipe), : (colon), or → (arrow)
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bulk Input
                          </label>
                          <textarea
                            value={newAssignment.bulkMatchingInput || ''}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, bulkMatchingInput: e.target.value }))}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your matching pairs here, one per line..."
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const input = newAssignment.bulkMatchingInput || '';
                              const lines = input.split('\n').filter(line => line.trim());
                              const leftItems: string[] = [];
                              const rightItems: string[] = [];
                              
                              lines.forEach(line => {
                                const trimmed = line.trim();
                                if (trimmed) {
                                  // Try different delimiters
                                  let parts: string[] = [];
                                  if (trimmed.includes('|')) {
                                    parts = trimmed.split('|');
                                  } else if (trimmed.includes(':')) {
                                    parts = trimmed.split(':');
                                  } else if (trimmed.includes('→')) {
                                    parts = trimmed.split('→');
                                  } else {
                                    // If no delimiter found, skip this line
                                    return;
                                  }
                                  
                                  if (parts.length >= 2) {
                                    leftItems.push(parts[0].trim());
                                    rightItems.push(parts[1].trim());
                                  }
                                }
                              });
                              
                              if (leftItems.length > 0 && rightItems.length > 0) {
                                setNewAssignment(prev => ({
                                  ...prev,
                                  leftItems,
                                  rightItems
                                }));
                                setSuccess(`Successfully parsed ${leftItems.length} matching pairs!`);
                              } else {
                                setError('No valid matching pairs found. Please check your format.');
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Parse Pairs
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setNewAssignment(prev => ({
                                ...prev,
                                bulkMatchingInput: '',
                                leftItems: [],
                                rightItems: []
                              }));
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                        
                        {/* Preview */}
                        {newAssignment.leftItems.length > 0 && newAssignment.rightItems.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preview ({newAssignment.leftItems.length} pairs)
                            </label>
                            <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                              {newAssignment.leftItems.map((leftItem, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-700 w-1/2">{leftItem}</span>
                                  <span className="text-sm text-gray-500">→</span>
                                  <span className="text-sm text-gray-600 w-1/2">{newAssignment.rightItems[index]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Writing Content */}
                {(newAssignment.type === 'writing' || newAssignment.type === 'writing-long') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Writing Prompt *
                      </label>
                      <textarea
                        value={newAssignment.question}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, question: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the writing prompt or question..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Length
                      </label>
                      <input
                        type="text"
                        value={newAssignment.criteria}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, criteria: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 200-300 words, 2-3 paragraphs"
                      />
                    </div>
                  </div>
                )}

                {/* Image Upload (Evidence) */}
                {newAssignment.type === 'image-upload' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                      Configure evidence slots (e.g., Code screenshot, Turtle output). Students will see one upload box per slot.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slots (comma separated labels)</label>
                      <input
                        type="text"
                        value={Array.isArray((newAssignment as any).slots) ? (newAssignment as any).slots.join(', ') : ((newAssignment as any).slots || '')}
                        onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), slots: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                        placeholder="Code screenshot, Turtle output screenshot"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max files per slot</label>
                        <input
                          type="number"
                          min={1}
                          value={(newAssignment as any).maxFilesPerSlot || 1}
                          onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), maxFilesPerSlot: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max size (MB per file)</label>
                        <input
                          type="number"
                          min={1}
                          value={(newAssignment as any).maxFileSizeMb || 10}
                          onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), maxFileSizeMb: parseInt(e.target.value) || 10 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          id="allowSupplementary"
                          type="checkbox"
                          checked={(newAssignment as any).allowSupplementary || false}
                          onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), allowSupplementary: e.target.checked }))}
                          className="mr-2"
                        />
                        <label htmlFor="allowSupplementary" className="text-sm text-gray-700">Allow supplementary uploads</label>
                      </div>
                      {(newAssignment as any).allowSupplementary && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max supplementary files</label>
                          <input
                            type="number"
                            min={1}
                            value={(newAssignment as any).maxSupplementaryFiles || 5}
                            onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), maxSupplementaryFiles: parseInt(e.target.value) || 5 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                    {(newAssignment as any).allowSupplementary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplementary label</label>
                        <input
                          type="text"
                          value={(newAssignment as any).supplementaryLabel || 'Supplementary evidence'}
                          onChange={(e) => setNewAssignment(prev => ({ ...(prev as any), supplementaryLabel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Allowed: PNG/JPG/GIF/WebP</p>
                  </div>
                )}
                
                {/* Speaking Content */}
                {newAssignment.type === 'speaking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speaking Task *
                      </label>
                      <textarea
                        value={newAssignment.question}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, question: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the speaking task or topic..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={newAssignment.timeLimit}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, timeLimit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                )}
                
                {/* Listening Content */}
                {newAssignment.type === 'listening' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audio Description *
                      </label>
                      <textarea
                        value={newAssignment.question}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the audio content or provide context..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Questions (one per line)
                      </label>
                      <textarea
                        value={newAssignment.bulkQuestions}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, bulkQuestions: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter questions, one per line..."
                      />
                    </div>
                  </div>
                )}
                
                {/* Drag & Drop Content */}
                {newAssignment.type === 'drag-and-drop' && newAssignment.subtype && (
                  <div className="space-y-4">
                    {/* Fill in the Blank */}
                    {newAssignment.subtype === 'fill-blank' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sentence with Blanks
                          </label>
                          <textarea
                            value={newAssignment.sentence}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, sentence: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="The [BLANK] is [BLANK] today. (Use [BLANK] for blanks)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Word Bank (one per line)
                          </label>
                          <textarea
                            value={newAssignment.wordBank?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              wordBank: e.target.value.split('\n').filter(word => word.trim())
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="weather&#10;nice&#10;sunny&#10;cold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Caption Matching */}
                    {newAssignment.subtype === 'image-caption' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Images (Upload multiple images)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              images: Array.from(e.target.files || [])
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Captions (one per line)
                          </label>
                          <textarea
                            value={newAssignment.captions?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              captions: e.target.value.split('\n').filter(caption => caption.trim())
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="A cat&#10;A dog&#10;A bird"
                          />
                        </div>
                      </div>
                    )}

                    {/* Ordering */}
                    {newAssignment.subtype === 'ordering' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Items to Order (one per line)
                          </label>
                          <textarea
                            value={newAssignment.orderItems?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              orderItems: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="First step&#10;Second step&#10;Third step&#10;Fourth step"
                          />
                        </div>
                      </div>
                    )}

                    {/* Categorization */}
                    {newAssignment.subtype === 'categorization' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categories (one per line)
                          </label>
                          <textarea
                            value={newAssignment.leftItems?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              leftItems: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Animals&#10;Plants&#10;Objects"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Items to Categorize (one per line)
                          </label>
                          <textarea
                            value={newAssignment.rightItems?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              rightItems: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dog&#10;Cat&#10;Tree&#10;Flower&#10;Car&#10;Book"
                          />
                        </div>
                      </div>
                    )}

                    {/* Labeling */}
                    {newAssignment.subtype === 'labeling' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Labels (one per line)
                          </label>
                          <textarea
                            value={newAssignment.leftItems?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              leftItems: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Head&#10;Body&#10;Legs&#10;Arms"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Items to Label (one per line)
                          </label>
                          <textarea
                            value={newAssignment.rightItems?.join('\n') || ''}
                            onChange={(e) => setNewAssignment(prev => ({ 
                              ...prev, 
                              rightItems: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Hair&#10;Eyes&#10;Nose&#10;Mouth&#10;Chest&#10;Stomach&#10;Hands&#10;Feet"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Connect Match (Line) Content */}
                {newAssignment.type === 'line-match' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connect Match Pairs
                      </label>
                      <div className="space-y-3">
                        {newAssignment.questions?.pairs?.map((pair: any, index: number) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={pair.left || ''}
                                onChange={(e) => {
                                  const updatedPairs = [...(newAssignment.questions?.pairs || [])];
                                  updatedPairs[index] = { ...updatedPairs[index], left: e.target.value };
                                  setNewAssignment(prev => ({
                                    ...prev,
                                    questions: { ...prev.questions, pairs: updatedPairs }
                                  }));
                                }}
                                placeholder="Left item (word/text)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={pair.right || ''}
                                onChange={(e) => {
                                  const updatedPairs = [...(newAssignment.questions?.pairs || [])];
                                  updatedPairs[index] = { ...updatedPairs[index], right: e.target.value };
                                  setNewAssignment(prev => ({
                                    ...prev,
                                    questions: { ...prev.questions, pairs: updatedPairs }
                                  }));
                                }}
                                placeholder="Right item (word/image)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPairs = newAssignment.questions?.pairs?.filter((_: any, i: number) => i !== index) || [];
                                setNewAssignment(prev => ({
                                  ...prev,
                                  questions: { ...prev.questions, pairs: updatedPairs }
                                }));
                              }}
                              className="px-2 py-1 text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentPairs = newAssignment.questions?.pairs || [];
                            setNewAssignment(prev => ({
                              ...prev,
                              questions: { 
                                ...prev.questions, 
                                pairs: [...currentPairs, { left: '', right: '' }] 
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800"
                        >
                          + Add Pair
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Phoneme Builder Content */}
                {newAssignment.type === 'phoneme-build' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Word with Blanks
                      </label>
                      <input
                        type="text"
                        value={newAssignment.questions?.targetWord || ''}
                        onChange={(e) => setNewAssignment(prev => ({
                          ...prev,
                          questions: { ...prev.questions, targetWord: e.target.value }
                        }))}
                        placeholder="e.g., b__k (use _ for blanks)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phoneme Tiles (one per line)
                      </label>
                      <textarea
                        value={newAssignment.questions?.phonemeTiles?.join('\n') || ''}
                        onChange={(e) => setNewAssignment(prev => ({
                          ...prev,
                          questions: { 
                            ...prev.questions, 
                            phonemeTiles: e.target.value.split('\n').filter(tile => tile.trim())
                          }
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="oo&#10;ee&#10;ai&#10;sh&#10;ch"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={newAssignment.questions?.correctAnswer || ''}
                        onChange={(e) => setNewAssignment(prev => ({
                          ...prev,
                          questions: { ...prev.questions, correctAnswer: e.target.value }
                        }))}
                        placeholder="e.g., book"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowCreateAssignment(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : (newAssignment.id ? 'Update Assignment' : 'Create Assignment')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Assignment Types Grid
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Assignment Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'multiple-choice', label: 'Multiple Choice', icon: '🔘', desc: 'Auto-graded questions with one correct answer' },
              { type: 'true-false', label: 'True/False', icon: '✅', desc: 'Simple true/false questions' },
              { type: 'matching', label: 'Matching', icon: '🔗', desc: 'Match items from two columns' },
              { type: 'drag-and-drop', label: 'Drag & Drop', icon: '🎯', desc: 'Interactive drag and drop activities' },
              { type: 'writing', label: 'Writing (Short)', icon: '✍️', desc: 'Short answer writing assignments' },
              { type: 'writing-long', label: 'Writing (Long)', icon: '📝', desc: 'Extended writing assignments' },
              { type: 'speaking', label: 'Speaking', icon: '🎤', desc: 'Oral response assignments' },
              { type: 'listening', label: 'Listening', icon: '🎧', desc: 'Audio-based assignments' },
              { type: 'assignment', label: 'General Assignment', icon: '📋', desc: 'General assignment type' },
              { type: 'image-upload', label: 'Image Upload (Evidence)', icon: '🖼️', desc: 'Students upload one or more images as evidence (e.g., code + turtle output, worksheet photo). Supports optional supplementary uploads.' },
              { type: 'line-match', label: 'Connect Match (Line)', icon: '🔗', desc: 'Connect left items to right items with lines' },
              { type: 'phoneme-build', label: 'Phoneme Builder', icon: '🔤', desc: 'Build words by dragging phoneme tiles' }
            ].map((assignmentType) => (
              <div key={assignmentType.type} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{assignmentType.icon}</span>
                  <h4 className="font-semibold text-gray-900">{assignmentType.label}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{assignmentType.desc}</p>
                <button
                  onClick={() => {
                    console.log('🎯 Create Assignment Type button clicked:', assignmentType.type);
                    console.log('📊 Setting assignment type to:', assignmentType.type);
                    setNewAssignment(prev => ({ ...prev, type: assignmentType.type }));
                    setShowCreateAssignment(true);
                    console.log('✅ Form should now be visible with type:', assignmentType.type);
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create {assignmentType.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignments</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('🎯 Navigate to Assignment Creator');
              setActiveTab('assignment-creator');
            }}
            className="btn-primary"
          >
            Create Assignment
          </button>
          <button
            onClick={fetchAssignments}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">All Assignments</h3>
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="English">English</option>
                <option value="Coding">Coding</option>
                <option value="Grammar">Grammar</option>
                <option value="Geography">Geography</option>
                <option value="Test">Test</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {assignments.filter(a => selectedCategory === 'all' || a.category === selectedCategory).length} assignment{assignments.filter(a => selectedCategory === 'all' || a.category === selectedCategory).length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No assignments found.</p>
            <p className="text-sm text-gray-400">Create your first assignment using the Assignment Creator tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments
              .filter((assignment: any) => selectedCategory === 'all' || assignment.category === selectedCategory)
              .map((assignment: any) => (
              <div key={assignment.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                {/* Header with title and status badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{assignment.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {assignment.type}
                      </span>
                      {assignment.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {assignment.category}
                        </span>
                      )}
                      {assignment.published ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {assignment.description && (
                  <p className="text-xs text-gray-600 mb-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{assignment.description}</p>
                )}
                
                {/* Course and Unit info */}
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  {assignment.course && (
                    <p><span className="font-medium">Course:</span> {assignment.course.name}</p>
                  )}
                  {assignment.unit && (
                    <p><span className="font-medium">Unit:</span> {assignment.unit.name}</p>
                  )}
                </div>
                
                {/* Due date and availability */}
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  {assignment.dueDate && (
                    <p><span className="font-medium">Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  )}
                  
                  <p><span className="font-medium">Availability:</span> 
                    {!assignment.availableFrom && !assignment.availableTo ? (
                      <span className="text-green-600"> Always</span>
                    ) : (
                      <span className="text-orange-600"> Limited</span>
                    )}
                  </p>
                </div>
                
                {/* Stats row */}
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>Submissions: {assignment.submissions?.length || 0}</span>
                  <span>Resources: {assignment.resources?.length || 0}</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        console.log('🎯 Edit Assignment button clicked');
                        console.log('📝 Assignment to edit:', assignment);
                        handleEditAssignment(assignment);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                  </div>
                  
                  {assignment.resources && assignment.resources.length > 0 && (
                    <button
                      onClick={() => handleViewAssignmentResources(assignment)}
                      className="text-green-600 hover:text-green-800 text-xs underline"
                    >
                      Resources
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resources</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            💡 Tip: Upload Coding resources individually to allocate them to different assignments
          </div>
          <button
            onClick={() => setShowUploadResource(true)}
            className="btn-primary"
          >
            Upload Resource
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">All Resources</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {resources.filter((resource: any) => resource.subjectId === currentSubjectId).length} Python resource{resources.filter((resource: any) => resource.subjectId === currentSubjectId).length !== 1 ? 's' : ''} • {resources.length} total
            </div>
            <button
              onClick={fetchResources}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Loading resources...</p>
        ) : resources.filter((resource: any) => resource.subjectId === currentSubjectId).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No Python resources found.</p>
            <p className="text-sm text-gray-400">Upload your first Python resource to get started.</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Debug Info:</p>
              <p className="text-xs text-gray-500">Total resources: {resources.length}</p>
              <p className="text-xs text-gray-500">Current subject ID: {currentSubjectId}</p>
              <p className="text-xs text-gray-500">Resources with matching subjectId: {resources.filter((r: any) => r.subjectId === currentSubjectId).length}</p>
              <p className="text-xs text-gray-500">Available subjectIds: {[...new Set(resources.map((r: any) => r.subjectId).filter(Boolean))].join(', ')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.filter((resource: any) => resource.subjectId === currentSubjectId).map((resource: any) => (
              <div key={resource.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                {/* Header with file icon and title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{resource.isGroup ? '📦' : getFileIcon(resource.type)}</span>
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{resource.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {resource.isGroup ? (
                        <>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            Group ({resource.resources.length})
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {formatFileSize(resource.totalSize)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {resource.type}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {formatFileSize(resource.fileSize)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {resource.description && (
                  <p className="text-xs text-gray-600 mb-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {resource.description}
                  </p>
                )}
                
                {/* Group resources list */}
                {resource.isGroup && resource.resources && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Resources:</p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {resource.resources.slice(0, 3).map((subResource: any, index: number) => (
                        <div key={subResource.id} className="text-xs text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                          {subResource.title}
                        </div>
                      ))}
                      {resource.resources.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{resource.resources.length - 3} more resources
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* File details */}
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p><span className="font-medium">Uploaded:</span> {new Date(resource.createdAt).toLocaleDateString()}</p>
                  {resource.createdBy && (
                    <p><span className="font-medium">By:</span> {resource.createdBy.firstName} {resource.createdBy.lastName}</p>
                  )}
                  {resource.isGroup && resource.fileTypes && (
                    <p><span className="font-medium">Types:</span> {resource.fileTypes.join(', ')}</p>
                  )}
                  {/* Expandable details for grouped resources */}
                  {resource.isGroup && resource.resources && (
                    <button
                      onClick={() => toggleDescription(resource.id)}
                      className="text-blue-600 hover:text-blue-800 mt-1"
                    >
                      {expandedDescriptions.has(resource.id) ? 'Hide details' : 'Show details'}
                    </button>
                  )}
                  {expandedDescriptions.has(resource.id) && resource.isGroup && resource.resources && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border max-h-40 overflow-y-auto">
                      {resource.resources.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between py-1 text-gray-700">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{getFileIcon(r.type)}</span>
                            <span className="font-medium">{r.title}</span>
                            <span className="text-xs text-gray-500">{r.type}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatFileSize(r.fileSize || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Stats row */}
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>Downloads: {resource.downloadCount || 0}</span>
                  <span>Assignments: {resource.assignments?.length || 0}</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">{resource.isGroup ? 'Download All' : 'Download'}</button>
                    <button
                      onClick={() => openCloneModal(resource)}
                      className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50"
                      title="Clone to another organization"
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => { setEditingResourceItem(resource); setShowEditResourceModal(true); }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    {resource.isGroup ? 'Delete Group' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resource Upload Modal */}
      {showUploadResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          {/* Draggable container */}
          <div
            className="absolute bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl cursor-move"
            style={{ top: '10%', left: '50%', transform: 'translateX(-50%)' }}
            onMouseDown={(e) => {
              const modal = e.currentTarget;
              const startX = e.clientX;
              const startY = e.clientY;
              const rect = modal.getBoundingClientRect();
              const offsetX = startX - rect.left;
              const offsetY = startY - rect.top;
              const onMove = (ev: MouseEvent) => {
                modal.style.left = `${ev.clientX - offsetX}px`;
                modal.style.top = `${Math.max(0, ev.clientY - offsetY)}px`;
                modal.style.transform = 'none';
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Upload Resource</h3>
              <button
                onClick={() => {
                  setShowUploadResource(false);
                  setNewResource({
                    title: '',
                    description: '',
                    subjectId: '',
                    courseId: '',
                    unitId: '',
                    tags: [],
                    isPublic: false,
                    isShared: false
                  });
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleUploadResource} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (100MB limit)
                        if (file.size > 100 * 1024 * 1024) {
                          setError('File size must be less than 100MB');
                          return;
                        }
                        
                        // Check file type
                        const allowedTypes = [
                          'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
                          'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
                          'application/pdf',
                          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
                        ];
                        
                        if (!allowedTypes.includes(file.type)) {
                          setError('File type not supported. Please upload audio, video, PDF, or image files only.');
                          return;
                        }
                        
                        setSelectedFile(file);
                        setError(''); // Clear any previous errors
                      } else {
                        setSelectedFile(null);
                      }
                    }}
                    accept="audio/*,video/*,application/pdf,image/*"
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <span className="text-4xl">📁</span>
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click to select a file'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported: Audio, Video, PDF, Images (Max 100MB)
                      </p>
                    </div>
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={newResource.subjectId || currentSubjectId}
                    onChange={(e) => setNewResource(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course (Optional)
                  </label>
                  <select
                    value={newResource.courseId}
                    onChange={(e) => setNewResource(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the resource..."
                />
              </div>

              {/* Unit Selection (if course is selected) */}
              {newResource.courseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit (Optional)
                  </label>
                  <select
                    value={newResource.unitId}
                    onChange={(e) => setNewResource(prev => ({ ...prev, unitId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Unit</option>
                    {courses
                      .find(course => course.id === newResource.courseId)
                      ?.units?.map((unit: any) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newResource.isPublic}
                    onChange={(e) => setNewResource(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make Public
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isShared"
                    checked={newResource.isShared}
                    onChange={(e) => setNewResource(prev => ({ ...prev, isShared: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isShared" className="text-sm text-gray-700">
                    Share as Template
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadResource(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingResource || !selectedFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingResource ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Clone Resource to Another Organization</h3>
              <button
                onClick={() => {
                  setShowCloneModal(false);
                  setSelectedCloneResource(null);
                  setCloneFormData({
                    targetOrganizationId: '',
                    targetSubjectId: '',
                    targetCourseId: '',
                    targetUnitId: '',
                    includeAssignments: false
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Cancel
              </button>
            </div>

            {selectedCloneResource && (
              <div className="space-y-6">
                {/* Resource Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Resource to Clone:</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(selectedCloneResource.type)}</span>
                    <div>
                      <p className="font-medium">{selectedCloneResource.title}</p>
                      <p className="text-sm text-gray-600">
                        {selectedCloneResource.type} • {formatFileSize(selectedCloneResource.fileSize || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Organization Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Organization *
                  </label>
                  <select
                    value={cloneFormData.targetOrganizationId}
                    onChange={(e) => {
                      const orgId = e.target.value;
                      setCloneFormData(prev => ({
                        ...prev,
                        targetOrganizationId: orgId,
                        targetSubjectId: '',
                        targetCourseId: '',
                        targetUnitId: ''
                      }));
                      if (orgId) {
                        fetchOrganizations();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                {cloneFormData.targetOrganizationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Subject *
                    </label>
                    <select
                      value={cloneFormData.targetSubjectId}
                      onChange={(e) => {
                        const subjectId = e.target.value;
                        setCloneFormData(prev => ({
                          ...prev,
                          targetSubjectId: subjectId,
                          targetCourseId: '',
                          targetUnitId: ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Subject</option>
                      {organizations
                        .find(org => org.id === cloneFormData.targetOrganizationId)
                        ?.subjects?.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Course Selection (Optional) */}
                {cloneFormData.targetSubjectId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Course (Optional)
                    </label>
                    <select
                      value={cloneFormData.targetCourseId}
                      onChange={(e) => {
                        const courseId = e.target.value;
                        setCloneFormData(prev => ({
                          ...prev,
                          targetCourseId: courseId,
                          targetUnitId: ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Course (Optional)</option>
                      {organizations
                        .find(org => org.id === cloneFormData.targetOrganizationId)
                        ?.subjects?.find(subject => subject.id === cloneFormData.targetSubjectId)
                        ?.courses?.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Unit Selection (Optional) */}
                {cloneFormData.targetCourseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Unit (Optional)
                    </label>
                    <select
                      value={cloneFormData.targetUnitId}
                      onChange={(e) => setCloneFormData(prev => ({
                        ...prev,
                        targetUnitId: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Unit (Optional)</option>
                      {organizations
                        .find(org => org.id === cloneFormData.targetOrganizationId)
                        ?.subjects?.find(subject => subject.id === cloneFormData.targetSubjectId)
                        ?.courses?.find(course => course.id === cloneFormData.targetCourseId)
                        ?.units?.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Include Assignments Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeAssignments"
                    checked={cloneFormData.includeAssignments}
                    onChange={(e) => setCloneFormData(prev => ({
                      ...prev,
                      includeAssignments: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <label htmlFor="includeAssignments" className="text-sm text-gray-700">
                    Also clone associated assignments (if any exist)
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloneModal(false);
                      setSelectedCloneResource(null);
                      setCloneFormData({
                        targetOrganizationId: '',
                        targetSubjectId: '',
                        targetCourseId: '',
                        targetUnitId: '',
                        includeAssignments: false
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloneResource}
                    disabled={!cloneFormData.targetOrganizationId || !cloneFormData.targetSubjectId || cloningResource}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {cloningResource ? 'Cloning...' : 'Clone Resource'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {showEditResourceModal && editingResourceItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Resource</h3>
              <button
                onClick={() => { setShowEditResourceModal(false); setEditingResourceItem(null); }}
                className="text-gray-500 hover:text-gray-700"
              >✕</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload: any = {
                    title: editingResourceItem.title,
                    description: editingResourceItem.description || ''
                  };
                  await axios.patch(`/resources/${editingResourceItem.id}`, payload);
                  setShowEditResourceModal(false);
                  setEditingResourceItem(null);
                  fetchResources();
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Failed to update resource');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingResourceItem.title || ''}
                  onChange={(e) => setEditingResourceItem((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editingResourceItem.description || ''}
                  onChange={(e) => setEditingResourceItem((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => { setShowEditResourceModal(false); setEditingResourceItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Allocation Section */}
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Resource Allocation</h3>
          <button
            onClick={() => setResourceActiveTab('allocate')}
            className="btn-primary text-sm"
          >
            Allocate Resources
          </button>
        </div>

        {resourceActiveTab === 'allocate' && (
          <div className="space-y-6">
            {/* Assignment Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Select Assignment</h3>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="form-select w-full max-w-md"
              >
                <option value="">Choose an assignment...</option>
                {assignments.map((assignment: any) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} - {assignment.course?.name || 'No Course'} - {assignment.unit?.name || 'No Unit'}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Select Resources to Allocate</h3>
              
              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="form-input"
                />
                <select
                  value={resourceTypeFilter}
                  onChange={(e) => setResourceTypeFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="">All types</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                </select>
              </div>

              {/* Selection Controls */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={handleSelectAllResources}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All Filtered
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear Selection
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {selectedResources.length} selected
                </span>
              </div>

              {/* Resource List */}
              <div className="max-h-96 overflow-y-auto border rounded-lg bg-white">
                {getFilteredResources().length === 0 ? (
                  <p className="p-4 text-gray-500">No resources found.</p>
                ) : (
                  <div className="divide-y">
                    {getFilteredResources().map((resource: any) => (
                      <div key={resource.id} className="p-4 hover:bg-gray-50">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedResources.includes(resource.id)}
                            onChange={() => handleResourceSelection(resource.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{getFileIcon(resource.type)}</span>
                              <h4 className="font-medium text-gray-900">{resource.title}</h4>
                            </div>
                            {resource.description && (
                              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Size: {formatFileSize(resource.fileSize || 0)} | 
                              Type: {resource.type} | 
                              Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allocate Button */}
              <div className="mt-4">
                <button
                  onClick={handleAllocateResources}
                  disabled={!selectedAssignment || selectedResources.length === 0 || allocationLoading}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                    !selectedAssignment || selectedResources.length === 0 || allocationLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {allocationLoading ? 'Allocating...' : `Allocate ${selectedResources.length} Resource(s) to Assignment`}
                </button>
                <div className="mt-2 text-xs text-gray-500">
                  Debug: Assignment={selectedAssignment ? 'Selected' : 'None'}, Resources={selectedResources.length}
                </div>
              </div>
            </div>

            {/* Current Allocations */}
            {selectedAssignment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Current Assignment Resources</h3>
                {(() => {
                  const assignment = assignments.find(a => a.id === selectedAssignment);
                  const assignedResources = assignment?.resources || [];
                  
                  return assignedResources.length === 0 ? (
                    <p className="text-gray-500">No resources allocated to this assignment yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedResources.map((resource: any) => (
                        <div key={resource.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{getFileIcon(resource.type)}</span>
                                <h4 className="font-medium text-sm text-gray-900">{resource.title}</h4>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(resource.fileSize || 0)} | {resource.type}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowStudentList(!showStudentList)}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${showStudentList ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400' : 'bg-white text-gray-800 hover:bg-gray-50 border'} `}
          >
            {showStudentList ? 'Hide Student List' : 'Show Student List'}
          </button>
          <button className="btn-primary text-sm">
            Add Student
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👥</span>
            <div>
              <p className="text-sm text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏫</span>
            <div>
              <p className="text-sm text-green-600">Active Classes</p>
              <p className="text-2xl font-bold text-green-900">{activeClasses}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="text-sm text-purple-600">Average Progress</p>
              <p className="text-2xl font-bold text-purple-900">{averageProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List - Hidden by default */}
      {showStudentList && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Student List (
              {students.filter(student => {
                const matchesSearch = 
                  student.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  student.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  student.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  student.studentNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  student.nickname?.toLowerCase().includes(studentSearch.toLowerCase());
                
                const matchesClass = !studentClassFilter || 
                  student.classroom?.name === studentClassFilter;
                
                return matchesSearch && matchesClass;
              }).length} students)
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search students..."
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              {(studentSearch || studentClassFilter) && (
                <button
                  onClick={() => {
                    setStudentSearch('');
                    setStudentClassFilter('');
                  }}
                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 bg-blue-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nickname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students
                    .filter(student => {
                      // Text search filter
                      const matchesSearch = 
                        student.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.studentNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.nickname?.toLowerCase().includes(studentSearch.toLowerCase());
                      
                      // Class filter
                      const matchesClass = !studentClassFilter || 
                        student.classroom?.name === studentClassFilter;
                      
                      return matchesSearch && matchesClass;
                    })
                    .map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.nickname ? (
                                <span className="text-blue-600 font-medium">Nickname: {student.nickname}</span>
                              ) : (
                                <span className="text-gray-400 italic">No nickname set</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.nickname ? (
                          <span className="text-blue-600 font-medium">{student.nickname}</span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.classroom ? `${student.classroom.yearLevel}/${student.classroom.classNum}` : 'Not Assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.studentNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Edit Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Student</h3>
              <p className="text-sm text-gray-600 mb-4">Use "Update Student" for name/email/status. To change the student's class, adjust Year Level and Class No., then click "Update Class".</p>
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editingStudent.firstName || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                    <select
                      value={editingStudent.yearLevel || ''}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev, yearLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['P1','P2','P3','P4','P5','P6','M1','M2','M3','M4','M5','M6','ADULT','ADVANCED','IN_HOUSE'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {editingStudent.originalYearLevel && editingStudent.originalYearLevel !== editingStudent.yearLevel && (
                      <p className="text-xs text-amber-600 mt-1">Was {editingStudent.originalYearLevel}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class No.</label>
                    <select
                      value={editingStudent.classNum || ''}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev, classNum: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['1','2','3','4','5','6'].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    {editingStudent.originalClassNum && editingStudent.originalClassNum !== editingStudent.classNum && (
                      <p className="text-xs text-amber-600 mt-1">Was {editingStudent.originalClassNum}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editingStudent.lastName || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingStudent.email || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={editingStudent.nickname || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.studentNumber || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, studentNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingStudent.active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, active: e.target.value === 'active' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditStudentModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStudent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingStudent ? 'Updating...' : 'Update Student'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateStudentClassroom}
                    disabled={updatingStudent}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updatingStudent ? 'Saving...' : 'Update Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClassView = () => (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Class Management & Year Level Progression</h2>
        <p className="text-gray-600 mb-4">
          Manage classrooms and progress entire classes to the next year level at the end of the academic year.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Year Level Progression</h3>
            <p className="text-sm text-blue-700">
              Use this feature to move entire classes to the next year level. For example, move all P1/1 students to P2/1.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Current Class Structure</h3>
              <p className="text-sm text-gray-600">
                Students are organized by year level (P1-P6, M1-M6) and class number (1-6).
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Example: P1/1, P1/2, M1/1, M1/2, etc.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Course Assignment</h3>
              <p className="text-sm text-gray-600">
                Courses are named after textbooks (e.g., "Project Explore 2") and can be assigned to multiple classrooms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourseStructure = () => (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold">Course Structure</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📚</span>
            <div>
              <p className="text-sm text-blue-600">Total Courses</p>
              <p className="text-2xl font-bold text-blue-900">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📖</span>
            <div>
              <p className="text-sm text-green-600">Total Subjects</p>
              <p className="text-2xl font-bold text-green-900">{subjects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <p className="text-sm text-purple-600">Total Units</p>
              <p className="text-2xl font-bold text-purple-900">
                {courses.reduce((total, course) => total + (course.units?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Subjects</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateSubject(true)}
              className="btn-primary text-sm"
            >
              Create Subject
            </button>
            <button
              onClick={fetchSubjects}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No subjects found.</p>
            <p className="text-sm text-gray-400">Create your first subject to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject: any) => (
              <div key={subject.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">{subject.name}</h4>
                    {subject.description && (
                      <div className="mb-2">
                        <div className={`text-xs text-gray-600 ${expandedDescriptions.has(subject.id) ? '' : 'overflow-hidden'}`} 
                             style={expandedDescriptions.has(subject.id) ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({children}) => <span className="text-xs text-gray-600">{children}</span>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              code: ({children}) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                              ul: ({children}) => <ul className="list-disc list-inside space-y-1 mt-2">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mt-2">{children}</ol>,
                              li: ({children}) => <li className="text-xs text-gray-600">{children}</li>,
                              h1: ({children}) => <h1 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h1>,
                              h2: ({children}) => <h2 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h3>,
                              blockquote: ({children}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600">{children}</blockquote>,
                            }}
                          >
                            {subject.description}
                          </ReactMarkdown>
                        </div>
                        {subject.description.length > 150 && (
                          <button
                            onClick={() => toggleDescription(subject.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                          >
                            {expandedDescriptions.has(subject.id) ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {subject.courses?.length || 0} Courses
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewSubjectDetails(subject)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setEditingSubject(subject);
                        setShowEditSubject(true);
                      }}
                      className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Courses</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateCourse(true)}
              className="btn-primary text-sm"
            >
              Create Course
            </button>
            <button
              onClick={fetchCourses}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No courses found.</p>
            <p className="text-sm text-gray-400">Courses will appear here once they are created.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: any) => (
              <div key={course.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">{course.name}</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {course.subject?.name || 'No Subject'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {course.units?.length || 0} Units
                      </span>
                    </div>
                  </div>
                </div>
                
                {course.description && (
                  <div className="mb-3">
                    <div className={`text-xs text-gray-600 ${expandedDescriptions.has(course.id) ? '' : 'overflow-hidden'}`} 
                         style={expandedDescriptions.has(course.id) ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => <span className="text-xs text-gray-600">{children}</span>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          code: ({children}) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                          ul: ({children}) => <ul className="list-disc list-inside space-y-1 mt-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mt-2">{children}</ol>,
                          li: ({children}) => <li className="text-xs text-gray-600">{children}</li>,
                          h1: ({children}) => <h1 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h1>,
                          h2: ({children}) => <h2 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h3>,
                          blockquote: ({children}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600">{children}</blockquote>,
                        }}
                      >
                        {course.description}
                      </ReactMarkdown>
                    </div>
                    {course.description.length > 150 && (
                      <button
                        onClick={() => toggleDescription(course.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                      >
                        {expandedDescriptions.has(course.id) ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Units Preview */}
                {course.units && course.units.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Units:</p>
                    <div className="space-y-1">
                      {course.units
                        .slice()
                        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                        .slice(0, 3)
                        .map((unit: any) => (
                        <div key={unit.id} className="text-xs text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          {unit.name}
                        </div>
                      ))}
                      {course.units.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{course.units.length - 3} more units
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCourseDetails(course)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditCourseClick(course)}
                      className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50"
                    >
                      Edit Course
                    </button>
                      <button
                        onClick={() => { setManagingCourse(course); setShowManageUnits(true); }}
                        className="text-orange-600 hover:text-orange-800 text-xs font-medium px-2 py-1 rounded hover:bg-orange-50"
                      >
                        Manage Units
                      </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCourseForUnit(course);
                      setShowCreateUnit(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 text-xs font-medium px-2 py-1 rounded hover:bg-purple-50"
                  >
                    Add Unit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unit Creation Modal */}
      {showCreateUnit && selectedCourseForUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create Unit for {selectedCourseForUnit.name}</h3>
              <button
                onClick={() => {
                  setShowCreateUnit(false);
                  setSelectedCourseForUnit(null);
                  setNewUnit({
                    name: '',
                    description: '',
                    order: 1
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name *
                </label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Unit 1: Introduction to Programming"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newUnit.description}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this unit covers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Number
                </label>
                <input
                  type="number"
                  value={newUnit.order}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1, 2, 3..."
                />
              </div>

              {/* Insert-and-shift toggle */}
              <div className="flex items-start space-x-2">
                <input
                  id="unit-bump-insert"
                  type="checkbox"
                  checked={unitBumpInsert}
                  onChange={(e) => setUnitBumpInsert(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="unit-bump-insert" className="text-sm text-gray-700">
                  Insert at this number and shift later units down by one
                  <span className="block text-xs text-gray-500">If unchecked, the system will auto-assign the next available number or use a free number you provide.</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateUnit(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Units Modal */}
      {showManageUnits && managingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Manage Units for {managingCourse.name}</h3>
              <button
                onClick={() => { setShowManageUnits(false); setManagingCourse(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Add Unit (insert at position) */}
            <div className="mb-6 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium mb-2 text-gray-800">Add Unit</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Unit Name</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={newManagedUnit.name}
                    onChange={(e) => setNewManagedUnit(u => ({ ...u, name: e.target.value }))}
                    placeholder="e.g., Unit 4: …"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Description</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={newManagedUnit.description}
                    onChange={(e) => setNewManagedUnit(u => ({ ...u, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Number</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded px-2 py-1"
                    value={newManagedUnit.order}
                    onChange={(e) => setNewManagedUnit(u => ({ ...u, order: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="inline-flex items-center mt-5 text-xs">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newManagedUnitBump}
                      onChange={(e) => setNewManagedUnitBump(e.target.checked)}
                    />
                    Insert & shift
                  </label>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={async () => {
                    if (!newManagedUnit.name) return;
                    try {
                      setCreatingManagedUnit(true);
                      const res = await axios.post('/units', {
                        title: newManagedUnit.name,
                        number: newManagedUnit.order,
                        description: newManagedUnit.description,
                        courseId: managingCourse.id,
                        bump: newManagedUnitBump
                      });
                      const created = res.data.unit;
                      // Update local state
                      setManagingCourse((prev: any) => ({
                        ...prev,
                        units: [...(prev.units || []), { ...created, name: created.title, order: created.number }]
                      }));
                      // Reset form and refresh courses
                      setNewManagedUnit({ name: '', description: '', order: (newManagedUnit.order + 1) });
                      setNewManagedUnitBump(true);
                      fetchCourses();
                    } catch (e) {
                      console.error('Failed to create unit in modal', e);
                    } finally {
                      setCreatingManagedUnit(false);
                    }
                  }}
                  disabled={creatingManagedUnit}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingManagedUnit ? 'Adding…' : 'Add Unit'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Tip: Check “Insert & shift” to place a unit at the given number and push later units down automatically.</p>
            </div>

            {Array.isArray(managingCourse.units) && managingCourse.units.length > 0 ? (
              <div className="space-y-3">
                {managingCourse.units
                  .slice()
                  .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                  .map((unit: any) => (
                  <UnitRow key={unit.id} unit={unit} onUpdated={(updated) => {
                    // Update local list after successful save
                    setManagingCourse((prev: any) => ({
                      ...prev,
                      units: prev.units.map((u: any) => (u.id === updated.id ? { ...u, ...updated, name: updated.title ?? updated.name, order: updated.number ?? updated.order } : u))
                    }));
                    // Also refresh courses to reflect new order globally
                    fetchCourses();
                  }} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No units yet for this course.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProgressTracking = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📈 Progress Tracking</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">🎯 Progress Tracking System</h3>
        <p className="text-blue-800 text-sm mb-3">
          This system tracks daily student performance, learning patterns, and progress trends for detailed reporting and analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">📊 Daily Progress:</span> Track scores and time spent
          </div>
          <div>
            <span className="font-medium">📈 Weekly Trends:</span> Identify best/worst performance days
          </div>
          <div>
            <span className="font-medium">🧠 Learning Patterns:</span> Analyze improvement rates and consistency
          </div>
        </div>
      </div>
      
      <ProgressDashboard isTeacher={true} />
    </div>
  );

  // Inline component for editing a unit with bump option
  type UnitRowProps = { unit: any; onUpdated: (unit: any) => void };
  const UnitRow: React.FC<UnitRowProps> = ({ unit, onUpdated }) => {
    const [title, setTitle] = useState(unit.name || unit.title || '');
    const [description, setDescription] = useState(unit.description || '');
    const [order, setOrder] = useState<number>(unit.order ?? unit.number ?? 1);
    const [bump, setBump] = useState<boolean>(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const save = async () => {
      try {
        setSaving(true);
        setErr('');
        const res = await axios.patch(`/units/${unit.id}`, {
          title,
          number: order,
          description,
          bump
        });
        onUpdated(res.data.unit);
        setBump(false);
      } catch (e: any) {
        setErr(e.response?.data?.message || 'Failed to update unit');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="border rounded-md p-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Unit Name</label>
            <input className="w-full border rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <input className="w-full border rounded px-2 py-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Number</label>
            <input type="number" min={1} className="w-full border rounded px-2 py-1" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 1)} />
          </div>
          <div className="md:col-span-1">
            <label className="inline-flex items-center mt-5 text-xs">
              <input type="checkbox" className="mr-2" checked={bump} onChange={(e) => setBump(e.target.checked)} />
              Insert & shift
            </label>
          </div>
        </div>
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
        <div className="mt-3 flex justify-end">
          <button onClick={save} disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="h-full">
      <ChatInterface />
    </div>
  );

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUserInfo(response.data.user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Fetch data from API
  const fetchCourses = async () => {
    try {
      const response = await axios.get('/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchResources = async () => {
    try {
      console.log('📁 Fetching resources for subject:', currentSubjectId);
      const response = await axios.get(`/resources?subjectId=${currentSubjectId}`);
      setResources(response.data.resources || []);
      console.log('✅ Resources fetched successfully, count:', response.data.resources?.length || 0);
      console.log('📊 All resources:', response.data.resources?.map((r: any) => ({ 
        title: r.title, 
        subjectId: r.subjectId, 
        subject: r.subject?.name || 'None'
      })));
      console.log('🔍 Coding resources:', response.data.resources?.filter((r: any) => r.subjectId === currentSubjectId).map((r: any) => r.title));
    } catch (error) {
      console.error('❌ Error fetching resources:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log('🔍 Fetching assignments for Coding subject...');
      const response = await axios.get(`/assignments/teacher?subjectId=${currentSubjectId}`);
      console.log('📋 Assignments response:', response.data);
      setAssignments(response.data.assignments || []);
      console.log('✅ Assignments fetched successfully, count:', response.data.assignments?.length || 0);
      console.log('📊 Available categories:', [...new Set(response.data.assignments?.map((a: any) => a.category).filter(Boolean) || [])]);
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('👥 Fetching students...');
      // Bust caches to ensure we see latest data after edits
      const response = await axios.get('/auth/students', { params: { ts: Date.now() } });
      setStudents(response.data.students || []);
      console.log('✅ Students fetched successfully, count:', response.data.students?.length || 0);
      console.log('👥 Student users:', (response.data.students || []).map((s: any) => ({ 
        name: `${s.firstName} ${s.lastName}`, 
        email: s.email, 
        classroom: s.classroom?.name || 'No classroom',
        studentNumber: s.studentNumber
      })));
      console.log('📊 Active classes:', activeClasses);
      console.log('📈 Average progress:', averageProgress);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchAssignmentsBySubject = async (subjectId: string) => {
    try {
      console.log('🔍 Fetching assignments for subject:', subjectId);
      const response = await axios.get(`/assignments/teacher?subjectId=${subjectId}`);
      console.log('📋 Assignments response:', response.data);
      setAssignments(response.data.assignments || []);
      console.log('✅ Assignments fetched successfully, count:', response.data.assignments?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (!newAssignment.title.trim()) {
      setError('Assignment title is required');
      setLoading(false);
      return;
    }

    if (!newAssignment.type) {
      setError('Assignment type is required');
      setLoading(false);
      return;
    }

    if (!newAssignment.difficulty) {
      setError('Difficulty level is required');
      setLoading(false);
      return;
    }

    if (!newAssignment.quarter) {
      setError('Quarter is required');
      setLoading(false);
      return;
    }

    // Validate time limit if provided
    if (newAssignment.timeLimit && newAssignment.timeLimit.trim()) {
      const timeLimit = parseInt(newAssignment.timeLimit);
      if (isNaN(timeLimit) || timeLimit < 1) {
        setError('Time limit must be a positive integer');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('=== DEBUGGING ASSIGNMENT UPDATE ===');
      console.log('1. Original newAssignment:', JSON.stringify(newAssignment, null, 2));
      console.log('2. allQuestions length:', allQuestions.length);
      console.log('3. currentQuestionIndex:', currentQuestionIndex);
      console.log('4. allQuestions content:', JSON.stringify(allQuestions, null, 2));
      
      // Create a clean assignment data object with only the fields that should be sent to the backend
      console.log('5. About to create assignmentData object...');
      console.log('5a. newAssignment at this point:', JSON.stringify(newAssignment, null, 2));
      console.log('5b. allQuestions before creating assignmentData:', JSON.stringify(allQuestions, null, 2));
      // Clean and validate the data before sending to backend
      let assignmentData: any = {
        title: newAssignment.title,
        description: newAssignment.description,
        type: newAssignment.type,
        subtype: newAssignment.subtype || undefined,
        category: newAssignment.category || undefined,
        difficulty: newAssignment.difficulty,
        timeLimit: newAssignment.timeLimit && newAssignment.timeLimit.trim() ? parseInt(newAssignment.timeLimit) : undefined,
        points: newAssignment.points,
        instructions: newAssignment.instructions || undefined,
        criteria: newAssignment.criteria || undefined,
        autoGrade: newAssignment.autoGrade,
        showFeedback: newAssignment.showFeedback,
        dueDate: newAssignment.dueDate && newAssignment.dueDate.trim() ? newAssignment.dueDate : undefined,
        availableFrom: newAssignment.availableFrom && newAssignment.availableFrom.trim() ? newAssignment.availableFrom : undefined,
        availableTo: newAssignment.availableTo && newAssignment.availableTo.trim() ? newAssignment.availableTo : undefined,
        quarter: newAssignment.quarter,
        maxAttempts: newAssignment.maxAttempts && newAssignment.maxAttempts.trim() ? parseInt(newAssignment.maxAttempts) : undefined,
        shuffleQuestions: newAssignment.shuffleQuestions,
        allowReview: newAssignment.allowReview,
        tags: newAssignment.tags,
        courseId: newAssignment.courseId && newAssignment.courseId.trim() ? newAssignment.courseId : '75124753-9465-4570-a466-4ee6178fcdcf', // Default to Coding course
        unitId: newAssignment.unitId && newAssignment.unitId.trim() ? newAssignment.unitId : undefined,
        partId: newAssignment.partId && newAssignment.partId.trim() ? newAssignment.partId : undefined,
        sectionId: newAssignment.sectionId && newAssignment.sectionId.trim() ? newAssignment.sectionId : undefined,
        topicId: newAssignment.topicId && newAssignment.topicId.trim() ? newAssignment.topicId : undefined,
        published: newAssignment.published,
        trackAttempts: newAssignment.trackAttempts,
        trackConfidence: newAssignment.trackConfidence,
        trackTimeSpent: newAssignment.trackTimeSpent,
        engagementDeadline: newAssignment.engagementDeadline && newAssignment.engagementDeadline.trim() ? parseInt(newAssignment.engagementDeadline) : undefined,
        lateSubmissionPenalty: newAssignment.lateSubmissionPenalty,
        negativeScoreThreshold: newAssignment.negativeScoreThreshold,
        recommendedCourses: newAssignment.recommendedCourses,
        recommendations: newAssignment.recommendations,
        difficultyLevel: newAssignment.difficultyLevel || 'beginner',
        learningObjectives: newAssignment.learningObjectives
      };
      
      console.log('6. assignmentData object created:', JSON.stringify(assignmentData, null, 2));
      console.log('6a. assignmentData === allQuestions immediately after creation?', assignmentData === allQuestions);
      console.log('6b. assignmentData type after creation:', typeof assignmentData);
      console.log('6c. assignmentData isArray after creation:', Array.isArray(assignmentData));
      console.log('6d. allQuestions content at this point:', JSON.stringify(allQuestions, null, 2));
      console.log('6e. assignmentData === allQuestions?', assignmentData === allQuestions);
      
      // If we have multiple questions, prepare them for submission
      console.log('7. About to check allQuestions.length:', allQuestions.length);
      if (allQuestions.length > 1) {
        console.log('7a. Multiple questions path taken');
        // Update the current question in allQuestions with form data
        const updatedQuestions = [...allQuestions];
        if (newAssignment.type === 'multiple-choice') {
          updatedQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            options: newAssignment.options,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'true-false') {
          updatedQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'matching') {
          // For matching, ONLY send the data directly to the top level
          assignmentData.leftItems = newAssignment.leftItems;
          assignmentData.rightItems = newAssignment.rightItems;
          // Don't create nested structure for matching
        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
          updatedQuestions[currentQuestionIndex] = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'speaking') {
          updatedQuestions[currentQuestionIndex] = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'listening') {
          updatedQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            bulkQuestions: newAssignment.bulkQuestions
          };
        } else if (newAssignment.type === 'line-match') {
          updatedQuestions[currentQuestionIndex] = {
            pairs: newAssignment.questions?.pairs || []
          };
        } else if (newAssignment.type === 'phoneme-build') {
          updatedQuestions[currentQuestionIndex] = {
            targetWord: newAssignment.questions?.targetWord || '',
            phonemeTiles: newAssignment.questions?.phonemeTiles || [],
            correctAnswer: newAssignment.questions?.correctAnswer || ''
          };
        }
        
        // Set the questions data for submission
        console.log('7b. Setting questions for multiple questions case...');
        // For matching, don't create nested questions structure
        if (newAssignment.type !== 'matching') {
          assignmentData.questions = {
            type: newAssignment.type,
            questions: updatedQuestions
          };
        }
        console.log('8. assignmentData after setting questions:', JSON.stringify(assignmentData, null, 2));
        console.log('8a. assignmentData type after setting questions:', typeof assignmentData);
        console.log('8b. assignmentData isArray after setting questions:', Array.isArray(assignmentData));
        console.log('8c. assignmentData === allQuestions after setting questions?', assignmentData === allQuestions);
      } else {
        // For single question, create the questions structure
        let questionData = {};
        if (newAssignment.type === 'multiple-choice') {
          questionData = {
            question: newAssignment.question,
            options: newAssignment.options,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'true-false') {
          questionData = {
            question: newAssignment.question,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'matching') {
          // For matching, ONLY send the data directly to the top level
          assignmentData.leftItems = newAssignment.leftItems;
          assignmentData.rightItems = newAssignment.rightItems;
          // Don't create nested structure for matching
        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
          questionData = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'speaking') {
          questionData = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'listening') {
          questionData = {
            question: newAssignment.question,
            bulkQuestions: newAssignment.bulkQuestions
          };
        } else if (newAssignment.type === 'line-match') {
          questionData = {
            pairs: newAssignment.questions?.pairs || []
          };
        } else if (newAssignment.type === 'phoneme-build') {
          questionData = {
            targetWord: newAssignment.questions?.targetWord || '',
            phonemeTiles: newAssignment.questions?.phonemeTiles || [],
            correctAnswer: newAssignment.questions?.correctAnswer || ''
          };
        }
        
        // For matching, don't create nested questions structure
        if (newAssignment.type !== 'matching') {
          assignmentData.questions = {
            type: newAssignment.type,
            questions: [questionData]
          };
        }
        console.log('9. assignmentData after single question structure:', JSON.stringify(assignmentData, null, 2));
        console.log('9a. assignmentData type after single question:', typeof assignmentData);
        console.log('9b. assignmentData isArray after single question:', Array.isArray(assignmentData));
        console.log('9c. assignmentData === allQuestions after single question?', assignmentData === allQuestions);
      }
      
      console.log('10. assignmentData after questions structure:', JSON.stringify(assignmentData, null, 2));
      console.log('10a. Checking if assignmentData === allQuestions:', assignmentData === allQuestions);
      console.log('10b. assignmentData type:', typeof assignmentData);
      console.log('10c. allQuestions type:', typeof allQuestions);
      
      // Convert data types to match backend expectations
      console.log('11. Before type conversion - assignmentData type:', typeof assignmentData);
      console.log('11a. Before type conversion - assignmentData isArray:', Array.isArray(assignmentData));
      console.log('11b. Before type conversion - assignmentData === allQuestions:', assignmentData === allQuestions);
      
      if (assignmentData.points && typeof assignmentData.points === 'string') {
        (assignmentData as any).points = parseInt(assignmentData.points) || 1;
      }
      if (assignmentData.maxAttempts && typeof assignmentData.maxAttempts === 'string') {
        (assignmentData as any).maxAttempts = parseInt(assignmentData.maxAttempts) || null;
      }
      if (assignmentData.timeLimit && typeof assignmentData.timeLimit === 'string') {
        (assignmentData as any).timeLimit = parseInt(assignmentData.timeLimit) || null;
      }
      if (assignmentData.engagementDeadline && typeof assignmentData.engagementDeadline === 'string') {
        (assignmentData as any).engagementDeadline = parseInt(assignmentData.engagementDeadline) || null;
      }
      if (assignmentData.lateSubmissionPenalty && typeof assignmentData.lateSubmissionPenalty === 'string') {
        (assignmentData as any).lateSubmissionPenalty = parseInt(assignmentData.lateSubmissionPenalty) || 0;
      }
      if (assignmentData.negativeScoreThreshold && typeof assignmentData.negativeScoreThreshold === 'string') {
        (assignmentData as any).negativeScoreThreshold = parseInt(assignmentData.negativeScoreThreshold) || 0;
      }
      
      // Convert boolean fields
      if (typeof assignmentData.autoGrade === 'string') {
        (assignmentData as any).autoGrade = assignmentData.autoGrade === 'true';
      }
      if (typeof assignmentData.showFeedback === 'string') {
        (assignmentData as any).showFeedback = assignmentData.showFeedback === 'true';
      }
      if (typeof assignmentData.shuffleQuestions === 'string') {
        (assignmentData as any).shuffleQuestions = assignmentData.shuffleQuestions === 'true';
      }
      if (typeof assignmentData.allowReview === 'string') {
        (assignmentData as any).allowReview = assignmentData.allowReview === 'true';
      }
      if (typeof assignmentData.published === 'string') {
        (assignmentData as any).published = assignmentData.published === 'true';
      }
      if (typeof assignmentData.trackAttempts === 'string') {
        (assignmentData as any).trackAttempts = assignmentData.trackAttempts === 'true';
      }
      if (typeof assignmentData.trackConfidence === 'string') {
        (assignmentData as any).trackConfidence = assignmentData.trackConfidence === 'true';
      }
      if (typeof assignmentData.trackTimeSpent === 'string') {
        (assignmentData as any).trackTimeSpent = assignmentData.trackTimeSpent === 'true';
      }
      
      console.log('12. After type conversion - assignmentData type:', typeof assignmentData);
      console.log('12a. After type conversion - assignmentData isArray:', Array.isArray(assignmentData));
      console.log('12b. After type conversion - assignmentData === allQuestions:', assignmentData === allQuestions);
      console.log('5. assignmentData after type conversion:', JSON.stringify(assignmentData, null, 2));
      
      // Final check - make sure assignmentData is an object, not an array
      if (Array.isArray(assignmentData)) {
        console.error('ERROR: assignmentData is an array instead of an object!');
        console.error('assignmentData:', assignmentData);
        console.error('This means assignmentData was accidentally set to allQuestions or another array');
        console.error('assignmentData === allQuestions:', assignmentData === allQuestions);
        console.error('assignmentData === allQuestions.questions:', assignmentData === (allQuestions as any).questions);
        
        // Try to recover by creating a proper assignment object
        console.log('Attempting to recover by creating proper assignment object...');
        assignmentData = {
          title: newAssignment.title || 'Recovered Assignment',
          description: newAssignment.description || '',
          type: newAssignment.type || 'multiple-choice',
          questions: {
            type: newAssignment.type || 'multiple-choice',
            questions: assignmentData // Use the array as the questions
          }
        };
        console.log('Recovered assignmentData:', JSON.stringify(assignmentData, null, 2));
      }
      
      console.log('6. Final assignmentData type check passed - it is an object');
      
      let response;
      
      // Check if we're editing an existing assignment or creating a new one
      if (newAssignment.id) {
        // Update existing assignment
        console.log('Updating assignment:', newAssignment.id);
        console.log('Final assignmentData type:', typeof assignmentData);
        console.log('Final assignmentData isArray:', Array.isArray(assignmentData));
        console.log('Final assignmentData === allQuestions?', assignmentData === allQuestions);
        
        // Save the current question before creating the clean assignment data
        let finalQuestions = [...allQuestions];
        if (newAssignment.type === 'multiple-choice') {
          finalQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            options: newAssignment.options,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'true-false') {
          finalQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            correctAnswer: newAssignment.correctAnswer,
            explanation: newAssignment.explanation
          };
        } else if (newAssignment.type === 'matching') {
          finalQuestions[currentQuestionIndex] = {
            leftItems: newAssignment.leftItems,
            rightItems: newAssignment.rightItems
          };
        } else if (newAssignment.type === 'writing' || newAssignment.type === 'writing-long') {
          finalQuestions[currentQuestionIndex] = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'speaking') {
          finalQuestions[currentQuestionIndex] = {
            question: newAssignment.question
          };
        } else if (newAssignment.type === 'listening') {
          finalQuestions[currentQuestionIndex] = {
            question: newAssignment.question,
            bulkQuestions: newAssignment.bulkQuestions
          };
        }

        // Force create a clean assignment object to avoid any reference issues
        const cleanAssignmentData = {
          title: newAssignment.title,
          description: newAssignment.description,
          type: newAssignment.type,
          subtype: newAssignment.subtype,
          category: newAssignment.category,
          difficulty: newAssignment.difficulty,
          timeLimit: newAssignment.timeLimit ? parseInt(String(newAssignment.timeLimit)) || null : null,
          points: newAssignment.points,
          instructions: newAssignment.instructions,
          criteria: newAssignment.criteria,
          autoGrade: newAssignment.autoGrade,
          showFeedback: newAssignment.showFeedback,
          dueDate: newAssignment.dueDate,
          availableFrom: newAssignment.availableFrom,
          availableTo: newAssignment.availableTo,
          quarter: newAssignment.quarter,
          maxAttempts: newAssignment.maxAttempts ? parseInt(String(newAssignment.maxAttempts)) || null : null,
          shuffleQuestions: newAssignment.shuffleQuestions,
          allowReview: newAssignment.allowReview,
          tags: newAssignment.tags,
          courseId: newAssignment.courseId,
          unitId: newAssignment.unitId,
          partId: newAssignment.partId,
          sectionId: newAssignment.sectionId,
          topicId: newAssignment.topicId,
          published: newAssignment.published,
          trackAttempts: newAssignment.trackAttempts,
          trackConfidence: newAssignment.trackConfidence,
          trackTimeSpent: newAssignment.trackTimeSpent,
          engagementDeadline: newAssignment.engagementDeadline ? parseInt(String(newAssignment.engagementDeadline)) || 0 : 0,
          lateSubmissionPenalty: newAssignment.lateSubmissionPenalty ? parseInt(String(newAssignment.lateSubmissionPenalty)) || 0 : 0,
          negativeScoreThreshold: newAssignment.negativeScoreThreshold ? parseInt(String(newAssignment.negativeScoreThreshold)) || 0 : 0,
          recommendedCourses: newAssignment.recommendedCourses,
          recommendations: newAssignment.recommendations,
          difficultyLevel: newAssignment.difficultyLevel,
          learningObjectives: newAssignment.learningObjectives,
          questions: {
            type: newAssignment.type,
            questions: finalQuestions
              .filter(q => q.question && q.question.trim() !== '') // Filter out empty questions
              .map(q => ({ ...q })) // Deep copy each question
          }
        };
        
        console.log('Clean assignmentData being sent:', JSON.stringify(cleanAssignmentData, null, 2));
        response = await axios.patch(`/assignments/${newAssignment.id}`, cleanAssignmentData);
        console.log('Assignment updated successfully:', response.data);
        setSuccess('Assignment updated successfully!');
        
        // Stay in edit mode - don't clear form or hide it
        // Just refresh the assignments list to show updated data
        fetchAssignments();
      } else {
        // Create new assignment
        console.log('Creating new assignment');
        console.log('FINAL assignmentData being sent:', JSON.stringify(assignmentData, null, 2));
        console.log('FINAL assignmentData type:', typeof assignmentData);
        console.log('FINAL assignmentData keys:', Object.keys(assignmentData));
        response = await axios.post('/assignments', assignmentData);
        console.log('✅ Assignment created successfully:', response.data);
        setSuccess('Assignment created successfully!');
        
        // Refresh assignments list immediately
        console.log('🔄 Refreshing assignments list...');
        await fetchAssignments();
        
        // Clear form and hide it for new assignments
        setNewAssignment({
          title: '',
          description: '',
          type: 'multiple-choice',
          subtype: '',
          category: '',
          difficulty: 'beginner',
          timeLimit: '',
          points: 1,
          instructions: '',
          criteria: '',
          autoGrade: true,
          showFeedback: true,
          dueDate: '',
          availableFrom: '',
          availableTo: '',
          quarter: 'Q1',
          maxAttempts: '',
          shuffleQuestions: false,
          allowReview: true,
          tags: [],
          courseId: '',
          unitId: '',
          partId: '',
          sectionId: '',
          topicId: '',
          published: true,
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswerIndex: 0,
          explanation: '',
          incorrectExplanations: {},
          recommendations: {},
          negativeScoreThreshold: 0,
          recommendedCourses: [],
          difficultyLevel: 'beginner',
          learningObjectives: [],
          trackAttempts: true,
          trackConfidence: true,
          trackTimeSpent: true,
          engagementDeadline: '',
          lateSubmissionPenalty: 0,
          statements: [],
          answers: [],
          leftItems: [],
          rightItems: [],
          sentence: '',
          wordBank: [],
          images: [],
          captions: [],
          orderItems: [],
          bulkQuestions: ''
        });
        setAllQuestions([]);
        setCurrentQuestionIndex(0);
        setShowCreateAssignment(false);
        
        // Refresh assignments list
        fetchAssignments();
      }
    } catch (error: any) {
      console.error('Error with assignment:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        setError(`Failed to create assignment: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check your input and try again.');
      } else {
        setError('Failed to create assignment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this assignment?')) {
        await axios.delete(`/assignments/${assignmentId}`);
        console.log('Assignment deleted successfully');
        // Refresh the assignments list
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment. Please try again.');
    }
  };

  const handleEditAssignment = (assignment: any) => {
    console.log('Edit assignment:', assignment);
    
    // Helper function to convert ISO date to datetime-local format
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };
    
    // Helper function to update current question in allQuestions
    const updateCurrentQuestion = (updatedQuestion: any) => {
      setAllQuestions(prev => {
        const newQuestions = [...prev];
        newQuestions[currentQuestionIndex] = updatedQuestion;
        return newQuestions;
      });
    };
    
    // Helper function to navigate to a specific question
    const navigateToQuestion = (index: number) => {
      if (index >= 0 && index < allQuestions.length) {
        setCurrentQuestionIndex(index);
        const question = allQuestions[index];
        
        // Update form with the selected question's data
        if (assignment.type === 'multiple-choice') {
          setNewAssignment(prev => ({
            ...prev,
            question: question.question || '',
            options: question.options || ['', '', '', ''],
            correctAnswer: question.correctAnswer || '',
            correctAnswerIndex: question.options ? question.options.indexOf(question.correctAnswer) : 0,
            explanation: question.explanation || ''
          }));
        } else if (assignment.type === 'true-false') {
          setNewAssignment(prev => ({
            ...prev,
            question: question.question || '',
            correctAnswer: question.correctAnswer || '',
            explanation: question.explanation || ''
          }));
        } else if (assignment.type === 'matching') {
          setNewAssignment(prev => ({
            ...prev,
            leftItems: question.leftItems || [],
            rightItems: question.rightItems || []
          }));
        } else if (assignment.type === 'writing' || assignment.type === 'writing-long') {
          setNewAssignment(prev => ({
            ...prev,
            question: question.question || ''
          }));
        } else if (assignment.type === 'speaking') {
          setNewAssignment(prev => ({
            ...prev,
            question: question.question || ''
          }));
        } else if (assignment.type === 'listening') {
          setNewAssignment(prev => ({
            ...prev,
            question: question.question || '',
            bulkQuestions: question.bulkQuestions || ''
          }));
        } else if (assignment.type === 'line-match') {
          setNewAssignment(prev => ({
            ...prev,
            questions: {
              ...prev.questions,
              pairs: question.pairs || []
            }
          }));
        } else if (assignment.type === 'phoneme-build') {
          setNewAssignment(prev => ({
            ...prev,
            questions: {
              ...prev.questions,
              targetWord: question.targetWord || '',
              phonemeTiles: question.phonemeTiles || [],
              correctAnswer: question.correctAnswer || ''
            }
          }));
        }
      }
    };
    
    // Extract content from the questions object if it exists
    let questionContent = {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswerIndex: 0,
      explanation: '',
      leftItems: [],
      rightItems: [],
      bulkQuestions: ''
    };
    
    if (assignment.questions && assignment.questions.questions && assignment.questions.questions.length > 0) {
      // Load all questions for multi-question editing
      setAllQuestions(assignment.questions.questions);
      setCurrentQuestionIndex(0);
      
      const firstQuestion = assignment.questions.questions[0];
      console.log(`Assignment has ${assignment.questions.questions.length} questions, enabling multi-question editing`);
      
      // Handle different assignment types
      if (assignment.type === 'multiple-choice') {
        questionContent = {
          question: firstQuestion.question || '',
          options: firstQuestion.options || ['', '', '', ''],
          correctAnswer: firstQuestion.correctAnswer || '',
          correctAnswerIndex: firstQuestion.options ? firstQuestion.options.indexOf(firstQuestion.correctAnswer) : 0,
          explanation: firstQuestion.explanation || '',
          leftItems: [],
          rightItems: [],
          bulkQuestions: ''
        };
      } else if (assignment.type === 'true-false') {
        questionContent = {
          question: firstQuestion.question || '',
          options: ['', '', '', ''],
          correctAnswer: firstQuestion.correctAnswer || '',
          correctAnswerIndex: 0,
          explanation: firstQuestion.explanation || '',
          leftItems: [],
          rightItems: [],
          bulkQuestions: ''
        };
      } else if (assignment.type === 'matching') {
        questionContent = {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswerIndex: 0,
          explanation: '',
          leftItems: firstQuestion.leftItems || [],
          rightItems: firstQuestion.rightItems || [],
          bulkQuestions: ''
        };
      } else if (assignment.type === 'writing' || assignment.type === 'writing-long') {
        questionContent = {
          question: firstQuestion.question || '',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswerIndex: 0,
          explanation: '',
          leftItems: [],
          rightItems: [],
          bulkQuestions: ''
        };
      } else if (assignment.type === 'speaking') {
        questionContent = {
          question: firstQuestion.question || '',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswerIndex: 0,
          explanation: '',
          leftItems: [],
          rightItems: [],
          bulkQuestions: ''
        };
      } else if (assignment.type === 'listening') {
        questionContent = {
          question: firstQuestion.question || '',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswerIndex: 0,
          explanation: '',
          leftItems: [],
          rightItems: [],
          bulkQuestions: firstQuestion.bulkQuestions || ''
        };
      }
    }
    
    // Set the assignment data for editing with proper date formatting
    setNewAssignment({
      ...assignment,
      ...questionContent,
      // Convert ISO dates to datetime-local format
      dueDate: formatDateForInput(assignment.dueDate),
      availableFrom: formatDateForInput(assignment.availableFrom),
      availableTo: formatDateForInput(assignment.availableTo),
      tags: assignment.tags || [],
      recommendations: assignment.recommendations || {},
      incorrectExplanations: assignment.incorrectExplanations || {},
      learningObjectives: assignment.learningObjectives || [],
      recommendedCourses: assignment.recommendedCourses || [],
      statements: assignment.statements || [],
      answers: assignment.answers || [],
      wordBank: assignment.wordBank || [],
      images: assignment.images || [],
      captions: assignment.captions || [],
      orderItems: assignment.orderItems || []
    });
    setShowCreateAssignment(true);
    setActiveTab('assignment-creator');
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingResource(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedFile) {
        setError('Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', newResource.title);
      formData.append('description', newResource.description || '');
      formData.append('subjectId', newResource.subjectId || currentSubjectId);
      formData.append('courseId', newResource.courseId || '');
      formData.append('unitId', newResource.unitId || '');
      formData.append('tags', JSON.stringify(newResource.tags));
      formData.append('isPublic', newResource.isPublic.toString());
      formData.append('isShared', newResource.isShared.toString());

      const response = await axios.post('/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Resource uploaded successfully');
      setShowUploadResource(false);
      setNewResource({
        title: '',
        description: '',
        subjectId: '',
        courseId: '',
        unitId: '',
        tags: [],
        isPublic: false,
        isShared: false
      });
      setSelectedFile(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      if (error.response?.data?.details) {
        setError(`Upload failed: ${error.response.data.message} - ${error.response.data.details}`);
      } else if (error.response?.data?.message) {
        setError(`Upload failed: ${error.response.data.message}`);
      } else if (error.message) {
        setError(`Upload failed: ${error.message}`);
      } else {
        setError('Failed to upload resource. Please check your connection and try again.');
      }
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this resource?')) {
        await axios.delete(`/resources/${resourceId}`);
        console.log('Resource deleted successfully');
        // Refresh the resources list
        fetchResources();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError('Failed to delete resource. Please try again.');
    }
  };

  // Resource allocation functions
  const handleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSelectAllResources = () => {
    const allResourceIds = getFilteredResources().map((resource: any) => resource.id);
    setSelectedResources(allResourceIds);
  };

  const handleClearSelection = () => {
    setSelectedResources([]);
  };

  const getFilteredResources = () => {
    return resources.filter((resource: any) => {
      const matchesSearch = resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                           resource.description?.toLowerCase().includes(resourceSearch.toLowerCase());
      const matchesType = !resourceTypeFilter || resource.type === resourceTypeFilter;
      return matchesSearch && matchesType;
    });
  };

  const handleAllocateResources = async () => {
    console.log('🔧 Allocate Resources clicked!');
    console.log('Selected resources:', selectedResources);
    
    if (!selectedAssignment || selectedResources.length === 0) {
      setError('Please select an assignment and at least one resource');
      return;
    }

    setAllocationLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/assignments/resources', {
        assignmentId: selectedAssignment,
        resourceIds: selectedResources
      });
      
      setSuccess(`Successfully allocated ${selectedResources.length} resource(s) to assignment`);
      setSelectedResources([]);
      fetchAssignments(); // Refresh to show updated allocations
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to allocate resources');
    } finally {
      setAllocationLoading(false);
    }
  };

  const handleViewAssignmentResources = (assignment: any) => {
    console.log('View resources for assignment:', assignment);
    
    if (!assignment.resources || assignment.resources.length === 0) {
      alert('No resources attached to this assignment.');
      return;
    }
    
    // Create a modal or popup to show resources
    const resourceList = assignment.resources.map((resource: any, index: number) => 
      `${index + 1}. ${resource.title} (${resource.type})`
    ).join('\n');
    
    alert(`Resources for "${assignment.title}":\n\n${resourceList}`);
  };

  const getFileIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'ppt': '📊',
      'pptx': '📊',
      'xls': '📈',
      'xlsx': '📈',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp3': '🎵',
      'mp4': '🎬',
      'avi': '🎬',
      'mov': '🎬',
      'txt': '📄',
      'zip': '📦',
      'rar': '📦'
    };
    return icons[type.toLowerCase()] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleViewSubjectDetails = (subject: any) => {
    console.log('View subject details:', subject);
    
    // Case-specific ordering: list courses A→Z by name (case-insensitive, numeric-aware)
    const orderedCourses = [...(subject.courses || [])].sort(
      (a: any, b: any) => (a?.name || '').localeCompare((b?.name || ''), undefined, { numeric: true, sensitivity: 'base' })
    );

    const subjectInfo = `
Subject: ${subject.name}
Description: ${subject.description || 'No description'}
Courses: ${subject.courses?.length || 0}
Created: ${subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'Unknown'}

${orderedCourses.length > 0 ? 'Courses:' : 'No courses assigned'}
${orderedCourses.map((course: any, index: number) => `${index + 1}. ${course.name}`).join('\n') || ''}
    `.trim();
    
    alert(`Subject Details:\n\n${subjectInfo}`);
  };

  const handleViewCourseDetails = (course: any) => {
    // Replace alert with a draggable, scrollable modal for full content
    const units = (course.units || []).map((u: any, i: number) => `${i + 1}. ${u.name}`).join('\n');
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
    const card = document.createElement('div');
    card.className = 'absolute bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 cursor-move';
    card.style.left = '50%';
    card.style.top = '10%';
    card.style.transform = 'translateX(-50%)';
    card.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-xl font-semibold">Course Details</h3>
          <p class="text-sm text-gray-600">${course.name}</p>
        </div>
        <button id="closeCourseModal" class="ml-4 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
      </div>
      <div class="space-y-2 text-sm">
        <p><span class="font-medium">Subject:</span> ${course.subject?.name || 'No Subject'}</p>
        <p><span class="font-medium">Description:</span> ${course.description || 'No description'}</p>
        <p><span class="font-medium">Units:</span> ${course.units?.length || 0}</p>
        <p><span class="font-medium">Created:</span> ${course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Unknown'}</p>
      </div>
      <div class="mt-4">
        <h4 class="text-md font-semibold mb-2">Unit List</h4>
        <pre class="bg-gray-50 rounded border p-3 text-sm whitespace-pre-wrap">${units || 'No units assigned'}</pre>
      </div>
    `;
    // Drag handling
    card.onmousedown = (e: MouseEvent) => {
      const startX = e.clientX; const startY = e.clientY; const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const offX = startX - rect.left; const offY = startY - rect.top;
      const move = (ev: MouseEvent) => { card.style.left = ev.clientX - offX + 'px'; card.style.top = Math.max(0, ev.clientY - offY) + 'px'; card.style.transform = 'none'; };
      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    };
    modal.appendChild(card);
    document.body.appendChild(modal);
    (card.querySelector('#closeCourseModal') as HTMLButtonElement).onclick = () => document.body.removeChild(modal);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/subjects', newSubject);
      setSuccess('Subject created successfully!');
      setShowCreateSubject(false);
      setNewSubject({ name: '', description: '' });
      fetchSubjects(); // Refresh the subjects list
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(`/subjects/${editingSubject.id}`, {
        name: editingSubject.name,
        description: editingSubject.description
      });
      setSuccess('Subject updated successfully!');
      setShowEditSubject(false);
      setEditingSubject(null);
      fetchSubjects(); // Refresh the subjects list
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update subject');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/courses', newCourse);
      setSuccess('Course created successfully!');
      setShowCreateCourse(false);
      setNewCourse({ name: '', description: '', subjectId: '' });
      fetchCourses(); // Refresh the courses list
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(`/courses/${editingCourse.id}`, {
        name: editingCourse.name,
        description: editingCourse.description,
        subjectId: editingCourse.subjectId
      });
      setSuccess('Course updated successfully!');
      setShowEditCourse(false);
      setEditingCourse(null);
      fetchCourses(); // Refresh the courses list
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating unit with data:', {
        title: newUnit.name,
        number: newUnit.order,
        description: newUnit.description,
        courseId: selectedCourseForUnit.id
      });
      
      const response = await axios.post('/units', {
        title: newUnit.name,
        number: newUnit.order,
        description: newUnit.description,
        courseId: selectedCourseForUnit.id,
        bump: unitBumpInsert
      });

      setSuccess('Unit created successfully');
      setShowCreateUnit(false);
      setSelectedCourseForUnit(null);
      setNewUnit({
        name: '',
        description: '',
        order: 1
      });
      setUnitBumpInsert(false);
      fetchCourses(); // Refresh courses to show the new unit
    } catch (error: any) {
      console.error('Error creating unit:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        setError(`Failed to create unit: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check your input and try again.');
      } else {
        setError('Failed to create unit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourseClick = (course: any) => {
    console.log('Edit course:', course);
    
    // Set up course editing
    setEditingCourse(course);
    setShowEditCourse(true);
  };

  // Student management handlers
  const handleEditStudent = (student: any) => {
    setEditingStudent({
      ...student,
      yearLevel: student.classroom?.yearLevel || '',
      classNum: student.classroom?.classNum || '',
      originalYearLevel: student.classroom?.yearLevel || '',
      originalClassNum: student.classroom?.classNum || ''
    });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setUpdatingStudent(true);
    try {
      const response = await axios.patch(`/auth/students/${editingStudent.id}`, editingStudent);
      if (response.status === 200) {
        setSuccess('Student updated successfully!');
        setShowEditStudentModal(false);
        setEditingStudent(null);
        fetchStudents(); // Refresh the student list
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleUpdateStudentClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.yearLevel || !editingStudent.classNum) {
      setError('Please select a year level and class number');
      return;
    }
    setUpdatingStudent(true);
    try {
      const response = await axios.patch(`/auth/users/${editingStudent.id}/classroom`, {
        yearLevel: editingStudent.yearLevel,
        classNum: editingStudent.classNum
      });
      if (response.status === 200) {
        setSuccess('Classroom updated successfully!');
        // Optimistically update local list
        setStudents(prev => prev.map((s: any) => s.id === editingStudent.id ? {
          ...s,
          classroom: {
            ...(s.classroom || {}),
            yearLevel: editingStudent.yearLevel,
            classNum: editingStudent.classNum,
            name: `${editingStudent.yearLevel}/${editingStudent.classNum}`
          }
        } : s));
        setShowEditStudentModal(false);
        setEditingStudent(null);
        // Also refetch to ensure consistency
        fetchStudents();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update classroom');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/auth/students/${studentId}`);
      if (response.status === 200) {
        setSuccess('Student removed successfully!');
        fetchStudents(); // Refresh the student list
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    // Redirect to login page
    window.location.href = '/login';
  };

  // Cross-organization resource cloning functions
  const fetchCloneableResources = async () => {
    try {
      const response = await axios.get('/resources/clone/resources');
      setCloneableResources(response.data.resources);
    } catch (error) {
      console.error('Error fetching cloneable resources:', error);
      setError('Failed to fetch cloneable resources');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('/resources/clone/organizations');
      setOrganizations(response.data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to fetch organizations');
    }
  };

  const handleCloneResource = async () => {
    if (!selectedCloneResource || !cloneFormData.targetOrganizationId || !cloneFormData.targetSubjectId) {
      setError('Please select a resource and target organization/subject');
      return;
    }

    try {
      setCloningResource(true);
      const response = await axios.post('/resources/clone', {
        sourceResourceId: selectedCloneResource.id,
        targetOrganizationId: cloneFormData.targetOrganizationId,
        targetSubjectId: cloneFormData.targetSubjectId,
        targetCourseId: cloneFormData.targetCourseId || null,
        targetUnitId: cloneFormData.targetUnitId || null,
        includeAssignments: cloneFormData.includeAssignments
      });

      setSuccess(`Resource cloned successfully! ${response.data.clonedAssignments} assignments also cloned.`);
      setShowCloneModal(false);
      setSelectedCloneResource(null);
      setCloneFormData({
        targetOrganizationId: '',
        targetSubjectId: '',
        targetCourseId: '',
        targetUnitId: '',
        includeAssignments: false
      });
      
      // Refresh resources
      fetchResources();
    } catch (error) {
      console.error('Error cloning resource:', error);
      setError('Failed to clone resource');
    } finally {
      setCloningResource(false);
    }
  };

  const openCloneModal = async (resource: any) => {
    setSelectedCloneResource(resource);
    setShowCloneModal(true);
    await fetchOrganizations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Teacher Portal</h1>
              {userInfo && userInfo.organization && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">•</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {userInfo.organization.name}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {userInfo.organization.code}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="text-sm text-gray-600">
                  Welcome, {userInfo.firstName} {userInfo.lastName}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 mr-8">
            {/* Organization Info */}
            {userInfo && userInfo.organization && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-bold text-blue-600">
                      {userInfo.organization.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userInfo.organization.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userInfo.organization.code}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="space-y-2">
              {sidebarMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'course-structure' && renderCourseStructure()}
            {activeTab === 'assignments' && renderAssignments()}
            {activeTab === 'assignment-creator' && renderAssignmentCreator()}
            {activeTab === 'resources' && renderResources()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'class-view' && renderClassView()}
            {activeTab === 'progress' && renderProgressTracking()}
            {activeTab === 'chat' && renderChat()}
          </div>
        </div>
      </div>
      
      {/* Subject Edit Modal */}
      {showEditSubject && editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Edit Subject: {editingSubject.name}</h3>
              <button
                onClick={() => {
                  setShowEditSubject(false);
                  setEditingSubject(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name (e.g., English, Mathematics)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject description... (Supports Markdown formatting)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown: **bold**, *italic*, `code`, lists, headings, etc.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSubject(false);
                    setEditingSubject(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Creation Modal */}
      {showCreateSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create New Subject</h3>
              <button
                onClick={() => {
                  setShowCreateSubject(false);
                  setNewSubject({ name: '', description: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name (e.g., English, Mathematics)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject description... (Supports Markdown formatting)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown: **bold**, *italic*, `code`, lists, headings, etc.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSubject(false);
                    setNewSubject({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create New Course</h3>
              <button
                onClick={() => {
                  setShowCreateCourse(false);
                  setNewCourse({ name: '', description: '', subjectId: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course name (e.g., Project Explore 2)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={newCourse.subjectId}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course description... (Supports Markdown formatting)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown: **bold**, *italic*, `code`, lists, headings, etc.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCourse(false);
                    setNewCourse({ name: '', description: '', subjectId: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Edit Modal */}
      {showEditCourse && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Edit Course: {editingCourse.name}</h3>
              <button
                onClick={() => {
                  setShowEditCourse(false);
                  setEditingCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course name (e.g., Project Explore 2)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={editingCourse.subjectId || editingCourse.subject?.id}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course description... (Supports Markdown formatting)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown: **bold**, *italic*, `code`, lists, headings, etc.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCourse(false);
                    setEditingCourse(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher; 