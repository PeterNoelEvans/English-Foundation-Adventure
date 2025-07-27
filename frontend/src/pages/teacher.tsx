import React, { useEffect, useState } from 'react';
import axios from '../api';

const Teacher: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'courses' | 'units'>('courses');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Resource management state
  const [resources, setResources] = useState<any[]>([]);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const [selectedCourseUnits, setSelectedCourseUnits] = useState<any[]>([]);
  const [resourceActiveTab, setResourceActiveTab] = useState<'upload' | 'my-resources' | 'shared' | 'allocate'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    courseId: '',
    unitId: '',
    tags: [] as string[],
    isPublic: false,
    isShared: false
  });

  // Resource allocation state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');

  // Grade level options
  const gradeLevels = [
    { value: 'P1', label: 'Primary 1 (P1)' },
    { value: 'P2', label: 'Primary 2 (P2)' },
    { value: 'P3', label: 'Primary 3 (P3)' },
    { value: 'P4', label: 'Primary 4 (P4)' },
    { value: 'P5', label: 'Primary 5 (P5)' },
    { value: 'P6', label: 'Primary 6 (P6)' },
    { value: 'M1', label: 'Mattayom 1 (M1)' },
    { value: 'M2', label: 'Mattayom 2 (M2)' },
    { value: 'M3', label: 'Mattayom 3 (M3)' },
    { value: 'M4', label: 'Mattayom 4 (M4)' },
    { value: 'M5', label: 'Mattayom 5 (M5)' },
    { value: 'M6', label: 'Mattayom 6 (M6)' },
  ];

  const [newCourse, setNewCourse] = useState({ name: '', description: '', subjectId: '' });
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [bulkUnits, setBulkUnits] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Assignment management state
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
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
    quarter: 'Q1',
    maxAttempts: '',
    shuffleQuestions: false,
    allowReview: true,
    tags: [] as string[],
    courseId: '',
    unitId: '',
    published: true
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('Teacher page loaded, token exists:', !!token);
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    console.log('Token found, fetching data...');
    fetchCourses();
    fetchSubjects();
    fetchResources();
    fetchSharedResources();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching courses...');
      const res = await axios.get('/courses?t=' + Date.now()); // Cache busting
      console.log('Fetched courses response:', res.data);
      console.log('Fetched courses:', res.data.courses);
      // Debug: Check if Mattayom course has units
      const mattayomCourse = res.data.courses.find((c: any) => c.name.includes('Mattayom'));
      if (mattayomCourse) {
        console.log('Mattayom course found:', mattayomCourse);
        console.log('Mattayom course units:', mattayomCourse.units);
      }
      setCourses(res.data.courses);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      if (token) {
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 20) + '...');
      }
      
      console.log('Making request to /subjects...');
      const res = await axios.get('/subjects');
      console.log('Subjects response status:', res.status);
      console.log('Subjects response data:', res.data);
      console.log('Subjects array:', res.data.subjects);
      console.log('Subjects array length:', res.data.subjects?.length || 0);
      
      if (res.data.subjects) {
        setSubjects(res.data.subjects);
        console.log('Subjects state updated with:', res.data.subjects.length, 'subjects');
      } else {
        console.error('No subjects array in response');
        setSubjects([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      setSubjects([]);
    }
  };

  // Resource management functions
  const fetchResources = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found, skipping resources fetch');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/resources');
      setResources(res.data.resources);
    } catch (err: any) {
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedResources = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('Token found:', !!token, 'Token length:', token?.length);
      
      if (!token) {
        console.log('No authentication token found, skipping shared resources fetch');
        return;
      }
      
      console.log('Making request to /resources/shared with token');
      const res = await axios.get('/resources/shared');
      console.log('Shared resources response:', res.data);
      setSharedResources(res.data.resources);
    } catch (err: any) {
      console.error('Failed to fetch shared resources:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      // Don't show error for authentication issues
      if (err.response?.status !== 401) {
        setError('Failed to fetch shared resources');
      }
    }
  };

  const fetchUnitsForCourse = async (courseId: string) => {
    try {
      const res = await axios.get(`/units/course/${courseId}`);
      setSelectedCourseUnits(res.data.units);
    } catch (err: any) {
      console.error('Failed to fetch units for course:', err);
      setSelectedCourseUnits([]);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setNewResource(prev => ({ ...prev, courseId, unitId: '' }));
    if (courseId) {
      fetchUnitsForCourse(courseId);
    } else {
      setSelectedCourseUnits([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!newResource.title.trim()) {
      setError('Title is required');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', newResource.title);
    formData.append('description', newResource.description);
    formData.append('courseId', newResource.courseId);
    formData.append('unitId', newResource.unitId);
    formData.append('tags', JSON.stringify(newResource.tags));
    formData.append('isPublic', newResource.isPublic.toString());
    formData.append('isShared', newResource.isShared.toString());

    try {
      await axios.post('/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess('Resource uploaded successfully!');
      setNewResource({
        title: '',
        description: '',
        courseId: '',
        unitId: '',
        tags: [],
        isPublic: false,
        isShared: false
      });
      setSelectedFile(null);
      setUploadProgress(0);
      fetchResources();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload resource');
      setUploadProgress(0);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`/resources/${resourceId}`);
        setSuccess('Resource deleted successfully!');
        fetchResources();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete resource');
      }
    }
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

  // Resource allocation functions
  const fetchAssignments = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, skipping assignments fetch');
        return;
      }
      
      const res = await axios.get('/assignments/teacher');
      setAssignments(res.data.assignments);
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err);
      // Don't show error for authentication issues
      if (err.response?.status !== 401) {
        setError('Failed to fetch assignments');
      }
    }
  };

  const handleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSelectAllResources = () => {
    const filteredResources = resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                           resource.description?.toLowerCase().includes(resourceSearch.toLowerCase());
      const matchesType = !resourceTypeFilter || resource.type.toLowerCase().includes(resourceTypeFilter.toLowerCase());
      return matchesSearch && matchesType;
    });
    
    const allResourceIds = filteredResources.map(r => r.id);
    setSelectedResources(allResourceIds);
  };

  const handleClearSelection = () => {
    setSelectedResources([]);
  };

  const handleAllocateResources = async () => {
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
      setSelectedAssignment('');
      fetchAssignments(); // Refresh to show updated allocations
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to allocate resources');
    } finally {
      setAllocationLoading(false);
    }
  };

  const handleRemoveResourceFromAssignment = async (assignmentId: string, resourceId: string) => {
    try {
      await axios.delete(`/assignments/${assignmentId}/resources/${resourceId}`);
      setSuccess('Resource removed from assignment');
      fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove resource');
    }
  };

  const getFilteredResources = () => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                           resource.description?.toLowerCase().includes(resourceSearch.toLowerCase());
      const matchesType = !resourceTypeFilter || resource.type.toLowerCase().includes(resourceTypeFilter.toLowerCase());
      return matchesSearch && matchesType;
    });
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCourse.name.trim() || !newCourse.subjectId) {
      setError('Course name and subject are required');
      return;
    }
    try {
      await axios.post('/courses', newCourse);
      setNewCourse(prev => ({ ...prev, name: '', description: '', subjectId: '' }));
      setSuccess('Course created successfully!');
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newSubject.name.trim()) {
      setError('Subject name is required');
      return;
    }
    try {
      console.log('Creating subject:', newSubject);
      const response = await axios.post('/subjects', newSubject);
      console.log('Subject creation response:', response.data);
      setNewSubject(prev => ({ ...prev, name: '', description: '' }));
      setSuccess('Subject created successfully!');
      console.log('Calling fetchSubjects after subject creation...');
      await fetchSubjects();
      console.log('fetchSubjects completed');
    } catch (err: any) {
      console.error('Subject creation error:', err);
      setError(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleBulkImportUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!bulkUnits.trim()) {
      setError('Please enter unit data');
      return;
    }

    try {
      // Parse the JSON format
      let units;
      try {
        units = JSON.parse(bulkUnits.trim());
        if (!Array.isArray(units)) {
          throw new Error('Data must be an array');
        }
      } catch (parseError) {
        setError('Invalid JSON format. Please check your JSON syntax.');
        return;
      }

      // Validate the units structure
      const validatedUnits = units.map((unit, index) => {
        if (!unit.title) {
          throw new Error(`Unit ${index + 1} is missing a title`);
        }
        return {
          title: unit.title,
          number: unit.number || index + 1,
          description: unit.description || ''
        };
      });

      console.log('Bulk importing units:', validatedUnits);
      
      const response = await axios.post(`/units/bulk`, {
        courseId: selectedCourse.id,
        units: validatedUnits
      });

      console.log('Bulk import response:', response.data);
      console.log('Created units:', response.data.createdUnits);
      setBulkUnits('');
      setShowBulkImport(false);
      setSuccess(`Successfully imported ${validatedUnits.length} units!`);
      
      // Force refresh courses with cache busting
      console.log('Refreshing courses after bulk import...');
      await fetchCourses();
      console.log('Courses refreshed after bulk import');
      
      // Update selectedCourse with the refreshed data
      const refreshedCourse = courses.find(c => c.id === selectedCourse.id);
      if (refreshedCourse) {
        console.log('Updating selectedCourse with refreshed data');
        setSelectedCourse(refreshedCourse);
      } else {
        // If we can't find it in the courses array, fetch the specific course
        console.log('Fetching updated course data directly');
        try {
          const courseResponse = await axios.get(`/courses/${selectedCourse.id}`);
          setSelectedCourse(courseResponse.data);
        } catch (err) {
          console.error('Failed to fetch updated course:', err);
        }
      }
    } catch (err: any) {
      console.error('Bulk import error:', err);
      if (err.message && err.message.includes('JSON')) {
        setError(err.message);
      } else {
        setError(err.response?.data?.message || 'Failed to import units');
      }
    }
  };

  const handleCourseSelect = (course: any) => {
    console.log('Course selected:', course);
    console.log('Course units:', course.units);
    console.log('Course units length:', course.units?.length || 0);
    setSelectedCourse(course);
    setViewMode('units');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setViewMode('courses');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const assignmentData = {
        ...newAssignment,
        maxAttempts: newAssignment.maxAttempts ? parseInt(newAssignment.maxAttempts) : null,
        courseId: newAssignment.courseId || null,
        unitId: newAssignment.unitId || null
      };

      const response = await axios.post('/assignments', assignmentData);
      setSuccess('Assignment created successfully!');
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
        quarter: 'Q1',
        maxAttempts: '',
        shuffleQuestions: false,
        allowReview: true,
        tags: [],
        courseId: '',
        unitId: '',
        published: true
      });
      fetchAssignments();
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await axios.delete(`/assignments/${assignmentId}`);
      setSuccess('Assignment deleted successfully!');
      fetchAssignments();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'course-structure', label: 'Subjects & Courses', icon: '📚' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'assessment-creator', label: 'Assessment Creator', icon: '🎯' },
    { id: 'resources', label: 'Resources', icon: '📁' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'class-view', label: 'Class View', icon: '🏫' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
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
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>
    </div>
  );

  const renderCourseStructure = () => (
    <div className="space-y-6">
      {/* Subject Creation */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Subject Management</h2>
        <form onSubmit={handleCreateSubject} className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <input
                  type="text"
                  placeholder="Subject name (e.g., English, Mathematics, Science)"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="col-span-6">
                <button type="submit" className="btn-primary w-full">
                  Create Subject
                </button>
              </div>
            </div>
            <textarea
              placeholder="Subject description (optional)"
              value={newSubject.description}
              onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea w-full"
              rows={2}
            />
          </div>
        </form>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Available Subjects</h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchSubjects}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh Subjects
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    try {
                      console.log('Testing debug endpoint...');
                      const res = await axios.get('/subjects/debug/all');
                      console.log('Debug response:', res.data);
                    } catch (err: any) {
                      console.error('Debug endpoint error:', err);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Debug All
                </button>
              )}
            </div>
          </div>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mb-2">
              Debug: {subjects.length} subjects loaded
            </div>
          )}
          {subjects.length === 0 ? (
            <p className="text-gray-500">No subjects found. Create your first subject above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject: any) => (
                <div key={subject.id} className="border rounded-lg p-4 bg-white">
                  <h4 className="font-medium text-gray-900">{subject.name}</h4>
                  {subject.description && (
                    <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {subject.courses?.length || 0} courses
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Creation */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Course Management</h2>
        {subjects.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> You need to create at least one subject before you can create courses. 
              Use the subject creation form above to add subjects like "English", "Mathematics", "Science", etc.
            </p>
          </div>
        )}
        <form onSubmit={handleCreateCourse} className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <input
                  type="text"
                  placeholder="Course name (e.g., Project Explore 2, Let's Find Out)"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="col-span-6">
            <select
                  value={newCourse.subjectId}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="form-select w-full"
              required
                >
                  <option value="">Select Subject</option>
                  {subjects.length === 0 ? (
                    <option value="" disabled>No subjects available - create a subject first</option>
                  ) : (
                    subjects.map((subject: any) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))
                  )}
            </select>
          </div>
            </div>
            <textarea
              placeholder="Course description"
              value={newCourse.description}
              onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea w-full"
              rows={3}
            />
            <button type="submit" className="btn-primary">
              Create Course
          </button>
      </div>
        </form>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}

        <div>
          <h3 className="text-lg font-medium mb-4">All Courses</h3>
          {loading ? (
            <p className="text-gray-500">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="text-gray-500">No courses found.</p>
          ) : viewMode === 'courses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courses.map((course: any) => (
                <div key={course.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCourseSelect(course)}>
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-400 mb-2">
                      Debug: Course {course.name} has {course.units?.length || 0} units
              </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">
                        {course.subject?.name}
                      </p>
          </div>
                    {course.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-500">
                        {course.units?.length || 0} units
                </div>
                      <div className="flex space-x-1">
                  <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add edit functionality
                            console.log('Edit course:', course.id);
                          }}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
                              try {
                                axios.delete(`/courses/${course.id}`);
                                setSuccess(`Course "${course.name}" deleted successfully`);
                                fetchCourses();
                        } catch (err: any) {
                                setError(err.response?.data?.message || 'Failed to delete course');
                        }
                      }
                    }}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
          </div>
      </div>
              ))}
            </div>
          ) : viewMode === 'units' && selectedCourse ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
              <button
                    onClick={handleBackToCourses}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
              >
                    ← Back to Courses
              </button>
                  <h3 className="text-lg font-medium">{selectedCourse.name} - Units</h3>
                  <p className="text-sm text-gray-600">
                    {selectedCourse.subject?.name}
                  </p>
            </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {selectedCourse.units?.length || 0} units
                  </div>
                  <button
                    onClick={() => setShowBulkImport(!showBulkImport)}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    {showBulkImport ? 'Cancel Bulk Import' : 'Bulk Import Units'}
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={async () => {
                        try {
                          console.log('Testing debug endpoint for course:', selectedCourse.id);
                          const res = await axios.get(`/units/debug/course/${selectedCourse.id}`);
                          console.log('Debug response:', res.data);
                        } catch (err: any) {
                          console.error('Debug endpoint error:', err);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Debug Units
                    </button>
                  )}
                </div>
      </div>

      {/* Bulk Import Form */}
      {showBulkImport && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Bulk Import Units</h4>
          <p className="text-sm text-gray-600 mb-4">
            Enter unit data in JSON format. Each unit should have a title, number, and optional description:
          </p>
          <form onSubmit={handleBulkImportUnits}>
            <textarea
              value={bulkUnits}
              onChange={(e) => setBulkUnits(e.target.value)}
              placeholder={`[
  {
    "title": "Getting Ready with Sounds and Words",
    "number": 1,
    "description": "Phonemic awareness, basic classroom vocabulary, and introduction routines in English"
  },
  {
    "title": "Everyday Listening and Speaking",
    "number": 2,
    "description": "Listening to instructions and responding with simple phrases and questions"
  },
  {
    "title": "Reading Basics",
    "number": 3,
    "description": "Understanding short texts; decoding strategies using phonics and sight words"
  }
]`}
              className="form-textarea w-full mb-4"
              rows={12}
            />
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Import Units
              </button>
              <button
                type="button"
                onClick={() => setShowBulkImport(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
              
                            {selectedCourse.units && selectedCourse.units.length > 0 ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    Debug: Found {selectedCourse.units.length} units
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedCourse.units.map((unit: any) => (
                      <div key={unit.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              Unit {unit.order}: {unit.name}
                            </div>
                            {unit.description && (
                              <div className="text-xs text-gray-600 mt-1">
                                {unit.description}
                              </div>
                            )}
                            {unit.parts && unit.parts.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {unit.parts.length} parts
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                // TODO: Add unit editing functionality
                                console.log('Edit unit:', unit.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete unit "${unit.name}"?`)) {
                                  try {
                                    await axios.delete(`/units/${unit.id}`);
                                    setSuccess(`Unit "${unit.name}" deleted successfully`);
                                    fetchCourses();
                                  } catch (err: any) {
                                    setError(err.response?.data?.message || 'Failed to delete unit');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">No units found for this course.</p>
              </div>
            )}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    );

  const renderResources = () => (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Resource Management</h2>
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b">
            <button
              type="button"
            onClick={() => setResourceActiveTab('upload')}
            className={`pb-2 px-1 ${resourceActiveTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Upload New Resource
            </button>
            <button
              type="button"
            onClick={() => setResourceActiveTab('my-resources')}
            className={`pb-2 px-1 ${resourceActiveTab === 'my-resources' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              My Resources
            </button>
            <button
              type="button"
            onClick={() => setResourceActiveTab('shared')}
            className={`pb-2 px-1 ${resourceActiveTab === 'shared' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Shared Resources
            </button>
          <button
            type="button"
            onClick={() => setResourceActiveTab('allocate')}
            className={`pb-2 px-1 ${resourceActiveTab === 'allocate' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Allocate Resources
          </button>
          </div>

          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}

          {/* Upload Form */}
        {resourceActiveTab === 'upload' && (
            <form onSubmit={handleCreateResource} className="mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Resource title"
                  value={newResource.title}
                  onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                  className="form-input"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="form-input"
                  accept="audio/*,video/*,application/pdf,image/*"
                  required
                />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: Audio (MP3, WAV, OGG), Video (MP4, WebM, AVI), PDF, Images (JPEG, PNG, GIF)
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
              
              <textarea
                placeholder="Description (optional)"
                value={newResource.description}
                onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                className="form-input w-full"
                rows={3}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={newResource.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select course (optional)</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} - {course.subject?.name} ({course.yearLevel})
                    </option>
                  ))}
                </select>
                
                <select
                  value={newResource.unitId}
                  onChange={e => setNewResource({ ...newResource, unitId: e.target.value })}
                  className="form-input"
                  disabled={!newResource.courseId}
                >
                  <option value="">
                    {newResource.courseId ? 'Select unit (optional)' : 'Select a course first'}
                  </option>
                  {selectedCourseUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.order}: {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newResource.isPublic}
                    onChange={e => setNewResource({ ...newResource, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  Make public
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newResource.isShared}
                    onChange={e => setNewResource({ ...newResource, isShared: e.target.checked })}
                    className="mr-2"
                  />
                  Make shared template
                </label>
              </div>
              
              <button
                type="submit"
                disabled={uploadProgress > 0}
                className="btn-primary w-full"
              >
                {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Resource'}
              </button>
            </div>
          </form>
          )}

        {/* My Resources */}
        {resourceActiveTab === 'my-resources' && (
            <div>
              <h3 className="text-lg font-medium mb-4">My Resources</h3>
            {loading ? (
              <p className="text-gray-500">Loading resources...</p>
            ) : resources.length === 0 ? (
              <p className="text-gray-500">No resources found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource: any) => (
                  <div key={resource.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{getFileIcon(resource.type)}</span>
                          <h4 className="font-medium text-gray-900">{resource.title}</h4>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Size: {formatFileSize(resource.fileSize || 0)}</p>
                          {resource.course && (
                            <p>Course: {resource.course.name}</p>
                          )}
                          {resource.unit && (
                            <p>Unit: {resource.unit.name}</p>
                          )}
                          <p>Uploaded: {new Date(resource.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

        {/* Shared Resources */}
        {resourceActiveTab === 'shared' && (
            <div>
            <h3 className="text-lg font-medium mb-4">Shared Resources</h3>
            {sharedResources.length === 0 ? (
                <p className="text-gray-500">No shared resources found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedResources.map((resource: any) => (
                  <div key={resource.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getFileIcon(resource.type)}</span>
                          <h4 className="font-medium text-gray-900">{resource.title}</h4>
                          </div>
                      {resource.description && (
                          <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Size: {formatFileSize(resource.fileSize || 0)}</p>
                          <p>Shared by: {resource.createdBy?.firstName} {resource.createdBy?.lastName}</p>
                          <p>Shared: {new Date(resource.createdAt).toLocaleDateString()}</p>
                      </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Resource Allocation */}
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
                    {assignment.title} - {assignment.unit?.name || 'No Unit'}
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
                  className="btn-primary w-full"
                >
                  {allocationLoading ? 'Allocating...' : `Allocate ${selectedResources.length} Resource(s) to Assignment`}
                  </button>
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
                                {formatFileSize(resource.fileSize || 0)}
                      </div>
                  </div>
                            <button
                              onClick={() => handleRemoveResourceFromAssignment(selectedAssignment, resource.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
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
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Student Management</h2>
        <p className="text-gray-600">Student management coming soon...</p>
      </div>
    </div>
  );

  const renderAssessmentCreator = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assessment Creator</h2>
        <button
          onClick={() => window.location.href = '/assessment-creator'}
          className="btn-primary"
        >
          Create New Assessment
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Assessment Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: 'multiple-choice', label: 'Multiple Choice', icon: '🔘', desc: 'Auto-graded questions with one correct answer' },
            { type: 'true-false', label: 'True/False', icon: '✅', desc: 'Simple true/false questions' },
            { type: 'matching', label: 'Matching', icon: '🔗', desc: 'Match items from two columns' },
            { type: 'drag-and-drop', label: 'Drag & Drop', icon: '🎯', desc: 'Interactive drag and drop activities' },
            { type: 'writing', label: 'Writing (Short)', icon: '✍️', desc: 'Short answer writing questions' },
            { type: 'writing-long', label: 'Writing (Long)', icon: '📝', desc: 'Extended writing assignments' },
            { type: 'speaking', label: 'Speaking', icon: '🎤', desc: 'Oral response assignments' },
            { type: 'listening', label: 'Listening', icon: '🎧', desc: 'Audio-based questions' },
            { type: 'assignment', label: 'Assignment', icon: '📋', desc: 'General assignment type' }
          ].map((assessmentType) => (
            <div key={assessmentType.type} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{assessmentType.icon}</span>
                <h4 className="font-semibold text-gray-900">{assessmentType.label}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{assessmentType.desc}</p>
              <button
                onClick={() => {
                  setNewAssignment(prev => ({ ...prev, type: assessmentType.type }));
                  setShowCreateAssignment(true);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create {assessmentType.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignments</h2>
        <button
          onClick={() => setShowCreateAssignment(!showCreateAssignment)}
          className="btn-primary"
        >
          {showCreateAssignment ? 'Cancel' : 'Create Assignment'}
        </button>
      </div>

      {/* Create Assignment Form */}
      {showCreateAssignment && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newAssignment.type}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, type: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="matching">Matching</option>
                  <option value="drag_and_drop">Drag & Drop</option>
                  <option value="sortable">Sortable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newAssignment.description}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                className="form-textarea w-full"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newAssignment.category}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input w-full"
                  placeholder="e.g., Grammar, Listening, Speaking"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  value={newAssignment.quarter}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, quarter: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={newAssignment.maxAttempts}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  className="form-input w-full"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={newAssignment.unitId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, unitId: e.target.value }))}
                  className="form-select w-full"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="form-input w-full"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAssignment.published}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, published: e.target.checked }))}
                    className="form-checkbox mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grading Criteria
              </label>
              <textarea
                value={newAssignment.criteria}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, criteria: e.target.value }))}
                className="form-textarea w-full"
                rows={3}
                placeholder="Enter grading criteria or rubric..."
              />
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Create Assignment
              </button>
              <button
                type="button"
                onClick={() => setShowCreateAssignment(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No assignments created yet.</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assignment.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.published ? 'Published' : 'Draft'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {assignment.type}
                    </span>
                  </div>
                  
                  {assignment.description && (
                    <p className="text-gray-600 mb-2">{assignment.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    {assignment.course && (
                      <div>
                        <span className="font-medium">Course:</span> {assignment.course.name}
                      </div>
                    )}
                    {assignment.unit && (
                      <div>
                        <span className="font-medium">Unit:</span> Unit {assignment.unit.order}: {assignment.unit.name}
                      </div>
                    )}
                    {assignment.category && (
                      <div>
                        <span className="font-medium">Category:</span> {assignment.category}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Quarter:</span> {assignment.quarter}
                    </div>
                  </div>
                  
                  {assignment.dueDate && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">Submissions:</span> {assignment.submissions?.length || 0}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Teacher Portal</h1>
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
            {activeTab === 'course-structure' && renderCourseStructure()}
            {activeTab === 'assignments' && renderAssignments()}
            {activeTab === 'assessment-creator' && renderAssessmentCreator()}
            {activeTab === 'resources' && renderResources()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'class-view' && renderClassView()}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Teacher; 