'use client';

import { useState, useEffect } from 'react';
import { Platform, CreatePlatformRequest, apiClient, DatabaseConfig } from '@/lib/api';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePlatformRequest | Partial<Platform>) => Promise<void>;
  platform?: Platform;
  mode: 'create' | 'edit';
}

export default function PlatformModal({ isOpen, onClose, onSave, platform, mode }: PlatformModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubUser: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    dbType: 'postgresql' as 'mysql' | 'postgresql',
    mysqlId: '',
    postgresqlId: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gitUsers, setGitUsers] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mysqlDatabases, setMysqlDatabases] = useState<DatabaseConfig[]>([]);
  const [postgresqlDatabases, setPostgresqlDatabases] = useState<DatabaseConfig[]>([]);
  const [selectedMysqlDb, setSelectedMysqlDb] = useState<DatabaseConfig | null>(null);
  const [selectedPostgresqlDb, setSelectedPostgresqlDb] = useState<DatabaseConfig | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, databases] = await Promise.all([
          apiClient.getGitUsers(),
          apiClient.getDatabases()
        ]);

        setGitUsers(users);
        setMysqlDatabases(databases.mysqls);
        setPostgresqlDatabases(databases.postgresqls);

        if (platform && mode === 'edit') {
          const databaseSettings = platform.settings?.database;
          setFormData({
            name: platform.name,
            description: platform.description || '',
            githubUser: platform.githubUser,
            status: platform.status,
            dbType: databaseSettings?.defaultType ?? 'postgresql',
            mysqlId: databaseSettings?.mysqlId || '',
            postgresqlId: databaseSettings?.postgresqlId || ''
          });
          if (databaseSettings?.mysqlId) {
            setSelectedMysqlDb(databases.mysqls.find(db => db.id === databaseSettings.mysqlId) ?? null);
          }
          if (databaseSettings?.postgresqlId) {
            setSelectedPostgresqlDb(databases.postgresqls.find(db => db.id === databaseSettings.postgresqlId) ?? null);
          }
        } else {
          const defaultPostgresqlId = databases.postgresqls[0]?.id || '';
          const defaultMysqlId = databases.mysqls[0]?.id || '';

          setFormData({
            name: '',
            description: '',
            githubUser: users[0] || '',
            status: 'active',
            dbType: 'postgresql',
            mysqlId: defaultMysqlId,
            postgresqlId: defaultPostgresqlId
          });

          if (defaultPostgresqlId) {
            setSelectedPostgresqlDb(databases.postgresqls[0]);
          }
          if (defaultMysqlId) {
            setSelectedMysqlDb(databases.mysqls[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [platform, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save platform');
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
            {mode === 'create' ? 'Create New Platform' : 'Edit Platform'}
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
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="my-platform"
                disabled={mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Platform name cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                rows={3}
                placeholder="Platform description..."
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {gitUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Database Type *
                  </label>
                  <select
                    required
                    value={formData.dbType}
                    onChange={(e) => {
                      const newType = e.target.value as 'mysql' | 'postgresql';
                      setFormData({ ...formData, dbType: newType });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>

                {formData.dbType === 'mysql' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MySQL Database *
                    </label>
                    {mysqlDatabases.length > 0 ? (
                      <>
                        <select
                          required
                          value={formData.mysqlId}
                          onChange={(e) => {
                            const dbId = e.target.value;
                            const db = mysqlDatabases.find(d => d.id === dbId);
                            setFormData({ ...formData, mysqlId: dbId });
                            setSelectedMysqlDb(db || null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          {mysqlDatabases.map((db) => (
                            <option key={db.id} value={db.id}>
                              {db.name}
                            </option>
                          ))}
                        </select>
                        {selectedMysqlDb && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-600">Host:</span>
                                <span className="ml-2 text-gray-900">{selectedMysqlDb.host}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Port:</span>
                                <span className="ml-2 text-gray-900">{selectedMysqlDb.port}</span>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className="font-medium text-gray-600">Description:</span>
                              <span className="ml-2 text-gray-700">{selectedMysqlDb.description}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-red-600">No MySQL databases configured</div>
                    )}
                  </div>
                )}

                {formData.dbType === 'postgresql' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PostgreSQL Database *
                    </label>
                    {postgresqlDatabases.length > 0 ? (
                      <>
                        <select
                          required
                          value={formData.postgresqlId}
                          onChange={(e) => {
                            const dbId = e.target.value;
                            const db = postgresqlDatabases.find(d => d.id === dbId);
                            setFormData({ ...formData, postgresqlId: dbId });
                            setSelectedPostgresqlDb(db || null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          {postgresqlDatabases.map((db) => (
                            <option key={db.id} value={db.id}>
                              {db.name}
                            </option>
                          ))}
                        </select>
                        {selectedPostgresqlDb && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-600">Host:</span>
                                <span className="ml-2 text-gray-900">{selectedPostgresqlDb.host}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Port:</span>
                                <span className="ml-2 text-gray-900">{selectedPostgresqlDb.port}</span>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className="font-medium text-gray-600">Description:</span>
                              <span className="ml-2 text-gray-700">{selectedPostgresqlDb.description}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-red-600">No PostgreSQL databases configured</div>
                    )}
                  </div>
                )}
              </>
            )}

            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}

            {mode === 'edit' && platform && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAdvanced ? '▼' : '▶'} Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Port</label>
                        <input
                          type="number"
                          value={platform?.settings?.basePort ?? ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Port Increment</label>
                        <input
                          type="number"
                          value={platform?.settings?.portIncrement ?? ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Network</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Subnet</label>
                          <input
                            type="text"
                            value={platform?.settings?.network?.subnet ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Gateway</label>
                          <input
                            type="text"
                            value={platform?.settings?.network?.gateway ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Database</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Default Type</label>
                          <input
                            type="text"
                            value={platform?.settings?.database?.defaultType ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">MySQL Host</label>
                            <input
                              type="text"
                              value={platform?.settings?.database?.mysql?.host ?? ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">PostgreSQL Host</label>
                            <input
                              type="text"
                              value={platform?.settings?.database?.postgresql?.host ?? ''}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                            />
                          </div>
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
                            value={platform?.settings?.volumes?.dataPath ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Logs Path</label>
                          <input
                            type="text"
                            value={platform?.settings?.volumes?.logsPath ?? ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Backups Path</label>
                          <input
                            type="text"
                            value={platform?.settings?.volumes?.backupsPath ?? ''}
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
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
