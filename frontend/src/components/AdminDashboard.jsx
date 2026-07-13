import React, { useState, useEffect } from 'react';

import { api } from '../services/api';
import { 
  LayoutDashboard, 
  Utensils, 
  Flame, 
  Info, 
  Phone, 
  Image as ImageIcon, 
  QrCode, 
  Home, 
  Star, 
  Settings, 
  User, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Save, 
  Check,
  RefreshCw,
  Search,
  Download,
  Gift,
  ShoppingBag
} from 'lucide-react';

export default function AdminDashboard({ 
  isAdmin, 
  adminUser, 
  onLogout,
  websiteSettings,
  restaurantSettings,
  contactInfo,
  heroSection,
  qrCode,
  categories,
  menuItems,
  gallery,
  reviews,
  orders = [],
  discounts = []
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Forms states
  const [categoryForm, setCategoryForm] = useState({ name: '', display_order: 0, isEdit: false, id: null });
  const [itemForm, setItemForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', status: 'visible', is_popular: false, display_order: 0, isEdit: false, id: null });
  const [infoForm, setInfoForm] = useState({ ...restaurantSettings });
  const [contactForm, setContactForm] = useState({ ...contactInfo });
  const [heroForm, setHeroForm] = useState({ ...heroSection });
  const [todaysSpecialForm, setTodaysSpecialForm] = useState({
    dish_name: heroSection?.todays_special_name || '',
    dish_image: heroSection?.todays_special_image || ''
  });
  const [specialUploadType, setSpecialUploadType] = useState('file'); // 'file' or 'url'
  const [specialFileError, setSpecialFileError] = useState('');
  const [specialUrlError, setSpecialUrlError] = useState('');
  const [qrForm, setQrForm] = useState({ ...qrCode });
  const [reviewForm, setReviewForm] = useState({ customer_name: '', review_text: '', rating: 5, photo_url: '', status: 'visible', isEdit: false, id: null });
  const [galleryForm, setGalleryForm] = useState({ image_url: '', category: 'Food', display_order: 0 });
  const [galleryUploadType, setGalleryUploadType] = useState('file'); // 'file' or 'url'
  const [galleryFileError, setGalleryFileError] = useState('');
  const [settingsForm, setSettingsForm] = useState({ ...websiteSettings });
  const [quickImageCatFilter, setQuickImageCatFilter] = useState('all');
  const [dishUploadType, setDishUploadType] = useState('file'); // 'file' or 'url'
  const [dishFileError, setDishFileError] = useState('');
  const [catUploadModes, setCatUploadModes] = useState({});
  const [catUrlInputs, setCatUrlInputs] = useState({});

  // Filtering states
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCat, setMenuFilterCat] = useState('all');

  // Discount states & forms
  const [discountSearch, setDiscountSearch] = useState('');
  const [discountFilter, setDiscountFilter] = useState('All');
  const [assignForm, setAssignForm] = useState({
    customer_phone: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount: '',
    expiry_date: '',
    notes: '',
    status: 'Active',
    isEdit: false,
    id: null
  });

  // Order states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');

  // Automatic First-Order Offer states
  const [firstOrderSettings, setFirstOrderSettings] = useState({
    enabled: websiteSettings?.first_order_discount_enabled !== false,
    minAmount: websiteSettings?.first_order_min_amount !== undefined ? websiteSettings.first_order_min_amount : 250,
    discountAmount: websiteSettings?.first_order_discount_amount !== undefined ? websiteSettings.first_order_discount_amount : 100
  });

  const [firstOrderHistorySearch, setFirstOrderHistorySearch] = useState('');
  const [firstOrderHistoryStatus, setFirstOrderHistoryStatus] = useState('All');
  const [firstOrderHistoryStartDate, setFirstOrderHistoryStartDate] = useState('');
  const [firstOrderHistoryEndDate, setFirstOrderHistoryEndDate] = useState('');

  // Sync settings when the websiteSettings prop updates
  useEffect(() => {
    if (websiteSettings) {
      setFirstOrderSettings({
        enabled: websiteSettings.first_order_discount_enabled !== false,
        minAmount: websiteSettings.first_order_min_amount !== undefined ? websiteSettings.first_order_min_amount : 250,
        discountAmount: websiteSettings.first_order_discount_amount !== undefined ? websiteSettings.first_order_discount_amount : 100
      });
    }
  }, [websiteSettings]);

  // Sync hero settings and Today's Special when the heroSection prop updates
  useEffect(() => {
    if (heroSection) {
      setHeroForm({ ...heroSection });
      setTodaysSpecialForm({
        dish_name: heroSection.todays_special_name || '',
        dish_image: heroSection.todays_special_image || ''
      });
    }
  }, [heroSection]);

  const handleFirstOrderSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateWebsiteSettings({
        ...websiteSettings,
        first_order_discount_enabled: firstOrderSettings.enabled,
        first_order_min_amount: parseFloat(firstOrderSettings.minAmount),
        first_order_discount_amount: parseFloat(firstOrderSettings.discountAmount)
      });
      triggerSuccess('First-Order Offer settings updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update First-Order Offer settings');
    } finally {
      setActionLoading(false);
    }
  };

  const exportFirstOrderHistoryToCSV = (filteredHistory) => {
    // CSV headers
    const headers = [
      'Phone Number',
      'Discount Applied',
      'First Order Discount Status',
      'Order ID',
      'Order Date',
      'Customer Name',
      'Order Amount',
      'Discount Amount',
      'Final Amount',
      'Reason'
    ];

    // Map filtered history to CSV rows
    const rows = filteredHistory.map(item => [
      `"${(item.customer_phone || '').replace(/"/g, '""')}"`,
      item.discount_amount > 0 ? 'Yes' : 'No',
      item.is_first_order ? 'Used' : 'Not Used',
      `"${(item.id || '').replace(/"/g, '""')}"`,
      `"${new Date(item.created_at).toLocaleString()}"`,
      `"${(item.customer_name || '').replace(/"/g, '""')}"`,
      item.original_amount,
      item.discount_amount,
      item.final_amount,
      `"${(item.first_order_discount_reason || '').replace(/"/g, '""')}"`
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `first_order_discount_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Handle mobile body scroll lock when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up when unmounting
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isSidebarOpen]);

  const getCustomerNameByPhone = (phone) => {
    const d = discounts.find(x => x.customer_phone === phone);
    if (d && d.notes && d.notes.startsWith('For: ')) {
      return d.notes.substring(5).split(' |')[0];
    }
    const order = orders.find(o => o.customer_phone === phone);
    return order ? order.customer_name : 'New Customer';
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const discountData = {
        customer_phone: assignForm.customer_phone.replace(/\D/g, ''),
        discount_type: assignForm.discount_type,
        discount_value: parseFloat(assignForm.discount_value) || 0,
        minimum_order_amount: parseFloat(assignForm.minimum_order_amount) || 0,
        maximum_discount: assignForm.maximum_discount ? parseFloat(assignForm.maximum_discount) : null,
        expiry_date: assignForm.expiry_date || null,
        notes: assignForm.notes,
        status: assignForm.status
      };

      if (assignForm.isEdit) {
        await api.updateDiscount(assignForm.id, discountData);
        triggerSuccess('Discount updated successfully!');
      } else {
        await api.createDiscount(discountData);
        triggerSuccess('Discount assigned successfully!');
      }
      
      setAssignForm({
        customer_phone: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '',
        maximum_discount: '',
        expiry_date: '',
        notes: '',
        status: 'Active',
        isEdit: false,
        id: null
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      try {
        await api.deleteDiscount(id);
        triggerSuccess('Discount deleted successfully!');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, { order_status: status });
      triggerSuccess(`Order status changed to ${status}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, { payment_status: status });
      triggerSuccess(`Payment status changed to ${status}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Computed stats for Dashboard & Panels
  const totalDiscounts = discounts.length;
  const activeDiscounts = discounts.filter(d => d.status === 'Active').length;
  const usedDiscounts = discounts.filter(d => d.status === 'Used').length;
  const expiredDiscounts = discounts.filter(d => d.status === 'Expired').length;
  const totalDiscountValueGiven = discounts
    .filter(d => d.status === 'Used')
    .reduce((acc, d) => {
      const order = orders.find(o => o.discount_id === d.id);
      return acc + (order ? order.discount_amount : 0);
    }, 0);

  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.order_status === 'Completed').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'Paid')
    .reduce((acc, o) => acc + o.final_amount, 0);

  // Trigger temporary success notification
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Redirect if not logged in
  if (!isAdmin) {
    window.location.hash = '#/login';
    return null;
  }

  // --- IMAGE UPLOAD HELPER ---
  const handleImageUpload = async (e, onUrlChange) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await api.uploadImage(file);
      if (res.success) {
        onUrlChange(res.file_path);
        triggerSuccess('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- SUBMIT HANDLERS ---

  // Category Submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (categoryForm.isEdit) {
        await api.updateCategory(categoryForm.id, { name: categoryForm.name, display_order: categoryForm.display_order });
        triggerSuccess('Category updated!');
      } else {
        await api.createCategory(categoryForm.name, categoryForm.display_order);
        triggerSuccess('Category created!');
      }
      setCategoryForm({ name: '', display_order: 0, isEdit: false, id: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDishImage = async (dish, file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.uploadImage(file);
      if (res.success) {
        const itemData = {
          name: dish.name,
          price: parseFloat(dish.price) || 0,
          category_id: dish.category_id,
          description: dish.description,
          image_url: res.file_path,
          status: dish.status,
          is_popular: !!dish.is_popular,
          display_order: parseInt(dish.display_order) || 0
        };
        await api.updateMenuItem(dish.id, itemData);
        triggerSuccess(`Image for "${dish.name}" updated successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update dish image: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDishImage = async (dish) => {
    if (!window.confirm(`Are you sure you want to remove the image for "${dish.name}"?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const itemData = {
        name: dish.name,
        price: parseFloat(dish.price) || 0,
        category_id: dish.category_id,
        description: dish.description,
        image_url: '',
        status: dish.status,
        is_popular: !!dish.is_popular,
        display_order: parseInt(dish.display_order) || 0
      };
      await api.updateMenuItem(dish.id, itemData);
      triggerSuccess(`Image for "${dish.name}" removed successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to remove dish image: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCatUrl = async (c, url) => {
    if (!url) {
      alert('Please enter a valid image URL');
      return;
    }
    const allowedExtensions = /\.(jpeg|jpg|png|webp|gif)/i;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image')) {
      alert('Please enter a valid HTTP or HTTPS image URL link.');
      return;
    }
    if (!allowedExtensions.test(url) && !url.startsWith('data:image')) {
      alert('The URL does not seem to point to a supported image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }
    try {
      setActionLoading(true);
      await api.updateCategory(c.id, { image_url: url });
      triggerSuccess(`Category image for "${c.name}" updated successfully!`);
    } catch (err) {
      alert('Failed to update category image: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Menu Item Submit
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const itemData = {
        name: itemForm.name,
        price: parseFloat(itemForm.price) || 0,
        category_id: itemForm.category_id,
        description: itemForm.description,
        image_url: itemForm.image_url,
        status: itemForm.status,
        is_popular: !!itemForm.is_popular,
        display_order: parseInt(itemForm.display_order) || 0
      };

      if (itemForm.isEdit) {
        await api.updateMenuItem(itemForm.id, itemData);
        triggerSuccess('Menu item updated!');
      } else {
        if (!itemData.category_id && categories.length > 0) {
          itemData.category_id = categories[0].id;
        }
        await api.createMenuItem(itemData);
        triggerSuccess('Menu item created!');
      }
      setItemForm({ name: '', price: '', category_id: '', description: '', image_url: '', status: 'visible', is_popular: false, display_order: 0, isEdit: false, id: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Restaurant Info Submit
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateRestaurantSettings(infoForm);
      triggerSuccess('Restaurant settings saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Contact Info Submit
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateContactInformation(contactForm);
      triggerSuccess('Contact information saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Hero Section Submit
  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateHeroSection(heroForm);
      triggerSuccess('Hero section settings saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpecialFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSpecialFileError("Invalid format. Choose JPG, JPEG, PNG, or WEBP.");
      return;
    }
    setSpecialFileError('');

    try {
      setUploading(true);
      const res = await api.uploadImage(file);
      if (res.success) {
        setTodaysSpecialForm(prev => ({
          ...prev,
          dish_image: res.file_path
        }));
        triggerSuccess("Image uploaded successfully!");
      }
    } catch (err) {
      console.error(err);
      setSpecialFileError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSpecialUrlChange = (e) => {
    const val = e.target.value;
    setTodaysSpecialForm(prev => ({ ...prev, dish_image: val }));
    
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      setSpecialUrlError("Please enter a valid absolute URL (starting with http:// or https://)");
    } else {
      setSpecialUrlError('');
    }
  };

  const handleTodaysSpecialSubmit = async (e) => {
    e.preventDefault();
    if (!todaysSpecialForm.dish_name.trim()) {
      alert("Dish name cannot be empty");
      return;
    }
    if (!todaysSpecialForm.dish_image.trim()) {
      alert("Please upload an image or provide a valid URL");
      return;
    }

    if (specialUploadType === 'url') {
      try {
        new URL(todaysSpecialForm.dish_image);
      } catch (_) {
        setSpecialUrlError("Please enter a valid absolute URL (starting with http:// or https://)");
        return;
      }
    }

    try {
      setActionLoading(true);
      const updatedHero = {
        ...heroSection,
        todays_special_name: todaysSpecialForm.dish_name.trim(),
        todays_special_image: todaysSpecialForm.dish_image.trim()
      };
      await api.updateHeroSection(updatedHero);
      triggerSuccess("Today's Special updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to save Today's Special changes");
    } finally {
      setActionLoading(false);
    }
  };

  // QR Code Submit
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateQRCode(qrForm);
      triggerSuccess('QR menu details saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (reviewForm.isEdit) {
        await api.updateReview(reviewForm.id, reviewForm);
        triggerSuccess('Review updated!');
      } else {
        await api.addReview(reviewForm);
        triggerSuccess('Review added!');
      }
      setReviewForm({ customer_name: '', review_text: '', rating: 5, photo_url: '', status: 'visible', isEdit: false, id: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Gallery Image Submit
  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryForm.image_url) {
      alert('Please upload or enter an image URL');
      return;
    }
    try {
      setActionLoading(true);
      await api.addGalleryImage(galleryForm.image_url, galleryForm.category, galleryForm.display_order);
      triggerSuccess('Image added to gallery!');
      setGalleryForm({ image_url: '', category: 'Food', display_order: 0 });
      setGalleryFileError('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Website Global Settings Submit
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.updateWebsiteSettings(settingsForm);
      triggerSuccess('Global website settings saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Handlers
  const handleDeleteCategory = async (id) => {
    if (confirm('Are you sure? This will delete all dishes inside this category too!')) {
      try {
        await api.deleteCategory(id);
        triggerSuccess('Category deleted');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Delete this menu item?')) {
      try {
        await api.deleteMenuItem(id);
        triggerSuccess('Menu item deleted');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteReview = async (id) => {
    if (confirm('Delete this review?')) {
      try {
        await api.deleteReview(id);
        triggerSuccess('Review deleted');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteGallery = async (id) => {
    if (confirm('Delete this image from gallery?')) {
      try {
        await api.deleteGalleryImage(id);
        triggerSuccess('Gallery image deleted');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const menuList = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', name: 'Menu Management', icon: Utensils },
    { id: 'category_images', name: 'Category Images', icon: ImageIcon },
    { id: 'orders', name: 'Order History', icon: ShoppingBag },
    { id: 'discounts', name: 'Customer Discounts', icon: Gift },
    { id: 'info', name: 'Restaurant Settings', icon: Info },
    { id: 'contact', name: 'Contact Info', icon: Phone },
    { id: 'gallery', name: 'Gallery', icon: ImageIcon },
    { id: 'qr', name: 'QR Menu Management', icon: QrCode },
    { id: 'hero', name: 'Hero Section Management', icon: Home },
    { id: 'reviews', name: 'Customer Reviews', icon: Star },
    { id: 'settings', name: 'Website Settings', icon: Settings },
  ];

  // Helper to resolve category name from ID
  const getCatName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Unassigned';
  };

  return (
    <div className="min-h-screen bg-[#070708] flex text-zinc-300">
      
      {/* SUCCESS MESSAGE FLOATER */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-zinc-900 border border-gold/30 text-gold flex items-center space-x-2 shadow-2xl animate-bounce">
          <Check size={18} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0a0c] border-r border-zinc-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}

      `}>
        <div className="h-16 px-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/MY3Logo.jpg" className="w-8 h-8 rounded-full object-cover border border-gold/30" alt="" />
            <span className="text-white font-bold text-sm tracking-widest uppercase">Admin</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">✕</button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuList.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => { setActiveTab(m.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-all duration-200
                  ${activeTab === m.id 
                    ? 'bg-gold/10 text-gold border-l-2 border-gold font-bold shadow-sm' 
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center space-x-3 px-4 py-3 mb-4 rounded-xl bg-zinc-900/40">
            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">
              {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminUser?.name || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{adminUser?.email || 'admin@mythri.com'}</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsSidebarOpen(false); onLogout(); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-red-500/10 text-red-400 hover:bg-red-950/15 transition-colors text-[13px] font-semibold"

          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* BLOCKER FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white p-1"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {menuList.find(m => m.id === activeTab)?.name}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <a 
              href="#/" 
              className="px-4 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white flex items-center space-x-1.5"
            >
              <span>Visit Site</span>
              <span>↗</span>
            </a>
          </div>
        </header>

        {/* Dynamic Panels */}
        <main className="p-6 md:p-8 flex-1">
          
          {/* ============================================================== */}
          {/* TAB: DASHBOARD OVERVIEW */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                
                <div className="glass-panel p-5 rounded-2xl">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Menu Items</p>
                  <h3 className="text-3xl font-bold text-white font-serif mt-2">{menuItems.length}</h3>
                  <div className="text-[10px] text-zinc-400 mt-1">Active inside menu</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Orders Logged</p>
                  <h3 className="text-3xl font-bold text-white font-serif mt-2">{totalOrdersCount}</h3>
                  <div className="text-[10px] text-zinc-400 mt-1">{completedOrdersCount} completed checkouts</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Revenue (Paid)</p>
                  <h3 className="text-3xl font-bold text-gold font-serif mt-2">₹{totalRevenue.toFixed(2)}</h3>
                  <div className="text-[10px] text-zinc-400 mt-1">From simulated payments</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Discounts</p>
                  <h3 className="text-3xl font-bold text-white font-serif mt-2">{activeDiscounts}</h3>
                  <div className="text-[10px] text-zinc-400 mt-1">{usedDiscounts} used / {expiredDiscounts} expired</div>
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Restaurant Quick Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 text-xs">Primary Phone</p>
                      <p className="text-white font-semibold mt-0.5">{contactInfo.primary_phone || '9676576392'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">WhatsApp Business Number</p>
                      <p className="text-gold font-semibold mt-0.5">{contactInfo.whatsapp_number || '9676576392'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">Opening Hours (Weekday)</p>
                      <p className="text-white mt-0.5">{restaurantSettings.opening_hours?.weekday || '11:00 AM - 11:00 PM'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">Website Status</p>
                      <p className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5
                        ${websiteSettings.status === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${websiteSettings.status === 'online' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                        <span>{websiteSettings.status === 'online' ? 'Online' : 'Maintenance'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Realtime CDC State</h3>
                    <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                      Your Mythri management console is actively connected to the server. Any changes you make to the menu, prices, or contact details propagate <strong>instantly</strong> to all open devices without requiring refreshes.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-green-400 font-semibold pt-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                    <span>Live Synchronization Enabled</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: MENU CATEGORY IMAGE MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'category_images' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide">Menu Category Image Management</h3>
                <p className="text-[10px] text-zinc-550 mt-0.5">Upload or replace high-quality background images for the 8 category cards displayed on the website Home page.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.slice(0, 8).map(c => {
                  let fallbackImg = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                  if (c.name.includes("Biryani")) {
                    fallbackImg = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80";
                  } else if (c.name.includes("Starter")) {
                    if (c.name.includes("Veg")) {
                      fallbackImg = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80";
                    } else {
                      fallbackImg = "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80";
                    }
                  } else if (c.name.includes("Curry") || c.name.includes("Curries")) {
                    fallbackImg = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                  } else if (c.name.includes("Tandoori") || c.name.includes("Kebab")) {
                    fallbackImg = "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80";
                  } else if (c.name.includes("Roti") || c.name.includes("Naan")) {
                    fallbackImg = "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80";
                  } else if (c.name.includes("Mandi")) {
                    fallbackImg = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80";
                  } else if (c.name.includes("Beverage") || c.name.includes("Beverages")) {
                    fallbackImg = "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80";
                  }

                  const currentImg = c.image_url || fallbackImg;
                  const currentMode = catUploadModes[c.id] || 'file';

                  return (
                    <div key={c.id} className="glass-panel p-4 rounded-2xl flex flex-col space-y-4 border border-zinc-900 bg-zinc-950/20 hover:border-zinc-800/80 transition duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white font-serif tracking-wide">{c.name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Category Background</p>
                        </div>
                        {c.image_url && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to reset the image for "${c.name}" to default?`)) return;
                              try {
                                setActionLoading(true);
                                await api.updateCategory(c.id, { image_url: '' });
                                setCatUrlInputs(prev => ({ ...prev, [c.id]: '' }));
                                triggerSuccess(`Category image for "${c.name}" reset to default!`);
                              } catch (err) {
                                alert('Failed to reset image: ' + err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className="text-[9px] px-1.5 py-0.5 border border-red-500/20 hover:bg-red-950/20 text-red-400 font-bold rounded transition"
                            title="Reset to Default Image"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Image Preview Container */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-850">
                        <img src={currentImg} className="w-full h-full object-cover" alt={c.name} />
                        {!c.image_url && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-950/80 text-[8px] uppercase tracking-wider text-gold font-bold border border-gold/25">
                            Default Fallback
                          </div>
                        )}
                      </div>

                      {/* Option Selector Toggle */}
                      <div className="flex border-b border-zinc-900/60 pb-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCatUploadModes(prev => ({ ...prev, [c.id]: 'file' }))}
                          className={`flex-1 py-1 font-bold text-center border-b-2 uppercase transition-all duration-200 ${currentMode === 'file' ? 'border-gold text-white font-extrabold' : 'border-transparent text-zinc-500'}`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatUploadModes(prev => ({ ...prev, [c.id]: 'url' }))}
                          className={`flex-1 py-1 font-bold text-center border-b-2 uppercase transition-all duration-200 ${currentMode === 'url' ? 'border-gold text-white font-extrabold' : 'border-transparent text-zinc-500'}`}
                        >
                          Image URL
                        </button>
                      </div>

                      {/* Options Input View */}
                      <div className="text-[11px]">
                        {currentMode === 'file' ? (
                          <label className="w-full py-2 bg-zinc-850 hover:bg-zinc-700 cursor-pointer rounded-lg border border-zinc-750 text-zinc-300 text-xs font-bold flex items-center justify-center transition space-x-1.5">
                            <Upload size={13} />
                            <span>Upload Image</span>
                            <input 
                              type="file" 
                              accept="image/jpeg,image/jpg,image/png,image/webp" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                if (!allowedTypes.includes(file.type)) {
                                  alert('Supported formats are JPG, JPEG, PNG, or WEBP.');
                                  return;
                                }

                                try {
                                  setActionLoading(true);
                                  const res = await api.uploadImage(file);
                                  if (res.success) {
                                    await api.updateCategory(c.id, { image_url: res.file_path });
                                    triggerSuccess(`Category image for "${c.name}" updated successfully!`);
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to upload category image: ' + err.message);
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={catUrlInputs[c.id] !== undefined ? catUrlInputs[c.id] : (c.image_url || '')}
                              onChange={(e) => setCatUrlInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                              placeholder="Paste Image URL"
                              className="flex-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-gold/40 text-white rounded-lg text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const url = catUrlInputs[c.id];
                                handleSaveCatUrl(c, url !== undefined ? url : (c.image_url || ''));
                              }}
                              className="px-3 py-1.5 bg-gold hover:bg-gold-light text-black font-extrabold rounded-lg transition"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: MENU MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'menu' && (
            <div className="space-y-8">
                     {/* DISH IMAGE QUICK MANAGEMENT SECTION */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-zinc-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">Dish Image Quick Management</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Quickly view, upload, or replace images for any menu item directly from your device.</p>
                  </div>
                  <select 
                    onChange={(e) => setQuickImageCatFilter(e.target.value)}
                    value={quickImageCatFilter}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {menuItems
                    .filter(item => quickImageCatFilter === 'all' || item.category_id === quickImageCatFilter)
                    .map(item => {
                      const catName = categories.find(c => c.id === item.category_id)?.name || 'Unassigned';
                      return (
                        <div key={item.id} className="relative group rounded-xl p-3 bg-zinc-900/40 border border-zinc-800/80 hover:border-gold/20 flex flex-col justify-between space-y-3 transition text-[11px]">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/50 shrink-0">
                              {item.image_url ? (
                                <img src={`${item.image_url}${item.image_url.includes('?') ? '&' : '?'}t=${item.updated_at ? new Date(item.updated_at).getTime() : (item.created_at ? new Date(item.created_at).getTime() : '')}`} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600 font-semibold bg-zinc-900 uppercase">No Img</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-white font-bold truncate">{item.name}</h4>
                              <p className="text-zinc-500 text-[10px] font-medium truncate mt-0.5">{catName}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 w-full">
                            <label className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-lg border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center transition space-x-1">
                              <Upload size={10} />
                              <span>Upload</span>
                              <input 
                                type="file" 
                                accept="image/jpeg,image/jpg,image/png,image/webp" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleUpdateDishImage(item, file);
                                }}
                              />
                            </label>
                            
                            {item.image_url && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveDishImage(item)}
                                className="px-2 py-1.5 bg-red-950/20 border border-red-500/10 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                                title="Remove Image"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {menuItems.filter(item => quickImageCatFilter === 'all' || item.category_id === quickImageCatFilter).length === 0 && (
                    <div className="col-span-full py-8 text-center text-zinc-600">No dishes found in this category.</div>
                  )}
                </div>
              </div>

              <hr className="border-zinc-900" />

              {/* DISHES MANAGEMENT SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Redesigned Menu Editor */}
                <div className="glass-panel p-6 rounded-2xl space-y-4 h-fit border border-zinc-800/80">
                  <div className="border-b border-zinc-900 pb-3">
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">
                      {itemForm.isEdit ? 'Edit Menu Dish' : 'Add New Menu Dish'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Fill in the fields below to update or create a menu item.</p>
                  </div>

                  <form onSubmit={handleItemSubmit} className="space-y-5 text-xs">
                    
                    {/* GROUP 1: Dish details */}
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gold/80 font-mono">1. Basic Information</p>
                      
                      <div>
                        <label className="block text-zinc-500 mb-1">Dish Name *</label>
                        <input 
                          type="text"
                          value={itemForm.name}
                          onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                          placeholder="e.g., Mutton Biryani"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-500 mb-1">Price (₹) *</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={itemForm.price}
                            onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                            placeholder="280.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-500 mb-1">Category *</label>
                          <select
                            value={itemForm.category_id}
                            onChange={(e) => setItemForm(prev => ({ ...prev, category_id: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                            required
                          >
                            <option value="">-- Choose --</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-500 mb-1">Description</label>
                        <textarea 
                          value={itemForm.description}
                          onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                          rows="2"
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                          placeholder="Detailed dish description..."
                        />
                      </div>
                    </div>

                    {/* GROUP 2: Media Management */}
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gold/80 font-mono">2. Dish Image</p>
                      
                      <div className="flex border-b border-zinc-900 mb-2">
                        <button
                          type="button"
                          onClick={() => setDishUploadType('file')}
                          className={`flex-1 py-1.5 text-center font-bold tracking-wider border-b-2 text-[10px] uppercase transition ${dishUploadType === 'file' ? 'border-gold text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishUploadType('url')}
                          className={`flex-1 py-1.5 text-center font-bold tracking-wider border-b-2 text-[10px] uppercase transition ${dishUploadType === 'url' ? 'border-gold text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Image URL
                        </button>
                      </div>

                      {dishUploadType === 'file' ? (
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-gold/30 rounded-xl p-4 cursor-pointer text-center bg-zinc-900/20 transition group">
                            <Upload size={16} className={`text-zinc-500 group-hover:text-gold transition ${uploading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] text-zinc-400 font-medium mt-1.5">Click to choose image file</span>
                            <span className="text-[8px] text-zinc-650 mt-0.5">JPG, JPEG, PNG, or WEBP</span>
                            <input 
                              type="file" 
                              accept="image/jpeg,image/jpg,image/png,image/webp" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                if (!allowedTypes.includes(file.type)) {
                                  setDishFileError('Supported files are JPG, JPEG, PNG, or WEBP');
                                  return;
                                }
                                setDishFileError('');
                                handleImageUpload(e, (url) => setItemForm(prev => ({ ...prev, image_url: url })));
                              }}
                            />
                          </label>
                          {dishFileError && <p className="text-red-400 text-[9px] font-medium">{dishFileError}</p>}
                        </div>
                      ) : (
                        <div>
                          <input 
                            type="text"
                            value={itemForm.image_url}
                            onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-xs transition"
                            placeholder="e.g., https://images.unsplash.com/..."
                          />
                        </div>
                      )}

                      {itemForm.image_url && (
                        <div className="flex items-center space-x-3 p-2 bg-zinc-900/20 border border-zinc-850 rounded-xl">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                            <img src={itemForm.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-zinc-400 truncate font-mono">{itemForm.image_url}</p>
                            <button 
                              type="button" 
                              onClick={() => setItemForm(prev => ({ ...prev, image_url: '' }))} 
                              className="text-[9px] text-red-400 hover:text-red-300 font-bold transition mt-0.5"
                            >
                              Clear Image
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* GROUP 3: Visibility & Settings */}
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gold/80 font-mono">3. Visibility & Order</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-500 mb-1">Status</label>
                          <select
                            value={itemForm.status}
                            onChange={(e) => setItemForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                          >
                            <option value="visible">Visible</option>
                            <option value="hidden">Hidden</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-500 mb-1">Display Order</label>
                          <input 
                            type="number"
                            value={itemForm.display_order}
                            onChange={(e) => setItemForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm transition"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input 
                          type="checkbox"
                          id="is_popular"
                          checked={!!itemForm.is_popular}
                          onChange={(e) => setItemForm(prev => ({ ...prev, is_popular: e.target.checked }))}
                          className="rounded border-zinc-800 text-gold focus:ring-gold/50 bg-zinc-900/60 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="is_popular" className="text-zinc-400 select-none cursor-pointer hover:text-white transition-colors">
                          Mark as Popular / Featured Dish
                        </label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2 border-t border-zinc-900">
                      <button 
                        type="submit" 
                        disabled={actionLoading || uploading}
                        className="flex-1 py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-extrabold uppercase tracking-wider rounded-xl transition shadow-gold disabled:opacity-50 flex items-center justify-center space-x-1.5"
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : uploading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Uploading Image...</span>
                          </>
                        ) : (
                          <span>{itemForm.isEdit ? 'Save Changes' : 'Create Dish'}</span>
                        )}
                      </button>
                      {itemForm.isEdit && (
                        <button 
                          type="button" 
                          onClick={() => setItemForm({ name: '', price: '', category_id: '', description: '', image_url: '', status: 'visible', is_popular: false, display_order: 0, isEdit: false, id: null })}
                          className="px-4 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-xl transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>



                {/* Right List: Menu items list */}
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">Menu Dishes List</h3>
                    
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500"><Search size={12} /></span>
                        <input
                          type="text"
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          placeholder="Search..."
                          className="pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white w-40 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                      
                      <select
                        value={menuFilterCat}
                        onChange={(e) => setMenuFilterCat(e.target.value)}
                        className="px-2 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white focus:outline-none"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-semibold sticky top-0 bg-[#0c0d0f]">
                          <th className="py-2.5">Dish</th>
                          <th className="py-2.5">Category</th>
                          <th className="py-2.5">Price</th>
                          <th className="py-2.5">Order</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems
                          .filter(item => {
                            const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                            const matchCat = menuFilterCat === 'all' || item.category_id === menuFilterCat;
                            return matchSearch && matchCat;
                          })
                          .map(item => (
                            <tr key={item.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10">
                              <td className="py-3 flex items-center space-x-3">
                                <div className="w-10 h-10 rounded overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                                  {item.image_url ? (
                                    <img src={`${item.image_url}${item.image_url.includes('?') ? '&' : '?'}t=${item.updated_at ? new Date(item.updated_at).getTime() : (item.created_at ? new Date(item.created_at).getTime() : '')}`} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700">No Img</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white flex items-center">
                                    <span>{item.name}</span>
                                    {item.is_popular && (
                                      <span className="ml-1.5 px-1 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold text-[8px] font-bold uppercase">Popular</span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 truncate max-w-xs">{item.description}</p>
                                </div>
                              </td>
                              <td className="py-3 text-zinc-400 font-medium">{getCatName(item.category_id)}</td>
                              <td className="py-3 font-semibold text-white">₹{parseFloat(item.price).toFixed(2)}</td>
                              <td className="py-3 text-zinc-400">{item.display_order}</td>
                              <td className="py-3">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStatus = item.status === 'visible' ? 'hidden' : 'visible';
                                    await api.updateMenuItem(item.id, { status: nextStatus });
                                    triggerSuccess(`Status changed to ${nextStatus}`);
                                  }}
                                  className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition
                                    ${item.status === 'visible' 
                                      ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                                      : 'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
                                    }
                                  `}
                                >
                                  {item.status === 'visible' ? <Eye size={10} /> : <EyeOff size={10} />}
                                  <span className="capitalize">{item.status}</span>
                                </button>
                              </td>
                              <td className="py-3 text-right space-x-2">
                                <button 
                                  onClick={() => setItemForm({ ...item, isEdit: true, id: item.id })}
                                  className="p-1 text-zinc-400 hover:text-gold transition"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-zinc-400 hover:text-red-400 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {menuItems.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-zinc-600">No dishes in menu yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}



          {/* ============================================================== */}
          {/* TAB: RESTAURANT INFORMATION */}
          {/* ============================================================== */}
          {activeTab === 'info' && (
            <div className="max-w-3xl">
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Edit General Restaurant Details</h3>
                <form onSubmit={handleInfoSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Restaurant Name</label>
                    <input 
                      type="text"
                      value={infoForm.name}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Tagline</label>
                    <input 
                      type="text"
                      value={infoForm.tagline}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Description</label>
                    <textarea 
                      value={infoForm.description}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">Weekday Opening Hours</label>
                      <input 
                        type="text"
                        value={infoForm.opening_hours?.weekday}
                        onChange={(e) => setInfoForm(prev => ({ 
                          ...prev, 
                          opening_hours: { ...prev.opening_hours, weekday: e.target.value } 
                        }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        placeholder="e.g. 11:00 AM - 11:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Weekend Opening Hours</label>
                      <input 
                        type="text"
                        value={infoForm.opening_hours?.weekend}
                        onChange={(e) => setInfoForm(prev => ({ 
                          ...prev, 
                          opening_hours: { ...prev.opening_hours, weekend: e.target.value } 
                        }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        placeholder="e.g. 11:00 AM - 11:30 PM"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">Delivery Radius</label>
                      <input 
                        type="text"
                        value={infoForm.delivery_radius}
                        onChange={(e) => setInfoForm(prev => ({ ...prev, delivery_radius: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Location / Zone</label>
                      <input 
                        type="text"
                        value={infoForm.location}
                        onChange={(e) => setInfoForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Physical Address</label>
                    <input 
                      type="text"
                      value={infoForm.address}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Google Maps Direct Link</label>
                    <input 
                      type="text"
                      value={infoForm.google_maps_link}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, google_maps_link: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full md:w-fit px-8 py-3 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-gold"
                    >
                      <Save size={14} />
                      <span>Save Restaurant Details</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CONTACT MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'contact' && (
            <div className="max-w-3xl">
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Edit Contact Numbers & Links</h3>
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">Primary Phone</label>
                      <input 
                        type="text"
                        value={contactForm.primary_phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, primary_phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Secondary Phone</label>
                      <input 
                        type="text"
                        value={contactForm.secondary_phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, secondary_phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">WhatsApp Number *</label>
                      <input 
                        type="text"
                        value={contactForm.whatsapp_number}
                        onChange={(e) => setContactForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        required
                      />
                      <span className="text-[10px] text-zinc-600 block mt-1">Number used for client orders. Input with country code, no symbols (e.g. 919676576392).</span>
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Email Address</label>
                      <input 
                        type="email"
                        value={contactForm.email_address}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email_address: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">Instagram Link</label>
                      <input 
                        type="text"
                        value={contactForm.instagram}
                        onChange={(e) => setContactForm(prev => ({ ...prev, instagram: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Facebook Link</label>
                      <input 
                        type="text"
                        value={contactForm.facebook}
                        onChange={(e) => setContactForm(prev => ({ ...prev, facebook: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Google Maps Embed URL</label>
                    <input 
                      type="text"
                      value={contactForm.google_maps_url}
                      onChange={(e) => setContactForm(prev => ({ ...prev, google_maps_url: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Address Details (for Contact page)</label>
                    <textarea 
                      value={contactForm.address}
                      onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                      rows="2"
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full md:w-fit px-8 py-3 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-gold"
                    >
                      <Save size={14} />
                      <span>Save Contact Information</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: GALLERY MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'gallery' && (
            <div className="space-y-8">
               {/* Add New Gallery Image */}
              <div className="glass-panel p-6 rounded-2xl space-y-5">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Upload New Gallery Photo</h3>
                
                {/* Method Selector Tabs */}
                <div className="flex space-x-2 border-b border-zinc-900/50 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryUploadType('file');
                      setGalleryForm(prev => ({ ...prev, image_url: '' }));
                      setGalleryFileError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-semibold transition-all
                      ${galleryUploadType === 'file' 
                        ? 'border-gold text-gold bg-gold/5 font-bold shadow-sm' 
                        : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                      }
                    `}
                  >
                    Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryUploadType('url');
                      setGalleryForm(prev => ({ ...prev, image_url: '' }));
                      setGalleryFileError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-semibold transition-all
                      ${galleryUploadType === 'url' 
                        ? 'border-gold text-gold bg-gold/5 font-bold shadow-sm' 
                        : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                      }
                    `}
                  >
                    Use Image Link / URL
                  </button>
                </div>

                <form onSubmit={handleGallerySubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    
                    {/* Method Content */}
                    <div className="md:col-span-2">
                      {galleryUploadType === 'file' ? (
                        <div className="space-y-2">
                          <label className="block text-zinc-500 mb-1 font-semibold">Choose Image File</label>
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-3">
                              <label className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-xl border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center transition space-x-2">
                                <Upload size={14} />
                                <span>Select Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    
                                    // Reset error
                                    setGalleryFileError('');
                                    
                                    // Validate file type
                                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                    if (!allowedTypes.includes(file.type)) {
                                      setGalleryFileError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
                                      setGalleryForm(prev => ({ ...prev, image_url: '' }));
                                      return;
                                    }
                                    
                                    try {
                                      setUploading(true);
                                      const res = await api.uploadImage(file);
                                      if (res.success) {
                                        setGalleryForm(prev => ({ ...prev, image_url: res.file_path }));
                                        triggerSuccess('Photo uploaded successfully!');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      setGalleryFileError('Upload failed: ' + err.message);
                                    } finally {
                                      setUploading(false);
                                    }
                                  }}
                                />
                              </label>
                              
                              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[200px]">
                                {galleryForm.image_url ? "Image uploaded" : "No file selected"}
                              </span>
                            </div>
                            
                            {/* Validation Error Message */}
                            {galleryFileError && (
                              <p className="text-red-400 text-[11px] font-semibold bg-red-950/20 border border-red-500/10 px-3 py-1.5 rounded-lg">
                                {galleryFileError}
                              </p>
                            )}

                            {/* Uploading loading state */}
                            {uploading && (
                              <div className="flex items-center space-x-2 text-gold py-1">
                                <div className="w-3.5 h-3.5 border border-gold border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] font-semibold">Uploading to server...</span>
                              </div>
                            )}

                            {/* Preview */}
                            {galleryForm.image_url && (
                              <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/50">
                                <img src={galleryForm.image_url} className="w-full h-full object-cover" alt="Preview" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-zinc-500 mb-1 font-semibold">Image Link / URL</label>
                          <input 
                            type="text"
                            value={galleryForm.image_url}
                            onChange={(e) => setGalleryForm(prev => ({ ...prev, image_url: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-xs"
                            placeholder="https://images.unsplash.com/photo-..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-zinc-500 mb-1 font-semibold">Photo Category</label>
                      <select 
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      >
                        <option value="Food">Food Photography</option>
                        <option value="Ambience">Ambience & Decor</option>
                        <option value="Family Dining">Family Dining</option>
                      </select>
                    </div>

                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading || uploading}
                      className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
                    >
                      {actionLoading ? 'Adding...' : 'Add to Gallery'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Gallery List (Grid of images) */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Gallery Image Grid</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map(img => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900/50 aspect-video">
                      <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-gold text-[9px] font-semibold border border-gold/15 uppercase">
                        {img.category}
                      </div>
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleDeleteGallery(img.id)}
                          className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition transform translate-y-2 group-hover:translate-y-0 duration-200 shadow-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-600">No images in gallery.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: QR MENU MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">QR Menu Code</h3>
                  <p className="text-zinc-500 text-xs mt-1">This module allows you to manage the destination link of the QR menu printed on tables. You can download and print the code for customer use.</p>
                </div>

                <form onSubmit={handleQrSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">QR Target URL</label>
                    <input 
                      type="text"
                      value={qrForm.destination_url}
                      onChange={(e) => setQrForm(prev => ({ ...prev, destination_url: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      placeholder="e.g. https://mythrirestaurant.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Custom QR Code Image URL (Optional)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        value={qrForm.qr_image_url || ''}
                        onChange={(e) => setQrForm(prev => ({ ...prev, qr_image_url: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-xs"
                        placeholder="Leave blank to auto-generate"
                      />
                      <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-xl border border-zinc-700 text-zinc-300 flex items-center justify-center transition">
                        <Upload size={14} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, (url) => setQrForm(prev => ({ ...prev, qr_image_url: url })))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <Save size={14} />
                      <span>Save QR Destination</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* QR Code Display & Preview */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3 w-full">QR Preview</h3>
                
                {/* Generate QR Code dynamically from Target URL */}
                <div className="p-4 bg-white rounded-xl shadow-2xl inline-block border-4 border-gold/40">
                  <img 
                    src={qrForm.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=050505&data=${encodeURIComponent(qrForm.destination_url || 'https://mythri-restaurant.vercel.app')}`} 
                    className="w-48 h-48 object-contain" 
                    alt="Menu QR Code" 
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-white text-sm font-semibold">Table Stand Menu QR Code</p>
                  <p className="text-zinc-500 text-xs truncate max-w-xs">{qrForm.destination_url}</p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <a 
                    href={qrForm.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=050505&data=${encodeURIComponent(qrForm.destination_url || 'https://mythri-restaurant.vercel.app')}`}
                    target="_blank"
                    download="mythri-menu-qr.png"
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-gold/30 text-gold rounded-lg transition text-xs flex items-center space-x-1.5 font-semibold"
                  >
                    <Download size={14} />
                    <span>Download QR Print</span>
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: HERO CUSTOMIZATION */}
          {/* ============================================================== */}
          {activeTab === 'hero' && (
            <div className="max-w-3xl space-y-6">
              {/* Card 1: Main Hero Banner Settings */}
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Edit Main Hero Banner details</h3>
                <form onSubmit={handleHeroSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Main Heading</label>
                    <input 
                      type="text"
                      value={heroForm.heading}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, heading: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Subheading</label>
                    <input 
                      type="text"
                      value={heroForm.subheading}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, subheading: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Description Paragraph</label>
                    <textarea 
                      value={heroForm.description}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Background Image URL</label>
                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        value={heroForm.background_image_url}
                        onChange={(e) => setHeroForm(prev => ({ ...prev, background_image_url: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-xs"
                        placeholder="Image Link"
                      />
                      <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-xl border border-zinc-700 text-zinc-300 flex items-center justify-center transition">
                        <Upload size={14} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, (url) => setHeroForm(prev => ({ ...prev, background_image_url: url })))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full md:w-fit px-8 py-3 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-gold"
                    >
                      <Save size={14} />
                      <span>Save Hero Section Settings</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Today's Special Management */}
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3 flex items-center space-x-2">
                  <Flame size={18} className="text-gold animate-pulse" />
                  <span>Today's Special Management</span>
                </h3>

                <form onSubmit={handleTodaysSpecialSubmit} className="space-y-6 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1 font-semibold text-sm">Today's Special Dish Name</label>
                    <input 
                      type="text"
                      value={todaysSpecialForm.dish_name}
                      onChange={(e) => setTodaysSpecialForm(prev => ({ ...prev, dish_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      placeholder="e.g., Chicken Dum Biryani"
                      required
                    />
                  </div>

                  {/* Image Upload/URL Selection */}
                  <div className="space-y-4">
                    <label className="block text-zinc-500 font-semibold text-sm">Image Upload Options</label>
                    <div className="flex space-x-6 mb-2">
                      <label className="flex items-center space-x-2 text-white cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="specialUploadType" 
                          value="file" 
                          checked={specialUploadType === 'file'}
                          onChange={() => setSpecialUploadType('file')}
                          className="accent-gold h-4 w-4"
                        />
                        <span className="text-xs font-medium">Upload from Device</span>
                      </label>
                      <label className="flex items-center space-x-2 text-white cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="specialUploadType" 
                          value="url" 
                          checked={specialUploadType === 'url'}
                          onChange={() => setSpecialUploadType('url')}
                          className="accent-gold h-4 w-4"
                        />
                        <span className="text-xs font-medium">Image URL</span>
                      </label>
                    </div>

                    {specialUploadType === 'file' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <label className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-xl border border-zinc-700 text-zinc-300 flex items-center justify-center space-x-2 transition">
                            <Upload size={14} />
                            <span className="text-xs font-semibold">Choose Image File</span>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg, image/webp" 
                              className="hidden" 
                              onChange={handleSpecialFileChange}
                            />
                          </label>
                          {uploading && (
                            <div className="flex items-center space-x-1.5 text-zinc-400">
                              <RefreshCw size={14} className="animate-spin text-gold" />
                              <span>Uploading image...</span>
                            </div>
                          )}
                        </div>
                        {specialFileError && (
                          <p className="text-red-500 text-xs font-semibold mt-1">{specialFileError}</p>
                        )}
                        <p className="text-[10px] text-zinc-500 font-light">Supported formats: JPG, JPEG, PNG, WEBP</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input 
                          type="url"
                          value={todaysSpecialForm.dish_image}
                          onChange={handleSpecialUrlChange}
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                          placeholder="Paste a valid image URL (e.g., https://example.com/dish.jpg)"
                        />
                        {specialUrlError && (
                          <p className="text-red-500 text-xs font-semibold mt-1">{specialUrlError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Previews side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900">
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <span className="block text-zinc-500 mb-3 font-medium text-xs">Current Live View</span>
                      <div className="relative group w-48 h-48 rounded-full border border-gold/10 p-3 bg-gold/2">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl relative">
                          <img 
                            src={heroSection.todays_special_image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"} 
                            className="w-full h-full object-cover animate-[spin_80s_linear_infinite]"
                            alt={heroSection.todays_special_name || "Signature Dum Biryani"} 
                          />
                          <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                        <div className="absolute bottom-2 right-2 glass-panel px-3 py-1.5 rounded-lg text-left border-l-2 border-gold max-w-[130px]">
                          <p className="text-[8px] text-gold font-bold uppercase tracking-wider">Today's Special</p>
                          <p className="text-white text-[10px] font-bold truncate">{heroSection.todays_special_name || "Chicken Dum Biryani"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <span className="block text-zinc-500 mb-3 font-medium text-xs">New Preview (Unsaved)</span>
                      <div className="relative group w-48 h-48 rounded-full border border-gold/10 p-3 bg-gold/2">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl relative bg-zinc-900/60 flex items-center justify-center">
                          {todaysSpecialForm.dish_image ? (
                            <img 
                              src={todaysSpecialForm.dish_image} 
                              className="w-full h-full object-cover animate-[spin_80s_linear_infinite]"
                              alt={todaysSpecialForm.dish_name || "New Dish Live Preview"} 
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-zinc-600 text-xs text-center px-4">No Image Selected</span>
                          )}
                          <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                        <div className="absolute bottom-2 right-2 glass-panel px-3 py-1.5 rounded-lg text-left border-l-2 border-gold max-w-[130px]">
                          <p className="text-[8px] text-gold font-bold uppercase tracking-wider">Today's Special</p>
                          <p className="text-white text-[10px] font-bold truncate">{todaysSpecialForm.dish_name || "Dish Name"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-900">
                    <button 
                      type="submit" 
                      disabled={actionLoading || uploading}
                      className="w-full md:w-fit px-8 py-3 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-gold disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CUSTOMER REVIEWS */}
          {/* ============================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">
                  {reviewForm.isEdit ? 'Edit Customer Review' : 'Add New Customer Review'}
                </h3>
                
                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-zinc-500 mb-1">Customer Name *</label>
                      <input 
                        type="text"
                        value={reviewForm.customer_name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        placeholder="Rajesh K."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Rating *</label>
                      <select 
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
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
                      <label className="block text-zinc-500 mb-1">Customer Photo URL</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text"
                          value={reviewForm.photo_url}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, photo_url: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-xs"
                          placeholder="Image Link"
                        />
                        <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 cursor-pointer rounded-xl border border-zinc-700 text-zinc-300 flex items-center justify-center transition">
                          <Upload size={14} />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, (url) => setReviewForm(prev => ({ ...prev, photo_url: url })))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Review Feedback Content *</label>
                    <textarea 
                      value={reviewForm.review_text}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      placeholder="Write review feedback here..."
                      required
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-lg transition"
                    >
                      {reviewForm.isEdit ? 'Save Changes' : 'Publish Review'}
                    </button>
                    {reviewForm.isEdit && (
                      <button 
                        type="button" 
                        onClick={() => setReviewForm({ customer_name: '', review_text: '', rating: 5, photo_url: '', status: 'visible', isEdit: false, id: null })}
                        className="px-3 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Review list */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Manage Customer Feedback</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={r.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} className="w-8 h-8 rounded-full object-cover" alt="" />
                            <div>
                              <p className="font-semibold text-white text-xs">{r.customer_name}</p>
                              <p className="text-[10px] text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-gold font-bold">
                            {'★'.repeat(r.rating)}
                          </div>
                        </div>
                        <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-light">{r.review_text}</p>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-4 mt-3 border-t border-zinc-900/50">
                        <button
                          onClick={async () => {
                            const nextStatus = r.status === 'visible' ? 'hidden' : 'visible';
                            await api.updateReview(r.id, { status: nextStatus });
                            triggerSuccess(`Review state changed to ${nextStatus}`);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold
                            ${r.status === 'visible' 
                              ? 'bg-green-500/5 border-green-500/10 text-green-400' 
                              : 'bg-zinc-500/5 border-zinc-500/10 text-zinc-500'
                            }
                          `}
                        >
                          {r.status}
                        </button>
                        <button 
                          onClick={() => setReviewForm({ ...r, isEdit: true, id: r.id })}
                          className="p-1 text-zinc-400 hover:text-gold transition"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: ORDER HISTORY */}
          {/* ============================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
                  <h3 className="text-sm font-bold text-white font-serif tracking-wide">Customer Orders Log</h3>
                  
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500"><Search size={12} /></span>
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search Name/Phone/ID..."
                        className="pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white w-44 focus:outline-none focus:border-gold/50"
                      />
                    </div>
                    
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="px-2 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 font-semibold sticky top-0 bg-[#0c0d0f]">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Customer Details</th>
                        <th className="py-2.5">Items Ordered</th>
                        <th className="py-2.5">Final Total</th>
                        <th className="py-2.5">Payment</th>
                        <th className="py-2.5">Order Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .filter(o => {
                          const matchSearch = o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                              o.customer_phone.includes(orderSearch) ||
                                              o.id.toLowerCase().includes(orderSearch.toLowerCase());
                          const matchFilter = orderFilter === 'All' || o.order_status === orderFilter;
                          return matchSearch && matchFilter;
                        })
                        .map(o => (
                          <tr key={o.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10">
                            <td className="py-3 font-mono font-bold text-white">{o.id}</td>
                            <td className="py-3">
                              <p className="font-semibold text-white">{o.customer_name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{o.customer_phone}</p>
                              {o.is_first_order && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-gold/10 border border-gold/15 text-gold text-[8px] font-bold rounded uppercase">
                                  First Order
                                </span>
                              )}
                            </td>
                            <td className="py-3 max-w-[200px]">
                              <div className="space-y-0.5 text-[10px] text-zinc-400">
                                {o.items?.map((item, idx) => (
                                  <div key={idx} className="truncate">
                                    {item.name} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="font-mono font-bold text-white">₹{o.final_amount.toFixed(2)}</span>
                              {o.discount_amount > 0 && (
                                <p className="text-[10px] text-gold font-mono mt-0.5">Discount: -₹{o.discount_amount.toFixed(2)}</p>
                              )}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.payment_status === 'Paid'
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : o.payment_status === 'Pending'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {o.payment_status}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.order_status === 'Completed'
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : o.order_status === 'Pending'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {o.order_status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <select 
                                  value={o.payment_status} 
                                  onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Failed">Failed</option>
                                </select>
                                
                                <select 
                                  value={o.order_status} 
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-zinc-600">No orders logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CUSTOMER DISCOUNTS */}
          {/* ============================================================== */}
          {activeTab === 'discounts' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Assigned</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">{totalDiscounts}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active</span>
                  <span className="text-xl font-bold text-green-400 font-mono mt-1 block">{activeDiscounts}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Used</span>
                  <span className="text-xl font-bold text-gold font-mono mt-1 block">{usedDiscounts}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Expired</span>
                  <span className="text-xl font-bold text-red-400 font-mono mt-1 block">{expiredDiscounts}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl col-span-2 md:col-span-1">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Value Saved</span>
                  <span className="text-xl font-bold text-gold font-mono mt-1 block">₹{totalDiscountValueGiven.toFixed(2)}</span>
                </div>
              </div>

              {/* Automatic First-Order Offer Settings */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3 flex items-center space-x-2">
                  <Gift className="text-gold" size={18} />
                  <span>Automatic First-Order Offer Settings</span>
                </h3>
                <form onSubmit={handleFirstOrderSettingsSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs mt-4">
                  <div>
                    <label className="block text-zinc-500 mb-1">Offer Status</label>
                    <select 
                      value={firstOrderSettings.enabled ? 'true' : 'false'}
                      onChange={(e) => setFirstOrderSettings(prev => ({ ...prev, enabled: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    >
                      <option value="true">Enabled (Apply automatically)</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Minimum Order Value (₹)</label>
                    <input 
                      type="number"
                      value={firstOrderSettings.minAmount}
                      onChange={(e) => setFirstOrderSettings(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Discount Amount (₹)</label>
                    <input 
                      type="number"
                      value={firstOrderSettings.discountAmount}
                      onChange={(e) => setFirstOrderSettings(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-xl transition h-[38px] flex items-center justify-center space-x-1"
                    >
                      <Save size={14} />
                      <span>Save Settings</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="glass-panel p-6 rounded-2xl h-fit space-y-4">
                  <h3 className="text-sm font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">
                    {assignForm.isEdit ? 'Edit Customer Discount' : 'Assign First-Time Discount'}
                  </h3>
                  <form onSubmit={handleDiscountSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-zinc-500 mb-1">Customer Name</label>
                      <input 
                        type="text"
                        value={assignForm.notes.startsWith('For: ') ? assignForm.notes.substring(5).split(' |')[0] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const restNotes = assignForm.notes.includes('|') ? assignForm.notes.split('|')[1] : '';
                          setAssignForm(prev => ({ 
                            ...prev, 
                            notes: `For: ${val}${restNotes ? ` |${restNotes}` : ''}` 
                          }));
                        }}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-500 mb-1">Phone Number (Unique) *</label>
                      <input 
                        type="tel"
                        value={assignForm.customer_phone}
                        onChange={(e) => setAssignForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                        required
                        disabled={assignForm.isEdit}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-500 mb-1">Discount Type</label>
                        <select 
                          value={assignForm.discount_type}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, discount_type: e.target.value }))}
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1">Discount Value *</label>
                        <input 
                          type="number"
                          value={assignForm.discount_value}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, discount_value: e.target.value }))}
                          placeholder="e.g. 15 or 100"
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-500 mb-1">Min Order Amount (₹)</label>
                        <input 
                          type="number"
                          value={assignForm.minimum_order_amount}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, minimum_order_amount: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1">Max Discount (₹)</label>
                        <input 
                          type="number"
                          value={assignForm.maximum_discount || ''}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, maximum_discount: e.target.value }))}
                          placeholder="No Limit"
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                          disabled={assignForm.discount_type === 'fixed'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-500 mb-1">Expiry Date</label>
                      <input 
                        type="date"
                        value={assignForm.expiry_date ? assignForm.expiry_date.split('T')[0] : ''}
                        onChange={(e) => setAssignForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-500 mb-1">Status</label>
                      <select 
                        value={assignForm.status}
                        onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Used" disabled>Used</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-500 mb-1">Internal Notes</label>
                      <textarea 
                        value={assignForm.notes.includes('|') ? assignForm.notes.split('|')[1] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const namePart = assignForm.notes.startsWith('For: ') ? assignForm.notes.split('|')[0] : '';
                          setAssignForm(prev => ({ 
                            ...prev, 
                            notes: `${namePart || 'For: '} |${val}` 
                          }));
                        }}
                        placeholder="Internal notes..."
                        className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                        rows="2"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="flex-1 py-2 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-lg transition"
                      >
                        {assignForm.isEdit ? 'Save Changes' : 'Assign Discount'}
                      </button>
                      {assignForm.isEdit && (
                        <button 
                          type="button" 
                          onClick={() => setAssignForm({
                            customer_phone: '',
                            discount_type: 'percentage',
                            discount_value: '',
                            minimum_order_amount: '',
                            maximum_discount: '',
                            expiry_date: '',
                            notes: '',
                            status: 'Active',
                            isEdit: false,
                            id: null
                          })}
                          className="px-3 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">Assigned Discounts</h3>
                    
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500"><Search size={12} /></span>
                        <input
                          type="text"
                          value={discountSearch}
                          onChange={(e) => setDiscountSearch(e.target.value)}
                          placeholder="Search Phone/Name..."
                          className="pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white w-40 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                      
                      <select
                        value={discountFilter}
                        onChange={(e) => setDiscountFilter(e.target.value)}
                        className="px-2 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white focus:outline-none"
                      >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Used">Used</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-semibold sticky top-0 bg-[#0c0d0f]">
                          <th className="py-2.5">Customer Name</th>
                          <th className="py-2.5">Phone Number</th>
                          <th className="py-2.5">Discount Value</th>
                          <th className="py-2.5">Min Order</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts
                          .filter(d => {
                            const name = getCustomerNameByPhone(d.customer_phone).toLowerCase();
                            const matchSearch = d.customer_phone.includes(discountSearch) || name.includes(discountSearch.toLowerCase());
                            const matchFilter = discountFilter === 'All' || d.status === discountFilter;
                            return matchSearch && matchFilter;
                          })
                          .map(d => (
                            <tr key={d.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10">
                              <td className="py-3 font-semibold text-white">{getCustomerNameByPhone(d.customer_phone)}</td>
                              <td className="py-3 text-zinc-400 font-mono">{d.customer_phone}</td>
                              <td className="py-3 text-white font-mono font-bold">
                                {d.discount_type === 'percentage' ? `${d.discount_value}%` : `₹${d.discount_value}`}
                              </td>
                              <td className="py-3 text-zinc-400 font-mono">₹{d.minimum_order_amount}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  d.status === 'Active' 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                    : d.status === 'Used' 
                                      ? 'bg-gold/10 border-gold/25 text-gold' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-3 text-right space-x-2">
                                <button 
                                  onClick={() => setAssignForm({
                                    ...d,
                                    isEdit: true,
                                    id: d.id
                                  })}
                                  disabled={d.status === 'Used'}
                                  className="p-1 text-zinc-400 hover:text-gold transition disabled:text-zinc-700"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDiscount(d.id)}
                                  className="p-1 text-zinc-400 hover:text-red-400 transition"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {discounts.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-zinc-600">No discounts assigned.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* First-Order Discount History Panel */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">First-Order Discount History</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Monitor automatic eligibility checks, discounts applied, and reasons for ineligibility.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Search name/phone */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500"><Search size={12} /></span>
                      <input
                        type="text"
                        value={firstOrderHistorySearch}
                        onChange={(e) => setFirstOrderHistorySearch(e.target.value)}
                        placeholder="Search Name/Phone..."
                        className="pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white w-40 focus:outline-none focus:border-gold/50"
                      />
                    </div>
                    
                    {/* Status filter */}
                    <select
                      value={firstOrderHistoryStatus}
                      onChange={(e) => setFirstOrderHistoryStatus(e.target.value)}
                      className="px-2 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Applied">Applied</option>
                      <option value="Not Eligible">Not Eligible</option>
                    </select>

                    {/* Date range filters */}
                    <div className="flex items-center space-x-1">
                      <input
                        type="date"
                        value={firstOrderHistoryStartDate}
                        onChange={(e) => setFirstOrderHistoryStartDate(e.target.value)}
                        className="px-2 py-1 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none font-mono"
                        placeholder="Start Date"
                      />
                      <span className="text-zinc-500">-</span>
                      <input
                        type="date"
                        value={firstOrderHistoryEndDate}
                        onChange={(e) => setFirstOrderHistoryEndDate(e.target.value)}
                        className="px-2 py-1 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none font-mono"
                        placeholder="End Date"
                      />
                    </div>

                    {/* CSV Export Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const history = (orders || []).filter(o => {
                          const term = firstOrderHistorySearch.trim().toLowerCase();
                          const matchesSearch = !term || 
                            (o.customer_name || '').toLowerCase().includes(term) || 
                            (o.customer_phone || '').includes(term);

                          const status = firstOrderHistoryStatus;
                          const isApplied = o.is_first_order === true;
                          const matchesStatus = status === 'All' || 
                            (status === 'Applied' && isApplied) || 
                            (status === 'Not Eligible' && !isApplied);

                          let matchesDate = true;
                          if (firstOrderHistoryStartDate) {
                            const start = new Date(firstOrderHistoryStartDate);
                            start.setHours(0, 0, 0, 0);
                            const orderDate = new Date(o.created_at);
                            if (orderDate < start) matchesDate = false;
                          }
                          if (firstOrderHistoryEndDate) {
                            const end = new Date(firstOrderHistoryEndDate);
                            end.setHours(23, 59, 59, 999);
                            const orderDate = new Date(o.created_at);
                            if (orderDate > end) matchesDate = false;
                          }

                          return matchesSearch && matchesStatus && matchesDate;
                        });
                        exportFirstOrderHistoryToCSV(history);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <Download size={12} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 font-semibold sticky top-0 bg-[#0c0d0f] z-10">
                        <th className="py-2.5">Customer Name</th>
                        <th className="py-2.5">Phone Number</th>
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Order Date</th>
                        <th className="py-2.5">Order Amount</th>
                        <th className="py-2.5">Discount Applied</th>
                        <th className="py-2.5">First Order Offer</th>
                        <th className="py-2.5">Final Amount</th>
                        <th className="py-2.5">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orders || [])
                        .filter(o => {
                          const term = firstOrderHistorySearch.trim().toLowerCase();
                          const matchesSearch = !term || 
                            (o.customer_name || '').toLowerCase().includes(term) || 
                            (o.customer_phone || '').includes(term);

                          const status = firstOrderHistoryStatus;
                          const isApplied = o.is_first_order === true;
                          const matchesStatus = status === 'All' || 
                            (status === 'Applied' && isApplied) || 
                            (status === 'Not Eligible' && !isApplied);

                          let matchesDate = true;
                          if (firstOrderHistoryStartDate) {
                            const start = new Date(firstOrderHistoryStartDate);
                            start.setHours(0, 0, 0, 0);
                            const orderDate = new Date(o.created_at);
                            if (orderDate < start) matchesDate = false;
                          }
                          if (firstOrderHistoryEndDate) {
                            const end = new Date(firstOrderHistoryEndDate);
                            end.setHours(23, 59, 59, 999);
                            const orderDate = new Date(o.created_at);
                            if (orderDate > end) matchesDate = false;
                          }

                          return matchesSearch && matchesStatus && matchesDate;
                        })
                        .map(o => {
                          const isApplied = o.is_first_order === true;
                          const formattedReason = o.first_order_discount_reason || (isApplied ? '🎉 First Order Offer Applied!' : 'N/A');
                          
                          return (
                            <tr key={o.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10">
                              <td className="py-3 font-semibold text-white">{o.customer_name}</td>
                              <td className="py-3 text-zinc-400 font-mono">{o.customer_phone}</td>
                              <td className="py-3 text-zinc-500 font-mono">{o.id}</td>
                              <td className="py-3 text-zinc-400 font-mono">
                                {new Date(o.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 text-zinc-400 font-mono">₹{o.original_amount.toFixed(2)}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  o.discount_amount > 0 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                    : 'bg-zinc-500/10 border-zinc-800 text-zinc-400'
                                }`}>
                                  {o.discount_amount > 0 ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isApplied 
                                    ? 'bg-gold/10 border-gold/25 text-gold' 
                                    : 'bg-zinc-500/10 border-zinc-800 text-zinc-400'
                                }`}>
                                  {isApplied ? 'Used' : 'Not Used'}
                                </span>
                              </td>
                              <td className="py-3 text-gold font-mono font-bold">₹{o.final_amount.toFixed(2)}</td>
                              <td className="py-3 text-zinc-400 max-w-[200px] truncate" title={formattedReason}>
                                {formattedReason}
                              </td>
                            </tr>
                          );
                        })}
                      {(orders || []).filter(o => {
                        const term = firstOrderHistorySearch.trim().toLowerCase();
                        const matchesSearch = !term || 
                          (o.customer_name || '').toLowerCase().includes(term) || 
                          (o.customer_phone || '').includes(term);

                        const status = firstOrderHistoryStatus;
                        const isApplied = o.is_first_order === true;
                        const matchesStatus = status === 'All' || 
                          (status === 'Applied' && isApplied) || 
                          (status === 'Not Eligible' && !isApplied);

                        let matchesDate = true;
                        if (firstOrderHistoryStartDate) {
                          const start = new Date(firstOrderHistoryStartDate);
                          start.setHours(0, 0, 0, 0);
                          const orderDate = new Date(o.created_at);
                          if (orderDate < start) matchesDate = false;
                        }
                        if (firstOrderHistoryEndDate) {
                          const end = new Date(firstOrderHistoryEndDate);
                          end.setHours(23, 59, 59, 999);
                          const orderDate = new Date(o.created_at);
                          if (orderDate > end) matchesDate = false;
                        }

                        return matchesSearch && matchesStatus && matchesDate;
                      }).length === 0 && (
                        <tr>
                          <td colSpan="9" className="py-6 text-center text-zinc-600">No checkout history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: WEBSITE GLOBAL SETTINGS */}
          {/* ============================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-md">
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <h3 className="text-base font-bold text-white font-serif tracking-wide border-b border-zinc-900 pb-3">Global Website System Settings</h3>
                
                <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Website Operational Status</label>
                    <select
                      value={settingsForm.status}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                    >
                      <option value="online">Online & Active (Fully visible)</option>
                      <option value="maintenance">Maintenance Mode (Show splash banner)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Default UI Palette / Theme</label>
                    <select
                      value={settingsForm.theme}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none rounded-xl text-white text-sm"
                      disabled
                    >
                      <option value="dark">Luxury Black Gold (Dark Theme)</option>
                    </select>
                    <span className="text-[10px] text-zinc-600 mt-1 block">Luxury Dark Theme is set by default per your specification.</span>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-gold hover:bg-gold-light text-black text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1"
                    >
                      <Save size={14} />
                      <span>Save Operational Settings</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
