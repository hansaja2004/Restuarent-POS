'use client';

import { useState } from 'react';
import { Menu, X, Clock, MapPin, Phone, Mail, Utensils, TreePine, Dumbbell, Waves, Users, LayoutGrid } from 'lucide-react';

export default function LandingPageClient({
  initialCategories,
  initialProducts,
}: {
  initialCategories: any[];
  initialProducts: any[];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );

  const activeCategoryProducts = initialProducts.filter(
    (p) => p.categoryId === activeCategoryId && p.isAvailable
  );

  const cateringPackages = [
    {
      name: 'Garden Party',
      price: '$45/person',
      description: 'Perfect for intimate gatherings',
      items: ['Appetizers platter', 'Herb beverages', 'Light snacks', 'Seating for up to 50 guests'],
      icon: 'utensils',
    },
    {
      name: 'Estate Celebration',
      price: '$75/person',
      description: 'Full dining experience',
      items: ['Multi-course menu', 'Wine pairings', 'Herb-infused cuisine', 'Seating for up to 100 guests'],
      icon: 'users',
    },
    {
      name: 'Premium Gathering',
      price: '$120/person',
      description: 'Luxury curated experience',
      items: ['Chef-selected menu', 'Premium beverages', 'Live herbs preparation', 'Unlimited guests'],
      icon: 'layout',
    },
  ];

  const activities = [
    {
      icon: 'tree',
      title: 'Herb Garden Tours',
      description: 'Explore our sustainable herb gardens and learn about estate cultivation',
    },
    {
      icon: 'utensils',
      title: 'Cooking Classes',
      description: 'Learn to cook with fresh herbs from our estate',
    },
    {
      icon: 'dumbbell',
      title: 'Wellness Programs',
      description: 'Yoga, meditation, and nature-based wellness activities',
    },
    {
      icon: 'waves',
      title: 'Relaxation Spa',
      description: 'Herbal treatments and spa services in natural surroundings',
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="w-full bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/Rubber Estate Transparent.png" alt="Rubber Estate" className="h-12 w-auto" />
            <h1 className="text-white text-2xl font-bold hidden sm:block">Rubber Estate</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8">
            {['Home', 'Menu', 'Catering', 'Activities', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-white hover:text-accent transition-colors font-medium"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-primary-foreground/20">
            {['Home', 'Menu', 'Catering', 'Activities', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="block w-full text-left px-4 py-3 text-white hover:bg-primary-light transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-primary via-primary to-[#0d472a]/80 text-white py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply blur-3xl"></div>
        </div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-6 inline-block">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">Next Generation Luxury</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
            Rubber Estate
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 text-balance max-w-2xl mx-auto font-light">
            Where futuristic design meets the timeless beauty of nature
          </p>
          <button
            onClick={() => scrollToSection('menu')}
            className="bg-accent text-white px-10 py-4 rounded-lg font-semibold hover:bg-accent/90 transition-all transform hover:scale-105"
          >
            Discover Excellence
          </button>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-3">Culinary Excellence</h2>
            <p className="text-lg text-muted-foreground">Exquisite flavors crafted from our estate gardens</p>
            <div className="w-16 h-1 bg-accent rounded-full mx-auto mt-4"></div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {initialCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all capitalize text-sm ${
                  activeCategoryId === category.id
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-secondary text-primary hover:bg-primary/10 border border-primary/20'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="grid md:grid-cols-2 gap-6">
            {activeCategoryProducts.map((item) => (
              <div key={item.id} className="group bg-white p-5 rounded-xl border border-primary/10 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all flex justify-between items-start">
                <div className="flex-1 pr-4 h-full flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors mb-2">{item.name}</h3>
                  <div>
                    {item.smallPrice || item.mediumPrice || item.largePrice ? (
                      <div className="flex gap-3 text-base font-bold text-accent flex-wrap">
                        {item.smallPrice && <span>S: Rs. {item.smallPrice}</span>}
                        {item.mediumPrice && <span>M: Rs. {item.mediumPrice}</span>}
                        {item.largePrice && <span>L: Rs. {item.largePrice}</span>}
                      </div>
                    ) : (
                      <span className="text-accent font-bold text-base">Rs. {item.price}</span>
                    )}
                  </div>
                </div>
                {item.imageUrl && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}
              </div>
            ))}
            {activeCategoryProducts.length === 0 && (
              <div className="text-center text-gray-500 py-10">No items available in this category.</div>
            )}
          </div>
        </div>
      </section>

      {/* Catering Packages Section */}
      <section id="catering" className="py-24 px-4 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-3">Event Experiences</h2>
            <p className="text-lg text-muted-foreground">Tailored packages for unforgettable moments</p>
            <div className="w-16 h-1 bg-accent rounded-full mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {cateringPackages.map((pkg, index) => (
              <div key={index} className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-primary/10 hover:border-accent/50 transform hover:-translate-y-2">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-accent font-bold text-xl mb-3">{pkg.price}</p>
                  <p className="text-primary-foreground/90">{pkg.description}</p>
                </div>
                <div className="p-8">
                  <ul className="space-y-3 mb-8">
                    {pkg.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent/90 transition-all transform group-hover:scale-105">
                    Inquire Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-3">Immersive Experiences</h2>
            <p className="text-lg text-muted-foreground">Engage with nature and luxury in harmony</p>
            <div className="w-16 h-1 bg-accent rounded-full mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {activities.map((activity, index) => {
              let IconComponent = Utensils;
              if (activity.icon === 'tree') IconComponent = TreePine;
              if (activity.icon === 'dumbbell') IconComponent = Dumbbell;
              if (activity.icon === 'waves') IconComponent = Waves;

              return (
                <div key={index} className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all border border-primary/10 hover:border-accent/50 flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <IconComponent size={32} className="text-accent group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">{activity.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hours & Info Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Hours */}
            <div className="group text-center">
              <div className="inline-block mb-6 p-4 bg-white/10 rounded-full group-hover:bg-accent/20 transition-colors">
                <Clock size={40} className="text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-6">Operating Hours</h3>
              <div className="space-y-3 text-primary-foreground/90 text-sm">
                <p><span className="font-semibold text-white">Mon - Fri:</span> 10:00 AM - 10:00 PM</p>
                <p><span className="font-semibold text-white">Saturday:</span> 9:00 AM - 11:00 PM</p>
                <p><span className="font-semibold text-white">Sunday:</span> 9:00 AM - 9:00 PM</p>
                <p className="mt-4 text-accent font-semibold text-xs">Closed Mondays for Maintenance</p>
              </div>
            </div>

            {/* Location */}
            <div className="group text-center">
              <div className="inline-block mb-6 p-4 bg-white/10 rounded-full group-hover:bg-accent/20 transition-colors">
                <MapPin size={40} className="text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-6">Location</h3>
              <p className="text-primary-foreground/90 leading-relaxed">
                <span className="font-semibold text-white block">123 Estate Road</span>
                <span className="block">Nature Valley, State 12345</span>
                <span className="text-accent text-sm mt-3">Nestled in pristine surroundings</span>
              </p>
            </div>

            {/* Contact */}
            <div className="group text-center">
              <div className="inline-block mb-6 p-4 bg-white/10 rounded-full group-hover:bg-accent/20 transition-colors">
                <Phone size={40} className="text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-3">
                  <Phone size={18} className="text-accent flex-shrink-0" />
                  <span className="text-sm">(555) 123-4567</span>
                </p>
                <p className="flex items-center justify-center gap-3">
                  <Mail size={18} className="text-accent flex-shrink-0" />
                  <span className="text-sm">info@rubberestate.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-24 px-4 bg-secondary/50">
        <div className="max-w-6xl mx-auto text-center">
          {/* Gallery placeholder */}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <h4 className="font-bold mb-3 text-accent">Quick Links</h4>
              <p className="text-primary-foreground/80">Home • Menu • Activities • Contact</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-accent">Hours</h4>
              <p className="text-primary-foreground/80">Mon-Fri: 10AM - 10PM<br/>Sat: 9AM - 11PM<br/>Sun: 9AM - 9PM</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-accent">Connect</h4>
              <p className="text-primary-foreground/80">(555) 123-4567<br/>info@rubberestate.com</p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center">
            <p className="mb-2 text-primary-foreground/90">© 2024 Rubber Estate. All rights reserved.</p>
            <p className="text-primary-foreground/70 text-sm">
              Where Futuristic Design Meets Nature
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
