'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Project } from '@/lib/api';

type RouteParams = {
  id: string;
  projectId: string;
};

type ProjectEditForm = {
  description: string;
  githubUser: string;
  status: Project['status'];
};

const statusOptions: Project['status'][] = ['development', 'production', 'active', 'inactive'];

export default function EditProjectPage() {
  const params = useParams<RouteParams>();
  const router = useRouter();
  const platformId = params.id;
  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [gitUsers, setGitUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProjectEditForm>({
    description: '',
    githubUser: '',
    status: 'development',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const [projectData, gitUsersData] = await Promise.all([
          apiClient.getProject(projectId),
          apiClient.getGitUsers(),
        ]);
        setProject(projectData);
        setGitUsers(gitUsersData);
        setFormData({
          description: projectData.description || '',
          githubUser: projectData.githubUser,
          status: projectData.status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await apiClient.updateProject(projectId, {
        description: formData.description,
        githubUser: formData.githubUser,
        status: formData.status,
      });
      router.push(`/platforms/${platformId}/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Project not found'}</p>
          <Link href={`/platforms/${platformId}/projects/${projectId}`} className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            ← Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/platforms/${platformId}/projects/${projectId}`} className="text-blue-600 hover:text-blue-500">
          ← Back to Project
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="mt-1 text-sm text-gray-600">
            {project.name} · Platform {project.platformId}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={project.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={4}
              placeholder="Project description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="githubUser">
              GitHub User *
            </label>
            <select
              id="githubUser"
              required
              value={formData.githubUser}
              onChange={(event) => setFormData({ ...formData, githubUser: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {gitUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value as Project['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
