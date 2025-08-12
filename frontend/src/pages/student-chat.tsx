import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from '../api';
import ChatInterface from '../components/ChatInterface';

const StudentChat: React.FC = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get('/auth/me');
        setUserInfo(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Student Messages</h1>
              {userInfo && userInfo.organization && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm font-medium text-gray-700">
                    {userInfo.organization.name}
                  </span>
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
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="h-screen pt-16">
        <ChatInterface />
      </div>
    </div>
  );
};

export default StudentChat;
