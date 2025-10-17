export default function NetworksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Networks</h1>
        <p className="mt-2 text-gray-600">Overview of shared Docker networks and reverse proxy tooling.</p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
        Select a network from the menu to view configuration details and maintenance actions.
      </div>
    </div>
  );
}
