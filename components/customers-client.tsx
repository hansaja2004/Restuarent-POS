'use client';

import { useState } from 'react';
import { Users, Search, History, ChevronRight, X, Pencil, Trash2, Download } from 'lucide-react';
import { getCustomerOrderHistory, updateCustomer, deleteCustomer } from '@/app/actions/customers';
import * as XLSX from 'xlsx';

type Customer = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  createdAt: string | Date | null;
};

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.phone.includes(search) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoadingHistory(true);
    setOrderHistory([]);
    const res = await getCustomerOrderHistory(customer.id);
    setIsLoadingHistory(false);
    if (res.data) {
      setOrderHistory(res.data);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer? Their past orders will be un-linked.')) {
      const res = await deleteCustomer(id);
      if (res.error) alert(res.error);
      else {
        setCustomers(customers.filter((c) => c.id !== id));
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setIsEditing(customer);
    setEditForm({ name: customer.name || '', phone: customer.phone, email: customer.email || '' });
  };

  const handleSaveEdit = async () => {
    if (!isEditing) return;
    if (!editForm.phone) return alert('Phone number is required');
    setIsSaving(true);
    const res = await updateCustomer(isEditing.id, editForm);
    setIsSaving(false);
    if (res.error) {
      alert(res.error);
    } else if (res.data) {
      setCustomers(customers.map((c) => (c.id === isEditing.id ? { ...c, ...editForm } as Customer : c)));
      setIsEditing(null);
      if (selectedCustomer?.id === isEditing.id) {
        setSelectedCustomer({ ...selectedCustomer, ...editForm } as Customer);
      }
    }
  };

  const handleExportExcel = () => {
    const data = customers.map(c => ({
      'ID': c.id,
      'Name': c.name || 'N/A',
      'Phone': c.phone,
      'Email': c.email || 'N/A',
      'Joined Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Unknown',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users size={32} className="text-teal-600" />
            Customers
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Manage loyalty and view order history</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all shadow"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <Users size={48} className="opacity-20 mb-2" />
                <p>No customers found.</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleViewHistory(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedCustomer?.id === c.id
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 hover:border-teal-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{c.name || 'No Name'}</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => handleEditClick(e, c)} className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => handleDelete(e, c.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={16} className={selectedCustomer?.id === c.id ? 'text-teal-600' : 'text-gray-400'} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium font-mono">{c.phone}</p>
                    {c.email && <p className="text-xs text-gray-500 mt-1 truncate">{c.email}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        {selectedCustomer && (
          <div className="w-96 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-blue-500" /> Order History
              </h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100 shrink-0">
              <p className="font-bold text-gray-900">{selectedCustomer.name || 'Unnamed'}</p>
              <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-10">No order history found.</p>
              ) : (
                orderHistory.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-900">{order.orderNumber || `Order #${order.id}`}</span>
                      <span className="text-xs font-semibold text-emerald-600">Rs. {Number(order.totalAmount).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown Date'} • {order.orderType}
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">{order.itemsDetail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold disabled:opacity-50"
                >Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
