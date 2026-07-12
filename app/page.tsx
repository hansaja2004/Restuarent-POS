import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google'
import Navbar from '@/components/landing/navbar'
import Hero from '@/components/landing/hero'
import OpenHours from '@/components/landing/open-hours'
import Menu from '@/components/landing/menu'
import Activities from '@/components/landing/activities'
import Catering from '@/components/landing/catering'
import Gallery from '@/components/landing/gallery'
import Contact from '@/components/landing/contact'
import Footer from '@/components/landing/footer'
import { getCategories, getProducts } from '@/app/actions/products'
import { getPublicLandingConfig } from '@/app/actions/settings'

const plusJakarta = Plus_Jakarta_Sans({ variable: '--font-plus-jakarta', subsets: ['latin'] })
const cormorantGaramond = Cormorant_Garamond({ variable: '--font-cormorant', weight: ['400', '600', '700'], subsets: ['latin'] })

export const dynamic = 'force-dynamic';
export default async function LandingPage() {
  const [categories, products, config] = await Promise.all([
    getCategories(),
    getProducts(),
    getPublicLandingConfig(),
  ]);

  return (
    <main className={`landing-theme ${plusJakarta.variable} ${cormorantGaramond.variable} min-h-screen text-foreground font-sans relative z-0`}>
      {/* Fixed background pattern - Uploaded Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] bg-[url('/bg-texture-luxury.png')] bg-cover bg-center" 
      ></div>

      <Navbar />
      <Hero heroImage={config.landingHeroImage} />
      <OpenHours 
        storeStatusOverride={config.storeStatusOverride} 
        bannerText={config.landingHoursBanner} 
        autoOpenTime={config.autoOpenTime} 
        autoCloseTime={config.autoCloseTime} 
      />
      <Menu initialCategories={categories} initialProducts={products} />
      <Activities activities={config.landingActivities} />
      <Catering />
      <Gallery images={config.landingGallery} />
      <Contact hoursList={config.landingHoursList} />
      <Footer />
    </main>
  )
}
