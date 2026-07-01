'use client'

import { useState, useEffect } from 'react'
import { Menu as MenuIcon, X } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
        setIsOpen(false);
      } else {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsOpen(false)
  }

  const leftLinks = [
    { label: 'Home', id: 'home' },
    { label: 'Menu', id: 'menu' },
    { label: 'Activities', id: 'activities' },
  ]

  const rightLinks = [
    { label: 'Catering', id: 'catering' },
    { label: 'Gallery', id: 'gallery' },
    { label: 'Contact', id: 'contact' },
  ]

  const mobileLinks = [...leftLinks, ...rightLinks]

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 bg-[#F7F4EF] border-b border-[#E0DDD8] shadow-sm ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled ? 'py-1' : 'py-2 md:py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Desktop Layout: Links - Logo - Links */}
        <div className="hidden md:flex justify-between items-center w-full">
          {/* Left Links */}
          <div className="flex-1 flex justify-end gap-10 pr-12">
            {leftLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[#2C302E] hover:text-[#A05740] font-medium tracking-widest uppercase text-sm transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#A05740] transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* Center Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer" 
            onClick={() => scrollToSection('home')}
          >
            <Image
              src="/logo.png"
              alt="Rubber Estate Logo"
              width={140}
              height={140}
              className={`object-contain transition-all duration-500 ${scrolled ? 'w-[65px] h-[65px]' : 'w-[100px] h-[100px]'}`}
            />
          </div>

          {/* Right Links */}
          <div className="flex-1 flex justify-start gap-10 pl-12">
            {rightLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[#2C302E] hover:text-[#A05740] font-medium tracking-widest uppercase text-sm transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#A05740] transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Layout: Logo on Left, Menu on Right */}
        <div className="flex md:hidden justify-between items-center">
          <div 
            className="cursor-pointer" 
            onClick={() => scrollToSection('home')}
          >
            <Image
              src="/logo.png"
              alt="Rubber Estate Logo"
              width={100}
              height={100}
              className={`object-contain transition-all duration-500 ${scrolled ? 'w-[55px] h-[55px]' : 'w-[80px] h-[80px]'}`}
            />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-[#1E3F20] hover:bg-[#1E3F20]/5 rounded-xl transition-colors"
          >
            {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out absolute top-full left-0 w-full bg-[#F7F4EF] border-b border-[#E0DDD8] shadow-lg ${
            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-transparent shadow-none'
          }`}
        >
          <div className="flex flex-col items-center gap-6 py-6">
            {mobileLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[#2C302E] font-cormorant text-2xl font-semibold tracking-wider hover:text-[#A05740] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
