import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import CustomerSite from './components/CustomerSite';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import MenuPage from './components/MenuPage';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Dynamic Content States
  const [websiteSettings, setWebsiteSettings] = useState({ status: 'online', theme: 'dark' });
  const [restaurantSettings, setRestaurantSettings] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [heroSection, setHeroSection] = useState({});
  const [qrCode, setQRCode] = useState({ qr_image_url: null, destination_url: '' });
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [gallery, setGallery] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('mythri_admin_token'));
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('mythri_admin_user') || 'null'));

  // Listen to hash changes for simple client-side routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch initial data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        webSets,
        restSets,
        contact,
        hero,
        qr,
        cats,
        items,
        images,
        feedback
      ] = await Promise.all([
        api.getWebsiteSettings(),
        api.getRestaurantSettings(),
        api.getContactInformation(),
        api.getHeroSection(),
        api.getQRCode(),
        api.getCategories(),
        api.getMenuItems(),
        api.getGallery(),
        api.getReviews()
      ]);

      setWebsiteSettings(webSets);
      setRestaurantSettings(restSets);
      setContactInfo(contact);
      setHeroSection(hero);
      setQRCode(qr);
      setCategories(cats);
      setMenuItems(items);
      setGallery(images);
      setReviews(feedback);
      setError(null);

      // Fetch admin data if logged in and on the admin route
      if (isAdmin && route === '#/admin') {
        try {
          const [orderList, discountList] = await Promise.all([
            api.getOrders(),
            api.getDiscounts()
          ]);
          setOrders(orderList);
          setDiscounts(discountList);
        } catch (e) {
          console.error('Error loading admin orders/discounts:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching database data:', err);
      setError('Could not connect to the API server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isAdmin]); // Refetch when admin status changes

  // Fetch admin orders/discounts on route change to #/admin
  useEffect(() => {
    if (isAdmin && route === '#/admin') {
      const loadAdminData = async () => {
        try {
          const [orderList, discountList] = await Promise.all([
            api.getOrders(),
            api.getDiscounts()
          ]);
          setOrders(orderList);
          setDiscounts(discountList);
        } catch (e) {
          console.error('Error loading admin data on route transition:', e);
        }
      };
      loadAdminData();
    }
  }, [route, isAdmin]);

  // BroadcastChannel for cross-tab realtime updates (same browser)
  const realtimeChannel = React.useMemo(() => new BroadcastChannel('mythri_realtime_channel'), []);

  const handleRealtimeUpdate = React.useCallback((type, data) => {
    switch (type) {
      case 'website_settings':
        setWebsiteSettings(data);
        break;
      case 'restaurant_settings':
        setRestaurantSettings(data);
        break;
      case 'contact_information':
        setContactInfo(data);
        break;
      case 'hero_section':
        setHeroSection(data);
        break;
      case 'qr_codes':
        setQRCode(data);
        break;
      case 'menu_categories':
        if (data.action === 'create') {
          setCategories(prev => {
            if (prev.some(c => c.id === data.category.id)) return prev;
            return [...prev, data.category].sort((a, b) => a.display_order - b.display_order);
          });
        } else if (data.action === 'update') {
          setCategories(prev => prev.map(c => c.id === data.category.id ? data.category : c).sort((a, b) => a.display_order - b.display_order));
        } else if (data.action === 'delete') {
          setCategories(prev => prev.filter(c => c.id !== data.id));
          setMenuItems(prev => prev.filter(item => item.category_id !== data.id));
        }
        break;
      case 'menu_items':
        if (data.action === 'create') {
          setMenuItems(prev => {
            if (prev.some(item => item.id === data.item.id)) return prev;
            return [...prev, data.item].sort((a, b) => a.display_order - b.display_order);
          });
        } else if (data.action === 'update') {
          setMenuItems(prev => prev.map(item => item.id === data.item.id ? data.item : item).sort((a, b) => a.display_order - b.display_order));
        } else if (data.action === 'delete') {
          setMenuItems(prev => prev.filter(item => item.id !== data.id));
        }
        break;
      case 'gallery_images':
        if (data.action === 'create') {
          setGallery(prev => {
            if (prev.some(img => img.id === data.image.id)) return prev;
            return [...prev, data.image].sort((a, b) => a.display_order - b.display_order);
          });
        } else if (data.action === 'delete') {
          setGallery(prev => prev.filter(img => img.id !== data.id));
        }
        break;
      case 'reviews':
        if (data.action === 'create') {
          setReviews(prev => {
            if (prev.some(r => r.id === data.review.id)) return prev;
            return [data.review, ...prev];
          });
        } else if (data.action === 'update') {
          setReviews(prev => prev.map(r => r.id === data.review.id ? data.review : r));
        } else if (data.action === 'delete') {
          setReviews(prev => prev.filter(r => r.id !== data.id));
        }
        break;
      case 'first_order_discounts':
        if (data.action === 'create') {
          setDiscounts(prev => {
            if (prev.some(d => d.id === data.discount.id)) return prev;
            return [data.discount, ...prev];
          });
        } else if (data.action === 'update') {
          setDiscounts(prev => prev.map(d => d.id === data.discount.id ? data.discount : d));
        } else if (data.action === 'delete') {
          setDiscounts(prev => prev.filter(d => d.id !== data.id));
        }
        break;
      case 'orders':
        if (data.action === 'create') {
          setOrders(prev => {
            if (prev.some(o => o.id === data.order.id)) return prev;
            return [data.order, ...prev];
          });
        } else if (data.action === 'update') {
          setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
        }
        break;
      default:
        break;
    }
  }, []);

  // Listen to BroadcastChannel updates
  useEffect(() => {
    const handleChannelMessage = (event) => {
      const { type, data } = event.data;
      console.log('BroadcastChannel message received:', type, data);
      handleRealtimeUpdate(type, data);
    };
    realtimeChannel.addEventListener('message', handleChannelMessage);
    return () => {
      realtimeChannel.removeEventListener('message', handleChannelMessage);
    };
  }, [realtimeChannel, handleRealtimeUpdate]);

  // Set up Realtime Updates Listener (SSE)
  useEffect(() => {
    const unsubscribe = api.subscribeToRealtime((payload) => {
      const { type, data } = payload;
      console.log('Realtime Update Received via SSE:', type, data);
      
      // Update local state
      handleRealtimeUpdate(type, data);

      // Broadcast to other tabs of the same browser
      try {
        realtimeChannel.postMessage({ type, data });
      } catch (err) {
        console.error('Error posting to BroadcastChannel:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [realtimeChannel, handleRealtimeUpdate]);

  const handleLogin = async (user, token) => {
    localStorage.setItem('mythri_admin_token', token);
    localStorage.setItem('mythri_admin_user', JSON.stringify(user));
    setIsAdmin(true);
    setAdminUser(user);
    // Prefetch admin data immediately to avoid delay
    try {
      const [orderList, discountList] = await Promise.all([
        api.getOrders(),
        api.getDiscounts()
      ]);
      setOrders(orderList);
      setDiscounts(discountList);
    } catch (e) {
      console.error('Error fetching admin data on login:', e);
    }
    window.location.hash = '#/admin';
  };

  const handleLogout = () => {
    localStorage.removeItem('mythri_admin_token');
    localStorage.removeItem('mythri_admin_user');
    setIsAdmin(false);
    setAdminUser(null);
    setOrders([]);
    setDiscounts([]);
    window.location.hash = '#/login';
  };

  // Render Routes
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-400 font-medium tracking-wide animate-pulse">Loading Mythri Restaurant...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-16 h-16 bg-red-950/30 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center text-2xl font-bold mb-4">!</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="max-w-md text-zinc-400 text-sm mb-6">{error}</p>
          <button 
            onClick={fetchAllData}
            className="px-6 py-2 bg-gold hover:bg-gold-light text-black font-semibold rounded-lg transition"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    if (route === '#/login') {
      return <AdminLogin onLogin={handleLogin} isAdmin={isAdmin} />;
    }

    if (route.startsWith('#/reset-password')) {
      return <ResetPassword />;
    }

    if (route === '#/menu') {
      return (
        <MenuPage 
          websiteSettings={websiteSettings}
          restaurantSettings={restaurantSettings}
          contactInfo={contactInfo}
          categories={categories}
          menuItems={menuItems}
        />
      );
    }

    if (route === '#/admin') {
      return (
        <AdminDashboard 
          isAdmin={isAdmin}
          adminUser={adminUser}
          onLogout={handleLogout}
          websiteSettings={websiteSettings}
          restaurantSettings={restaurantSettings}
          contactInfo={contactInfo}
          heroSection={heroSection}
          qrCode={qrCode}
          categories={categories}
          menuItems={menuItems}
          gallery={gallery}
          reviews={reviews}
          orders={orders}
          discounts={discounts}
        />
      );
    }

    // Default Customer Site (covers #/ and anything else)
    return (
      <CustomerSite 
        websiteSettings={websiteSettings}
        restaurantSettings={restaurantSettings}
        contactInfo={contactInfo}
        heroSection={heroSection}
        qrCode={qrCode}
        categories={categories}
        menuItems={menuItems}
        gallery={gallery}
        reviews={reviews}
      />
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 antialiased select-none">
      {renderContent()}
    </div>
  );
}
