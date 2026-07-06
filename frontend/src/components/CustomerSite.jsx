import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Clock, 
  MapPin, 
  ArrowUp, 
  Star, 
  User,
  Coffee,
  CheckCircle,
  Award,
  Users,
  ChevronRight,
  Send,
  X
} from 'lucide-react';

export default function CustomerSite({ 
  websiteSettings,
  restaurantSettings,
  contactInfo,
  heroSection,
  qrCode,
  categories,
  menuItems,
  gallery,
  reviews
}) {
  // Navigation active state
  const [activeNav, setActiveNav] = useState('home');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Gallery category filter
  const [galleryFilter, setGalleryFilter] = useState('all');

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Review submission state
  const [newReview, setNewReview] = useState({ customer_name: '', review_text: '', rating: 5 });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Monitor scroll for header & scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Cross-page scrolling redirection checker
    const scrollTo = localStorage.getItem('scroll_to_section');
    if (scrollTo) {
      localStorage.removeItem('scroll_to_section');
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic branding text helper
  const logoText = useMemo(() => {
    if (!restaurantSettings.name) return { name: 'Mythri', sub: 'Family Restaurant' };
    const parts = restaurantSettings.name.split('–');
    if (parts.length > 1) {
      return { name: parts[0].trim(), sub: parts[1].trim() };
    }
    return { name: restaurantSettings.name, sub: 'Family Restaurant' };
  }, [restaurantSettings.name]);

  // Dynamic Google Maps embed URL
  const mapsEmbedUrl = useMemo(() => {
    const link = restaurantSettings.google_maps_link || contactInfo.google_maps_url;
    if (link && (link.includes('google.com/maps/embed') || link.includes('google.com/maps/embed/v1'))) {
      return link;
    }
    const addressVal = restaurantSettings.address || contactInfo.address || 'Beside KMR Hospital, NH-65, Nandigama';
    return `https://maps.google.com/maps?q=${encodeURIComponent(addressVal)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [restaurantSettings.google_maps_link, contactInfo.google_maps_url, restaurantSettings.address, contactInfo.address]);

  // Format phone numbers for WA & calls
  const waNumber = useMemo(() => {
    const raw = contactInfo.whatsapp_number || '9676576392';
    // Remove non-digit symbols. Ensure country code is present (default 91 for India if not specified)
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10) return `91${cleaned}`;
    return cleaned;
  }, [contactInfo.whatsapp_number]);

  const primaryPhone = contactInfo.primary_phone || '9676576392';
  const secondaryPhone = contactInfo.secondary_phone || '9637657639';

  // --- WHATSAPP ORDER URL CREATOR ---
  const triggerWhatsAppOrder = (dishName, price) => {
    const restaurantName = logoText.name || 'Mythri Restaurant';
    const message = `Hello ${restaurantName},\n\nI would like to order:\nDish Name: ${dishName}\nPrice: ₹${parseFloat(price).toFixed(2)}\n\nPlease confirm availability.`;
    const encodedText = encodeURIComponent(message);
    const url = `https://wa.me/${waNumber}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // --- REVIEW SUBMISSION ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.customer_name || !newReview.review_text) return;
    try {
      setSubmittingReview(true);
      await api.addReview({
        customer_name: newReview.customer_name,
        review_text: newReview.review_text,
        rating: parseInt(newReview.rating) || 5,
        status: 'visible' // Automatically visible for demo convenience
      });
      setReviewSubmitted(true);
      setNewReview({ customer_name: '', review_text: '', rating: 5 });
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Could not submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter menu items by category tab & search keyword
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (item.status === 'hidden') return false;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, selectedCategory, searchTerm]);

  // Gallery items (category filters removed)
  const filteredGallery = useMemo(() => {
    return gallery;
  }, [gallery]);

  // Maintenance overlay if website offline
  if (websiteSettings.status === 'maintenance') {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] -top-40 -left-40"></div>
        <div className="w-16 h-16 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center text-gold text-2xl font-bold mb-6 font-serif">
          {logoText.name.substring(0, 2).toUpperCase()}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Cooking Something Special</h1>
        <p className="text-zinc-400 text-sm mt-3 max-w-md leading-relaxed">
          {restaurantSettings.name || 'Mythri Family Restaurant'} digital menu is temporarily undergoing scheduled enhancements. We will be back online shortly!
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <a href={`tel:${primaryPhone}`} className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-gold">
            <Phone size={14} />
            <span>Call Restaurant</span>
          </a>
          <a href={`https://wa.me/${waNumber}`} target="_blank" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5">
            <MessageSquare size={14} className="text-green-500" />
            <span>Order via WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  const scrollToSection = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#050505] text-zinc-300 relative min-h-screen">
      
      {/* FLOATING ACTION WIDGETS */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col space-y-3">
        {/* Quick Call */}
        <a 
          href={`tel:${primaryPhone}`}
          className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:text-gold hover:border-gold/30 transition-all duration-300 shadow-2xl hover:scale-105"
          title="Call Now"
        >
          <Phone size={18} />
        </a>
        {/* Quick WhatsApp Chat */}
        <a 
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500 hover:text-white hover:bg-green-600 transition-all duration-300 shadow-2xl hover:scale-105"
          title="WhatsApp Order"
        >
          <MessageSquare size={18} />
        </a>
      </div>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gold hover:bg-gold-light text-black flex items-center justify-center transition shadow-gold-lg hover:scale-105"
          title="Scroll To Top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* --- NAV BAR --- */}
      <nav className="fixed top-0 left-0 w-full z-[9999] bg-[#050506]/95 border-b border-zinc-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src="/MY3Logo.jpg" className="w-10 h-10 rounded-full border border-gold/40 object-cover" alt="Mythri Logo" />
              <div>
                <span className="text-white font-bold font-serif text-lg tracking-wide block uppercase">{logoText.name}</span>
                <span className="text-gold uppercase tracking-[0.25em] text-[8px] block -mt-1 font-semibold">{logoText.sub}</span>
              </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider">
              {['home', 'menu', 'gallery', 'reviews', 'contact'].map(sec => (
                <button
                  key={sec}
                  onClick={() => {
                    if (sec === 'menu') {
                      window.location.hash = '#/menu';
                    } else {
                      scrollToSection(sec);
                    }
                  }}
                  className={`transition-colors duration-200 hover:text-gold ${activeNav === sec ? 'text-gold font-bold border-b border-gold/50 pb-1' : 'text-zinc-400'}`}
                >
                  {sec}
                </button>
              ))}
              <a href="#/login" className="text-zinc-500 hover:text-white transition-colors">Admin</a>
            </div>

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <a 
                href={`tel:${primaryPhone}`} 
                className="px-4 py-2 border border-zinc-800 hover:border-gold/30 rounded-lg hover:text-white transition-all text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
              >
                <Phone size={12} />
                <span>Call Now</span>
              </a>
              <button 
                onClick={() => { window.location.hash = '#/menu'; }} 
                className="px-4 py-2 bg-gold hover:bg-gold-light text-black rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-gold"
              >
                Order Now
              </button>
            </div>

            {/* Hamburger Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-zinc-400 hover:text-white p-2"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drop */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#09090b] border-b border-zinc-900 px-4 py-4 space-y-3">
            {['home', 'menu', 'gallery', 'reviews', 'contact'].map(sec => (
              <button
                key={sec}
                onClick={() => {
                  if (sec === 'menu') {
                    window.location.hash = '#/menu';
                  } else {
                    scrollToSection(sec);
                  }
                }}
                className={`block w-full text-left py-2 text-sm uppercase font-semibold ${activeNav === sec ? 'text-gold' : 'text-zinc-400'}`}
              >
                {sec}
              </button>
            ))}
            <a href="#/login" className="block w-full py-2 text-sm uppercase text-zinc-500 font-semibold border-t border-zinc-900 pt-3">Admin Portal</a>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a 
                href={`tel:${primaryPhone}`} 
                className="py-2.5 border border-zinc-800 rounded-lg text-center text-xs font-bold uppercase text-zinc-300"
              >
                Call Now
              </a>
              <button 
                onClick={() => { window.location.hash = '#/menu'; }}
                className="py-2.5 bg-gold text-black rounded-lg text-center text-xs font-bold uppercase shadow-gold"
              >
                Order Now
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="home" className="pt-32 pb-20 md:py-48 relative overflow-hidden flex items-center min-h-[90vh]">
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.22] scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${heroSection.background_image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80'})` }}
        ></div>
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pointer-events-none"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gold/5 blur-[150px] -top-40 -right-40 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            
            <div className="md:col-span-7 space-y-6">
              
              {/* Badges Slider (Row) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {(heroSection.badges || ["100% Fresh Ingredients", "Best Multi-Cuisine", "Family Dining Room"]).map((b, i) => (
                  <span key={i} className="px-3 py-1 bg-gold/10 border border-gold/15 text-gold rounded-full text-[10px] uppercase font-bold tracking-wider">
                    {b}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-serif text-white tracking-wide leading-tight">
                {heroSection.heading || 'Mythri Family Restaurant'}
                <span className="block text-gold mt-1 font-serif font-normal italic text-3xl sm:text-4xl lg:text-5xl">
                  {heroSection.subheading || 'Savor The Authentic Taste'}
                </span>
              </h1>

              <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed font-light">
                {heroSection.description || 'Experience the best multi-cuisine family dining with fresh ingredients, traditional spices, and exceptional service.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
                <button
                  onClick={() => { window.location.hash = '#/menu'; }}
                  className="w-full sm:w-fit px-8 py-3.5 bg-gold-gradient text-black font-bold uppercase rounded-xl hover:opacity-95 active:scale-[0.98] transition shadow-gold-lg text-xs tracking-wider"
                >
                  Explore Our Menu
                </button>
                <button
                  onClick={() => { window.location.hash = '#/menu'; }}
                  className="w-full sm:w-fit px-8 py-3.5 bg-zinc-900/80 border border-zinc-800 hover:border-gold/30 text-white font-semibold uppercase rounded-xl hover:bg-zinc-800 transition text-xs tracking-wider flex items-center justify-center space-x-2"
                >
                  <MessageSquare size={14} className="text-green-500" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>

            </div>

            {/* Featured Dish / Slider side */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div className="relative group w-72 h-72 md:w-96 md:h-96 rounded-full border border-gold/10 p-4 bg-gold/2">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl relative">
                  <img 
                    src={heroSection.todays_special_image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"} 
                    className="w-full h-full object-cover animate-[spin_80s_linear_infinite]"
                    alt={heroSection.todays_special_name || "Signature Dum Biryani"} 
                  />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div className="absolute bottom-4 right-4 glass-panel px-4 py-2 rounded-xl text-left border-l-2 border-gold">
                  <p className="text-[10px] text-gold font-bold uppercase tracking-wider">Today's Special</p>
                  <p className="text-white text-xs font-bold">{heroSection.todays_special_name || "Chicken Dum Biryani"}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* --- WHY CHOOSE US --- */}
      <section className="py-20 border-y border-zinc-900 bg-[#070708]/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Our Quality Promise</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Why Dine At Mythri?</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold"><CheckCircle size={20} /></div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">100% Fresh Ingredients</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">We source fresh poultry, meats, and vegetables daily to ensure premium taste. True freshness you can feel in every single bite.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold"><Award size={20} /></div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">Authentic Recipes</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">Our experienced chefs master the traditional cooking methods of authentic Hyderabadi Dum Biryani and Arabian Mandi.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold"><Users size={20} /></div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">Family Dining Ambience</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">A clean, comfortable, and luxury fine-dining space tailormade for family get-togethers and celebratory dinners.</p>
            </div>

          </div>
        </div>
      </section>




      {/* --- MENU CATEGORIES PREVIEW SECTION --- */}
      <section id="menu-preview" className="py-20 border-t border-zinc-900 bg-[#070708]/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Taste Our Cuisine</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Menu Categories</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map(c => {
              let img = c.image_url;
              if (!img) {
                img = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                if (c.name.includes("Biryani")) {
                  img = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80";
                } else if (c.name.includes("Starter")) {
                  if (c.name.includes("Veg")) {
                    img = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80";
                  } else {
                    img = "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80";
                  }
                } else if (c.name.includes("Curry") || c.name.includes("Curries")) {
                  img = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                } else if (c.name.includes("Tandoori") || c.name.includes("Kebab")) {
                  img = "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80";
                } else if (c.name.includes("Roti") || c.name.includes("Naan")) {
                  img = "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80";
                } else if (c.name.includes("Mandi")) {
                  img = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                } else if (c.name.includes("Beverage") || c.name.includes("Beverages")) {
                  img = "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80";
                }
              }
              
              return (
                <div 
                  key={c.id} 
                  onClick={() => {
                    localStorage.setItem('selected_category_id', c.id);
                    window.location.hash = '#/menu';
                  }}
                  className="relative group rounded-2xl overflow-hidden aspect-square border border-zinc-900/60 cursor-pointer shadow-lg hover:scale-102 transition-all duration-300"
                >
                  <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors flex flex-col justify-end p-6">
                    <p className="text-white font-serif font-bold text-base md:text-lg tracking-wide">{c.name}</p>
                    <div className="flex items-center space-x-1 text-gold text-[10px] uppercase tracking-widest mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span>Browse Full Menu</span>
                      <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* --- MASONRY GALLERY --- */}
      <section id="gallery" className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Dine & Ambience</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Restaurant Photo Gallery</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          </div>



          {/* Gallery Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredGallery.map(img => (
              <div key={img.id} className="relative group rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-900/50 aspect-video md:aspect-square">
                <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-103 transition-all duration-500" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                  <span className="text-[10px] text-gold uppercase tracking-wider font-bold">{img.category}</span>
                </div>
              </div>
            ))}
            {filteredGallery.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-600">No gallery images found.</div>
            )}
          </div>

        </div>
      </section>

      {/* --- TESTIMONIALS & REVIEW WRITER --- */}
      <section id="reviews" className="py-20 border-t border-zinc-900 bg-[#070708]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Diner Experiences</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Customer Reviews</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Reviews Cards List (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.filter(r => r.status === 'visible').slice(0, 6).map(review => (
                  <div key={review.id} className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={review.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                          className="w-10 h-10 rounded-full object-cover border border-zinc-800" 
                          alt="" 
                        />
                        <div>
                          <p className="font-semibold text-white text-sm">{review.customer_name}</p>
                          <p className="text-[10px] text-zinc-500">Verified Diner</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-0.5 text-gold text-xs">
                        {'★'.repeat(review.rating)}
                      </div>
                    </div>

                    <p className="text-zinc-400 text-xs leading-relaxed font-light italic">
                      "{review.review_text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial Form Writer (1 col) */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 h-fit border-l-2 border-gold">
              <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Dined With Us? Write A Review</h3>
              
              {reviewSubmitted ? (
                <div className="p-4 rounded-xl bg-green-950/20 border border-green-500/15 text-green-400 text-xs text-center space-y-2">
                  <CheckCircle size={24} className="mx-auto" />
                  <p className="font-bold">Thank you for your feedback!</p>
                  <p className="text-[10px] text-zinc-400 leading-normal">Your review has been saved successfully and is now published on the website.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Your Name *</label>
                    <input 
                      type="text"
                      value={newReview.customer_name}
                      onChange={(e) => setNewReview(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      placeholder="e.g., Rajesh K."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Rating *</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                      <option value="2">⭐⭐ (2 Stars)</option>
                      <option value="1">⭐ (1 Star)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Review Feedback *</label>
                    <textarea 
                      value={newReview.review_text}
                      onChange={(e) => setNewReview(prev => ({ ...prev, review_text: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      placeholder="Share your dining experience..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-gold hover:bg-gold-light text-black font-bold uppercase rounded-lg transition text-[10px] tracking-wider"
                  >
                    {submittingReview ? 'Sending...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>


      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-20 border-t border-zinc-900 bg-[#070708]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Visit Us Today</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Contact & Location</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Quick details */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-2">
                    {restaurantSettings.name || 'Mythri Restaurant'}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">
                    {restaurantSettings.tagline || 'Taste The Freshness In Every Bite'}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3">
                    <span className="text-gold mt-0.5"><MapPin size={16} /></span>
                    <div>
                      <p className="text-white font-semibold">Address</p>
                      <p className="text-zinc-400 mt-1 leading-normal">
                        {restaurantSettings.address || contactInfo.address || 'Beside KMR Hospital, NH-65, Nandigama'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gold mt-0.5"><Phone size={16} /></span>
                    <div>
                      <p className="text-white font-semibold">Reservations & Delivery</p>
                      <p className="text-zinc-400 mt-1">Primary: <a href={`tel:${primaryPhone}`} className="text-white hover:text-gold font-semibold">{primaryPhone}</a></p>
                      <p className="text-zinc-400">Secondary: <a href={`tel:${secondaryPhone}`} className="text-white hover:text-gold font-semibold">{secondaryPhone}</a></p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-gold mt-0.5"><Clock size={16} /></span>
                    <div>
                      <p className="text-white font-semibold">Hours of Operation</p>
                      <p className="text-zinc-400 mt-1">Weekday: {restaurantSettings.opening_hours?.weekday || '11:00 AM - 11:00 PM'}</p>
                      <p className="text-zinc-400">Weekend: {restaurantSettings.opening_hours?.weekend || '11:00 AM - 11:30 PM'}</p>
                    </div>
                  </div>

                  {(contactInfo.facebook || contactInfo.instagram || restaurantSettings.social_media_links?.facebook || restaurantSettings.social_media_links?.instagram) && (
                    <div className="flex items-start space-x-3 pt-1 border-t border-zinc-900/60 pt-3">
                      <span className="text-gold mt-0.5"><Users size={16} /></span>
                      <div>
                        <p className="text-white font-semibold">Follow Us</p>
                        <div className="flex space-x-4 mt-2">
                          {(contactInfo.facebook || restaurantSettings.social_media_links?.facebook) && (
                            <a 
                              href={contactInfo.facebook || restaurantSettings.social_media_links?.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-400 hover:text-gold transition font-medium"
                            >
                              Facebook
                            </a>
                          )}
                          {(contactInfo.instagram || restaurantSettings.social_media_links?.instagram) && (
                            <a 
                              href={contactInfo.instagram || restaurantSettings.social_media_links?.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-400 hover:text-gold transition font-medium"
                            >
                              Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <a 
                href={restaurantSettings.google_maps_link || contactInfo.google_maps_url || 'https://maps.app.goo.gl/81f9WrWjXGkT2Mth8'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-gold-gradient text-black font-bold uppercase rounded-xl hover:opacity-95 text-center text-xs tracking-wider shadow-gold block transition"
              >
                Get Directions via Google Maps
              </a>

            </div>

            {/* Embedded Google Maps Container */}
            <div className="lg:col-span-7 rounded-[20px] overflow-hidden min-h-[350px] border border-zinc-800/80 bg-zinc-950 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(212,175,55,0.06)] hover:scale-[1.01] hover:border-gold/20 relative group">
              <iframe 
                src={mapsEmbedUrl} 
                className="w-full h-full border-0 min-h-[350px] md:min-h-[400px] grayscale invert contrast-[1.15] opacity-[0.6] transition-opacity duration-300 group-hover:opacity-[0.7]"
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps"
              ></iframe>

              {/* Subtle Premium Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45 pointer-events-none transition-all duration-300 group-hover:via-black/10"></div>
              
              {/* Subtle Gold Ambient Inner Shadow Border */}
              <div className="absolute inset-0 border border-gold/5 pointer-events-none rounded-[20px]"></div>

              {/* Floating Information Badge */}
              <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-xs p-4 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 shadow-lg text-left select-none pointer-events-auto flex items-start space-x-3 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <MapPin size={15} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold font-serif uppercase tracking-wider">Restaurant Location</h4>
                  <p className="text-zinc-400 text-[10px] leading-normal font-light">
                    {restaurantSettings.address || contactInfo.address || 'Beside KMR Hospital, NH-65, Nandigama'}
                  </p>
                  <a 
                    href={restaurantSettings.google_maps_link || contactInfo.google_maps_url || 'https://maps.app.goo.gl/81f9WrWjXGkT2Mth8'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[10px] text-gold font-bold hover:text-gold-light transition pt-1"
                  >
                    <span>Open in Google Maps</span>
                    <ChevronRight size={10} className="mt-0.5" />
                  </a>
                </div>
              </div>

              {/* Modern Premium Call-to-Action Button */}
              <div className="absolute bottom-4 right-4 pointer-events-auto">
                <a 
                  href={restaurantSettings.google_maps_link || contactInfo.google_maps_url || 'https://maps.app.goo.gl/81f9WrWjXGkT2Mth8'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gold-gradient text-black font-bold uppercase rounded-full hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md text-[10px] tracking-wider"
                >
                  <MapPin size={12} />
                  <span>Navigate</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#050506] border-t border-zinc-900/60 py-16 text-xs text-zinc-500 select-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/MY3Logo.jpg" className="w-8 h-8 rounded-full border border-gold/30 object-cover" alt="Mythri Logo" />
              <span className="text-white font-bold font-serif text-sm uppercase tracking-wide">
                {restaurantSettings.name || 'Mythri Restaurant'}
              </span>
            </div>
            <p className="leading-relaxed">
              {restaurantSettings.description || 'Taste the freshness in every single bite. The complete multi-cuisine family dining experience since 2012.'}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Quick Links</h4>
            <ul className="space-y-2">
              {['home', 'menu', 'gallery', 'reviews', 'contact'].map(sec => (
                <li key={sec}>
                  <button onClick={() => scrollToSection(sec)} className="hover:text-gold transition uppercase text-[10px] tracking-wide font-medium">{sec}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Menu Categories</h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map(c => (
                <li key={c.id}>
                  <button 
                    onClick={() => {
                      localStorage.setItem('selected_category_id', c.id);
                      window.location.hash = '#/menu';
                    }} 
                    className="hover:text-gold transition text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Contact Details</h4>
            <p className="leading-normal">
              Address: {restaurantSettings.address || contactInfo.address || 'Beside KMR Hospital, NH-65, Nandigama'}<br />
              Primary Phone: <a href={`tel:${primaryPhone}`} className="text-zinc-300 hover:text-gold">{primaryPhone}</a><br />
              Secondary Phone: <a href={`tel:${secondaryPhone}`} className="text-zinc-300 hover:text-gold">{secondaryPhone}</a><br />
              Email: <a href={`mailto:${contactInfo.email_address}`} className="text-zinc-300 hover:text-gold">{contactInfo.email_address || 'contact@mythri.com'}</a>
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] gap-4">
          <p>© {new Date().getFullYear()} {restaurantSettings.name || 'Mythri Family Restaurant'}. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#/login" className="hover:text-white transition">Admin Portal</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
