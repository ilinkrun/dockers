'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  apiClient,
  Platform,
  CreatePlatformRequest,
  Project,
} from '@/lib/api';
import PlatformModal from '@/components/PlatformModal';
import ConfirmModal from '@/components/ConfirmModal';

type PlatformProjectsState = {
  data: Project[];
  loading: boolean;
  error: string | null;
};

type ProjectDeleteConfirmState = {
  isOpen: boolean;
  project: Project | null;
  platformId: string | null;
};

const initialDeleteState: ProjectDeleteConfirmState = {
  isOpen: false,
  project: null,
  platformId: null,
};

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; platform: Platform | null }>({ isOpen: false, platform: null });
  const [openProjectsFor, setOpenProjectsFor] = useState<string | null>(null);
  const [projectsByPlatform, setProjectsByPlatform] = useState<Record<string, PlatformProjectsState>>({});
  const [projectDeleteConfirm, setProjectDeleteConfirm] = useState<ProjectDeleteConfirmState>(initialDeleteState);

  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchPlatforms = async () => {
    try {
      const data = await apiClient.getPlatforms();
      setPlatforms(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const ensureProjectsLoaded = async (platformId: string, force = false) => {
    const existing = projectsByPlatform[platformId];

    if (existing && !force && !existing.error) {
      return;
    }

    setProjectsByPlatform((prev) => ({
      ...prev,
      [platformId]: {
        data: existing?.data ?? [],
        loading: true,
        error: null,
      },
    }));

    try {
      const data = await apiClient.getProjectsByPlatform(platformId);
      setProjectsByPlatform((prev) => ({
        ...prev,
        [platformId]: {
          data,
          loading: false,
          error: null,
        },
      }));
    } catch (err) {
      setProjectsByPlatform((prev) => ({
        ...prev,
        [platformId]: {
          data: prev[platformId]?.data ?? [],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load projects',
        },
      }));
    }
  };

  const refreshProjectsForPlatform = async (platformId: string) => {
    await ensureProjectsLoaded(platformId, true);
  };

  useEffect(() => {
    const platformIdParam = searchParams.get('platformId');
    if (!platformIdParam) {
      return;
    }

    setOpenProjectsFor(platformIdParam);
    void ensureProjectsLoaded(platformIdParam);
  }, [searchParams]);

  const handleCreate = () => {
    setModalMode('create');
    setEditingPlatform(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (platform: Platform) => {
    setModalMode('edit');
    setEditingPlatform(platform);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreatePlatformRequest | Partial<Platform>) => {
    if (modalMode === 'create') {
      const scriptData = data as CreatePlatformRequest;
      await apiClient.createPlatformScript({
        name: scriptData.name,
        githubUser: scriptData.githubUser,
        description: scriptData.description,
      });
      await apiClient.createPlatform(scriptData);
    } else if (editingPlatform) {
      await apiClient.updatePlatform(editingPlatform.id, data);
    }
    await fetchPlatforms();
  };

  const handleDeleteClick = (platform: Platform) => {
    setDeleteConfirm({ isOpen: true, platform });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.platform) return;

    try {
      await apiClient.deletePlatformScript({
        name: deleteConfirm.platform.name,
        githubUser: deleteConfirm.platform.githubUser,
      });

      await apiClient.deletePlatform(deleteConfirm.platform.id);
      await fetchPlatforms();
      setDeleteConfirm({ isOpen: false, platform: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete platform');
      setDeleteConfirm({ isOpen: false, platform: null });
    }
  };

  const handleProjectsToggle = (platformId: string) => {
    if (openProjectsFor === platformId) {
      setOpenProjectsFor(null);
      return;
    }

    setOpenProjectsFor(platformId);
    void ensureProjectsLoaded(platformId);
  };

  const handleProjectCreate = (platform: Platform) => {
    router.push(`/platforms/${platform.id}/projects/new`);
  };

  const handleProjectView = (platform: Platform, project: Project) => {
    router.push(`/platforms/${platform.id}/projects/${project.id}`);
  };

  const handleProjectEdit = (platform: Platform, project: Project) => {
    router.push(`/platforms/${platform.id}/projects/${project.id}/edit`);
  };

  const handleProjectDeleteClick = (platformId: string, project: Project) => {
    setProjectDeleteConfirm({ isOpen: true, project, platformId });
  };

  const handleProjectDeleteConfirm = async () => {
    const { project, platformId } = projectDeleteConfirm;
    if (!project || !platformId) return;

    try {
      await apiClient.deleteProjectScript({
        platformId: project.platformId,
        name: project.name,
        githubUser: project.githubUser,
      });

      await apiClient.deleteProject(project.id);
      await refreshProjectsForPlatform(platformId);
      await fetchPlatforms();
      setProjectDeleteConfirm(initialDeleteState);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
      setProjectDeleteConfirm(initialDeleteState);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Platforms</h1>
          <p className="mt-2 text-gray-600">Manage your Docker platforms and related projects</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          + New Platform
        </button>
      </div>

      {platforms.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🏗️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No platforms yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first platform</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Platform
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {platforms.map((platform) => {
              const projectState = projectsByPlatform[platform.id];
              const isProjectsOpen = openProjectsFor === platform.id;

              return (
                <li key={platform.id}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{platform.name}</h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              platform.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : platform.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {platform.status}
                          </span>
                        </div>
                        {platform.description && (
                          <p className="mt-1 text-sm text-gray-500">{platform.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">👤 {platform.githubUser}</span>
                          <span className="flex items-center">📦 {platform.projectCount} projects</span>
                          <span className="flex items-center">🔌 Port: {platform.settings.basePort}</span>
                          <span className="flex items-center">🌐 {platform.settings.network.subnet}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Created: {new Date(platform.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleProjectsToggle(platform.id)}
                          className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                            isProjectsOpen
                              ? 'border-blue-500 text-blue-600 bg-blue-50'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          Projects
                        </button>
                        <Link
                          href={`/platforms/${platform.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleEdit(platform)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(platform)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isProjectsOpen && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Projects</h4>
                          <button
                            onClick={() => handleProjectCreate(platform)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            프로젝트 생성
                          </button>
                        </div>

                        {projectState?.loading ? (
                          <div className="py-6 text-sm text-gray-500">Loading projects...</div>
                        ) : projectState?.error ? (
                          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-center justify-between">
                              <span>{projectState.error}</span>
                              <button
                                onClick={() => refreshProjectsForPlatform(platform.id)}
                                className="ml-3 text-xs font-medium underline"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        ) : projectState && projectState.data.length > 0 ? (
                          <ul className="space-y-3">
                            {projectState.data.map((project) => (
                              <li key={project.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                      <h5 className="text-base font-medium text-gray-900 truncate">{project.name}</h5>
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          project.status === 'production'
                                            ? 'bg-green-100 text-green-800'
                                            : project.status === 'development'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : project.status === 'active'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {project.status}
                                      </span>
                                    </div>
                                    {project.description && (
                                      <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                                    )}
                                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 sm:grid-cols-3">
                                      <span>👤 {project.githubUser}</span>
                                      <span>🔌 Backend: {project.ports.backend}</span>
                                      <span>🔌 GraphQL: {project.ports.graphql}</span>
                                      <span>🔌 Next.js: {project.ports.frontendNextjs}</span>
                                      <span>💾 DB: {project.database.type}</span>
                                      <span>🌍 {project.environment.nodeEnv}</span>
                                    </div>
                                  </div>
                                  <div className="ml-4 flex-shrink-0 flex gap-2">
                                    <button
                                      onClick={() => handleProjectView(platform, project)}
                                      className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleProjectEdit(platform, project)}
                                      className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleProjectDeleteClick(platform.id, project)}
                                      className="inline-flex items-center rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="rounded-md border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                            아직 프로젝트가 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <PlatformModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        platform={editingPlatform}
        mode={modalMode}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="플랫폼 삭제"
        message={`정말로 "${deleteConfirm.platform?.name}" 플랫폼을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, platform: null })}
      />

      <ConfirmModal
        isOpen={projectDeleteConfirm.isOpen}
        title="프로젝트 삭제"
        message={`정말로 "${projectDeleteConfirm.project?.name}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleProjectDeleteConfirm}
        onCancel={() => setProjectDeleteConfirm(initialDeleteState)}
      />
    </div>
  );
}
