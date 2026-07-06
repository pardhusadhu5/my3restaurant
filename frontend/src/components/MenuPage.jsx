import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Clock, 
  MapPin, 
  ArrowUp, 
  CheckCircle,
  Menu,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Gift,
  AlertCircle
} from 'lucide-react';

export default function MenuPage({ 
  websiteSettings,
  restaurantSettings,
  contactInfo,
  categories,
  menuItems
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Dynamic branding text helper
  const logoText = useMemo(() => {
    if (!restaurantSettings.name) return { name: 'Mythri', sub: 'Family Restaurant' };
    const parts = restaurantSettings.name.split('–');
    if (parts.length > 1) {
      return { name: parts[0].trim(), sub: parts[1].trim() };
    }
    return { name: restaurantSettings.name, sub: 'Family Restaurant' };
  }, [restaurantSettings.name]);

  // Cart and checkout states
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('mythri_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Checkout inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  
  // Payment simulation state
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', or null
  const [createdOrder, setCreatedOrder] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('mythri_cart', JSON.stringify(cart));
  }, [cart]);

  // Monitor scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if a category was pre-selected from the homepage
  useEffect(() => {
    const preSelected = localStorage.getItem('selected_category_id');
    if (preSelected) {
      setSelectedCategory(preSelected);
      localStorage.removeItem('selected_category_id');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Debounced first-time customer discount check
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  useEffect(() => {
    if (!checkoutModalOpen) {
      setEligibilityResult(null);
      return;
    }

    const cleanedPhone = customerPhone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setEligibilityResult(null);
      return;
    }

    const handler = setTimeout(async () => {
      setLoadingEligibility(true);
      try {
        const res = await api.checkDiscountEligibility(cleanedPhone, cartSubtotal);
        setEligibilityResult(res);
      } catch (err) {
        console.error('Error checking discount eligibility:', err);
        setEligibilityResult({ eligible: false, reason: 'Failed to verify first-time discount code.' });
      } finally {
        setLoadingEligibility(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [customerPhone, cartSubtotal, checkoutModalOpen]);

  // Format phone numbers
  const waNumber = useMemo(() => {
    const raw = contactInfo.whatsapp_number || '9676576392';
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10) return `91${cleaned}`;
    return cleaned;
  }, [contactInfo.whatsapp_number]);

  const primaryPhone = contactInfo.primary_phone || '9676576392';
  const secondaryPhone = contactInfo.secondary_phone || '9637657639';

  // Handle Cart Operations
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleIncrement = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  };

  const handleDecrement = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity === 1) {
        return prev.filter(i => i.id !== id);
      }
      return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const handleRemove = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // WhatsApp Message Formatter
  const formatWhatsAppMessage = (orderId, name, phone, items, subtotal, discountAmt, finalTotal) => {
    const restName = restaurantSettings.name || 'Mythri Family Restaurant';
    let message = `*${restName} - Order Receipt*\n`;
    message += `----------------------------------------\n`;
    message += `*Order ID:* ${orderId}\n`;
    message += `*Customer:* ${name}\n`;
    message += `*Phone:* ${phone}\n`;
    message += `----------------------------------------\n`;
    message += `*Items Ordered:*\n`;
    items.forEach(item => {
      message += `- ${item.name} x${item.quantity} (₹${(item.price * item.quantity).toFixed(2)})\n`;
    });
    message += `----------------------------------------\n`;
    message += `*Subtotal:* ₹${subtotal.toFixed(2)}\n`;
    if (discountAmt > 0) {
      message += `*Discount:* -₹${discountAmt.toFixed(2)}\n`;
    }
    message += `*Final Amount:* ₹${finalTotal.toFixed(2)}\n`;
    message += `----------------------------------------\n`;
    message += `*Payment Status:* Cash on Delivery / Pay at Restaurant\n`;
    message += `Thank you for your order! Your receipt is ready.`;
    return message;
  };

  // Place Order on WhatsApp
  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone) {
      alert('Please fill in your Name and Phone Number.');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const discount = eligibilityResult?.eligible ? eligibilityResult.discount : null;
      const discountAmt = eligibilityResult?.eligible ? eligibilityResult.discountAmount : 0;
      const finalAmt = eligibilityResult?.eligible ? eligibilityResult.finalAmount : cartSubtotal;

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        customer_email: customerEmail || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        original_amount: cartSubtotal,
        discount_id: discount ? discount.id : null,
        discount_amount: discountAmt,
        final_amount: finalAmt,
        is_first_order: eligibilityResult?.eligible ? (eligibilityResult.isAutomaticFirstOrder ? true : !!discount) : false,
        payment_status: 'Pending',
        order_status: 'Pending'
      };

      const order = await api.createOrder(orderData);

      // Generate WhatsApp order message and redirect
      const message = formatWhatsAppMessage(
        order.id,
        order.customer_name,
        order.customer_phone,
        order.items,
        order.original_amount,
        order.discount_amount || 0,
        order.final_amount
      );
      
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      // Clear cart and reset states
      setCart([]);
      setCheckoutModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCheckoutSubmitting(false);
    } catch (err) {
      console.error('Error submitting order:', err);
      alert(err.message || 'Failed to complete order checkout.');
      setCheckoutSubmitting(false);
    }
  };

  // Handle Navbar redirects back to Home page sections
  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (sectionId === 'menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    localStorage.setItem('scroll_to_section', sectionId);
    window.location.hash = '#/';
  };

  // Memoized values
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (item.status === 'hidden') return false;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, selectedCategory, searchTerm]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return (
    <div className="bg-[#050505] text-zinc-300 relative min-h-screen">
      
      {/* FLOATING ACTION WIDGETS */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col space-y-3">
        <a 
          href={`tel:${primaryPhone}`}
          className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:text-gold hover:border-gold/30 transition-all duration-300 shadow-2xl hover:scale-105"
          title="Call Now"
        >
          <Phone size={18} />
        </a>
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
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('home')}>
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
                  onClick={() => handleNavClick(sec)}
                  className={`transition-colors duration-200 hover:text-gold ${sec === 'menu' ? 'text-gold font-bold border-b border-gold/50 pb-1' : 'text-zinc-400'}`}
                >
                  {sec}
                </button>
              ))}
              <a href="#/login" className="text-zinc-500 hover:text-white transition-colors">Admin</a>
            </div>

            {/* Quick Actions & Desktop Cart */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 bg-zinc-900/60 border border-zinc-800 hover:border-gold/30 rounded-xl text-zinc-300 hover:text-gold transition-all"
                title="Open Cart"
              >
                <ShoppingCart size={16} />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gold text-black font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-mono border border-[#050505] shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                    {cartTotalItems}
                  </span>
                )}
              </button>
              <a 
                href={`tel:${primaryPhone}`} 
                className="px-4 py-2 border border-zinc-800 hover:border-gold/30 rounded-lg hover:text-white transition-all text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
              >
                <Phone size={12} />
                <span>Call Now</span>
              </a>
            </div>

            {/* Mobile Actions (Cart + Hamburger) */}
            <div className="flex items-center space-x-2 md:hidden">
              <button 
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-gold rounded-lg"
              >
                <ShoppingCart size={16} />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-black font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono border border-[#050505]">
                    {cartTotalItems}
                  </span>
                )}
              </button>
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
                onClick={() => handleNavClick(sec)}
                className={`block w-full text-left py-2 text-sm uppercase font-semibold ${sec === 'menu' ? 'text-gold' : 'text-zinc-400'}`}
              >
                {sec}
              </button>
            ))}
            <a href="#/login" className="block w-full py-2 text-sm uppercase text-zinc-500 font-semibold border-t border-zinc-900 pt-3">Admin Portal</a>
          </div>
        )}
      </nav>

      {/* --- MENU WRAPPER --- */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-gold font-bold text-xs uppercase tracking-[0.3em] font-mono">Taste In Every Bite</p>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-white tracking-wide">Culinary Menu</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto mt-4"></div>
          <p className="text-xs text-amber-500/80 font-semibold tracking-wide pt-2">Note: After placing an order, please wait 10–15 minutes.</p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-6 mb-12">
          <div className="max-w-md mx-auto relative group">
            <span className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-gold transition-colors duration-300">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Biryani, Mandi, Starters..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/45 border border-zinc-800 focus:border-gold focus:ring-2 focus:ring-gold/15 rounded-xl text-white text-sm focus:outline-none transition-all duration-300 shadow-xl placeholder-zinc-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1 justify-start max-w-5xl mx-auto scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border
                ${selectedCategory === 'all' 
                  ? 'bg-gold border-gold text-black font-extrabold shadow-gold' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }
              `}
            >
              All Dishes
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border
                  ${selectedCategory === c.id 
                    ? 'bg-gold border-gold text-black font-extrabold shadow-gold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }
                `}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMenuItems.map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="glass-panel rounded-2xl overflow-hidden glass-panel-hover flex flex-col group justify-between">
                <div>
                  <div className="h-44 overflow-hidden relative bg-zinc-950">
                    {item.is_popular && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-gold text-black font-extrabold text-[9px] uppercase tracking-wider rounded-md border border-gold/30 shadow-lg z-10">
                        Popular
                      </div>
                    )}
                    {item.image_url ? (
                      <img 
                        src={`${item.image_url}${item.image_url.includes('?') ? '&' : '?'}t=${item.updated_at ? new Date(item.updated_at).getTime() : (item.created_at ? new Date(item.created_at).getTime() : '')}`} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                        alt={item.name} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-700 uppercase tracking-widest font-bold">Mythri Meal</div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/80 backdrop-blur rounded text-gold font-bold text-xs border border-gold/15">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide truncate">{item.name}</h3>
                    <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-3 font-light min-h-[50px]">{item.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  {cartItem ? (
                    <div className="flex items-center justify-between bg-zinc-900/80 border border-gold/20 rounded-xl px-2 py-1.5">
                      <button 
                        onClick={() => handleDecrement(item.id)}
                        className="p-1 hover:text-gold text-zinc-400 transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold text-white font-mono">{cartItem.quantity}</span>
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="p-1 hover:text-gold text-zinc-400 transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-gold/30 text-gold hover:text-white rounded-xl transition text-[11px] font-bold flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingCart size={12} className="text-gold" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredMenuItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-500">
              No dishes match your search keywords or category filters.
            </div>
          )}
        </div>

      </section>

      {/* --- FLOATING CART BOTTOM BAR --- */}
      {cartTotalItems > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-[#09090b]/95 border border-gold/30 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(212,175,55,0.15)] px-6 py-4 flex items-center justify-between text-white animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gold/15 rounded-xl border border-gold/20 text-gold">
              <ShoppingCart size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400">{cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}</span>
              <span className="text-sm font-extrabold text-gold font-mono">₹{cartSubtotal.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={() => setCartDrawerOpen(true)}
            className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black font-extrabold rounded-xl transition-all hover:scale-102 flex items-center space-x-1.5 text-xs uppercase tracking-wider"
          >
            <span>View Cart</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* --- CART DRAWER BACKDROP --- */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity" onClick={() => setCartDrawerOpen(false)} />
      )}
      
      {/* --- CART DRAWER PANEL --- */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#09090b] border-l border-zinc-900 z-[9999] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${cartDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={20} className="text-gold" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">Your Order</h3>
          </div>
          <button onClick={() => setCartDrawerOpen(false)} className="text-zinc-500 hover:text-white p-1 transition">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body (Items) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b border-zinc-900/40 pb-4">
              <div className="flex-1 pr-4">
                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                <span className="text-[10px] text-zinc-500 font-mono">₹{parseFloat(item.price).toFixed(2)} each</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-0.5">
                  <button onClick={() => handleDecrement(item.id)} className="p-1 hover:text-gold text-zinc-500 transition"><Minus size={10} /></button>
                  <span className="text-[11px] font-bold font-mono text-white">{item.quantity}</span>
                  <button onClick={() => handleIncrement(item.id)} className="p-1 hover:text-gold text-zinc-500 transition"><Plus size={10} /></button>
                </div>
                <span className="text-xs font-bold text-gold font-mono w-16 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => handleRemove(item.id)} className="text-zinc-600 hover:text-red-500 p-1 transition"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs text-center space-y-3 py-16">
              <ShoppingCart size={32} className="stroke-[1.5] text-zinc-800" />
              <p>Your shopping cart is empty.</p>
              <button onClick={() => setCartDrawerOpen(false)} className="text-gold hover:underline font-bold uppercase tracking-wider text-[10px]">Add dishes</button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-900 bg-zinc-950/40 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-zinc-400">Subtotal:</span>
              <span className="text-base font-bold text-gold font-mono">₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => { setCartDrawerOpen(false); setCheckoutModalOpen(true); }}
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-black font-extrabold rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-gold-lg"
            >
              <span>Proceed to Checkout</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* --- CHECKOUT MODAL --- */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99998] flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#09090b]/98 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Standard Checkout Form Screen */}
            <>
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <div className="flex items-center space-x-2">
                  <Gift size={20} className="text-gold" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-serif">Checkout Details</h3>
                </div>
                <button 
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Your Name *</label>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-gold rounded-xl text-white text-xs focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number (First-time check) *</label>
                  <input 
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-gold rounded-xl text-white text-xs focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address (Optional)</label>
                  <input 
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 focus:border-gold rounded-xl text-white text-xs focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Eligibility Verification Messages */}
              {loadingEligibility && (
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex items-center space-x-3 text-xs text-zinc-400">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking first-time customer discount eligibility...</span>
                </div>
              )}

              {eligibilityResult && (
                <div className={`border rounded-xl p-4 flex items-start space-x-3 text-xs ${
                  eligibilityResult.eligible 
                    ? 'bg-gold/5 border-gold/30 text-gold shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                    : eligibilityResult.isBelowMinAmount
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {eligibilityResult.eligible ? (
                    <>
                      <Gift size={16} className="mt-0.5 flex-shrink-0 text-gold animate-pulse" />
                      <div>
                        <p className="font-bold text-white mb-0.5">
                          {eligibilityResult.isAutomaticFirstOrder ? '🎉 Congratulations!' : '🎉 Discount Eligible!'}
                        </p>
                        <p className="leading-relaxed">
                          {eligibilityResult.isAutomaticFirstOrder ? (
                            `Your first order discount of ₹${eligibilityResult.discountAmount} has been applied.`
                          ) : (
                            <>
                              A first-time customer discount has been applied successfully. 
                              Value: <span className="font-bold text-white">{
                                eligibilityResult.discount?.discount_type === 'percentage' 
                                  ? `${eligibilityResult.discount.discount_value}%` 
                                  : `₹${eligibilityResult.discount.discount_value}`
                              } Off</span>
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${eligibilityResult.isBelowMinAmount ? 'text-blue-400' : 'text-red-400'}`} />
                      <div>
                        <p className="font-semibold text-white mb-0.5">
                          {eligibilityResult.isBelowMinAmount ? 'First Order Offer' : 'Offer Status'}
                        </p>
                        <p className="leading-relaxed">{eligibilityResult.reason}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Items Summary */}
              <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-900/80 space-y-2">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Order Summary</span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-[11px] text-zinc-400">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 border-t border-zinc-900 pt-3 text-[11px] font-medium font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {eligibilityResult?.eligible && (
                    <div className="flex justify-between text-gold">
                      <span>First Order Discount:</span>
                      <span>-₹{eligibilityResult.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-xs pt-1.5 border-t border-zinc-900/60">
                    <span>Final Total:</span>
                    <span className="text-gold">₹{(eligibilityResult?.eligible ? eligibilityResult.finalAmount : cartSubtotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Checkout Button */}
              <div className="pt-2">
                <button 
                  onClick={handlePlaceOrder}
                  disabled={checkoutSubmitting || loadingEligibility}
                  className="w-full py-3.5 bg-gold hover:bg-gold-light disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-extrabold rounded-xl transition text-xs uppercase tracking-wider shadow-gold-lg flex items-center justify-center space-x-2"
                >
                  <MessageSquare size={14} />
                  <span>{checkoutSubmitting ? 'Placing Order...' : 'Place Order on WhatsApp'}</span>
                </button>
              </div>
            </>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-[#050506] border-t border-zinc-900/60 py-16 text-xs text-zinc-500 select-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center bg-gold/5 font-serif font-bold text-sm text-gold">
                {logoText.name.substring(0, 2).toUpperCase()}
              </div>
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
                  <button onClick={() => handleNavClick(sec)} className="hover:text-gold transition uppercase text-[10px] tracking-wide font-medium">{sec}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Menu Categories</h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map(c => (
                <li key={c.id}>
                  <button onClick={() => { setSelectedCategory(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold transition text-left">{c.name}</button>
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
