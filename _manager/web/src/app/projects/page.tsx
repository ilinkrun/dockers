'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, Project, Platform, CreateProjectRequest } from '@/lib/api';
import ProjectModal from '@/components/ProjectModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; project: Project | null }>({ isOpen: false, project: null });

  const fetchData = async () => {
    try {
      const [projectsData, platformsData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getPlatforms()
      ]);
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
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setModalMode('edit');
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateProjectRequest | Partial<Project>) => {
    if (modalMode === 'create') {
      // Execute cp.sh script first
      const scriptData = data as CreateProjectRequest;
      await apiClient.createProjectScript({
        platformId: scriptData.platformId,
        name: scriptData.name,
        githubUser: scriptData.githubUser,
        description: scriptData.description
      });
      // Then create in database
      await apiClient.createProject(scriptData);
    } else if (editingProject) {
      await apiClient.updateProject(editingProject.id, data);
    }
    await fetchData();
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirm({ isOpen: true, project });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.project) return;

    try {
      // First execute xgit to delete repositories
      await apiClient.deleteProjectScript({
        platformId: deleteConfirm.project.platformId,
        name: deleteConfirm.project.name,
        githubUser: deleteConfirm.project.githubUser
      });

      // Then delete from database
      await apiClient.deleteProject(deleteConfirm.project.id);
      await fetchData();
      setDeleteConfirm({ isOpen: false, project: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
      setDeleteConfirm({ isOpen: false, project: null });
    }
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || platformId;
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">
            Manage your platform projects
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first project</p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            Create Project
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="px-6 py-5 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'production'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'development'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          🏗️ Platform: <span className="ml-1 font-medium">{getPlatformName(project.platformId)}</span>
                        </span>
                        <span className="flex items-center">
                          👤 {project.githubUser}
                        </span>
                        <span className="flex items-center">
                          🔌 Backend: {project.ports.backend}
                        </span>
                        <span className="flex items-center">
                          🔌 GraphQL: {project.ports.graphql}
                        </span>
                        <span className="flex items-center">
                          🔌 Next.js: {project.ports.frontendNextjs}
                        </span>
                        <span className="flex items-center">
                          🔌 SvelteKit: {project.ports.frontendSveltekit}
                        </span>
                        <span className="flex items-center">
                          💾 DB: {project.database.type} - {project.database.name}
                        </span>
                        <span className="flex items-center">
                          🌍 Env: {project.environment.nodeEnv}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Created: {new Date(project.createdAt).toLocaleString()} • Updated: {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(project)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project)}
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

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        project={editingProject}
        platforms={platforms}
        mode={modalMode}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="프로젝트 삭제"
        message={`정말로 "${deleteConfirm.project?.name}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, project: null })}
      />
    </div>
  );
}
