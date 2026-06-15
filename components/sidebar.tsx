'use client'

import { ChevronLeft, BarChart3, ShoppingCart, ClipboardList, Menu, Grid3x3, TrendingUp, Package, Users, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'

export default function Sidebar() {
  const router = useRouter()

  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', badge: null, href: '/dashboard' },
    { icon: ShoppingCart, label: 'Point of Sale', badge: null, href: '/' },
    { icon: ClipboardList, label: 'Orders', badge: null, href: '/orders' },
    { icon: Menu, label: 'Menu Management', badge: '8', href: '/menu' },
    { icon: Grid3x3, label: 'Table &Floor Plan', badge: null, href: '/floor-plan' },
    { icon: TrendingUp, label: 'Sales Reports', badge: null, href: '/reports' },
    { icon: Package, label: 'Inventory Reports', badge: null, href: '/inventory' },
    { icon: Users, label: 'Employee Management', badge: null, href: '/employees' },
  ]

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Package size={18} />
          </div>
          {!collapsed && <span className="font-semibold text-gray-900">Foodcode</span>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft size={20} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Current restaurant removed per request */}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {menuItems.map((item, idx) => (
          <button
            key={item.label}
            onClick={() => item.href && router.push(item.href)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${idx === 0 ? 'bg-gray-100' : ''}`}
          >
            <item.icon size={20} className="text-gray-600" />
            {!collapsed && (
              <>
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2 py-2 border-t border-gray-200 space-y-2">
        <button
          onClick={() => router.push('/settings')}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings size={20} className="text-gray-600" />
          {!collapsed && <span className="text-sm text-gray-700">Settings</span>}
        </button>

        <button
          type="button"
          onClick={async () => {
            await logout()
            router.push('/login')
          }}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut size={20} className="text-gray-600" />
          {!collapsed && <span className="text-sm text-gray-700">Sign out</span>}
        </button>
      </div>

      {/* Account section removed per request */}
    </div>
  )
}
