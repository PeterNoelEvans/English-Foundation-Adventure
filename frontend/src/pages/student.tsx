import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useRouter } from 'next/router';
import ChatInterface from '../components/ChatInterface';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  profilePicture?: string;
  role: string;
  studentNumber?: number;
  classroom?: {
    id: string;
    yearLevel: string;
    classNum: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

const Student: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nickname: '',
    password: ''
  });
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [updatingClass, setUpdatingClass] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showCourseSelectionModal, setShowCourseSelectionModal] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showAssignmentQuiz, setShowAssignmentQuiz] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [burstAnimation, setBurstAnimation] = useState(false);
  const [assignmentAnswers, setAssignmentAnswers] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingResource, setViewingResource] = useState<any>(null);
  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
    fetchAssignments();
    fetchSubjects();
    fetchEnrolledCourses();
    fetchAvailableClasses();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000); // 8 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Debug assignment details modal
  useEffect(() => {
    console.log('Assignment details state:', { showAssignmentDetails, selectedAssignment });
  }, [showAssignmentDetails, selectedAssignment]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/auth/me');
      setUser(res.data.user);
      setProfileForm({
        firstName: res.data.user.firstName || '',
        lastName: res.data.user.lastName || '',
        email: res.data.user.email || '',
        nickname: res.data.user.nickname || '',
        password: ''
      });
    } catch (err: any) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/assignments');
      setAssignments(res.data.assignments);
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/enrollment/subjects');
      setSubjects(res.data.subjects);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const res = await axios.get('/enrollment/my-courses');
      setEnrolledCourses(res.data.enrollments);
    } catch (err: any) {
      console.error('Failed to fetch enrolled courses:', err);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const res = await axios.get('/auth/available-classes');
      setAvailableClasses(res.data.classes);
    } catch (err: any) {
      console.error('Failed to fetch available classes:', err);
    }
  };

  const handleClassUpdate = async () => {
    if (!selectedClassId) {
      setError('Please select a class');
      return;
    }

    try {
      setUpdatingClass(true);
      const res = await axios.patch(`/auth/students/${user?.id}/class`, {
        classroomId: selectedClassId
      });
      
      setSuccess('Class updated successfully!');
      setUser(res.data.student);
      setSelectedClassId('');
      
      // Refresh user data to get updated class info
      await fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update class');
    } finally {
      setUpdatingClass(false);
    }
  };

  const handleEnrollInCourse = async (courseId: string) => {
    try {
      setEnrollmentLoading(true);
      await axios.post('/enrollment/enroll', { courseId });
      await fetchEnrolledCourses();
      setShowEnrollmentModal(false);
      setSuccess('Successfully enrolled in course!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleUnenrollFromCourse = async (courseId: string) => {
    try {
      await axios.delete(`/enrollment/unenroll/${courseId}`);
      await fetchEnrolledCourses();
      setSuccess('Successfully unenrolled from course!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unenroll from course');
    }
  };

  const handleCourseSelection = (course: any) => {
    setSelectedCourse(course);
    setShowCourseSelectionModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleStartAssignment = (assignment: any) => {
    console.log('Starting assignment:', assignment);
    setCurrentAssignment(assignment);
    setShowAssignmentQuiz(true);
    setShowAssignmentDetails(false); // Close the details modal
  };

  const handleViewResources = (assignment: any) => {
    // Trigger burst animation
    setBurstAnimation(true);
    
    // Set assignment and show modal after a small delay
    setTimeout(() => {
      setSelectedAssignment(assignment);
      setShowResourcesModal(true);
      setBurstAnimation(false);
    }, 300);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAssignmentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAssignment = async () => {
    if (!currentAssignment) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Implement actual submission to backend
      console.log('Submitting assignment:', {
        assignmentId: currentAssignment.id,
        answers: assignmentAnswers
      });
      
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Assignment submitted successfully!');
      setShowAssignmentQuiz(false);
      setAssignmentAnswers({});
      fetchAssignments(); // Refresh assignments to show updated status
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMultipleChoiceQuestion = (question: any, index: number) => {
    const questionId = question.id || `question-${index}`;
    const selectedAnswer = assignmentAnswers[questionId];
    
    return (
      <div key={questionId} className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">
            Question {index + 1}
          </span>
          <span className="text-sm text-gray-500">
            {question.points ? `${question.points} points` : '1 point'}
          </span>
        </div>
        
        <h4 className="font-medium text-gray-900 mb-3">{question.text}</h4>
        
        <div className="space-y-2">
          {question.options?.map((option: string, optionIndex: number) => (
            <label key={optionIndex} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={questionId}
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const handleViewResource = (resource: any) => {
    setViewingResource(resource);
  };

  const handleDownloadResource = (resource: any) => {
    // TODO: Implement actual download functionality
    console.log('Downloading resource:', resource);
    alert(`Downloading ${resource.title}...`);
  };

  const renderResourceViewer = (resource: any) => {
    const isImage = ['image', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(resource.type?.toLowerCase());
    const isPDF = resource.type?.toLowerCase() === 'pdf';
    const isText = ['text', 'txt', 'md'].includes(resource.type?.toLowerCase());
    const isVideo = ['video', 'mp4', 'avi', 'mov'].includes(resource.type?.toLowerCase());
    
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{resource.title}</h3>
          <button
            onClick={() => setViewingResource(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {resource.description && (
            <p className="text-gray-600">{resource.description}</p>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
            {isImage ? (
              <div className="text-center">
                <span className="text-6xl mb-4">🖼️</span>
                <p className="text-gray-600">Image preview would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">{resource.title}</p>
              </div>
            ) : isPDF ? (
              <div className="text-center">
                <span className="text-6xl mb-4">📄</span>
                <p className="text-gray-600">PDF viewer would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">{resource.title}</p>
              </div>
            ) : isVideo ? (
              <div className="text-center">
                <span className="text-6xl mb-4">🎥</span>
                <p className="text-gray-600">Video player would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">{resource.title}</p>
              </div>
            ) : isText ? (
              <div className="text-center">
                <span className="text-6xl mb-4">📝</span>
                <p className="text-gray-600">Text content would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">{resource.title}</p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-6xl mb-4">📁</span>
                <p className="text-gray-600">File preview would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">{resource.title}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleDownloadResource(resource)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        nickname: profileForm.nickname
      };

      if (profileForm.password) {
        updateData.password = profileForm.password;
      }

      await axios.patch('/auth/profile', updateData);
      setSuccess('Profile updated successfully!');
      setEditingProfile(false);
      fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      setUploadProgress(0);
              await axios.post('/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      setSuccess('Profile picture uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
      setUploadProgress(0);
    }
  };

  const getProfilePictureUrl = (filename?: string) => {
    if (!filename) return '/avatar.png';
    // Use the backend API endpoint for profile pictures
    return `https://lms-pne.uk/api/auth/profile-pictures/${filename}`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return 'Not graded';
    return `${score}%`;
  };

  const getProgressText = (assignment: any) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return 'Not started';
    }
    const submission = assignment.submissions[0];
    if (submission.score !== null) {
      return `Completed - ${submission.score}%`;
    }
    return 'Submitted';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'ppt': case 'pptx': return '📊';
      case 'xls': case 'xlsx': return '📈';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'enrollment', label: 'Enrollment', icon: '📚' },
    { id: 'assignments', label: 'My Assignments', icon: '📝' },
    { id: 'resources', label: 'Learning Resources', icon: '📁' },
    { id: 'progress', label: 'My Progress', icon: '📈' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.firstName}!
        </h2>
        <p className="text-gray-600">
          {user?.classroom ? 
            `You're in ${user.classroom.yearLevel}/${user.classroom.classNum}` : 
            'Ready to learn?'
          }
          {user?.studentNumber && (
            <span className="ml-2 text-gray-500">
              (Student #: {user.studentNumber})
            </span>
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {assignments.filter(a => !a.submissions || a.submissions.length === 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {assignments.filter(a => a.submissions && a.submissions.length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrolledCourses.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <span className="text-4xl">📊</span>
          <p className="mt-2 text-sm text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  );

  const renderEnrollment = () => (
    <div className="space-y-6">
      {/* Current Course Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Current Course</h2>
          <button
            onClick={() => setShowCourseSelectionModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Change Course
          </button>
        </div>
        
        {selectedCourse ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900">{selectedCourse.course.name}</h3>
            <p className="text-blue-700">{selectedCourse.course.subject.name}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">📚</span>
            <p className="mt-2 text-sm text-gray-500">No course selected</p>
            <button
              onClick={() => setShowEnrollmentModal(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Enroll in a Course
            </button>
          </div>
        )}
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Enrolled Courses</h3>
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">📚</span>
            <p className="mt-2 text-sm text-gray-500">No enrolled courses</p>
            <button
              onClick={() => setShowEnrollmentModal(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Enroll in a Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{enrollment.course.name}</h4>
                    <p className="text-sm text-gray-600">{enrollment.course.subject.name}</p>
                  </div>
                  <button
                    onClick={() => handleUnenrollFromCourse(enrollment.course.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Unenroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Assignments</h2>
      
      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl">📝</span>
          <p className="mt-2 text-sm text-gray-500">No assignments available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="text-gray-600 mb-3">{assignment.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Type:</span> {assignment.type}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {getProgressText(assignment)}
                    </div>
                    {assignment.dueDate && (
                      <div>
                        <span className="font-medium">Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Course:</span> {assignment.course?.name || 'N/A'}
                    </div>
                  </div>

                  {/* Availability Information */}
                  {(assignment.availableFrom || assignment.availableTo) && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Available:</span>
                      {assignment.availableFrom && (
                        <span> From {new Date(assignment.availableFrom).toLocaleDateString()}</span>
                      )}
                      {assignment.availableTo && (
                        <span> To {new Date(assignment.availableTo).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {assignment.resources && assignment.resources.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Resources:</h4>
                      <div className="space-y-2">
                        {assignment.resources.map((resource: any) => (
                          <div key={resource.id} className="flex items-center space-x-2 text-sm">
                            <span>{getFileIcon(resource.type)}</span>
                            <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                              {resource.title}
                            </span>
                            <span className="text-gray-500">({formatFileSize(resource.fileSize)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                                  <button
                  onClick={() => {
                    console.log('Opening assignment details for:', assignment);
                    setSelectedAssignment(assignment);
                    setShowAssignmentDetails(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                  
                                {/* Resources Link - Always show, even if no resources yet */}
              <button
                onClick={() => handleViewResources(assignment)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm relative overflow-hidden transform hover:scale-105 active:scale-95"
              >
                📚 View Resources
              </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Learning Resources</h2>
      <div className="text-center py-8">
        <span className="text-4xl">📁</span>
        <p className="mt-2 text-sm text-gray-500">No resources available</p>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Progress</h2>
      <div className="text-center py-8">
        <span className="text-4xl">📈</span>
        <p className="mt-2 text-sm text-gray-500">Progress tracking coming soon</p>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="h-full">
      <ChatInterface />
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex items-start space-x-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
              <img
                src={getProfilePictureUrl(user.profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/avatar.png';
                }}
              />
            </div>
            
            {!editingProfile && (
              <div className="mt-4 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <button
                    onClick={handleProfilePictureUpload}
                    disabled={uploadProgress > 0}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Picture'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="flex-1">
            {editingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="form-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="form-input w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={profileForm.nickname}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, nickname: e.target.value }))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (Leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                    className="form-input w-full"
                  />
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="form-input flex-1"
                    >
                      <option value="">Select a class</option>
                      {availableClasses.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleClassUpdate}
                      disabled={!selectedClassId || updatingClass}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updatingClass ? 'Updating...' : 'Update Class'}
                    </button>
                  </div>
                  {user.classroom && (
                    <p className="text-sm text-gray-500 mt-1">
                      Current class: {user.classroom.yearLevel}/{user.classroom.classNum}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                {user.nickname && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nickname:</span>
                    <p className="text-gray-900">{user.nickname}</p>
                  </div>
                )}
                {user.studentNumber && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Student Number:</span>
                    <p className="text-gray-900">{user.studentNumber}</p>
                  </div>
                )}
                {user.classroom && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Class:</span>
                    <p className="text-gray-900">{user.classroom.yearLevel}/{user.classroom.classNum}</p>
                  </div>
                )}
                {user.organization && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Organization:</span>
                    <p className="text-gray-900">{user.organization.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug indicator for assignment details modal */}
      {showAssignmentDetails && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-[10000]">
          Modal should be open!
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Student Portal</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 mr-8">
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
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'enrollment' && renderEnrollment()}
            {activeTab === 'assignments' && renderAssignments()}
            {activeTab === 'resources' && renderResources()}
            {activeTab === 'progress' && renderProgress()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {showAssignmentDetails && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedAssignment.title}</h2>
              <button
                onClick={() => setShowAssignmentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {selectedAssignment.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedAssignment.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span> {selectedAssignment.type}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span> {getProgressText(selectedAssignment)}
                </div>
                {selectedAssignment.dueDate && (
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span> {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Course:</span> {selectedAssignment.course?.name || 'N/A'}
                </div>
              </div>

              {selectedAssignment.resources && selectedAssignment.resources.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Resources</h3>
                  <div className="space-y-2">
                    {selectedAssignment.resources.map((resource: any) => (
                      <div key={resource.id} className="flex items-center space-x-2 text-sm">
                        <span>{getFileIcon(resource.type)}</span>
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          {resource.title}
                        </span>
                        <span className="text-gray-500">({formatFileSize(resource.fileSize)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowAssignmentDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => handleStartAssignment(selectedAssignment)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Enroll in Courses</h2>
              <button
                onClick={() => setShowEnrollmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-3">{subject.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subject.courses.map((course: any) => {
                      const isEnrolled = enrolledCourses.some(
                        enrollment => enrollment.course.id === course.id
                      );
                      
                      return (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{course.name}</h4>
                              {course.description && (
                                <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEnrollInCourse(course.id)}
                              disabled={isEnrolled || enrollmentLoading}
                              className={`ml-2 px-3 py-1 text-sm rounded-md transition-colors ${
                                isEnrolled
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {isEnrolled ? 'Enrolled' : 'Enroll'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal */}
      {showCourseSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Select Course to Work On</h2>
              <button
                onClick={() => setShowCourseSelectionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                    <button
                      onClick={() => handleCourseSelection(enrollment)}
                      className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900">{enrollment.course.name}</h3>
                      <p className="text-sm text-gray-600">{enrollment.course.subject.name}</p>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No enrolled courses. Please enroll in a course first.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {showResourcesModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                📚 Resources for "{selectedAssignment.title}"
              </h2>
              <button
                onClick={() => setShowResourcesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Assignment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Course:</span> {selectedAssignment.course?.name || 'N/A'}</div>
                  <div><span className="font-medium">Type:</span> {selectedAssignment.type}</div>
                  {selectedAssignment.dueDate && (
                    <div><span className="font-medium">Due Date:</span> {new Date(selectedAssignment.dueDate).toLocaleDateString()}</div>
                  )}
                  <div><span className="font-medium">Status:</span> {getProgressText(selectedAssignment)}</div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">📁 Learning Resources</h3>
                
                {selectedAssignment.resources && selectedAssignment.resources.length > 0 ? (
                  <div className="space-y-3">
                    {selectedAssignment.resources.map((resource: any) => (
                      <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getFileIcon(resource.type)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{resource.title}</div>
                            {resource.description && (
                              <div className="text-sm text-gray-600">{resource.description}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {formatFileSize(resource.fileSize)} • {resource.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewResource(resource)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDownloadResource(resource)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            📥 Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">📚</span>
                    <p className="mt-2 text-gray-600">No resources available for this assignment yet.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your teacher will add learning materials here soon!
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Resources Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">🔗 Additional Resources</h3>
                <div className="text-center py-4">
                  <span className="text-2xl">🚧</span>
                  <p className="mt-2 text-gray-600">Additional resources coming soon!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This section will include links to external resources, videos, and supplementary materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Quiz Modal */}
      {showAssignmentQuiz && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                📝 {currentAssignment.title}
              </h2>
              <button
                onClick={() => setShowAssignmentQuiz(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Type:</span> {currentAssignment.type}</div>
                  <div><span className="font-medium">Course:</span> {currentAssignment.course?.name || 'N/A'}</div>
                  {currentAssignment.dueDate && (
                    <div><span className="font-medium">Due Date:</span> {new Date(currentAssignment.dueDate).toLocaleDateString()}</div>
                  )}
                  <div><span className="font-medium">Status:</span> {getProgressText(currentAssignment)}</div>
                </div>
              </div>

              {/* Assignment Content */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">📋 Assignment Content</h3>
                
                {currentAssignment.description && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{currentAssignment.description}</p>
                  </div>
                )}

                {currentAssignment.instructions && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                    <p className="text-gray-600">{currentAssignment.instructions}</p>
                  </div>
                )}

                {/* Assignment Questions */}
                {currentAssignment.questions && currentAssignment.questions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Questions</h4>
                      <div className="text-sm text-gray-500">
                        {Object.keys(assignmentAnswers).length} of {currentAssignment.questions.length} answered
                      </div>
                    </div>
                    
                    {currentAssignment.questions.map((question: any, index: number) => {
                      if (currentAssignment.type === 'multiple-choice') {
                        return renderMultipleChoiceQuestion(question, index);
                      }
                      // Add other question types here as needed
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="mb-3">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">
                              Question {index + 1}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-3">{question.text}</h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-yellow-800 text-sm">
                              Question type "{question.type || 'unknown'}" not yet implemented.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-center">No questions available for this assignment.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowAssignmentQuiz(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Viewer Modal */}
      {viewingResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {renderResourceViewer(viewingResource)}
          </div>
        </div>
      )}

      {/* Burst Animation */}
      {burstAnimation && (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
          {/* Generate 16 circles in a burst pattern with different colors */}
          {[...Array(16)].map((_, index) => {
            const angle = (index * 22.5) * (Math.PI / 180); // 22.5 degrees apart for 16 circles
            const distance = 100; // Distance from center
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const delay = index * 30; // Stagger the animation
            
            // Different colors for variety
            const colors = [
              'from-green-400 to-green-600',
              'from-blue-400 to-blue-600', 
              'from-purple-400 to-purple-600',
              'from-pink-400 to-pink-600',
              'from-yellow-400 to-yellow-600',
              'from-red-400 to-red-600',
              'from-indigo-400 to-indigo-600',
              'from-teal-400 to-teal-600'
            ];
            const colorIndex = index % colors.length;
            
            return (
              <div
                key={index}
                className={`absolute w-4 h-4 bg-gradient-to-r ${colors[colorIndex]} rounded-full shadow-lg`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  animation: `burst 0.8s ease-out ${delay}ms forwards`,
                }}
              />
            );
          })}
          
          {/* Additional smaller circles for extra effect */}
          {[...Array(8)].map((_, index) => {
            const angle = (index * 45) * (Math.PI / 180);
            const distance = 60;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const delay = index * 40 + 200;
            
            return (
              <div
                key={`small-${index}`}
                className="absolute w-2 h-2 bg-white rounded-full shadow-md"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  animation: `burst 0.6s ease-out ${delay}ms forwards`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Student; 