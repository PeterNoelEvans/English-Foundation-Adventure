import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useRouter } from 'next/router';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  profilePicture?: string;
  role: string;
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
  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
    fetchAssignments();
    fetchSubjects();
    fetchEnrolledCourses();
  }, []);

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
    localStorage.removeItem('selectedOrganization');
    router.push('/');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = { ...profileForm };
      // Remove empty password field
      if (!updateData.password) {
        delete updateData.password;
      }

      await axios.patch('/auth/profile', updateData);
      setSuccess('Profile updated successfully!');
      setEditingProfile(false);
      fetchUserData(); // Refresh user data
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
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      await axios.post('/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        }
      });

      setSuccess('Profile picture uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchUserData(); // Refresh user data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
      setUploadProgress(0);
    }
  };

  const getProfilePictureUrl = (filename?: string) => {
    if (!filename) return '/avatar.png';
    return `http://localhost:3000/api/auth/profile-pictures/${filename}`;
  };

  // Assignment helper functions
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'; // Not done
    if (score >= 80) return 'text-green-600'; // High score
    if (score >= 50) return 'text-orange-600'; // Average score
    return 'text-red-600'; // Below 50%
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return 'Not done';
    return `${score}%`;
  };

  const getProgressText = (assignment: any) => {
    const totalAssignments = assignment.resources?.length || 0;
    const completedAssignments = assignment.submissions?.length || 0;
    if (totalAssignments === 0) return '0/0';
    return `${completedAssignments}/${totalAssignments}`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('audio')) return '🎵';
    if (type.includes('video')) return '🎥';
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'enrollment', label: 'Enrollment', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { id: 'assignments', label: 'My Assignments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'resources', label: 'Learning Resources', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'progress', label: 'My Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
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
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
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
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resources</p>
              <p className="text-2xl font-semibold text-gray-900">
                {assignments.reduce((total, assignment) => total + (assignment.resources?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No recent activity</p>
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
            <p className="text-blue-700">{selectedCourse.course.subject.name} • {selectedCourse.course.yearLevel}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No course selected</p>
            <button
              onClick={() => setShowCourseSelectionModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select a Course
            </button>
          </div>
        )}
      </div>

      {/* My Enrollments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Enrollments</h2>
          <button
            onClick={() => setShowEnrollmentModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Enroll in New Course
          </button>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{enrollment.course.name}</h3>
                    <p className="text-sm text-gray-600">{enrollment.course.subject.name}</p>
                    <p className="text-sm text-gray-500">{enrollment.course.yearLevel}</p>
                  </div>
                  <button
                    onClick={() => handleUnenrollFromCourse(enrollment.course.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                    title="Unenroll"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No enrollments yet</p>
            <button
              onClick={() => setShowEnrollmentModal(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Enroll in Your First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">My Profile</h2>
        
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}

        <div className="flex items-start space-x-6">
          {/* Profile Picture Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
                <img
                  src={getProfilePictureUrl(user?.profilePicture)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    e.currentTarget.src = '/avatar.png';
                  }}
                />
              </div>
              
              {/* Upload Button */}
              <div className="mt-4 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-picture-input"
                />
                <label
                  htmlFor="profile-picture-input"
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 cursor-pointer"
                >
                  Choose Photo
                </label>
                {selectedFile && (
                  <button
                    onClick={handleProfilePictureUpload}
                    disabled={uploadProgress > 0}
                    className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="flex-1">
            {editingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="form-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="form-input w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (Optional)</label>
                  <input
                    type="text"
                    value={profileForm.nickname}
                    onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="form-input w-full"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="text-gray-900">{user?.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="text-gray-900">{user?.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                
                {user?.nickname && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                    <p className="text-gray-900">{user.nickname}</p>
                  </div>
                )}
                
                {user?.classroom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <p className="text-gray-900">{user.classroom.yearLevel}/{user.classroom.classNum}</p>
                  </div>
                )}
                
                <button
                  onClick={() => setEditingProfile(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Assignments</h2>
        <p className="text-gray-600 mb-6">Access learning materials and complete assignments for your enrolled courses.</p>
        
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No assignments available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assignments.map((assignment: any) => {
              const latestSubmission = assignment.submissions?.[0];
              const score = latestSubmission?.score || null;
              
              return (
                <div key={assignment.id} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Assignment Title */}
                  <h3 className="font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                  
                  {/* Progress and Score */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      {getProgressText(assignment)}
                    </span>
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                      {getScoreText(score)}
                    </span>
                  </div>
                  
                  {/* Course and Unit Info */}
                  <div className="text-xs text-gray-600 mb-3">
                    <p>{assignment.course?.name}</p>
                    <p>Unit {assignment.unit?.order}: {assignment.unit?.name}</p>
                  </div>
                  
                  {/* Description */}
                  {assignment.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{assignment.description}</p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowAssignmentDetails(true);
                      }}
                      className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                    >
                      View Resources ({assignment.resources?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowAssignmentDetails(true);
                      }}
                      className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700 transition-colors"
                    >
                      View Assignment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Details Modal */}
      {showAssignmentDetails && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedAssignment.title}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedAssignment.course?.name} - Unit {selectedAssignment.unit?.order}: {selectedAssignment.unit?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignmentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedAssignment.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedAssignment.description}</p>
                </div>
              )}

              {/* Resources Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Resources</h3>
                {selectedAssignment.resources && selectedAssignment.resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAssignment.resources.map((resource: any) => (
                      <div key={resource.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getFileIcon(resource.type)}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              Size: {formatFileSize(resource.fileSize || 0)} | 
                              Type: {resource.type}
                            </div>
                          </div>
                        </div>
                        <button className="mt-3 w-full bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors">
                          View Resource
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No resources available for this assignment.</p>
                )}
              </div>

              {/* Assignment Progress */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h3>
                {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Latest Submission</span>
                      <span className={`text-lg font-bold ${getScoreColor(selectedAssignment.submissions[0].score)}`}>
                        {getScoreText(selectedAssignment.submissions[0].score)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Submitted: {new Date(selectedAssignment.submissions[0].submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">No submissions yet. Start working on this assignment!</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignmentDetails(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors">
                  Start Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Resources</h2>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No resources available</p>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Progress</h2>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No progress data available</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r shadow-sm min-h-screen fixed z-20">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-xl font-bold text-blue-700">Student Portal</span>
        </div>
        
        {/* Profile Section */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              <img
                src={getProfilePictureUrl(user?.profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.currentTarget.src = '/avatar.png';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.classroom ? `${user.classroom.yearLevel}/${user.classroom.classNum}` : 'Student'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-2 space-y-1">
          {sidebarMenu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-100 mt-8"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-800">Student Portal</h1>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs (hidden on md and up) */}
          <div className="mb-8 md:hidden">
            <nav className="flex space-x-8">
              {sidebarMenu.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'enrollment' && renderEnrollment()}
          {activeTab === 'assignments' && renderAssignments()}
          {activeTab === 'resources' && renderResources()}
          {activeTab === 'progress' && renderProgress()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Enroll in New Course</h2>
              <button
                onClick={() => setShowEnrollmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                    {subject.courses.map((course) => {
                      const isEnrolled = enrolledCourses.some(
                        enrollment => enrollment.course.id === course.id
                      );
                      
                      return (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{course.name}</h4>
                              <p className="text-sm text-gray-600">{course.yearLevel}</p>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                      <p className="text-sm text-gray-500">{enrollment.course.yearLevel}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
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
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'enrollment' && renderEnrollment()}
            {activeTab === 'assignments' && renderAssignments()}
            {activeTab === 'resources' && renderResources()}
            {activeTab === 'progress' && renderProgress()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student; 