'use client';

import { useState, useEffect } from 'react';
import { Project, CreateProjectRequest, Platform, apiClient } from '@/lib/api';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProjectRequest | Partial<Project>) => Promise<void>;
  project?: Project;
  platforms: Platform[];
  mode: 'create' | 'edit';
}

export default function ProjectModal({ isOpen, onClose, onSave, project, platforms, mode }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    platformId: '',
    description: '',
    githubUser: '',
    status: 'development' as 'active' | 'inactive' | 'development' | 'production'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gitUsers, setGitUsers] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const fetchGitUsers = async () => {
      try {
        const users = await apiClient.getGitUsers();
        setGitUsers(users);

        if (project && mode === 'edit') {
          setFormData({
            name: project.name,
            platformId: project.platformId,
            description: project.description || '',
            githubUser: project.githubUser,
            status: project.status
          });
        } else {
          // For create mode, default to first platform's githubUser
          const defaultPlatform = platforms[0];
          setFormData({
            name: '',
            platformId: defaultPlatform?.id || '',
            description: '',
            githubUser: defaultPlatform?.githubUser || users[0] || '',
            status: 'development'
          });
        }
      } catch (err) {
        console.error('Failed to fetch git users:', err);
      }
    };

    if (isOpen) {
      fetchGitUsers();
    }
  }, [project, platforms, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                placeholder="my-project"
                disabled={mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Project name cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform *
              </label>
              <select
                required
                value={formData.platformId}
                onChange={(e) => {
                  const selectedPlatform = platforms.find(p => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    platformId: e.target.value,
                    githubUser: selectedPlatform?.githubUser || formData.githubUser
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                disabled={mode === 'edit'}
              >
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
              {mode === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Platform cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                rows={3}
                placeholder="Project description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub User *
              </label>
              <select
                required
                value={formData.githubUser}
                onChange={(e) => setFormData({ ...formData, githubUser: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                {gitUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'development' | 'production' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {mode === 'edit' && project && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  {showAdvanced ? '▼' : '▶'} Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3 max-h-96 overflow-y-auto">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ports</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Backend</label>
                          <input
                            type="number"
                            value={project?.ports?.backend ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">GraphQL</label>
                          <input
                            type="number"
                            value={project?.ports?.graphql ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Frontend (Next.js)</label>
                          <input
                            type="number"
                            value={project?.ports?.frontendNextjs ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Frontend (SvelteKit)</label>
                          <input
                            type="number"
                            value={project?.ports?.frontendSveltekit ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                      {project?.ports?.reserved && project?.ports?.reserved.length > 0 && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Reserved Ports</label>
                          <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-300">
                            {project?.ports?.reserved?.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Database</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Type</label>
                            <input
                              type="text"
                              value={project?.database?.type ?? ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Host</label>
                            <input
                              type="text"
                              value={project?.database?.host ?? ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Database Name</label>
                          <input
                            type="text"
                            value={project?.database?.name ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">User</label>
                            <input
                              type="text"
                              value={project?.database?.user ?? ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Auto Create</label>
                            <input
                              type="text"
                              value={project?.database?.autoCreate ? 'Yes' : 'No'}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Environment</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Node Environment</label>
                          <input
                            type="text"
                            value={project?.environment?.nodeEnv ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">CORS Origin</label>
                          <input
                            type="text"
                            value={project?.environment?.corsOrigin ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Docker Images</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Backend</label>
                          <input
                            type="text"
                            value={project?.docker?.imageBackend ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Frontend (Next.js)</label>
                          <input
                            type="text"
                            value={project?.docker?.imageFrontendNextjs ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Volumes</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Data Path</label>
                          <input
                            type="text"
                            value={project?.volumes?.dataPath ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Logs Path</label>
                          <input
                            type="text"
                            value={project?.volumes?.logsPath ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Uploads Path</label>
                          <input
                            type="text"
                            value={project?.volumes?.uploadsPath ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
