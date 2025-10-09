export default function RepositoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Repositories</h1>
        <p className="mt-2 text-gray-600">Centralize Docker manager source control integrations.</p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
        Choose either the GitHub or local repository views from the navigation menu to manage code remotes.
      </div>
    </div>
  );
}
