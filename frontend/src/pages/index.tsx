import { useRouter } from 'next/router';
import { useState } from 'react';

const organizations = [
  {
    id: 'pbs',
    name: 'PBS',
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Primary and Secondary Education'
  },
  {
    id: 'hospital',
    name: 'Hospital',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Healthcare Training Institute'
  },
  {
    id: 'coding-school',
    name: 'Coding School',
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'Technology and Programming'
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState('');

  const handleOrganizationSelect = (orgId: string) => {
    setSelectedOrg(orgId);
    // Store the selected organization in localStorage
    localStorage.setItem('selectedOrganization', orgId);
    // Redirect to login with organization context
    router.push(`/login?org=${orgId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Learning Resource Hub
        </h1>
        <p className="text-xl text-gray-600">
          Your comprehensive platform for academic success
        </p>
      </div>

      {/* Organization Selection */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Select Your Organization
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org.id)}
                className={`${org.color} text-white rounded-lg p-8 text-center transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
              >
                <h3 className="text-2xl font-bold mb-2">{org.name}</h3>
                <p className="text-sm opacity-90">{org.description}</p>
              </button>
            ))}
          </div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Your Learning Journey
            </h3>
            <p className="text-gray-600 text-lg">
              Access curriculum materials, track your progress, and find resources to help you succeed.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                Curriculum Overview
              </h4>
              <p className="text-gray-600">
                View all subjects and topics for your grade level
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                Study Resources
              </h4>
              <p className="text-gray-600">
                Access learning materials and practice exercises
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                Progress Tracking
              </h4>
              <p className="text-gray-600">
                Monitor your learning progress and achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 