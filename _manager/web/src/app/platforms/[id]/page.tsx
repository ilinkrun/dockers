'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Platform, Project } from '@/lib/api';

export default function PlatformDetailPage() {
  const params = useParams();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = params.id as string;
        const [platformData, projectsData] = await Promise.all([
          apiClient.getPlatform(id),
          apiClient.getProjectsByPlatform(id)
        ]);
        setPlatform(platformData);
        setProjects(projectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load platform');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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

  if (error || !platform) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Platform not found'}</p>
          <Link href="/platforms" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            ← Back to Platforms
          </Link>
        </div>
      </div>
    );
  }

  const mysqlHost = platform.settings?.database?.mysql?.host;
  const mysqlPort = platform.settings?.database?.mysql?.port;
  const postgresqlHost = platform.settings?.database?.postgresql?.host;
  const postgresqlPort = platform.settings?.database?.postgresql?.port;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/platforms" className="text-blue-600 hover:text-blue-500">
          ← Back to Platforms
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{platform.name}</h1>
              {platform.description && (
                <p className="mt-1 text-sm text-gray-500">{platform.description}</p>
              )}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              platform.status === 'active'
                ? 'bg-green-100 text-green-800'
                : platform.status === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {platform.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Platform ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{platform.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">GitHub User</dt>
              <dd className="mt-1 text-sm text-gray-900">{platform.githubUser}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Base Port</dt>
              <dd className="mt-1 text-sm text-gray-900">{platform.settings?.basePort ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Project Count</dt>
              <dd className="mt-1 text-sm text-gray-900">{platform.projectCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Network Subnet</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{platform.settings?.network?.subnet ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Network Gateway</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{platform.settings?.network?.gateway ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">MySQL</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {mysqlHost && mysqlPort
                  ? `${mysqlHost}:${mysqlPort}`
                  : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">PostgreSQL</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {postgresqlHost && postgresqlPort
                  ? `${postgresqlHost}:${postgresqlPort}`
                  : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(platform.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(platform.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Projects ({projects.length})</h2>
        </div>
        {projects.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {projects
              .filter(Boolean)
              .map((project, index) => {
                if (!project?.id) {
                  return null;
                }

                return (
                  <li key={project.id}>
                    <Link href={`/platforms/${platform.id}/projects/${project.id}`} className="block px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {project?.name ?? 'Untitled Project'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project?.status === 'production'
                                ? 'bg-green-100 text-green-800'
                                : project?.status === 'development'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {project?.status ?? 'Unknown'}
                            </span>
                          </div>
                          {project?.description && (
                            <p className="mt-1 text-sm text-gray-500">{project?.description}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Backend: {project?.ports?.backend ?? 'N/A'}</span>
                            <span>GraphQL: {project?.ports?.graphql ?? 'N/A'}</span>
                            <span>DB: {project?.database?.type ?? 'N/A'}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="text-blue-600 hover:text-blue-500">View →</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No projects in this platform yet</p>
            <Link href={`/platforms/${platform.id}/projects/new`} className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
              Create a project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
