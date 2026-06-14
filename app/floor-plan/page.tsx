import Sidebar from '@/components/sidebar'

export default function FloorPlanPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Table &amp; Floor Plan</h1>
        <p className="text-sm text-gray-600">Configure tables and floor layout.</p>
      </div>
    </div>
  )
}
