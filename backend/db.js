const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const supabase = require('./supabase');

const dbPath = path.join(__dirname, 'db.json');
const seedsPath = path.join(__dirname, 'seeds.json');

// Password hashing helper
function hashPassword(password) {
  const salt = 'mythri_restaurant_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Ensure the new admin exists and is updated
function ensureNewAdmin(local) {
  if (!local.admins) {
    local.admins = [];
  }
  
  const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
  const newAdmin = {
    username: 'My3',
    email: 'joelramireddy@gmail.com',
    password: targetHash,
    name: 'Joel'
  };

  const existingIndex = local.admins.findIndex(a => 
    a.username.toLowerCase() === 'my3' || 
    a.email.toLowerCase() === 'joelramireddy@gmail.com' ||
    a.username.toLowerCase() === 'admin'
  );

  if (existingIndex > -1) {
    local.admins[existingIndex] = newAdmin;
  } else {
    if (local.admins.length === 1 && local.admins[0].username === 'admin') {
      local.admins[0] = newAdmin;
    } else {
      local.admins.push(newAdmin);
    }
  }
}

// Initialize local JSON DB if running in mock mode
function initLocalDB() {
  if (!fs.existsSync(dbPath)) {
    try {
      const seedData = fs.readFileSync(seedsPath, 'utf8');
      fs.writeFileSync(dbPath, seedData, 'utf8');
      console.log('Local db.json initialized from seeds.json');
    } catch (err) {
      console.error('Error creating local db.json:', err.message);
      // Fallback empty DB
      const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
      fs.writeFileSync(dbPath, JSON.stringify({
        website_settings: { 
          status: "online", 
          theme: "dark",
          first_order_discount_enabled: true,
          first_order_min_amount: 250,
          first_order_discount_amount: 100
        },
        restaurant_settings: {},
        contact_information: {},
        hero_section: {},
        qr_codes: {},
        admins: [{ username: "My3", password: targetHash, email: "joelramireddy@gmail.com", name: "Joel" }],
        menu_categories: [],
        menu_items: [],
        gallery_images: [],
        reviews: [],
        customer_first_order_uses: []
      }, null, 2), 'utf8');
    }
  }
}

// Read local data
function readLocalDB() {
  initLocalDB();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const local = JSON.parse(data);
    
    // Auto-update db.json if the correct hashed admin doesn't exist
    const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
    const hasCorrectAdmin = local.admins && local.admins.some(a => 
      a.username === 'My3' && 
      a.email === 'joelramireddy@gmail.com' && 
      a.password === targetHash
    );

    let needsWrite = false;

    if (!hasCorrectAdmin) {
      console.log('Updating local admin credentials to new hashed values...');
      ensureNewAdmin(local);
      needsWrite = true;
    }

    // Auto-update website_settings if first-order configurations are missing
    if (local.website_settings && local.website_settings.first_order_discount_enabled === undefined) {
      console.log('Seeding automatic first-order discount configurations in local database...');
      local.website_settings.first_order_discount_enabled = true;
      local.website_settings.first_order_min_amount = 250;
      local.website_settings.first_order_discount_amount = 100;
      needsWrite = true;
    }

    // Auto-update if customer_first_order_uses doesn't exist
    if (!local.customer_first_order_uses) {
      console.log('Creating customer_first_order_uses array in local database...');
      local.customer_first_order_uses = [];
      needsWrite = true;
    }

    if (needsWrite) {
      writeLocalDB(local);
    }

    
    return local;
  } catch (err) {
    console.error('Error reading local db:', err.message);
    return {};
  }
}

// Write local data
function writeLocalDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local db:', err.message);
  }
}



// Helper to generate UUID-like strings for local items
function generateId() {
  return 'local_' + Math.random().toString(36).substr(2, 9);
}

// Check if we should use Supabase
const useSupabase = () => supabase !== null;

