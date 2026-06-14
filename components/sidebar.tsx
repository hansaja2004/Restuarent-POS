'use client'

import { ChevronLeft, Lock, Eye, LogOut, Plus, MoreVertical, BarChart3, ShoppingCart, ClipboardList, Menu, Grid3x3, TrendingUp, Package, Users, HelpCircle, Settings } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'

export default function Sidebar() {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', badge: null },
    { icon: ShoppingCart, label: 'Point of Sale', badge: null },
    { icon: ClipboardList, label: 'Orders', badge: null },
    { icon: Menu, label: 'Menu Management', badge: '8' },
    { icon: Grid3x3, label: 'Table &Floor Plan', badge: null },
    { icon: TrendingUp, label: 'Sales Reports', badge: null },
    { icon: Package, label: 'Inventory Reports', badge: null },
    { icon: Users, label: 'Customer Directory', badge: null },
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

      {/* Current Restaurant */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-600 font-semibold">Current restaurant</p>
          <p className="text-sm font-medium text-gray-900 mt-1">Bounty Catch Branch 1</p>
          <p className="text-xs text-gray-500 mt-1">Indah Kapuk beach, Jakarta</p>
          <button className="mt-2 text-gray-500 hover:text-gray-700">
            <MoreVertical size={16} />
          </button>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer ${idx === 0 ? 'bg-gray-100' : ''}`}
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
          </div>
        ))}
      </nav>

      {/* Settings & Help */}
      <div className="px-2 py-2 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <Settings size={20} className="text-gray-600" />
          {!collapsed && <span className="text-sm text-gray-700">Settings</span>}
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <HelpCircle size={20} className="text-gray-600" />
          {!collapsed && <span className="text-sm text-gray-700">Help center</span>}
        </div>
      </div>

      {/* Account Section */}
      {!collapsed && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          <p className="text-xs text-gray-600 font-semibold px-1">Switch account</p>

          {/* Active Account */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop"
              alt="Antonio"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Antonio Erlangga</p>
              <p className="text-xs text-gray-500 truncate">antonioer@gmail.com</p>
            </div>
            <Lock size={16} className="text-blue-600" />
          </div>

          {/* Inactive Account */}
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop"
              alt="Antonio"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Antonio Erlangga</p>
              <p className="text-xs text-gray-500 truncate">antonioer@gmail.com</p>
            </div>
          </div>

          {/* Add Account */}
          <button className="w-full flex items-center justify-center gap-2 text-teal-600 hover:bg-teal-50 p-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Add account
          </button>

          {/* Sign Out */}
          <button 
            onClick={async () => {
              await logout()
              router.push('/login')
            }} 
            className="w-full text-red-600 hover:text-red-700 text-sm font-medium p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            Sign out
          </button>

          {/* Another Account */}
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1517849845537-1d51a20414de?w=32&h=32&fit=crop"
              alt="Antonio"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Antonio Erlangga</p>
              <p className="text-xs text-gray-500 truncate">antonioer@gmail.com</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
