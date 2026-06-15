import { getCategories, getProducts, createProduct, createCategory, deleteProduct } from '@/app/actions/products';
import AdminProductForm from '@/components/admin-product-form';

export default async function ProductsPage() {
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products & Categories</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Forms */}
        <div className="space-y-8">
          {/* Add Category Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Category</h2>
            <form action={async (formData) => {
              'use server';
              await createCategory(formData);
            }} className="space-y-4">
              <div>
                <label htmlFor="admin-category-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input id="admin-category-name" name="name" type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors">
                Add Category
              </button>
            </form>
          </div>

          {/* Add Product Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Product</h2>
            <AdminProductForm categories={categories} />
          </div>
        </div>

        {/* Right Column: Lists */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Products List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Size Prices</th>
                    <th className="px-6 py-3">Category ID</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {p.smallPrice && <span className="rounded bg-gray-100 px-2 py-1 text-xs">S: LKR {p.smallPrice}</span>}
                          {p.mediumPrice && <span className="rounded bg-gray-100 px-2 py-1 text-xs">M: LKR {p.mediumPrice}</span>}
                          {p.largePrice && <span className="rounded bg-gray-100 px-2 py-1 text-xs">L: LKR {p.largePrice}</span>}
                          {!p.smallPrice && !p.mediumPrice && !p.largePrice && (
                            <span>LKR {p.price}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{p.categoryId}</td>
                      <td className="px-6 py-4">
                        <form action={async () => {
                          'use server';
                          await deleteProduct(p.id);
                        }}>
                          <button type="submit" className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-center">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
