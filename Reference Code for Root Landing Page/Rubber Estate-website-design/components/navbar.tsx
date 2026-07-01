'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsOpen(false)
  }

  const navLinks = [
    { label: 'Home', id: 'home' },
    { label: 'Menu', id: 'menu' },
    { label: 'Activities', id: 'activities' },
    { label: 'Catering', id: 'catering' },
    { label: 'Gallery', id: 'gallery' },
    { label: 'Contact', id: 'contact' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#F7F4EF] border-b border-[#E0DDD8] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Rubber Estate Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <div>
              <p className="text-sm text-[#1E3F20] font-semibold">RUBBER</p>
              <p className="text-sm text-[#1E3F20]">ESTATE</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[#2C302E] text-sm font-medium hover:text-[#1E3F20] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-[#E0DDD8]">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left px-4 py-2 text-[#2C302E] hover:bg-[#E8EFE9]"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
