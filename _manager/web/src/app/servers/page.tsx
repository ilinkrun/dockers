'use client';

import { useEffect, useState } from 'react';
import { apiClient, ProjectServer, ServerTemplate, Project, Platform } from '@/lib/api';
import ServerModal from '@/components/ServerModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function ServersPage() {
  const [servers, setServers] = useState<ProjectServer[]>([]);
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ProjectServer | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; server: ProjectServer | null }>({ isOpen: false, server: null });

  const fetchData = async () => {
    try {
      const [serversData, templatesData, projectsData, platformsData] = await Promise.all([
        apiClient.getProjectServers(),
        apiClient.getServerTemplates(),
        apiClient.getProjects(),
        apiClient.getPlatforms()
      ]);
      setServers(serversData);
      setTemplates(templatesData.all);
      setProjects(projectsData);
      setPlatforms(platformsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setModalMode('create');
    setEditingServer(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (server: ProjectServer) => {
    setModalMode('edit');
    setEditingServer(server);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<ProjectServer, 'id'>) => {
    if (modalMode === 'create') {
      await apiClient.createProjectServer(data);
    } else if (editingServer) {
      const { port, enabled, config, templateId } = data;
      await apiClient.updateProjectServer(editingServer.projectId, editingServer.id, { port, enabled, config, templateId });
    }
    await fetchData();
  };

  const handleDeleteClick = (server: ProjectServer) => {
    setDeleteConfirm({ isOpen: true, server });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.server) return;

    try {
      await apiClient.deleteProjectServer(deleteConfirm.server.projectId, deleteConfirm.server.id);
      await fetchData();
      setDeleteConfirm({ isOpen: false, server: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete server');
      setDeleteConfirm({ isOpen: false, server: null });
    }
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || templateId;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || platformId;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'backend':
        return 'bg-blue-100 text-blue-800';
      case 'graphql':
        return 'bg-purple-100 text-purple-800';
      case 'frontend':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Servers</h1>
          <p className="mt-2 text-gray-600">
            Manage project servers and their configurations
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          + New Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🖥️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No servers yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first server</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Create Server
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {servers.map((server) => (
              <li key={server.id}>
                <div className="px-6 py-5 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {getTemplateName(server.templateId)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(server.type)}`}>
                          {server.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          server.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {server.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          📦 Project: <span className="ml-1 font-medium">{getProjectName(server.projectId)}</span>
                        </span>
                        <span className="flex items-center">
                          🏗️ Platform: <span className="ml-1 font-medium">{getPlatformName(server.platformId)}</span>
                        </span>
                        <span className="flex items-center">
                          🔌 Port: <span className="ml-1 font-mono font-semibold text-blue-600">{server.port}</span>
                        </span>
                        <span className="flex items-center">
                          🆔 Server ID: <span className="ml-1 font-mono text-xs">{server.id}</span>
                        </span>
                      </div>
                      {server.config && Object.keys(server.config).length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">Configuration</summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded overflow-auto">
                              {JSON.stringify(server.config, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleEdit(server)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(server)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        server={editingServer}
        templates={templates}
        projects={projects}
        platforms={platforms}
        mode={modalMode}
        allServers={servers}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Server"
        message={`Are you sure you want to delete this server (Port: ${deleteConfirm.server?.port})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, server: null })}
      />
    </div>
  );
}
