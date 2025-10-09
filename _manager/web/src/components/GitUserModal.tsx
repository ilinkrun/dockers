'use client';

import { useState, useEffect } from 'react';
import { GitUserDetailed } from '@/lib/api';

interface GitUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GitUserFormData) => void;
  mode: 'create' | 'edit';
  gitUser?: GitUserDetailed;
}

export interface GitUserFormData {
  username: string;
  fullName: string;
  email: string;
  token: string;
  token2?: string;
  expired?: string;
}

export default function GitUserModal({ isOpen, onClose, onSubmit, mode, gitUser }: GitUserModalProps) {
  const [formData, setFormData] = useState<GitUserFormData>({
    username: '',
    fullName: '',
    email: '',
    token: '',
    token2: '',
    expired: ''
  });

  useEffect(() => {
    if (mode === 'edit' && gitUser) {
      setFormData({
        username: gitUser.username,
        fullName: gitUser.fullName,
        email: gitUser.email,
        token: gitUser.token,
        token2: gitUser.token2 || '',
        expired: gitUser.expired || ''
      });
    } else if (mode === 'create') {
      setFormData({
        username: '',
        fullName: '',
        email: '',
        token: '',
        token2: '',
        expired: ''
      });
    }
  }, [mode, gitUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New GitHub User' : 'Edit GitHub User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Username *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., jnjsoftweb"
              disabled={mode === 'edit'}
            />
            <p className="mt-1 text-xs text-gray-500">GitHub username (cannot be changed after creation)</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., user@example.com"
            />
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token *
            </label>
            <input
              type="text"
              required
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
              placeholder="ghp_... or github_pat_..."
            />
            <p className="mt-1 text-xs text-gray-500">Personal access token for GitHub API</p>
          </div>

          {/* Token2 (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token 2 (Optional)
            </label>
            <input
              type="text"
              value={formData.token2}
              onChange={(e) => setFormData({ ...formData, token2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
              placeholder="Alternative token (optional)"
            />
            <p className="mt-1 text-xs text-gray-500">Secondary token if needed</p>
          </div>

          {/* Expired Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expired}
              onChange={(e) => setFormData({ ...formData, expired: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">When the token expires (for tracking purposes)</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {mode === 'create' ? 'Create Git User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
