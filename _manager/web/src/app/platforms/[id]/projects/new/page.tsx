'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Platform, CreateProjectRequest } from '@/lib/api';

type RouteParams = {
  id: string;
};

export default function NewProjectPage() {
  const params = useParams<RouteParams>();
  const router = useRouter();
  const platformId = params.id;

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [gitUsers, setGitUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    platformId,
    description: '',
    githubUser: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [platformData, gitUsersData] = await Promise.all([
          apiClient.getPlatform(platformId),
          apiClient.getGitUsers(),
        ]);

        setPlatform(platformData);
        setGitUsers(gitUsersData);
        setFormData((prev) => ({
          ...prev,
          platformId,
          githubUser: platformData.githubUser || gitUsersData[0] || prev.githubUser,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [platformId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await apiClient.createProjectScript({
        platformId: formData.platformId,
        platformName: platform?.name || formData.platformId,
        name: formData.name,
        githubUser: formData.githubUser,
        description: formData.description,
      });

      const project = await apiClient.createProject(formData);
      router.push(`/platforms/${platformId}/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Link href={`/platforms?platformId=${platformId}`} className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            ← Back to Platform
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/platforms?platformId=${platformId}`} className="text-blue-600 hover:text-blue-500">
          ← Back to Platform
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          {platform && (
            <p className="mt-2 text-sm text-gray-600">
              Platform: <span className="font-medium text-gray-900">{platform.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
              placeholder="my-project"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              {gitUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-70"
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
