'use client';

import { useState, useEffect } from 'react';
import { DatabaseConfig } from '@/lib/api';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseFormData) => void;
  mode: 'create' | 'edit';
  database?: DatabaseConfig & { type: 'mysql' | 'postgresql' };
}

export interface DatabaseFormData {
  type: 'mysql' | 'postgresql';
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  description: string;
}

export default function DatabaseModal({ isOpen, onClose, onSubmit, mode, database }: DatabaseModalProps) {
  const [formData, setFormData] = useState<DatabaseFormData>({
    type: 'postgresql',
    id: '',
    name: '',
    host: '',
    port: 5432,
    user: '',
    password: '',
    description: ''
  });

  useEffect(() => {
    if (mode === 'edit' && database) {
      setFormData({
        type: database.type,
        id: database.id,
        name: database.name,
        host: database.host,
        port: database.port,
        user: database.user,
        password: database.password,
        description: database.description
      });
    } else if (mode === 'create') {
      setFormData({
        type: 'postgresql',
        id: '',
        name: '',
        host: '',
        port: 5432,
        user: '',
        password: '',
        description: ''
      });
    }
  }, [mode, database]);

  // Update default port when type changes
  useEffect(() => {
    if (mode === 'create') {
      setFormData(prev => ({
        ...prev,
        port: prev.type === 'mysql' ? 3306 : 5432
      }));
    }
  }, [formData.type, mode]);

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
            {mode === 'create' ? 'Add New Database Configuration' : 'Edit Database Configuration'}
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
          {/* Database Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'mysql' | 'postgresql' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={mode === 'edit'}
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          {/* Database ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database ID *
            </label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., mysql_prod_1"
              disabled={mode === 'edit'}
            />
            <p className="mt-1 text-xs text-gray-500">Unique identifier for this database configuration</p>
          </div>

          {/* Database Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., MySQL Production Server"
            />
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host *
            </label>
            <input
              type="text"
              required
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., localhost or 192.168.1.100"
            />
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port *
            </label>
            <input
              type="number"
              required
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="3306 for MySQL, 5432 for PostgreSQL"
            />
          </div>

          {/* User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User *
            </label>
            <input
              type="text"
              required
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., root or admin"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Database password"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
              placeholder="e.g., Production MySQL server hosted on AWS"
            />
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
              {mode === 'create' ? 'Create Database Config' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
