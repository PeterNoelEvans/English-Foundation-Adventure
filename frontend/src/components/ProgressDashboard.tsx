import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProgressData {
  dailyProgress: any[];
  weeklyProgress: any[];
  learningPatterns: any[];
  summary: {
    totalScore: number;
    completedAssignments: number;
    averageScore: number;
    totalAssignments: number;
  };
  dailyAverages: Array<{
    date: string;
    averageScore: number;
  }>;
}

interface ProgressDashboardProps {
  studentId?: string;
  isTeacher?: boolean;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ studentId, isTeacher = false }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedView, setSelectedView] = useState('daily');

  useEffect(() => {
    fetchProgressData();
  }, [studentId, selectedPeriod]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const targetStudentId = studentId || 'me';
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
      const startDateStr = startDate.toISOString().split('T')[0];

      const response = await axios.get(`/progress/student/${targetStudentId}`, {
        params: {
          startDate: startDateStr,
          endDate: endDate
        }
      });

      setProgressData(response.data);
    } catch (err: any) {
      console.error('Error fetching progress:', err);
      setError(err.response?.data?.message || 'Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  const recordProgress = async (assignmentId: string, score: number, timeSpent: number = 0) => {
    try {
      await axios.post('/progress/daily', {
        assignmentId,
        score,
        timeSpentMinutes: timeSpent,
        completed: true
      });
      
      // Refresh progress data
      await fetchProgressData();
    } catch (err: any) {
      console.error('Error recording progress:', err);
      setError(err.response?.data?.message || 'Failed to record progress');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchProgressData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No progress data available.</p>
      </div>
    );
  }

  const { summary, dailyAverages, weeklyProgress, learningPatterns } = progressData;

  // Calculate additional metrics
  const completionRate = summary.totalAssignments > 0 
    ? Math.round((summary.completedAssignments / summary.totalAssignments) * 100) 
    : 0;

  const bestDay = weeklyProgress.length > 0 ? weeklyProgress[0]?.bestDayOfWeek : null;
  const worstDay = weeklyProgress.length > 0 ? weeklyProgress[0]?.worstDayOfWeek : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📊 Progress Dashboard</h2>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="patterns">Learning Patterns</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Score</p>
              <p className="text-lg font-semibold text-gray-900">{summary.totalScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.completedAssignments}/{summary.totalAssignments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-lg font-semibold text-gray-900">{summary.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-lg font-semibold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📅 Daily Progress</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {dailyAverages.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.max(day.averageScore, 5)}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.date}: ${day.averageScore.toFixed(1)}%`}
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Average score per day over the last {selectedPeriod} days
          </p>
        </div>

        {/* Weekly Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Weekly Performance</h3>
          {weeklyProgress.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Best Day</p>
                  <p className="text-lg font-semibold text-green-600">{bestDay || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Worst Day</p>
                  <p className="text-lg font-semibold text-red-600">{worstDay || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {weeklyProgress.slice(0, 4).map((week, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      Week of {new Date(week.weekStart).toLocaleDateString()}
                    </span>
                    <span className="font-semibold">{week.averageScore?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No weekly data available</p>
          )}
        </div>
      </div>

      {/* Learning Patterns */}
      {learningPatterns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🧠 Learning Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningPatterns.map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 capitalize">
                  {pattern.patternType.replace('_', ' ')}
                </h4>
                <div className="space-y-1">
                  {Object.entries(pattern.patternData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                                             <span className="font-medium">
                         {typeof value === 'number' ? value.toFixed(2) : String(value)}
                       </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Recent Activity</h3>
        {progressData.dailyProgress.length > 0 ? (
          <div className="space-y-3">
            {progressData.dailyProgress.slice(0, 10).map((progress, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {progress.assignment.type === 'multiple-choice' ? '🔘' : '📝'}
                  </span>
                  <div>
                    <p className="font-medium">{progress.assignment.title}</p>
                    <p className="text-sm text-gray-600">
                      {progress.assignment.course?.name} • {new Date(progress.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{progress.score || 0}%</p>
                  <p className="text-xs text-gray-500">
                    {progress.timeSpentMinutes || 0} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>

      {/* Progress Recording (for testing) */}
      {isTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🧪 Test Progress Recording</h4>
          <p className="text-sm text-blue-800 mb-3">
            Teachers can test progress recording functionality here.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => recordProgress('test-assignment-id', 85, 15)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Record 85% (15 min)
            </button>
            <button
              onClick={() => recordProgress('test-assignment-id', 92, 20)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Record 92% (20 min)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard; 