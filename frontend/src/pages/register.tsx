import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useRouter } from 'next/router';

const organizations = {
  pbs: { name: 'PBS', color: 'green', bgColor: 'bg-green-500' },
  hospital: { name: 'Hospital', color: 'blue', bgColor: 'bg-blue-500' },
  'coding-school': { name: 'Coding School', color: 'purple', bgColor: 'bg-purple-500' }
};

const Register: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    yearLevel: 'P1',
    classNum: '1',
    studentNumber: '',
  });
  const [error, setError] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Year level options
  const yearLevels = [
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

  // Class number options
  const classNumbers = [
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' },
    { value: '6', label: 'Class 6' },
  ];

  useEffect(() => {
    // Get organization from URL query or localStorage
    const orgFromQuery = router.query.org as string;
    const orgFromStorage = typeof window !== 'undefined' ? localStorage.getItem('selectedOrganization') : null;
    const org = orgFromQuery || orgFromStorage || 'pbs';
    setSelectedOrg(org);
  }, [router.query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate student number if provided
    if (form.role === 'STUDENT' && form.studentNumber.trim()) {
      const studentNumberRegex = /^\d{5}$/;
      if (!studentNumberRegex.test(form.studentNumber)) {
        setError('Student number must be exactly 5 digits');
        return;
      }
    }

    try {
      const { confirmPassword, ...registrationData } = form;
      // Add organization to the registration data
      const dataWithOrg = {
        ...registrationData,
        organization: selectedOrg
      };
      
      await axios.post('/auth/register', dataWithOrg);
      
      // Store organization context
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedOrganization', selectedOrg);
      }
      
      router.push(`/login?org=${selectedOrg}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const currentOrg = organizations[selectedOrg as keyof typeof organizations] || organizations.pbs;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className={`text-3xl font-bold text-${currentOrg.color}-600`}>
            {currentOrg.name} Registration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started ({currentOrg.name})
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

        <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email address"
                />
              </div>
        </div>

        <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="form-input pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
        </div>

        <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-input pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
        </div>

        <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="form-input"
                >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </div>
            </div>

            {form.role === 'STUDENT' && (
              <div>
                <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">
                  Year Level
                </label>
                <div className="mt-1">
                  <select
                    id="yearLevel"
                    name="yearLevel"
                    value={form.yearLevel}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    {yearLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {form.role === 'STUDENT' && (
              <div>
                <label htmlFor="classNum" className="block text-sm font-medium text-gray-700">
                  Class Number
                </label>
                <div className="mt-1">
                  <select
                    id="classNum"
                    name="classNum"
                    value={form.classNum}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    {classNumbers.map((classNum) => (
                      <option key={classNum.value} value={classNum.value}>
                        {classNum.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {form.role === 'STUDENT' && (
              <div>
                <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-700">
                  Student Number <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="studentNumber"
                    name="studentNumber"
                    type="text"
                    value={form.studentNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter 5-digit student number (optional)"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    title="Please enter a 5-digit number"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  If you don't have a student number, you can leave this blank.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${currentOrg.bgColor} hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${currentOrg.color}-500`}
              >
                Create Account
              </button>
            </div>
      </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href={`/login?org=${selectedOrg}`} className="font-medium text-green-600 hover:text-green-500">
                Sign in here
              </a>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Organization Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 