import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useRouter } from 'next/router';

interface AssessmentType {
  value: string;
  label: string;
  description: string;
  autoGraded: boolean;
  supportsBulkImport: boolean;
}

interface DragDropSubtype {
  value: string;
  label: string;
  description: string;
}

const AssessmentCreator: React.FC = () => {
  const [assessment, setAssessment] = useState({
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
    tags: [] as string[],
    courseId: '',
    unitId: '',
    published: true
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTag, setNewTag] = useState('');
  const router = useRouter();

  const assessmentTypes: AssessmentType[] = [
    {
      value: 'multiple-choice',
      label: 'Multiple Choice',
      description: 'Standard multiple choice questions with one correct answer',
      autoGraded: true,
      supportsBulkImport: true
    },
    {
      value: 'true-false',
      label: 'True/False',
      description: 'Simple true/false questions',
      autoGraded: true,
      supportsBulkImport: true
    },
    {
      value: 'matching',
      label: 'Matching',
      description: 'Match items from two columns',
      autoGraded: true,
      supportsBulkImport: true
    },
    {
      value: 'drag-and-drop',
      label: 'Drag and Drop',
      description: 'Interactive drag and drop activities',
      autoGraded: true,
      supportsBulkImport: false
    },
    {
      value: 'writing',
      label: 'Writing (Short)',
      description: 'Short answer writing questions',
      autoGraded: false,
      supportsBulkImport: false
    },
    {
      value: 'writing-long',
      label: 'Writing (Long)',
      description: 'Extended writing assignments',
      autoGraded: false,
      supportsBulkImport: false
    },
    {
      value: 'speaking',
      label: 'Speaking',
      description: 'Oral response assignments',
      autoGraded: false,
      supportsBulkImport: false
    },
    {
      value: 'listening',
      label: 'Listening Comprehension',
      description: 'Audio-based questions',
      autoGraded: true,
      supportsBulkImport: false
    },
    {
      value: 'assignment',
      label: 'Assignment',
      description: 'General assignment type',
      autoGraded: false,
      supportsBulkImport: false
    }
  ];

  const dragDropSubtypes: DragDropSubtype[] = [
    {
      value: 'ordering',
      label: 'Ordering',
      description: 'Arrange items in the correct order'
    },
    {
      value: 'categorization',
      label: 'Categorization',
      description: 'Sort items into categories'
    },
    {
      value: 'fill-blank',
      label: 'Fill in the Blank',
      description: 'Drag words to fill in blanks'
    },
    {
      value: 'labeling',
      label: 'Labeling',
      description: 'Label parts of an image or diagram'
    }
  ];

  const categories = [
    'Grammar', 'Vocabulary', 'Reading', 'Writing', 'Listening', 
    'Speaking', 'Pronunciation', 'Comprehension', 'Critical Thinking'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const quarters = [
    { value: 'Q1', label: 'Quarter 1' },
    { value: 'Q2', label: 'Quarter 2' },
    { value: 'Q3', label: 'Quarter 3' },
    { value: 'Q4', label: 'Quarter 4' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (assessment.courseId) {
      fetchUnits(assessment.courseId);
    } else {
      setUnits([]);
    }
  }, [assessment.courseId]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/courses');
      setCourses(response.data.courses);
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchUnits = async (courseId: string) => {
    try {
      const response = await axios.get(`/courses/${courseId}/units`);
      setUnits(response.data.units);
    } catch (err: any) {
      console.error('Failed to fetch units:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
    
    // Auto-update autoGrade based on assessment type
    if (field === 'type') {
      const selectedType = assessmentTypes.find(t => t.value === value);
      if (selectedType) {
        setAssessment(prev => ({ ...prev, autoGrade: selectedType.autoGraded }));
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !assessment.tags.includes(newTag.trim())) {
      setAssessment(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAssessment(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const assessmentData = {
        ...assessment,
        timeLimit: assessment.timeLimit ? parseInt(assessment.timeLimit) : null,
        maxAttempts: assessment.maxAttempts ? parseInt(assessment.maxAttempts) : null,
        courseId: assessment.courseId || null,
        unitId: assessment.unitId || null
      };

      const response = await axios.post('/assignments', assessmentData);
      setSuccess('Assessment created successfully!');
      
      // Redirect to assessment list after a short delay
      setTimeout(() => {
        router.push('/teacher');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = assessmentTypes.find(t => t.value === assessment.type);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose an assessment type and configure the settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
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

            {/* Assessment Type Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessmentTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      assessment.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      {type.autoGraded && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Auto-graded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    {type.supportsBulkImport && (
                      <span className="text-xs text-blue-600">Supports bulk import</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Drag and Drop Subtype */}
            {assessment.type === 'drag-and-drop' && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Drag & Drop Subtype</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dragDropSubtypes.map((subtype) => (
                    <div
                      key={subtype.value}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                        assessment.subtype === subtype.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('subtype', subtype.value)}
                    >
                      <h4 className="font-medium text-gray-900">{subtype.label}</h4>
                      <p className="text-sm text-gray-600">{subtype.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={assessment.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="form-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={assessment.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={assessment.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="form-select w-full"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={assessment.points}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={assessment.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="form-textarea w-full"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                value={assessment.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={3}
                className="form-textarea w-full"
                placeholder="Provide specific instructions for students..."
              />
            </div>

            {/* Course and Unit Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course (Optional)
                </label>
                <select
                  value={assessment.courseId}
                  onChange={(e) => handleInputChange('courseId', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit (Optional)
                </label>
                <select
                  value={assessment.unitId}
                  onChange={(e) => handleInputChange('unitId', e.target.value)}
                  className="form-select w-full"
                  disabled={!assessment.courseId}
                >
                  <option value="">Select a unit (optional)</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.order}: {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From
                </label>
                <input
                  type="datetime-local"
                  value={assessment.availableFrom}
                  onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={assessment.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  value={assessment.quarter}
                  onChange={(e) => handleInputChange('quarter', e.target.value)}
                  className="form-select w-full"
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={assessment.timeLimit}
                  onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                  className="form-input w-full"
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  value={assessment.maxAttempts}
                  onChange={(e) => handleInputChange('maxAttempts', e.target.value)}
                  className="form-input w-full"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Grading and Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Grading & Feedback</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoGrade"
                    checked={assessment.autoGrade}
                    onChange={(e) => handleInputChange('autoGrade', e.target.checked)}
                    className="form-checkbox mr-2"
                    disabled={!selectedType?.autoGraded}
                  />
                  <label htmlFor="autoGrade" className="text-sm font-medium text-gray-700">
                    Auto-grade assessment
                    {!selectedType?.autoGraded && (
                      <span className="text-gray-500 ml-1">(Not available for this type)</span>
                    )}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFeedback"
                    checked={assessment.showFeedback}
                    onChange={(e) => handleInputChange('showFeedback', e.target.checked)}
                    className="form-checkbox mr-2"
                  />
                  <label htmlFor="showFeedback" className="text-sm font-medium text-gray-700">
                    Show feedback after submission
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="shuffleQuestions"
                    checked={assessment.shuffleQuestions}
                    onChange={(e) => handleInputChange('shuffleQuestions', e.target.checked)}
                    className="form-checkbox mr-2"
                  />
                  <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">
                    Shuffle question order
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowReview"
                    checked={assessment.allowReview}
                    onChange={(e) => handleInputChange('allowReview', e.target.checked)}
                    className="form-checkbox mr-2"
                  />
                  <label htmlFor="allowReview" className="text-sm font-medium text-gray-700">
                    Allow students to review after submission
                  </label>
                </div>
              </div>

              {!assessment.autoGrade && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grading Criteria
                  </label>
                  <textarea
                    value={assessment.criteria}
                    onChange={(e) => handleInputChange('criteria', e.target.value)}
                    rows={4}
                    className="form-textarea w-full"
                    placeholder="Provide grading criteria or rubric for manual grading..."
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="form-input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {assessment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assessment.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Publish Settings */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={assessment.published}
                onChange={(e) => handleInputChange('published', e.target.checked)}
                className="form-checkbox mr-2"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">
                Publish assessment immediately
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCreator; 