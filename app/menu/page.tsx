import Sidebar from '@/components/sidebar'
import { getCategories, getProducts, createProduct, createCategory, deleteProduct, deleteCategory } from '@/app/actions/products'

export default async function MenuPage() {
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant's menu, categories, and products</p>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                  <p className="text-xs text-gray-500 mt-1">Organize your menu</p>
                </div>

                {/* Add Category Form */}
                <div className="p-6 border-b border-gray-100">
                  <form action={async (formData) => {
                    'use server';
                    await createCategory(formData);
                  }} className="space-y-3">
                    <input id="category-name" name="name" type="text" placeholder="Category name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" />
                    <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                      Add Category
                    </button>
                  </form>
                </div>

                {/* Category List */}
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <form action={async () => {
                        'use server';
                        await deleteCategory(cat.id);
                      }}>
                        <button type="submit" className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs font-medium transition-opacity">
                          ✕
                        </button>
                      </form>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No categories yet</p>}
                </div>
              </div>
            </div>

            {/* Right Content: Products */}
            <div className="lg:col-span-3 space-y-6">
              {/* Add Product Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
                  <p className="text-xs text-gray-500 mt-1">Add items to your menu</p>
                </div>

                <form action={async (formData) => {
                  'use server';
                  await createProduct(formData);
                }} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <input id="product-name" name="name" type="text" placeholder="Product name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div>
                    <input id="product-price" name="price" type="number" step="0.01" placeholder="Price" required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div>
                    <select id="product-category" name="categoryId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input id="product-image" name="imageUrl" type="text" placeholder="Image URL" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <button type="submit" className="bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Add Product
                  </button>
                </form>
              </div>

              {/* Products List Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Products ({products.length})</h2>
                    <p className="text-xs text-gray-500 mt-1">All menu items</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {products.length > 0 ? (
                    products.map(p => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      return (
                        <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors group flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <img src={p.imageUrl || '/spicy-shrimp-rice.png'} alt={p.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{p.name}</div>
                              <div className="text-xs text-gray-500">/ serving</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">LKR {Number(p.price).toFixed(2)}</div>
                            <div>
                              <span className="inline-block px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full whitespace-nowrap">{cat?.name ?? 'Unknown'}</span>
                            </div>
                            <form action={async () => {
                              'use server';
                              await deleteProduct(p.id);
                            }}>
                              <button type="submit" className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-sm font-medium transition-opacity whitespace-nowrap">
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 text-sm">No products yet. Add your first product above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