const db = {
  // --- WEBSITE SETTINGS ---
  async getWebsiteSettings() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('website_settings').select('*').eq('id', 1).single();
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.website_settings || { status: 'online', theme: 'dark' };
  },

  async updateWebsiteSettings(settings) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('website_settings').update(settings).eq('id', 1).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    local.website_settings = { ...local.website_settings, ...settings };
    writeLocalDB(local);
    return local.website_settings;
  },

  // --- RESTAURANT INFO ---
  async getRestaurantSettings() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('restaurant_settings').select('*').eq('id', 1).single();
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.restaurant_settings || {};
  },

  async updateRestaurantSettings(settings) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('restaurant_settings').update(settings).eq('id', 1).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    local.restaurant_settings = { ...local.restaurant_settings, ...settings };
    writeLocalDB(local);
    return local.restaurant_settings;
  },

  // --- CONTACT INFO ---
  async getContactInformation() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('contact_information').select('*').eq('id', 1).single();
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.contact_information || {};
  },

  async updateContactInformation(contact) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('contact_information').update(contact).eq('id', 1).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    local.contact_information = { ...local.contact_information, ...contact };
    writeLocalDB(local);
    return local.contact_information;
  },

  // --- HERO SECTION ---
  async getHeroSection() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('hero_section').select('*').eq('id', 1).single();
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.hero_section || {};
  },

  async updateHeroSection(hero) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('hero_section').update(hero).eq('id', 1).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    local.hero_section = { ...local.hero_section, ...hero };
    writeLocalDB(local);
    return local.hero_section;
  },

  // --- QR CODES ---
  async getQRCode() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('qr_codes').select('*').eq('id', 1).single();
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.qr_codes || { qr_image_url: null, destination_url: '' };
  },

  async updateQRCode(qr) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('qr_codes').update(qr).eq('id', 1).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    local.qr_codes = { ...local.qr_codes, ...qr };
    writeLocalDB(local);
    return local.qr_codes;
  },

  // --- MENU CATEGORIES ---
  async getCategories() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_categories').select('*').order('display_order', { ascending: true });
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.menu_categories || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addCategory(name, displayOrder = 0) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_categories').insert([{ name, display_order: displayOrder }]).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const newCat = { id: generateId(), name, display_order: parseInt(displayOrder) || 0, created_at: new Date().toISOString() };
    local.menu_categories.push(newCat);
    writeLocalDB(local);
    return newCat;
  },

  async updateCategory(id, updates) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_categories').update(updates).eq('id', id).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const catIndex = local.menu_categories.findIndex(c => c.id === id);
    if (catIndex > -1) {
      local.menu_categories[catIndex] = { ...local.menu_categories[catIndex], ...updates };
      writeLocalDB(local);
      return local.menu_categories[catIndex];
    }
    return null;
  },

  async deleteCategory(id) {
    if (useSupabase()) {
      const { error } = await supabase.from('menu_categories').delete().eq('id', id);
      if (!error) return true;
    }
    const local = readLocalDB();
    local.menu_categories = local.menu_categories.filter(c => c.id !== id);
    // Cascade delete menu items belonging to category
    local.menu_items = local.menu_items.filter(item => item.category_id !== id);
    writeLocalDB(local);
    return true;
  },

  // --- MENU ITEMS ---
  async getMenuItems() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_items').select('*').order('display_order', { ascending: true });
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.menu_items || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addMenuItem(item) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_items').insert([item]).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const newItem = {
      id: generateId(),
      ...item,
      price: parseFloat(item.price) || 0,
      display_order: parseInt(item.display_order) || 0,
      status: item.status || 'visible',
      created_at: new Date().toISOString()
    };
    local.menu_items.push(newItem);
    writeLocalDB(local);
    return newItem;
  },

  async updateMenuItem(id, updates) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('menu_items').update(updates).eq('id', id).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const index = local.menu_items.findIndex(item => item.id === id);
    if (index > -1) {
      if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
      if (updates.display_order !== undefined) updates.display_order = parseInt(updates.display_order) || 0;
      local.menu_items[index] = { ...local.menu_items[index], ...updates };
      
      writeLocalDB(local);
      return local.menu_items[index];
    }
    return null;
  },

  async deleteMenuItem(id) {
    if (useSupabase()) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (!error) return true;
    }
    const local = readLocalDB();
    local.menu_items = local.menu_items.filter(item => item.id !== id);
    writeLocalDB(local);
    return true;
  },

  // --- GALLERY IMAGES ---
  async getGalleryImages() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('gallery_images').select('*').order('display_order', { ascending: true });
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.gallery_images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addGalleryImage(image_url, category = 'Food', displayOrder = 0) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('gallery_images').insert([{ image_url, category, display_order: displayOrder }]).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const newImg = {
      id: generateId(),
      image_url,
      category,
      display_order: parseInt(displayOrder) || 0,
      created_at: new Date().toISOString()
    };
    local.gallery_images.push(newImg);
    writeLocalDB(local);
    return newImg;
  },

  async deleteGalleryImage(id) {
    if (useSupabase()) {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (!error) return true;
    }
    const local = readLocalDB();
    local.gallery_images = local.gallery_images.filter(img => img.id !== id);
    writeLocalDB(local);
    return true;
  },

  // --- CUSTOMER REVIEWS ---
  async getReviews() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.reviews || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async addReview(review) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('reviews').insert([review]).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const newReview = {
      id: generateId(),
      ...review,
      rating: parseInt(review.rating) || 5,
      status: review.status || 'visible',
      created_at: new Date().toISOString()
    };
    local.reviews.unshift(newReview);
    writeLocalDB(local);
    return newReview;
  },

  async updateReview(id, updates) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('reviews').update(updates).eq('id', id).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    const index = local.reviews.findIndex(r => r.id === id);
    if (index > -1) {
      if (updates.rating !== undefined) updates.rating = parseInt(updates.rating) || 5;
      local.reviews[index] = { ...local.reviews[index], ...updates };
      writeLocalDB(local);
      return local.reviews[index];
    }
    return null;
  },

  async deleteReview(id) {
    if (useSupabase()) {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (!error) return true;
    }
    const local = readLocalDB();
    local.reviews = local.reviews.filter(r => r.id !== id);
    writeLocalDB(local);
    return true;
  },

  // --- ADMIN AUTHENTICATION ---
  async authenticateAdmin(username, password) {
    if (useSupabase()) {
      try {
        // Map 'My3' to 'joelramireddy@gmail.com' for Supabase authentication
        let loginEmail = username;
        if (username && username.trim().toLowerCase() === 'my3') {
          loginEmail = 'joelramireddy@gmail.com';
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password
        });
        if (error) throw error;
        return { success: true, user: data.user, token: data.session.access_token };
      } catch (err) {
        console.error('Supabase Auth error:', err.message);
        // If login fails on Supabase, do NOT automatically fall back to mock admin for security
      }
    }
    
    // Local / Mock fallback auth
    const local = readLocalDB();
    const inputHash = hashPassword(password);
    const foundAdmin = local.admins.find(a => 
      (a.username.toLowerCase() === username.toLowerCase() || a.email.toLowerCase() === username.toLowerCase()) && 
      a.password === inputHash
    );
    if (foundAdmin) {
      return {
        success: true,
        user: { email: foundAdmin.email, name: foundAdmin.name || 'Admin' },
        token: 'mock-jwt-token-for-mythri-restaurant'
      };
    }
    return { success: false, message: 'Invalid credentials' };
  },


  // --- CUSTOMERS ---
  async getCustomers() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.customers || [];
  },

  async getCustomerByPhone(phone) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('customers').select('*').eq('phone_number', phone).maybeSingle();
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.customers || []).find(c => c.phone_number === phone) || null;
  },

  async createCustomer(customer) {
    const id = customer.id || generateId();
    const newCust = {
      id,
      name: customer.name,
      phone_number: customer.phone_number,
      email: customer.email || null,
      created_at: new Date().toISOString()
    };
    if (useSupabase()) {
      const { data, error } = await supabase.from('customers').insert([newCust]).select().single();
      if (!error) return data;
    }
    const local = readLocalDB();
    if (!local.customers) local.customers = [];
    local.customers.push(newCust);
    writeLocalDB(local);
    return newCust;
  },

  // --- DISCOUNTS ---
  async getDiscounts() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('first_order_discounts').select('*').order('assigned_date', { ascending: false });
      if (!error) return data;
    }
    const local = readLocalDB();
    // Auto check expired status on load
    const now = new Date();
    let changed = false;
    const list = (local.first_order_discounts || []).map(d => {
      if (d.status === 'Active' && d.expiry_date && new Date(d.expiry_date) < now) {
        d.status = 'Expired';
        changed = true;
      }
      return d;
    });
    if (changed) writeLocalDB(local);
    return list.sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));
  },

  async addDiscount(discount) {
    // Validate only one active discount per phone number
    const active = await this.getActiveDiscountByPhone(discount.customer_phone);
    if (active) {
      throw new Error('An active first-order discount already exists for this phone number.');
    }

    const id = generateId();
    const newDisc = {
      id,
      customer_phone: discount.customer_phone,
      discount_type: discount.discount_type,
      discount_value: parseFloat(discount.discount_value) || 0,
      minimum_order_amount: parseFloat(discount.minimum_order_amount) || 0,
      maximum_discount: discount.maximum_discount ? parseFloat(discount.maximum_discount) : null,
      status: discount.status || 'Active',
      notes: discount.notes || null,
      expiry_date: discount.expiry_date || null,
      assigned_by_admin: discount.assigned_by_admin || 'admin',
      assigned_date: new Date().toISOString(),
      used_date: null,
      order_id: null
    };

    if (useSupabase()) {
      const { data, error } = await supabase.from('first_order_discounts').insert([newDisc]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const local = readLocalDB();
    if (!local.first_order_discounts) local.first_order_discounts = [];
    local.first_order_discounts.push(newDisc);
    writeLocalDB(local);
    return newDisc;
  },

  async updateDiscount(id, updates) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('first_order_discounts').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const local = readLocalDB();
    const index = local.first_order_discounts.findIndex(d => d.id === id);
    if (index > -1) {
      local.first_order_discounts[index] = { ...local.first_order_discounts[index], ...updates };
      writeLocalDB(local);
      return local.first_order_discounts[index];
    }
    return null;
  },

  async deleteDiscount(id) {
    if (useSupabase()) {
      const { error } = await supabase.from('first_order_discounts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const local = readLocalDB();
    local.first_order_discounts = (local.first_order_discounts || []).filter(d => d.id !== id);
    writeLocalDB(local);
    return true;
  },

  async getActiveDiscountByPhone(phone) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('first_order_discounts')
        .select('*')
        .eq('customer_phone', phone)
        .eq('status', 'Active')
        .maybeSingle();
      if (!error && data) {
        // Check expiry dynamically
        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
          await supabase.from('first_order_discounts').update({ status: 'Expired' }).eq('id', data.id);
          return null;
        }
        return data;
      }
      return null;
    }

    const local = readLocalDB();
    const discount = (local.first_order_discounts || []).find(d => d.customer_phone === phone && d.status === 'Active');
    if (discount) {
      if (discount.expiry_date && new Date(discount.expiry_date) < new Date()) {
        discount.status = 'Expired';
        writeLocalDB(local);
        return null;
      }
      return discount;
    }
    return null;
  },

  async getFirstOrderUseByPhone(phone) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('customer_first_order_uses')
        .select('*')
        .eq('phone_number', phone)
        .maybeSingle();
      if (!error && data) return data;
    }
    const local = readLocalDB();
    return (local.customer_first_order_uses || []).find(u => u.phone_number === phone) || null;
  },

  async markFirstOrderUse(phone, orderId) {
    const record = {
      phone_number: phone,
      first_order_discount_used: true,
      discount_applied_at: new Date().toISOString(),
      order_id: orderId
    };

    if (useSupabase()) {
      const { error } = await supabase.from('customer_first_order_uses').upsert([record]);
      if (error) console.error('Error upserting first order use in Supabase:', error.message);
      return;
    }

    const local = readLocalDB();
    if (!local.customer_first_order_uses) local.customer_first_order_uses = [];
    const idx = local.customer_first_order_uses.findIndex(u => u.phone_number === phone);
    if (idx > -1) {
      local.customer_first_order_uses[idx] = record;
    } else {
      local.customer_first_order_uses.push(record);
    }
    writeLocalDB(local);
  },

  async removeFirstOrderUse(phone) {
    if (useSupabase()) {
      const { error } = await supabase.from('customer_first_order_uses').delete().eq('phone_number', phone);
      if (error) console.error('Error deleting first order use from Supabase:', error.message);
      return;
    }

    const local = readLocalDB();
    if (local.customer_first_order_uses) {
      local.customer_first_order_uses = local.customer_first_order_uses.filter(u => u.phone_number !== phone);
      writeLocalDB(local);
    }
  },

  async checkDiscountEligibility(phone, amount) {
    const settings = await this.getWebsiteSettings();
    const firstOrderEnabled = settings.first_order_discount_enabled !== false;
    const firstOrderMinVal = settings.first_order_min_amount !== undefined ? parseFloat(settings.first_order_min_amount) : 250;
    const firstOrderAmt = settings.first_order_discount_amount !== undefined ? parseFloat(settings.first_order_discount_amount) : 100;

    if (firstOrderEnabled) {
      // 1. Check customer_first_order_uses table first
      const useRecord = await this.getFirstOrderUseByPhone(phone);
      if (useRecord && useRecord.first_order_discount_used) {
        return { 
          eligible: false, 
          reason: 'First Order Offer has already been used for this phone number.' 
        };
      }

      // 2. Check previous completed orders
      const orders = await this.getCompletedOrdersByPhone(phone);
      if (orders.length > 0) {
        return { 
          eligible: false, 
          reason: 'First Order Offer has already been used for this phone number.' 
        };
      }

      // 3. Verify minimum order amount
      if (amount < firstOrderMinVal) {
        return { 
          eligible: false, 
          isBelowMinAmount: true,
          minAmount: firstOrderMinVal,
          currentAmount: amount,
          reason: `Add ₹${(firstOrderMinVal - amount).toFixed(2)} more to unlock your ₹${firstOrderAmt} First Order Discount.`
        };
      }

      // Calculate discount value (cannot exceed order total)
      const discountAmount = Math.min(firstOrderAmt, amount);
      return {
        eligible: true,
        isAutomaticFirstOrder: true,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat((amount - discountAmount).toFixed(2)),
        reason: `🎉 Congratulations! Your first order discount of ₹${firstOrderAmt} has been applied.`,
        minAmount: firstOrderMinVal
      };
    }

    // Fallback to manual discount system if the automatic first-order discount is disabled
    const discount = await this.getActiveDiscountByPhone(phone);
    if (!discount) {
      return { eligible: false, reason: 'No active discount assigned to this phone number.' };
    }

    const orders = await this.getCompletedOrdersByPhone(phone);
    if (orders.length > 0) {
      return { eligible: false, reason: 'First Order Offer has already been used for this phone number.' };
    }

    if (amount < discount.minimum_order_amount) {
      return { 
        eligible: false, 
        reason: `Minimum order amount of ₹${discount.minimum_order_amount} is required to apply this discount.`,
        discount
      };
    }

    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (amount * discount.discount_value) / 100;
      if (discount.maximum_discount && discountAmount > discount.maximum_discount) {
        discountAmount = discount.maximum_discount;
      }
    } else {
      discountAmount = discount.discount_value;
    }
    discountAmount = Math.min(discountAmount, amount);

    return {
      eligible: true,
      discount,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat((amount - discountAmount).toFixed(2)),
      reason: '🎉 First-Time Discount Applied!'
    };
  },

  async getCompletedOrdersByPhone(phone) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .eq('order_status', 'Completed');
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.orders || []).filter(o => o.customer_phone === phone && o.order_status === 'Completed');
  },

  // --- ORDERS ---
  async getOrders() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.orders || [];
  },

  async createOrder(order) {
    const id = 'ORD_' + Math.floor(100000 + Math.random() * 900000);
    
    // Server-side validation of discount eligibility
    let discountAmount = 0;
    let finalAmount = parseFloat(order.original_amount);
    let isFirstOrder = false;
    let firstOrderDiscountReason = '';

    const settings = await this.getWebsiteSettings();
    const firstOrderEnabled = settings.first_order_discount_enabled !== false;
    const firstOrderMinVal = settings.first_order_min_amount !== undefined ? parseFloat(settings.first_order_min_amount) : 250;
    const firstOrderAmt = settings.first_order_discount_amount !== undefined ? parseFloat(settings.first_order_discount_amount) : 100;

    if (firstOrderEnabled) {
      const useRecord = await this.getFirstOrderUseByPhone(order.customer_phone);
      const orders = await this.getCompletedOrdersByPhone(order.customer_phone);
      
      if ((useRecord && useRecord.first_order_discount_used) || orders.length > 0) {
        firstOrderDiscountReason = 'First Order Offer has already been used for this phone number.';
      } else if (finalAmount < firstOrderMinVal) {
        firstOrderDiscountReason = `Order subtotal (₹${finalAmount.toFixed(2)}) was below the minimum requirement of ₹${firstOrderMinVal.toFixed(2)}.`;
      } else {
        discountAmount = Math.min(firstOrderAmt, finalAmount);
        finalAmount -= discountAmount;
        isFirstOrder = true;
        firstOrderDiscountReason = '🎉 First Order Offer Applied!';
      }
    } else {
      firstOrderDiscountReason = 'First Order Offer was disabled by admin.';
      if (order.discount_id) {
        // Verify manual discount
        const eligibility = await this.checkDiscountEligibility(order.customer_phone, finalAmount);
        if (eligibility.eligible && eligibility.discount && eligibility.discount.id === order.discount_id) {
          discountAmount = eligibility.discountAmount;
          finalAmount = eligibility.finalAmount;
        }
      }
    }

    const newOrder = {
      id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || null,
      items: order.items,
      original_amount: parseFloat(order.original_amount),
      discount_id: isFirstOrder ? null : (order.discount_id || null),
      discount_amount: parseFloat(discountAmount),
      final_amount: parseFloat(finalAmount),
      is_first_order: isFirstOrder,
      first_order_discount_reason: firstOrderDiscountReason,
      payment_status: order.payment_status || 'Pending',
      order_status: order.order_status || 'Pending',
      created_at: new Date().toISOString()
    };

    // Customer Auto Creation/Resolution
    const existingCustomer = await this.getCustomerByPhone(order.customer_phone);
    if (!existingCustomer) {
      await this.createCustomer({
        name: order.customer_name,
        phone_number: order.customer_phone,
        email: order.customer_email || null
      });
    }

    // Handle discount consumption on success
    if (newOrder.discount_id && newOrder.payment_status === 'Paid') {
      await this.updateDiscount(newOrder.discount_id, {
        status: 'Used',
        used_date: new Date().toISOString(),
        order_id: id
      });
    }

    // Handle automatic first-order discount use recording
    if (isFirstOrder && (newOrder.payment_status === 'Paid' || newOrder.order_status === 'Completed')) {
      await this.markFirstOrderUse(newOrder.customer_phone, id);
    }

    if (useSupabase()) {
      const { data, error } = await supabase.from('orders').insert([newOrder]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const local = readLocalDB();
    if (!local.orders) local.orders = [];
    local.orders.push(newOrder);
    writeLocalDB(local);
    return newOrder;
  },

  async updateOrderStatus(id, updates) {
    const order = await this.getOrderById(id);
    if (order && order.is_first_order) {
      const paymentStatus = updates.payment_status || order.payment_status;
      const orderStatus = updates.order_status || order.order_status;
      
      if (orderStatus === 'Cancelled' || paymentStatus === 'Failed') {
        await this.removeFirstOrderUse(order.customer_phone);
      } else if (paymentStatus === 'Paid' || orderStatus === 'Completed') {
        await this.markFirstOrderUse(order.customer_phone, id);
      }
    }

    // If order payment status is toggled, check if we need to mark manual discount used/active
    if (updates.payment_status || updates.order_status) {
      if (order && order.discount_id) {
        if (updates.payment_status === 'Paid') {
          await this.updateDiscount(order.discount_id, {
            status: 'Used',
            used_date: new Date().toISOString(),
            order_id: id
          });
        } else if (updates.payment_status === 'Failed' || updates.order_status === 'Cancelled') {
          // Put back to active
          await this.updateDiscount(order.discount_id, {
            status: 'Active',
            used_date: null,
            order_id: null
          });
        }
      }
    }

    if (useSupabase()) {
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const local = readLocalDB();
    const index = local.orders.findIndex(o => o.id === id);
    if (index > -1) {
      local.orders[index] = { ...local.orders[index], ...updates };
      writeLocalDB(local);
      return local.orders[index];
    }
    return null;
  },

  async getOrderById(id) {
    if (useSupabase()) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (!error) return data;
    }
    const local = readLocalDB();
    return (local.orders || []).find(o => o.id === id) || null;
  }
};

module.exports = db;
