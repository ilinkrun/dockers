'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, DatabaseConfig, GitUserDetailed, ServerTemplate } from '@/lib/api';
import DatabaseModal, { DatabaseFormData } from '@/components/DatabaseModal';
import GitUserModal, { GitUserFormData } from '@/components/GitUserModal';
import ServerTemplateModal from '@/components/ServerTemplateModal';

const tabParamMap: Record<string, 'envs' | 'databases' | 'gitusers' | 'servers'> = {
  envs: 'envs',
  databases: 'databases',
  githubs: 'gitusers',
  templates: 'servers',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'envs' | 'databases' | 'gitusers' | 'servers'>('databases');

  // Database state
  const [mysqlDatabases, setMysqlDatabases] = useState<DatabaseConfig[]>([]);
  const [postgresqlDatabases, setPostgresqlDatabases] = useState<DatabaseConfig[]>([]);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbModalMode, setDbModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDatabase, setSelectedDatabase] = useState<(DatabaseConfig & { type: 'mysql' | 'postgresql' }) | undefined>();

  // Git Users state
  const [gitUsers, setGitUsers] = useState<GitUserDetailed[]>([]);
  const [isGitUserModalOpen, setIsGitUserModalOpen] = useState(false);
  const [gitUserModalMode, setGitUserModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGitUser, setSelectedGitUser] = useState<GitUserDetailed | undefined>();

  // Server Templates state
  const [backendTemplates, setBackendTemplates] = useState<ServerTemplate[]>([]);
  const [graphqlTemplates, setGraphqlTemplates] = useState<ServerTemplate[]>([]);
  const [frontendTemplates, setFrontendTemplates] = useState<ServerTemplate[]>([]);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverModalMode, setServerModalMode] = useState<'create' | 'edit'>('create');
  const [selectedServerTemplate, setSelectedServerTemplate] = useState<ServerTemplate | undefined>();

  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) {
      return;
    }

    const mapped = tabParamMap[tabParam];
    if (mapped && mapped !== activeTab) {
      setActiveTab(mapped);
    }
  }, [searchParams, activeTab]);

  // Load databases
  useEffect(() => {
    if (activeTab === 'databases') {
      loadDatabases();
    } else if (activeTab === 'gitusers') {
      loadGitUsers();
    } else if (activeTab === 'envs') {
      setIsLoading(false);
    } else if (activeTab === 'servers') {
      loadServerTemplates();
    }
  }, [activeTab]);

  const loadDatabases = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getDatabases();
      setMysqlDatabases(data.mysqls);
      setPostgresqlDatabases(data.postgresqls);
    } catch (error) {
      console.error('Failed to load databases:', error);
      alert('Failed to load databases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDatabase = () => {
    setDbModalMode('create');
    setSelectedDatabase(undefined);
    setIsDbModalOpen(true);
  };

  const handleEditDatabase = (db: DatabaseConfig, type: 'mysql' | 'postgresql') => {
    setDbModalMode('edit');
    setSelectedDatabase({ ...db, type });
    setIsDbModalOpen(true);
  };

  const handleDeleteDatabase = async (id: string, type: 'mysql' | 'postgresql') => {
    if (!confirm(`Are you sure you want to delete this database configuration?`)) {
      return;
    }

    try {
      await apiClient.deleteDatabase(type, id);
      alert('Database configuration deleted successfully');
      loadDatabases();
    } catch (error) {
      console.error('Failed to delete database:', error);
      alert('Failed to delete database configuration');
    }
  };

  const handleDbModalSubmit = async (data: DatabaseFormData) => {
    try {
      if (dbModalMode === 'create') {
        await apiClient.createDatabase(data);
        alert('Database configuration created successfully');
      } else {
        await apiClient.updateDatabase(data.type, data.id, data);
        alert('Database configuration updated successfully');
      }
      setIsDbModalOpen(false);
      loadDatabases();
    } catch (error) {
      console.error('Failed to save database:', error);
      alert(error instanceof Error ? error.message : 'Failed to save database configuration');
    }
  };

  // Git Users handlers
  const loadGitUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getGitUsersDetailed();
      setGitUsers(data);
    } catch (error) {
      console.error('Failed to load git users:', error);
      alert('Failed to load GitHub users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGitUser = () => {
    setGitUserModalMode('create');
    setSelectedGitUser(undefined);
    setIsGitUserModalOpen(true);
  };

  const handleEditGitUser = (user: GitUserDetailed) => {
    setGitUserModalMode('edit');
    setSelectedGitUser(user);
    setIsGitUserModalOpen(true);
  };

  const handleDeleteGitUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete GitHub user "${username}"?`)) {
      return;
    }

    try {
      await apiClient.deleteGitUser(username);
      alert('GitHub user deleted successfully');
      loadGitUsers();
    } catch (error) {
      console.error('Failed to delete git user:', error);
      alert('Failed to delete GitHub user');
    }
  };

  const handleGitUserModalSubmit = async (data: GitUserFormData) => {
    try {
      if (gitUserModalMode === 'create') {
        await apiClient.createGitUser(data);
        alert('GitHub user created successfully');
      } else {
        await apiClient.updateGitUser(data.username, data);
        alert('GitHub user updated successfully');
      }
      setIsGitUserModalOpen(false);
      loadGitUsers();
    } catch (error) {
      console.error('Failed to save git user:', error);
      alert(error instanceof Error ? error.message : 'Failed to save GitHub user');
    }
  };

  // Server Templates handlers
  const loadServerTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getServerTemplates();
      setBackendTemplates(data.backend);
      setGraphqlTemplates(data.graphql);
      setFrontendTemplates(data.frontend);
    } catch (error) {
      console.error('Failed to load server templates:', error);
      alert('Failed to load server templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateServerTemplate = () => {
    setServerModalMode('create');
    setSelectedServerTemplate(undefined);
    setIsServerModalOpen(true);
  };

  const handleEditServerTemplate = (template: ServerTemplate) => {
    setServerModalMode('edit');
    setSelectedServerTemplate(template);
    setIsServerModalOpen(true);
  };

  const handleDeleteServerTemplate = async (template: ServerTemplate) => {
    if (!confirm(`Are you sure you want to delete the "${template.name}" template?`)) {
      return;
    }

    try {
      await apiClient.deleteServerTemplate(template.type, template.id);
      alert('Server template deleted successfully');
      loadServerTemplates();
    } catch (error) {
      console.error('Failed to delete server template:', error);
      alert('Failed to delete server template');
    }
  };

  const handleServerModalSubmit = async (data: ServerTemplate) => {
    try {
      if (serverModalMode === 'create') {
        await apiClient.createServerTemplate(data);
        alert('Server template created successfully');
      } else {
        await apiClient.updateServerTemplate(data.type, data.id, data);
        alert('Server template updated successfully');
      }
      setIsServerModalOpen(false);
      loadServerTemplates();
    } catch (error) {
      console.error('Failed to save server template:', error);
      alert(error instanceof Error ? error.message : 'Failed to save server template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage environment variables, databases, GitHub accounts, and server templates
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('envs')}
              className={`$
                activeTab === 'envs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Envs
            </button>
            <button
              onClick={() => setActiveTab('databases')}
              className={`$
                activeTab === 'databases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Databases
            </button>
            <button
              onClick={() => setActiveTab('gitusers')}
              className={`$
                activeTab === 'gitusers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Githubs
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`$
                activeTab === 'servers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Templates
            </button>
          </nav>

        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'envs' && (
            <div>
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Environment Management</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Environment variable management is coming soon. Continue managing synced .env files under
                  <span className="mx-1 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-700">_settings/</span>
                  as part of the provisioning workflow.
                </p>
              </div>
            </div>
          )}
          {activeTab === 'databases' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Database Configurations</h2>
                <button
                  onClick={handleCreateDatabase}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Add Database
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading databases...</div>
              ) : (
                <div className="space-y-8">
                  {/* MySQL Databases */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🐬</span> MySQL Databases
                    </h3>
                    {mysqlDatabases.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No MySQL databases configured</div>
                    ) : (
                      <div className="grid gap-4">
                        {mysqlDatabases.map((db) => (
                          <div key={db.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{db.name}</h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                    {db.id}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Host:</span>
                                    <span className="ml-2 text-gray-900">{db.host}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Port:</span>
                                    <span className="ml-2 text-gray-900">{db.port}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">User:</span>
                                    <span className="ml-2 text-gray-900">{db.user}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Password:</span>
                                    <span className="ml-2 text-gray-900">••••••••</span>
                                  </div>
                                </div>
                                {db.description && (
                                  <p className="mt-2 text-sm text-gray-600">{db.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditDatabase(db, 'mysql')}
                                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDatabase(db.id, 'mysql')}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PostgreSQL Databases */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🐘</span> PostgreSQL Databases
                    </h3>
                    {postgresqlDatabases.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No PostgreSQL databases configured</div>
                    ) : (
                      <div className="grid gap-4">
                        {postgresqlDatabases.map((db) => (
                          <div key={db.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{db.name}</h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                    {db.id}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Host:</span>
                                    <span className="ml-2 text-gray-900">{db.host}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Port:</span>
                                    <span className="ml-2 text-gray-900">{db.port}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">User:</span>
                                    <span className="ml-2 text-gray-900">{db.user}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Password:</span>
                                    <span className="ml-2 text-gray-900">••••••••</span>
                                  </div>
                                </div>
                                {db.description && (
                                  <p className="mt-2 text-sm text-gray-600">{db.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditDatabase(db, 'postgresql')}
                                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDatabase(db.id, 'postgresql')}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gitusers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Git Users</h2>
                <button
                  onClick={handleCreateGitUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Add Git User
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading GitHub users...</div>
              ) : gitUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">No GitHub users configured</div>
              ) : (
                <div className="grid gap-4">
                  {gitUsers.map((user) => (
                    <div key={user.username} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{user.fullName}</h4>
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded font-mono">
                              @{user.username}
                            </span>
                            {user.expired && (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                Expires: {user.expired}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Email:</span>
                              <span className="ml-2 text-gray-900">{user.email}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Token:</span>
                              <span className="ml-2 text-gray-900 font-mono text-xs">
                                {user.token.substring(0, 12)}...
                              </span>
                            </div>
                            {user.token2 && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-600">Token 2:</span>
                                <span className="ml-2 text-gray-900 font-mono text-xs">
                                  {user.token2.substring(0, 12)}...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditGitUser(user)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGitUser(user.username)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'servers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Server Templates</h2>
                <button
                  onClick={handleCreateServerTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Add Template
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading server templates...</div>
              ) : (
                <div className="space-y-8">
                  {/* Backend Templates */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚙️</span> Backend Templates
                    </h3>
                    {backendTemplates.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No backend templates configured</div>
                    ) : (
                      <div className="grid gap-4">
                        {backendTemplates.map((template) => (
                          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                    {template.id}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                    {template.language}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-600">Framework:</span>
                                  <span className="text-gray-900">{template.framework}</span>
                                </div>
                                {template.features.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {template.features.map((feature, idx) => (
                                      <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GraphQL Templates */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📊</span> GraphQL Templates
                    </h3>
                    {graphqlTemplates.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No GraphQL templates configured</div>
                    ) : (
                      <div className="grid gap-4">
                        {graphqlTemplates.map((template) => (
                          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded">
                                    {template.id}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                    {template.language}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-600">Framework:</span>
                                  <span className="text-gray-900">{template.framework}</span>
                                </div>
                                {template.features.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {template.features.map((feature, idx) => (
                                      <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Frontend Templates */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🎨</span> Frontend Templates
                    </h3>
                    {frontendTemplates.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No frontend templates configured</div>
                    ) : (
                      <div className="grid gap-4">
                        {frontendTemplates.map((template) => (
                          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                    {template.id}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                    {template.language}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-600">Framework:</span>
                                  <span className="text-gray-900">{template.framework}</span>
                                </div>
                                {template.features.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {template.features.map((feature, idx) => (
                                      <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteServerTemplate(template)}
                                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Database Modal */}
        <DatabaseModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          onSubmit={handleDbModalSubmit}
          mode={dbModalMode}
          database={selectedDatabase}
        />

        {/* Git User Modal */}
        <GitUserModal
          isOpen={isGitUserModalOpen}
          onClose={() => setIsGitUserModalOpen(false)}
          onSubmit={handleGitUserModalSubmit}
          mode={gitUserModalMode}
          gitUser={selectedGitUser}
        />

        {/* Server Template Modal */}
        <ServerTemplateModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
          onSubmit={handleServerModalSubmit}
          mode={serverModalMode}
          template={selectedServerTemplate}
        />
      </div>
    </div>
  );
}
