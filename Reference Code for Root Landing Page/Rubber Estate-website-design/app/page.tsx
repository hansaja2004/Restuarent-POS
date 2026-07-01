'use client'

import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Menu from '@/components/menu'
import Activities from '@/components/activities'
import Catering from '@/components/catering'
import Gallery from '@/components/gallery'
import Contact from '@/components/contact'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Menu />
      <Activities />
      <Catering />
      <Gallery />
      <Contact />
      <Footer />
    </main>
  )
}
