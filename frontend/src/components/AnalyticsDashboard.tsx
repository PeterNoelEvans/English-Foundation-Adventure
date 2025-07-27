import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StudentAnalytics {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  period: {
    start: string;
    end: string;
  };
  sessions: {
    total: number;
    totalTime: number;
    averageTime: number;
  };
  assignments: {
    completed: number;
    started: number;
    abandoned: number;
    completionRate: number;
  };
  activities: {
    total: number;
    breakdown: Record<string, number>;
  };
  recentActivity: any[];
  recentSessions: any[];
  recentAttempts: any[];
}

interface SchoolAnalytics {
  school: {
    id: string;
    totalStudents: number;
    activeStudents: number;
    engagementRate: number;
  };
  period: {
    start: string;
    end: string;
  };
  sessions: {
    total: number;
    totalTime: number;
    averageTime: number;
  };
  assignments: {
    total: number;
    completed: number;
    completionRate: number;
  };
  activities: {
    total: number;
  };
  topStudents: Array<{
    id: string;
    name: string;
    completedAssignments: number;
    averageScore: number;
    totalTime: number;
    engagementScore: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [schoolAnalytics, setSchoolAnalytics] = useState<SchoolAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchStudents();
    fetchSchoolAnalytics();
  }, [period]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAnalytics(selectedStudent);
    }
  }, [selectedStudent, period]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/auth/students');
      setStudents(response.data.students);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchStudentAnalytics = async (studentId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/analytics/student/${studentId}?period=${period}`);
      setStudentAnalytics(response.data.analytics);
    } catch (err: any) {
      setError('Failed to fetch student analytics');
      console.error('Failed to fetch student analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolAnalytics = async () => {
    try {
      const response = await axios.get(`/analytics/school?period=${period}`);
      setSchoolAnalytics(response.data.analytics);
    } catch (err: any) {
      console.error('Failed to fetch school analytics:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="form-input w-32"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* School Overview */}
      {schoolAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{schoolAnalytics.school.totalStudents}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700">Active Students</h3>
            <p className="text-3xl font-bold text-green-600">{schoolAnalytics.school.activeStudents}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700">Engagement Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{schoolAnalytics.school.engagementRate}%</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700">Completion Rate</h3>
            <p className="text-3xl font-bold text-orange-600">{schoolAnalytics.assignments.completionRate}%</p>
          </div>
        </div>
      )}

      {/* Student Selection */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Student Analytics</h3>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="form-input w-full md:w-64"
        >
          <option value="">Select a student...</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Student Analytics */}
      {selectedStudent && studentAnalytics && (
        <div className="space-y-6">
          {/* Student Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <h4 className="text-sm font-medium text-gray-600">Total Sessions</h4>
              <p className="text-2xl font-bold text-blue-600">{studentAnalytics.sessions.total}</p>
            </div>
            <div className="card">
              <h4 className="text-sm font-medium text-gray-600">Total Time</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatTime(studentAnalytics.sessions.totalTime)}
              </p>
            </div>
            <div className="card">
              <h4 className="text-sm font-medium text-gray-600">Completed Assignments</h4>
              <p className="text-2xl font-bold text-purple-600">
                {studentAnalytics.assignments.completed}
              </p>
            </div>
            <div className="card">
              <h4 className="text-sm font-medium text-gray-600">Completion Rate</h4>
              <p className="text-2xl font-bold text-orange-600">
                {studentAnalytics.assignments.completionRate}%
              </p>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="card">
            <h4 className="text-lg font-semibold mb-4">Activity Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(studentAnalytics.activities.breakdown).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-sm text-gray-600">{type.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold text-blue-600">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold mb-4">Recent Activity</h4>
              <div className="space-y-2">
                {studentAnalytics.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{activity.activityType}</span>
                    <span className="text-gray-500">{formatDate(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="text-lg font-semibold mb-4">Recent Sessions</h4>
              <div className="space-y-2">
                {studentAnalytics.recentSessions.slice(0, 5).map((session, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{session.sessionType}</span>
                    <span className="text-gray-500">
                      {session.duration ? formatTime(session.duration) : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Students */}
      {schoolAnalytics && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Top Performing Students</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Completed</th>
                  <th className="text-left py-2">Avg Score</th>
                  <th className="text-left py-2">Total Time</th>
                  <th className="text-left py-2">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {schoolAnalytics.topStudents.map((student, index) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        {student.name}
                      </div>
                    </td>
                    <td className="py-2">{student.completedAssignments}</td>
                    <td className="py-2">{student.averageScore}%</td>
                    <td className="py-2">{formatTime(student.totalTime)}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {student.engagementScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 