export default function DatabaseServerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Database Server</h1>
        <p className="mt-2 text-gray-600">Review shared MySQL and PostgreSQL services provisioned for platforms.</p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
        Database service controls will live here. Use the Settings → Databases tab for configuration while we wire this view.
      </div>
    </div>
  );
}
