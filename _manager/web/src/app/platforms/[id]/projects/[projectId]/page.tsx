'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Project, Platform } from '@/lib/api';

type RouteParams = {
  id: string;
  projectId: string;
};

export default function PlatformProjectDetailPage() {
  const params = useParams<RouteParams>();
  const platformId = params.id;
  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, platformData] = await Promise.all([
          apiClient.getProject(projectId),
          apiClient.getPlatform(platformId),
        ]);
        setProject(projectData);
        setPlatform(platformData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (platformId && projectId) {
      void fetchData();
    }
  }, [platformId, projectId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Project not found'}</p>
          <Link href={`/platforms?platformId=${platformId}`} className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            ← Back to Platform
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/platforms?platformId=${platformId}`} className="text-blue-600 hover:text-blue-500">
          ← Back to Platform
        </Link>
        <Link
          href={`/platforms/${platformId}/projects/${projectId}/edit`}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Edit Project
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && <p className="mt-1 text-sm text-gray-500">{project.description}</p>}
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>

        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Project ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{project.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Platform</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {platform ? (
                  <Link href={`/platforms/${platform.id}`} className="text-blue-600 hover:text-blue-500">
                    {platform.name}
                  </Link>
                ) : (
                  platformId
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">GitHub User</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.githubUser}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.environment?.nodeEnv ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Ports</h2>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Backend</dt>
              <dd className="mt-1 text-lg font-mono text-gray-900">{project.ports?.backend ?? 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">GraphQL</dt>
              <dd className="mt-1 text-lg font-mono text-gray-900">{project.ports?.graphql ?? 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Frontend (Next.js)</dt>
              <dd className="mt-1 text-lg font-mono text-gray-900">{project.ports?.frontendNextjs ?? 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Frontend (SvelteKit)</dt>
              <dd className="mt-1 text-lg font-mono text-gray-900">{project.ports?.frontendSveltekit ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Database</h2>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono uppercase">{project.database?.type ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Database Name</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{project.database?.name ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{project.database?.user ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Environment</h2>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Node Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.environment?.nodeEnv ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CORS Origin</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{project.environment?.corsOrigin ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Metadata</h2>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(project.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(project.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
