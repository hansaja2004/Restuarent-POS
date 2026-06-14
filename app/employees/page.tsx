import Sidebar from '@/components/sidebar'
import { getUsers, createUser, deleteUser } from '@/app/actions/employees'

export default async function EmployeesPage() {
  const users = await getUsers();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Employee Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Employee</h2>
            <form action={async (formData) => {
              'use server';
              await createUser(formData);
            }} className="space-y-4">
              <div>
                <label htmlFor="emp-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input id="emp-username" name="username" type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="emp-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="emp-password" name="password" type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="emp-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="emp-role" name="role" className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg">Add Employee</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Employees</h2>
            </div>
            <div className="p-6">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.id}</td>
                      <td className="px-6 py-4">{u.username}</td>
                      <td className="px-6 py-4">{u.role}</td>
                      <td className="px-6 py-4">
                        <form action={async () => {
                          'use server';
                          await deleteUser(u.id);
                        }}>
                          <button type="submit" className="text-red-600 hover:text-red-800">Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
