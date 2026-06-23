'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';
import { createCategory, createProduct, updateProduct, deleteProduct, updateCategory, deleteCategory, toggleProductAvailability } from '@/app/actions/products';

interface DBProduct {
  id: number;
  name: string;
  categoryId: number;
  price: string;
  imageUrl?: string | null;
  smallPrice?: string | null;
  mediumPrice?: string | null;
  largePrice?: string | null;
  isAvailable?: boolean;
}

interface DBCategory {
  id: number;
  name: string;
}

interface Props {
  initialCategories: DBCategory[];
  initialProducts: DBProduct[];
  session: any;
}

export default function MenuClient({ initialCategories, initialProducts, session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = session?.role === 'admin' || session?.role === 'manager' || session?.role === 'director';

  // State
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Product Form State
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    categoryId: initialCategories[0]?.id.toString() || '',
    price: '',
    hasSizes: false,
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
    imageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  
  // Editing Product State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    hasSizes: false,
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
    imageUrl: '',
  });
  const [editImagePreview, setEditImagePreview] = useState('');

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // --- Category Actions ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const fd = new FormData();
    fd.append('name', newCategoryName.trim());
    startTransition(async () => {
      const result = await createCategory(fd);
      if (result?.error) showMessage(result.error, 'error');
      else {
        setNewCategoryName('');
        showMessage('Category added!');
        router.refresh();
      }
    });
  };

  const handleSaveCategory = async (id: number) => {
    if (!editingCategoryName.trim()) return;
    const fd = new FormData();
    fd.append('name', editingCategoryName.trim());
    startTransition(async () => {
      const result = await updateCategory(id, fd);
      if (result?.error) showMessage(result.error, 'error');
      else {
        setEditingCategoryId(null);
        showMessage('Category updated!');
        router.refresh();
      }
    });
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? All items inside must be deleted first.')) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result?.error) showMessage(result.error, 'error');
      else {
        showMessage('Category deleted!');
        router.refresh();
      }
    });
  };

  // --- Product Actions ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditImagePreview(reader.result as string);
          setEditItemForm({ ...editItemForm, imageUrl: reader.result as string });
        } else {
          setImagePreview(reader.result as string);
          setNewItemForm({ ...newItemForm, imageUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async () => {
    if (!newItemForm.name || !newItemForm.categoryId) return alert('Please fill required fields.');
    const fd = new FormData();
    fd.append('name', newItemForm.name.trim());
    fd.append('categoryId', newItemForm.categoryId);
    fd.append('imageUrl', newItemForm.imageUrl || '/spicy-shrimp-rice.png');
    
    if (newItemForm.hasSizes) {
      fd.append('pricingType', 'sizes');
      if (newItemForm.smallPrice) fd.append('smallPrice', newItemForm.smallPrice);
      if (newItemForm.mediumPrice) fd.append('mediumPrice', newItemForm.mediumPrice);
      if (newItemForm.largePrice) fd.append('largePrice', newItemForm.largePrice);
    } else {
      fd.append('pricingType', 'single');
      fd.append('price', newItemForm.price);
    }

    startTransition(async () => {
      const result = await createProduct(fd);
      if (result?.error) showMessage(result.error, 'error');
      else {
        setNewItemForm({
          name: '',
          categoryId: initialCategories[0]?.id.toString() || '',
          price: '',
          hasSizes: false,
          smallPrice: '',
          mediumPrice: '',
          largePrice: '',
          imageUrl: '',
        });
        setImagePreview('');
        showMessage('Item added!');
        router.refresh();
      }
    });
  };

  const handleEditProductClick = (item: DBProduct) => {
    setEditingProductId(item.id);
    setEditItemForm({
      name: item.name,
      categoryId: item.categoryId.toString(),
      price: item.price || '',
      hasSizes: !!(item.smallPrice || item.mediumPrice || item.largePrice),
      smallPrice: item.smallPrice || '',
      mediumPrice: item.mediumPrice || '',
      largePrice: item.largePrice || '',
      imageUrl: item.imageUrl || '',
    });
    setEditImagePreview(item.imageUrl || '');
  };

  const handleSaveEditProduct = async (id: number) => {
    if (!editItemForm.name || !editItemForm.categoryId) return alert('Please fill required fields.');
    const fd = new FormData();
    fd.append('name', editItemForm.name.trim());
    fd.append('categoryId', editItemForm.categoryId);
    fd.append('imageUrl', editItemForm.imageUrl || '/spicy-shrimp-rice.png');
    
    if (editItemForm.hasSizes) {
      fd.append('pricingType', 'sizes');
      if (editItemForm.smallPrice) fd.append('smallPrice', editItemForm.smallPrice);
      if (editItemForm.mediumPrice) fd.append('mediumPrice', editItemForm.mediumPrice);
      if (editItemForm.largePrice) fd.append('largePrice', editItemForm.largePrice);
    } else {
      fd.append('pricingType', 'single');
      fd.append('price', editItemForm.price);
    }

    startTransition(async () => {
      const result = await updateProduct(id, fd);
      if (result?.error) showMessage(result.error, 'error');
      else {
        setEditingProductId(null);
        showMessage('Item updated!');
        router.refresh();
      }
    });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to completely delete this item?')) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) showMessage(result.error, 'error');
      else {
        showMessage('Item deleted!');
        router.refresh();
      }
    });
  };

  const handleToggleAvailability = async (id: number, isAvailable: boolean) => {
    startTransition(async () => {
      const result = await toggleProductAvailability(id, isAvailable);
      if (result?.error) showMessage(result.error, 'error');
      else {
        showMessage(isAvailable ? 'Menu item enabled!' : 'Menu item disabled!');
        router.refresh();
      }
    });
  };

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white';
  const card = 'bg-white rounded-xl border border-gray-200 shadow-sm p-6';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage categories, items, pricing, and availability</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg font-semibold shadow-sm flex items-center justify-between ${
          message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={16}/></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all ${
            activeTab === 'products' ? 'bg-teal-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all ${
            activeTab === 'categories' ? 'bg-teal-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${card} h-fit`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-teal-600" /> Add Category
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Beverages"
                  className={inp}
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddCategory}
                disabled={isPending || !newCategoryName.trim() || !isAdmin}
                className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Add Category'}
              </button>
              {!isAdmin && <p className="text-xs text-red-500 text-center">Requires Manager access.</p>}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" /> Existing Categories
              </h2>
            </div>
            <div className="divide-y divide-gray-100 p-5">
              {initialCategories.map(cat => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  {editingCategoryId === cat.id ? (
                    <div className="flex flex-1 items-center gap-2 mr-4">
                      <input
                        type="text"
                        className={inp}
                        value={editingCategoryName}
                        onChange={e => setEditingCategoryName(e.target.value)}
                      />
                      <button onClick={() => handleSaveCategory(cat.id)} className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200">
                        <Save size={16} />
                      </button>
                      <button onClick={() => setEditingCategoryId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-500">{initialProducts.filter(p => p.categoryId === cat.id).length} items</p>
                    </div>
                  )}
                  
                  {editingCategoryId !== cat.id && isAdmin && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded bg-gray-50 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-gray-500 hover:text-red-600 p-1.5 rounded bg-gray-50 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Form: Add Item */}
          <div className={`${card} h-fit xl:col-span-1`}>
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Plus size={18} className="text-teal-600" /> Add New Item
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Cheeseburger"
                  className={inp}
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({...newItemForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Category *</label>
                <select
                  className={inp}
                  value={newItemForm.categoryId}
                  onChange={e => setNewItemForm({...newItemForm, categoryId: e.target.value})}
                >
                  {initialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    checked={newItemForm.hasSizes}
                    onChange={e => setNewItemForm({...newItemForm, hasSizes: e.target.checked})}
                  />
                  <span className="text-sm font-bold text-gray-700">Has multiple sizes?</span>
                </label>

                {newItemForm.hasSizes ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">SMALL (Rs)</label>
                      <input type="number" placeholder="0" className={inp} value={newItemForm.smallPrice} onChange={e => setNewItemForm({...newItemForm, smallPrice: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">MEDIUM (Rs)</label>
                      <input type="number" placeholder="0" className={inp} value={newItemForm.mediumPrice} onChange={e => setNewItemForm({...newItemForm, mediumPrice: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">LARGE (Rs)</label>
                      <input type="number" placeholder="0" className={inp} value={newItemForm.largePrice} onChange={e => setNewItemForm({...newItemForm, largePrice: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Price (Rs) *</label>
                    <input type="number" placeholder="0" className={inp} value={newItemForm.price} onChange={e => setNewItemForm({...newItemForm, price: e.target.value})} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Item Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all cursor-pointer border border-gray-200 rounded-lg" />
                {imagePreview && (
                  <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                onClick={handleAddItem}
                disabled={isPending || !isAdmin}
                className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save New Item'}
              </button>
            </div>
          </div>

          {/* Right Grid: Items */}
          <div className="xl:col-span-2 space-y-4">
            <input
              type="text"
              placeholder="Search items..."
              className={inp}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col group">
                  {editingProductId === item.id ? (
                    <div className="p-3 space-y-3">
                      <input type="text" className="w-full text-sm border p-1" value={editItemForm.name} onChange={e => setEditItemForm({...editItemForm, name: e.target.value})} />
                      <select className="w-full text-sm border p-1" value={editItemForm.categoryId} onChange={e => setEditItemForm({...editItemForm, categoryId: e.target.value})}>
                        {initialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={editItemForm.hasSizes} onChange={e => setEditItemForm({...editItemForm, hasSizes: e.target.checked})} />
                        <span className="text-xs">Sizes?</span>
                      </label>

                      {editItemForm.hasSizes ? (
                        <div className="space-y-1">
                          <input type="number" placeholder="S Price" className="w-full text-xs border p-1" value={editItemForm.smallPrice} onChange={e => setEditItemForm({...editItemForm, smallPrice: e.target.value})} />
                          <input type="number" placeholder="M Price" className="w-full text-xs border p-1" value={editItemForm.mediumPrice} onChange={e => setEditItemForm({...editItemForm, mediumPrice: e.target.value})} />
                          <input type="number" placeholder="L Price" className="w-full text-xs border p-1" value={editItemForm.largePrice} onChange={e => setEditItemForm({...editItemForm, largePrice: e.target.value})} />
                        </div>
                      ) : (
                        <input type="number" placeholder="Price" className="w-full text-sm border p-1" value={editItemForm.price} onChange={e => setEditItemForm({...editItemForm, price: e.target.value})} />
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleSaveEditProduct(item.id)} className="flex-1 bg-teal-600 text-white text-xs py-1.5 rounded"><Save size={12} className="inline mx-auto" /></button>
                        <button onClick={() => setEditingProductId(null)} className="flex-1 bg-gray-200 text-gray-700 text-xs py-1.5 rounded"><X size={12} className="inline mx-auto" /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-28 bg-gray-100 relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-blue-400" />
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <p className={`font-bold text-sm leading-tight ${item.isAvailable !== false ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name}</p>
                            {item.isAvailable === false && (
                              <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Disabled</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{initialCategories.find(c => c.id === item.categoryId)?.name}</p>
                          
                          <div className="mt-2 text-xs font-bold text-gray-900">
                            {item.smallPrice || item.mediumPrice || item.largePrice ? (
                              <div className="flex flex-col gap-0.5">
                                {item.smallPrice && <span>S: Rs.{item.smallPrice}</span>}
                                {item.mediumPrice && <span>M: Rs.{item.mediumPrice}</span>}
                                {item.largePrice && <span>L: Rs.{item.largePrice}</span>}
                              </div>
                            ) : (
                              <span>Rs. {item.price}</span>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleEditProductClick(item)} className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 rounded flex justify-center gap-1"><Edit2 size={10} /> Edit</button>
                              <button onClick={() => handleDeleteProduct(item.id)} className="flex-1 text-[10px] bg-gray-100 hover:bg-red-100 text-red-600 font-bold py-1.5 rounded flex justify-center gap-1"><Trash2 size={10} /> Del</button>
                            </div>
                            <button
                              onClick={() => handleToggleAvailability(item.id, item.isAvailable === false)}
                              className={`w-full text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 ${
                                item.isAvailable !== false
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                                  : 'bg-teal-50 hover:bg-teal-100 text-teal-600'
                              }`}
                            >
                              {item.isAvailable !== false ? 'Disable Item' : 'Enable Item'}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
