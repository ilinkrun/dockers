'use client';

import { useState, useEffect } from 'react';
import { ProjectServer, ServerTemplate, Project, Platform } from '@/lib/api';

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProjectServer, 'id'>) => Promise<void>;
  server?: ProjectServer;
  templates: ServerTemplate[];
  projects: Project[];
  platforms: Platform[];
  mode: 'create' | 'edit';
  allServers: ProjectServer[];
}

export default function ServerModal({
  isOpen,
  onClose,
  onSave,
  server,
  templates,
  projects,
  platforms,
  mode,
  allServers
}: ServerModalProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    platformId: '',
    type: 'backend' as 'backend' | 'graphql' | 'frontend',
    templateId: '',
    port: 20100,
    enabled: true,
    config: '{}'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portWarning, setPortWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (server && mode === 'edit') {
        setFormData({
          projectId: server.projectId,
          platformId: server.platformId,
          type: server.type,
          templateId: server.templateId,
          port: server.port,
          enabled: server.enabled,
          config: JSON.stringify(server.config, null, 2)
        });
      } else {
        // Reset to defaults for create mode
        const defaultProject = projects[0];
        const defaultPlatform = platforms.find(p => p.id === defaultProject?.platformId) || platforms[0];
        const backendTemplates = templates.filter(t => t.type === 'backend');

        setFormData({
          projectId: defaultProject?.id || '',
          platformId: defaultPlatform?.id || '',
          type: 'backend',
          templateId: backendTemplates[0]?.id || '',
          port: 20100,
          enabled: true,
          config: '{}'
        });
      }
      setError(null);
      setPortWarning(null);
    }
  }, [server, templates, projects, platforms, mode, isOpen]);

  const checkPortDuplication = (port: number, currentServerId?: string) => {
    const duplicateServer = allServers.find(s =>
      s.port === port && s.id !== currentServerId
    );

    if (duplicateServer) {
      const project = projects.find(p => p.id === duplicateServer.projectId);
      return `⚠️ Port ${port} is already in use by ${project?.name || duplicateServer.projectId} (${duplicateServer.id})`;
    }
    return null;
  };

  const handlePortChange = (port: number) => {
    setFormData({ ...formData, port });
    const warning = checkPortDuplication(port, server?.id);
    setPortWarning(warning);
  };

  const handleTypeChange = (type: 'backend' | 'graphql' | 'frontend') => {
    const filteredTemplates = templates.filter(t => t.type === type);
    setFormData({
      ...formData,
      type,
      templateId: filteredTemplates[0]?.id || ''
    });
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    const selectedPlatform = platforms.find(p => p.id === selectedProject?.platformId);

    setFormData({
      ...formData,
      projectId,
      platformId: selectedPlatform?.id || formData.platformId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for port duplication
    const portCheck = checkPortDuplication(formData.port, server?.id);
    if (portCheck) {
      setError(portCheck);
      return;
    }

    // Validate JSON config
    let configObj: Record<string, unknown>;
    try {
      configObj = JSON.parse(formData.config);
    } catch {
      setError('Invalid JSON in configuration');
      return;
    }

    setSaving(true);

    try {
      const saveData = {
        projectId: formData.projectId,
        platformId: formData.platformId,
        type: formData.type,
        templateId: formData.templateId,
        port: formData.port,
        enabled: formData.enabled,
        config: configObj
      };

      await onSave(saveData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter(t => t.type === formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New Server' : 'Edit Server'}
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

        {portWarning && !error && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            {portWarning}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                disabled={mode === 'edit'}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.platformId})
                  </option>
                ))}
              </select>
              {mode === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Project cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as 'backend' | 'graphql' | 'frontend')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                disabled={mode === 'edit'}
              >
                <option value="backend">Backend</option>
                <option value="graphql">GraphQL</option>
                <option value="frontend">Frontend</option>
              </select>
              {mode === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Server type cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template *
              </label>
              <select
                required
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.framework})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port *
              </label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => handlePortChange(parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  portWarning
                    ? 'border-yellow-300 focus:ring-yellow-500'
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                min="1"
                max="65535"
              />
              {portWarning && (
                <p className="mt-1 text-sm text-yellow-600">{portWarning}</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Configuration (JSON)
              </label>
              <textarea
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 font-mono text-sm"
                rows={8}
                placeholder='{"key": "value"}'
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter server configuration as JSON (e.g., CORS settings, API URLs, etc.)
              </p>
            </div>

            {mode === 'edit' && server && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Server ID: <span className="font-mono">{server.id}</span>
                </p>
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
              disabled={saving || (portWarning !== null && mode === 'create')}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
