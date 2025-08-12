import React, { useEffect, useState } from 'react';
import axios from '../../api';

interface Org {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logo?: string | null;
}

const SuperuserOrganizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    domain: '',
    primaryColor: '',
    secondaryColor: '',
    logo: ''
  });
  const [uploadingOrgId, setUploadingOrgId] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/organizations');
      setOrganizations(res.data?.organizations || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.code) {
      setError('Name and code are required');
      return;
    }
    try {
      const payload = {
        name: form.name,
        code: form.code.toUpperCase().replace(/\s+/g, '_'),
        domain: form.domain || undefined,
        primaryColor: form.primaryColor || undefined,
        secondaryColor: form.secondaryColor || undefined,
        logo: form.logo || undefined
      };
      await axios.post('/organizations', payload);
      setSuccess('Organization created successfully');
      setForm({ name: '', code: '', domain: '', primaryColor: '', secondaryColor: '', logo: '' });
      fetchOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create organization. Ensure you are logged in and have superuser access.');
    }
  };

  const handleLogoUpload = async (orgId: string, file: File) => {
    try {
      setError('');
      setSuccess('');
      setUploadingOrgId(orgId);
      const fd = new FormData();
      fd.append('logo', file);
      await axios.post(`/organizations/${orgId}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Logo uploaded');
      await fetchOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingOrgId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Organizations</h1>
          <p className="text-gray-600">Superuser-only page to create new organizations.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create Organization</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Greenwood High" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input name="code" value={form.code} onChange={handleChange} className="form-input" placeholder="GREENWOOD_HIGH" />
                <p className="text-xs text-gray-500 mt-1">Uppercase with underscores; used as unique code.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain (optional)</label>
                  <input name="domain" value={form.domain} onChange={handleChange} className="form-input" placeholder="greenwood.example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logo (optional)</label>
                  <input name="logo" value={form.logo} onChange={handleChange} className="form-input" placeholder="logo filename or URL" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Color (optional)</label>
                  <input name="primaryColor" value={form.primaryColor} onChange={handleChange} className="form-input" placeholder="#4F46E5 or tailwind token" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secondary Color (optional)</label>
                  <input name="secondaryColor" value={form.secondaryColor} onChange={handleChange} className="form-input" placeholder="#A78BFA" />
                </div>
              </div>
              <div>
                <button type="submit" className="btn-primary w-full">Create</button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Existing Organizations</h2>
              <button onClick={fetchOrganizations} className="text-sm text-indigo-600 hover:underline">Refresh</button>
            </div>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : organizations.length === 0 ? (
              <p className="text-gray-600">No organizations found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {organizations.map((o) => (
                  <div key={o.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 border">
                        {o.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.logo} alt={o.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No logo</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{o.name}</p>
                        <p className="text-sm text-gray-600">{o.code} {o.domain ? `• ${o.domain}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <span className="sr-only">Upload logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoUpload(o.id, f);
                          }}
                        />
                        <span className="btn-secondary px-3 py-1 text-sm">{uploadingOrgId === o.id ? 'Uploading…' : 'Upload Logo'}</span>
                      </label>
                      <button
                        onClick={async () => {
                          const name = prompt('New name', o.name) || o.name;
                          const code = prompt('New code', o.code) || o.code;
                          const domain = prompt('Domain (optional)', o.domain || '') || '';
                          const primaryColor = prompt('Primary Color (optional)', o.primaryColor || '') || '';
                          const secondaryColor = prompt('Secondary Color (optional)', o.secondaryColor || '') || '';
                          let logo = prompt('Logo path (starts with /uploads/, optional)', o.logo || '') || '';
                          // Normalize logo to start with /uploads
                          if (logo) {
                            const trimmed = logo.trim();
                            if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/uploads/')) {
                              if (trimmed.includes('/')) {
                                logo = trimmed.startsWith('/') ? `/uploads${trimmed}` : `/uploads/${trimmed}`;
                              } else {
                                logo = `/uploads/org-logos/${trimmed}`;
                              }
                            } else {
                              logo = trimmed;
                            }
                          }
                          try {
                            await axios.patch(`/organizations/${o.id}`, { name, code, domain, primaryColor, secondaryColor, logo });
                            setSuccess('Organization updated');
                            fetchOrganizations();
                          } catch (err: any) {
                            setError(err.response?.data?.message || 'Failed to update organization');
                          }
                        }}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperuserOrganizations;

