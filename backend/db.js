const pool = require('./dbConfig');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Password hashing helper
function hashPassword(password) {
  const salt = 'mythri_restaurant_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

const usePostgres = () => pool !== null;

// --- LOCAL MOCK DATABASE FALLBACK LAYER ---
const dbPath = path.join(__dirname, 'db.json');
let localDB = null;

if (!usePostgres()) {
  if (fs.existsSync(dbPath)) {
    try {
      localDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse local db.json:', e.message);
    }
  }
  if (!localDB) {
    const seedsPath = path.join(__dirname, 'seeds.json');
    try {
      localDB = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
      fs.writeFileSync(dbPath, JSON.stringify(localDB, null, 2), 'utf8');
      console.log('Local db.json initialized from seeds.json');
    } catch (err) {
      console.error('Failed to load seeds.json, using default schema:', err.message);
      const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
      localDB = {
        website_settings: { status: "online", theme: "dark", first_order_discount_enabled: true, first_order_min_amount: 250, first_order_discount_amount: 100 },
        restaurant_settings: {},
        contact_information: {},
        hero_section: {},
        qr_codes: {},
        admins: [{ username: "My3", password: targetHash, email: "joelramireddy@gmail.com", name: "Joel" }],
        menu_categories: [],
        menu_items: [],
        gallery_images: [],
        reviews: [],
        orders: [],
        first_order_discounts: [],
        customer_first_order_uses: [],
        customers: []
      };
      fs.writeFileSync(dbPath, JSON.stringify(localDB, null, 2), 'utf8');
    }
  }

  // Ensure default admin in mock db
  const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
  if (!localDB.admins) localDB.admins = [];
  const hasCorrectAdmin = localDB.admins.some(a => a.username === 'My3' && a.email === 'joelramireddy@gmail.com' && a.password === targetHash);
  if (!hasCorrectAdmin) {
    localDB.admins = localDB.admins.filter(a => a.username !== 'My3' && a.email !== 'joelramireddy@gmail.com');
    localDB.admins.push({ username: "My3", password: targetHash, email: "joelramireddy@gmail.com", name: "Joel" });
    fs.writeFileSync(dbPath, JSON.stringify(localDB, null, 2), 'utf8');
  }
}

function saveLocalDB() {
  if (!usePostgres() && localDB) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(localDB, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write db.json:', e.message);
    }
  }
}

// Seed admin on boot in Postgres
async function ensureAdminSeeded() {
  if (!usePostgres()) return;
  const targetHash = '2a72532749481a79c750aeb1a3179fdf91f8fbbd62246697dbc546be660a1d31';
  try {
    const res = await pool.query('SELECT * FROM admins WHERE username = $1 OR email = $2', ['My3', 'joelramireddy@gmail.com']);
    if (res.rowCount === 0) {
      await pool.query(
        'INSERT INTO admins (username, email, password, name) VALUES ($1, $2, $3, $4)',
        ['My3', 'joelramireddy@gmail.com', targetHash, 'Joel']
      );
      console.log('Default admin seeded successfully in Neon PostgreSQL.');
    } else {
      // Keep admin credentials updated
      await pool.query('UPDATE admins SET password = $1 WHERE username = $2', [targetHash, 'My3']);
    }
    return;
  } catch (err) {
    console.error('Error ensuring admin is seeded:', err.message);
  }
}

async function initializeDatabase() {
  if (!usePostgres()) return;
  try {
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `;
    const res = await pool.query(checkTableQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      console.log('Database tables not found. Running schema.sql initialization...');
      let schemaPath = path.join(__dirname, '../schema.sql');
      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join(__dirname, 'schema.sql');
      }
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('Database schema initialized and seeded successfully in Neon PostgreSQL!');
      } else {
        console.warn('Warning: schema.sql file not found.');
      }
    } else {
      console.log('Database tables verified successfully.');
    }
    // Run schema migrations/alterations if tables exist
    await pool.query('ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS image_url TEXT');
  } catch (err) {
    console.error('Error verifying/initializing database schema:', err.message);
  }
  
  await ensureAdminSeeded();
}

// Invoke on boot
initializeDatabase();

// Dynamic Helpers for SQL Operations
async function updateRow(table, id, updates, idColumn = 'id') {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  const sql = `UPDATE "${table}" SET ${setClause} WHERE "${idColumn}" = $${keys.length + 1} RETURNING *`;
  const result = await pool.query(sql, [...values, id]);
  return result.rows[0] || null;
}

async function insertRow(table, record) {
  const keys = Object.keys(record);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO "${table}" (${cols}) VALUES (${vals}) RETURNING *`;
  const result = await pool.query(sql, Object.values(record));
  return result.rows[0];
}

const db = {
  usePostgres,
  hashPassword,

  // --- WEBSITE SETTINGS ---
  async getWebsiteSettings() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM website_settings WHERE id = 1');
      return res.rows[0] || { status: 'online', theme: 'dark' };
    }
    return localDB.website_settings || { status: 'online', theme: 'dark' };
  },

  async updateWebsiteSettings(settings) {
    const updates = {};
    if (settings.status !== undefined) updates.status = settings.status;
    if (settings.theme !== undefined) updates.theme = settings.theme;
    if (settings.first_order_discount_enabled !== undefined) {
      updates.first_order_discount_enabled = settings.first_order_discount_enabled === true || settings.first_order_discount_enabled === 'true';
    }
    if (settings.first_order_min_amount !== undefined) updates.first_order_min_amount = parseFloat(settings.first_order_min_amount) || 0;
    if (settings.first_order_discount_amount !== undefined) updates.first_order_discount_amount = parseFloat(settings.first_order_discount_amount) || 0;
    updates.updated_at = new Date().toISOString();

    if (usePostgres()) {
      return await updateRow('website_settings', 1, updates);
    }
    localDB.website_settings = { ...localDB.website_settings, ...updates };
    saveLocalDB();
    return localDB.website_settings;
  },

  // --- RESTAURANT INFO ---
  async getRestaurantSettings() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM restaurant_settings WHERE id = 1');
      return res.rows[0] || {};
    }
    return localDB.restaurant_settings || {};
  },

  async updateRestaurantSettings(settings) {
    const updates = { ...settings, updated_at: new Date().toISOString() };
    delete updates.id;
    if (updates.opening_hours && typeof updates.opening_hours === 'object') {
      updates.opening_hours = JSON.stringify(updates.opening_hours);
    }
    if (updates.social_media_links && typeof updates.social_media_links === 'object') {
      updates.social_media_links = JSON.stringify(updates.social_media_links);
    }

    if (usePostgres()) {
      return await updateRow('restaurant_settings', 1, updates);
    }
    localDB.restaurant_settings = { ...localDB.restaurant_settings, ...updates };
    saveLocalDB();
    return localDB.restaurant_settings;
  },

  // --- CONTACT INFO ---
  async getContactInformation() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM contact_information WHERE id = 1');
      return res.rows[0] || {};
    }
    return localDB.contact_information || {};
  },

  async updateContactInformation(contact) {
    const updates = { ...contact, updated_at: new Date().toISOString() };
    delete updates.id;

    if (usePostgres()) {
      return await updateRow('contact_information', 1, updates);
    }
    localDB.contact_information = { ...localDB.contact_information, ...updates };
    saveLocalDB();
    return localDB.contact_information;
  },

  // --- HERO SECTION ---
  async getHeroSection() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM hero_section WHERE id = 1');
      return res.rows[0] || {};
    }
    return localDB.hero_section || {};
  },

  async updateHeroSection(hero) {
    const updates = { ...hero, updated_at: new Date().toISOString() };
    delete updates.id;
    if (updates.cta_buttons && typeof updates.cta_buttons === 'object') {
      updates.cta_buttons = JSON.stringify(updates.cta_buttons);
    }
    if (updates.badges && typeof updates.badges === 'object') {
      updates.badges = JSON.stringify(updates.badges);
    }

    if (usePostgres()) {
      return await updateRow('hero_section', 1, updates);
    }
    localDB.hero_section = { ...localDB.hero_section, ...updates };
    saveLocalDB();
    return localDB.hero_section;
  },

  // --- QR CODES ---
  async getQRCode() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM qr_codes WHERE id = 1');
      return res.rows[0] || { qr_image_url: null, destination_url: '' };
    }
    return localDB.qr_codes || { qr_image_url: null, destination_url: '' };
  },

  async updateQRCode(qr) {
    const updates = { ...qr, updated_at: new Date().toISOString() };
    delete updates.id;

    if (usePostgres()) {
      return await updateRow('qr_codes', 1, updates);
    }
    localDB.qr_codes = { ...localDB.qr_codes, ...updates };
    saveLocalDB();
    return localDB.qr_codes;
  },

  // --- PAYMENT QR CODES ---
  async getPaymentQRs() {
    if (useSupabase()) {
      const { data, error } = await supabase.from('payment_qr_codes').select('*').order('created_at', { ascending: false });
      if (!error) return data;
    }
    const local = readLocalDB();
    return local.payment_qr_codes || [];
  },

  async addPaymentQR(qrData) {
    const newQR = {
      id: qrData.id || `pqr_${Date.now()}`,
      image_url: qrData.image_url,
      name: qrData.name,
      is_active: qrData.is_active || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (useSupabase()) {
      // If setting this one to active, deactivate others first
      if (newQR.is_active) {
        await supabase.from('payment_qr_codes').update({ is_active: false }).neq('id', newQR.id);
      }
      const { data, error } = await supabase.from('payment_qr_codes').insert([newQR]).select().single();
      if (!error) return data;
    }
    
    const local = readLocalDB();
    if (!local.payment_qr_codes) local.payment_qr_codes = [];
    if (newQR.is_active) {
      local.payment_qr_codes = local.payment_qr_codes.map(q => ({ ...q, is_active: false }));
    }
    local.payment_qr_codes.unshift(newQR);
    writeLocalDB(local);
    return newQR;
  },

  async updatePaymentQR(id, updates) {
    updates.updated_at = new Date().toISOString();
    
    if (useSupabase()) {
      // If setting this one to active, deactivate others first
      if (updates.is_active === true) {
        await supabase.from('payment_qr_codes').update({ is_active: false }).neq('id', id);
      }
      const { data, error } = await supabase.from('payment_qr_codes').update(updates).eq('id', id).select().single();
      if (!error) return data;
    }
    
    const local = readLocalDB();
    const index = local.payment_qr_codes.findIndex(q => q.id === id);
    if (index !== -1) {
      if (updates.is_active === true) {
        local.payment_qr_codes = local.payment_qr_codes.map(q => ({ ...q, is_active: false }));
      }
      local.payment_qr_codes[index] = { ...local.payment_qr_codes[index], ...updates };
      writeLocalDB(local);
      return local.payment_qr_codes[index];
    }
    return null;
  },

  async deletePaymentQR(id) {
    if (useSupabase()) {
      await supabase.from('payment_qr_codes').delete().eq('id', id);
    }
    const local = readLocalDB();
    local.payment_qr_codes = local.payment_qr_codes.filter(q => q.id !== id);
    writeLocalDB(local);
    return true;
  },

  // --- MENU CATEGORIES ---
  async getCategories() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM menu_categories ORDER BY display_order ASC');
      return res.rows;
    }
    return (localDB.menu_categories || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addCategory(name, displayOrder = 0) {
    const id = 'cat_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      name,
      display_order: parseInt(displayOrder) || 0,
      image_url: null,
      created_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('menu_categories', record);
    }
    if (!localDB.menu_categories) localDB.menu_categories = [];
    localDB.menu_categories.push(record);
    saveLocalDB();
    return record;
  },

  async updateCategory(id, updates) {
    const cleanUpdates = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.display_order !== undefined) cleanUpdates.display_order = parseInt(updates.display_order) || 0;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;

    if (usePostgres()) {
      return await updateRow('menu_categories', id, cleanUpdates);
    }
    if (!localDB.menu_categories) localDB.menu_categories = [];
    const index = localDB.menu_categories.findIndex(c => c.id === id);
    if (index > -1) {
      localDB.menu_categories[index] = { ...localDB.menu_categories[index], ...cleanUpdates };
      saveLocalDB();
      return localDB.menu_categories[index];
    }
    return null;
  },

  async deleteCategory(id) {
    if (usePostgres()) {
      await pool.query('DELETE FROM menu_categories WHERE id = $1', [id]);
      return true;
    }
    if (localDB.menu_categories) {
      localDB.menu_categories = localDB.menu_categories.filter(c => c.id !== id);
    }
    if (localDB.menu_items) {
      localDB.menu_items = localDB.menu_items.filter(i => i.category_id !== id);
    }
    saveLocalDB();
    return true;
  },

  // --- MENU ITEMS ---
  async getMenuItemById(id) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return (localDB.menu_items || []).find(i => i.id === id) || null;
  },

  async getMenuItems() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM menu_items ORDER BY display_order ASC');
      return res.rows;
    }
    return (localDB.menu_items || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addMenuItem(item) {
    const id = 'item_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      name: item.name,
      price: parseFloat(item.price) || 0,
      category_id: item.category_id,
      description: item.description || null,
      image_url: item.image_url || null,
      status: item.status || 'visible',
      is_popular: item.is_popular === true || item.is_popular === 'true',
      display_order: parseInt(item.display_order) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('menu_items', record);
    }
    if (!localDB.menu_items) localDB.menu_items = [];
    localDB.menu_items.push(record);
    saveLocalDB();
    return record;
  },

  async updateMenuItem(id, updates) {
    const cleanUpdates = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.price !== undefined) cleanUpdates.price = parseFloat(updates.price) || 0;
    if (updates.category_id !== undefined) cleanUpdates.category_id = updates.category_id;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.is_popular !== undefined) cleanUpdates.is_popular = updates.is_popular === true || updates.is_popular === 'true';
    if (updates.display_order !== undefined) cleanUpdates.display_order = parseInt(updates.display_order) || 0;
    cleanUpdates.updated_at = new Date().toISOString();

    if (usePostgres()) {
      return await updateRow('menu_items', id, cleanUpdates);
    }
    if (!localDB.menu_items) localDB.menu_items = [];
    const index = localDB.menu_items.findIndex(i => i.id === id);
    if (index > -1) {
      localDB.menu_items[index] = { ...localDB.menu_items[index], ...cleanUpdates };
      saveLocalDB();
      return localDB.menu_items[index];
    }
    return null;
  },

  async deleteMenuItem(id) {
    if (usePostgres()) {
      await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
      return true;
    }
    if (localDB.menu_items) {
      localDB.menu_items = localDB.menu_items.filter(i => i.id !== id);
    }
    saveLocalDB();
    return true;
  },

  // --- GALLERY IMAGES ---
  async getGalleryImages() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM gallery_images ORDER BY display_order ASC');
      return res.rows;
    }
    return (localDB.gallery_images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  },

  async addGalleryImage(image_url, category = 'Food', displayOrder = 0) {
    const id = 'gal_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      image_url,
      category,
      display_order: parseInt(displayOrder) || 0,
      created_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('gallery_images', record);
    }
    if (!localDB.gallery_images) localDB.gallery_images = [];
    localDB.gallery_images.push(record);
    saveLocalDB();
    return record;
  },

  async deleteGalleryImage(id) {
    if (usePostgres()) {
      await pool.query('DELETE FROM gallery_images WHERE id = $1', [id]);
      return true;
    }
    if (localDB.gallery_images) {
      localDB.gallery_images = localDB.gallery_images.filter(g => g.id !== id);
    }
    saveLocalDB();
    return true;
  },

  // --- CUSTOMER REVIEWS ---
  async getReviews() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
      return res.rows;
    }
    return (localDB.reviews || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async addReview(review) {
    const id = 'rev_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      customer_name: review.customer_name,
      review_text: review.review_text,
      rating: parseInt(review.rating) || 5,
      photo_url: review.photo_url || null,
      status: review.status || 'visible',
      created_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('reviews', record);
    }
    if (!localDB.reviews) localDB.reviews = [];
    localDB.reviews.push(record);
    saveLocalDB();
    return record;
  },

  async updateReview(id, updates) {
    const cleanUpdates = {};
    if (updates.customer_name !== undefined) cleanUpdates.customer_name = updates.customer_name;
    if (updates.review_text !== undefined) cleanUpdates.review_text = updates.review_text;
    if (updates.rating !== undefined) cleanUpdates.rating = parseInt(updates.rating) || 5;
    if (updates.photo_url !== undefined) cleanUpdates.photo_url = updates.photo_url;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    if (usePostgres()) {
      return await updateRow('reviews', id, cleanUpdates);
    }
    if (!localDB.reviews) localDB.reviews = [];
    const index = localDB.reviews.findIndex(r => r.id === id);
    if (index > -1) {
      localDB.reviews[index] = { ...localDB.reviews[index], ...cleanUpdates };
      saveLocalDB();
      return localDB.reviews[index];
    }
    return null;
  },

  async deleteReview(id) {
    if (usePostgres()) {
      await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
      return true;
    }
    if (localDB.reviews) {
      localDB.reviews = localDB.reviews.filter(r => r.id !== id);
    }
    saveLocalDB();
    return true;
  },

  // --- ADMIN AUTHENTICATION ---
  async authenticateAdmin(username, password) {
    const inputHash = hashPassword(password);

    if (usePostgres()) {
      const res = await pool.query(
        'SELECT * FROM admins WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)) AND password = $2',
        [username, inputHash]
      );
      const foundAdmin = res.rows[0];
      if (foundAdmin) {
        return {
          success: true,
          user: { email: foundAdmin.email, name: foundAdmin.name || 'Admin', username: foundAdmin.username },
          token: 'mock-jwt-token-for-mythri-restaurant'
        };
      }
      return { success: false, message: 'Invalid credentials' };
    }

    const foundAdmin = (localDB.admins || []).find(a => 
      (a.username.toLowerCase() === username.toLowerCase() || a.email.toLowerCase() === username.toLowerCase()) && 
      a.password === inputHash
    );
    if (foundAdmin) {
      return {
        success: true,
        user: { email: foundAdmin.email, name: foundAdmin.name || 'Admin', username: foundAdmin.username },
        token: 'mock-jwt-token-for-mythri-restaurant'
      };
    }
    return { success: false, message: 'Invalid credentials' };
  },

  // --- CUSTOMERS ---
  async getCustomers() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
      return res.rows;
    }
    return (localDB.customers || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getCustomerByPhone(phone) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM customers WHERE phone_number = $1', [phone]);
      return res.rows[0] || null;
    }
    return (localDB.customers || []).find(c => c.phone_number === phone) || null;
  },

  async createCustomer(customer) {
    const id = customer.id || 'cust_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      name: customer.name,
      phone_number: customer.phone_number,
      email: customer.email || null,
      created_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('customers', record);
    }
    if (!localDB.customers) localDB.customers = [];
    localDB.customers.push(record);
    saveLocalDB();
    return record;
  },

  // --- DISCOUNTS ---
  async getDiscounts() {
    const now = new Date().toISOString();
    if (usePostgres()) {
      await pool.query(
        `UPDATE first_order_discounts SET status = 'Expired' WHERE status = 'Active' AND expiry_date < $1`,
        [now]
      );
      const res = await pool.query('SELECT * FROM first_order_discounts ORDER BY assigned_date DESC');
      return res.rows;
    }

    if (localDB.first_order_discounts) {
      localDB.first_order_discounts.forEach(d => {
        if (d.status === 'Active' && d.expiry_date && new Date(d.expiry_date) < new Date()) {
          d.status = 'Expired';
        }
      });
      saveLocalDB();
    }
    return (localDB.first_order_discounts || []).sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));
  },

  async addDiscount(discount) {
    const active = await this.getActiveDiscountByPhone(discount.customer_phone);
    if (active) {
      throw new Error('An active first-order discount already exists for this phone number.');
    }
    const id = 'disc_' + Math.random().toString(36).substr(2, 9);
    const record = {
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

    if (usePostgres()) {
      return await insertRow('first_order_discounts', record);
    }
    if (!localDB.first_order_discounts) localDB.first_order_discounts = [];
    localDB.first_order_discounts.push(record);
    saveLocalDB();
    return record;
  },

  async updateDiscount(id, updates) {
    const cleanUpdates = {};
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.used_date !== undefined) cleanUpdates.used_date = updates.used_date;
    if (updates.order_id !== undefined) cleanUpdates.order_id = updates.order_id;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

    if (usePostgres()) {
      return await updateRow('first_order_discounts', id, cleanUpdates);
    }
    if (!localDB.first_order_discounts) localDB.first_order_discounts = [];
    const index = localDB.first_order_discounts.findIndex(d => d.id === id);
    if (index > -1) {
      localDB.first_order_discounts[index] = { ...localDB.first_order_discounts[index], ...cleanUpdates };
      saveLocalDB();
      return localDB.first_order_discounts[index];
    }
    return null;
  },

  async deleteDiscount(id) {
    if (usePostgres()) {
      await pool.query('DELETE FROM first_order_discounts WHERE id = $1', [id]);
      return true;
    }
    if (localDB.first_order_discounts) {
      localDB.first_order_discounts = localDB.first_order_discounts.filter(d => d.id !== id);
    }
    saveLocalDB();
    return true;
  },

  async getActiveDiscountByPhone(phone) {
    if (usePostgres()) {
      const res = await pool.query(
        `SELECT * FROM first_order_discounts WHERE customer_phone = $1 AND status = 'Active'`,
        [phone]
      );
      const discount = res.rows[0];
      if (discount) {
        if (discount.expiry_date && new Date(discount.expiry_date) < new Date()) {
          await pool.query(`UPDATE first_order_discounts SET status = 'Expired' WHERE id = $1`, [discount.id]);
          return null;
        }
        return discount;
      }
      return null;
    }

    const discount = (localDB.first_order_discounts || []).find(d => d.customer_phone === phone && d.status === 'Active');
    if (discount) {
      if (discount.expiry_date && new Date(discount.expiry_date) < new Date()) {
        discount.status = 'Expired';
        saveLocalDB();
        return null;
      }
      return discount;
    }
    return null;
  },

  async getFirstOrderUseByPhone(phone) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM customer_first_order_uses WHERE phone_number = $1', [phone]);
      return res.rows[0] || null;
    }
    return (localDB.customer_first_order_uses || []).find(u => u.phone_number === phone) || null;
  },

  async markFirstOrderUse(phone, orderId) {
    if (usePostgres()) {
      await pool.query(
        `INSERT INTO customer_first_order_uses (phone_number, first_order_discount_used, discount_applied_at, order_id)
         VALUES ($1, true, NOW(), $2)
         ON CONFLICT (phone_number) DO UPDATE
         SET first_order_discount_used = true, discount_applied_at = NOW(), order_id = $2`,
        [phone, orderId]
      );
      return;
    }

    if (!localDB.customer_first_order_uses) localDB.customer_first_order_uses = [];
    const index = localDB.customer_first_order_uses.findIndex(u => u.phone_number === phone);
    const record = { phone_number: phone, first_order_discount_used: true, discount_applied_at: new Date().toISOString(), order_id: orderId };
    if (index > -1) {
      localDB.customer_first_order_uses[index] = record;
    } else {
      localDB.customer_first_order_uses.push(record);
    }
    saveLocalDB();
  },

  async removeFirstOrderUse(phone) {
    if (usePostgres()) {
      await pool.query('DELETE FROM customer_first_order_uses WHERE phone_number = $1', [phone]);
      return;
    }
    if (localDB.customer_first_order_uses) {
      localDB.customer_first_order_uses = localDB.customer_first_order_uses.filter(u => u.phone_number !== phone);
      saveLocalDB();
    }
  },

  async getCompletedOrdersByPhone(phone) {
    if (usePostgres()) {
      const res = await pool.query(
        `SELECT * FROM orders WHERE customer_phone = $1 AND order_status = 'Completed'`,
        [phone]
      );
      return res.rows;
    }
    return (localDB.orders || []).filter(o => o.customer_phone === phone && o.order_status === 'Completed');
  },

  // --- ORDERS ---
  async getOrders() {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows;
    }
    return (localDB.orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getOrderById(id) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return (localDB.orders || []).find(o => o.id === id) || null;
  },

  async createOrder(order) {
    const id = 'ORD_' + Math.floor(100000 + Math.random() * 900000);
    
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
        firstOrderDiscountReason = `Order subtotal (₹${(Number(finalAmount) || 0).toFixed(2)}) was below the minimum requirement of ₹${(Number(firstOrderMinVal) || 0).toFixed(2)}.`;
      } else {
        discountAmount = Math.min(firstOrderAmt, finalAmount);
        finalAmount -= discountAmount;
        isFirstOrder = true;
        firstOrderDiscountReason = '🎉 First Order Offer Applied!';
      }
    } else {
      firstOrderDiscountReason = 'First Order Offer was disabled by admin.';
      if (order.discount_id) {
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
      items: typeof order.items === 'object' ? JSON.stringify(order.items) : order.items,
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

    if (usePostgres()) {
      return await insertRow('orders', newOrder);
    }
    if (!localDB.orders) localDB.orders = [];
    localDB.orders.push(newOrder);
    saveLocalDB();
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

    if (updates.payment_status || updates.order_status) {
      if (order && order.discount_id) {
        if (updates.payment_status === 'Paid') {
          await this.updateDiscount(order.discount_id, {
            status: 'Used',
            used_date: new Date().toISOString(),
            order_id: id
          });
        } else if (updates.payment_status === 'Failed' || updates.order_status === 'Cancelled') {
          await this.updateDiscount(order.discount_id, {
            status: 'Active',
            used_date: null,
            order_id: null
          });
        }
      }
    }

    const cleanUpdates = {};
    if (updates.payment_status !== undefined) cleanUpdates.payment_status = updates.payment_status;
    if (updates.order_status !== undefined) cleanUpdates.order_status = updates.order_status;

    if (usePostgres()) {
      return await updateRow('orders', id, cleanUpdates);
    }
    if (!localDB.orders) localDB.orders = [];
    const index = localDB.orders.findIndex(o => o.id === id);
    if (index > -1) {
      localDB.orders[index] = { ...localDB.orders[index], ...cleanUpdates };
      saveLocalDB();
      return localDB.orders[index];
    }
    return null;
  },

  async checkDiscountEligibility(phone, amount) {
    const settings = await this.getWebsiteSettings();
    const firstOrderEnabled = settings.first_order_discount_enabled !== false;
    const firstOrderMinVal = settings.first_order_min_amount !== undefined ? parseFloat(settings.first_order_min_amount) : 250;
    const firstOrderAmt = settings.first_order_discount_amount !== undefined ? parseFloat(settings.first_order_discount_amount) : 100;

    if (firstOrderEnabled) {
      const useRecord = await this.getFirstOrderUseByPhone(phone);
      if (useRecord && useRecord.first_order_discount_used) {
        return { eligible: false, reason: 'First Order Offer has already been used for this phone number.' };
      }

      const orders = await this.getCompletedOrdersByPhone(phone);
      if (orders.length > 0) {
        return { eligible: false, reason: 'First Order Offer has already been used for this phone number.' };
      }

      if (amount < firstOrderMinVal) {
        return { 
          eligible: false, 
          isBelowMinAmount: true,
          minAmount: firstOrderMinVal,
          currentAmount: amount,
          reason: `Add ₹${((Number(firstOrderMinVal) || 0) - (Number(amount) || 0)).toFixed(2)} more to unlock your ₹${firstOrderAmt} First Order Discount.`
        };
      }

      const discountAmount = Math.min(firstOrderAmt, amount);
      return {
        eligible: true,
        isAutomaticFirstOrder: true,
        discountAmount: parseFloat((Number(discountAmount) || 0).toFixed(2)),
        finalAmount: parseFloat(((Number(amount) || 0) - (Number(discountAmount) || 0)).toFixed(2)),
        reason: `🎉 Congratulations! Your first order discount of ₹${firstOrderAmt} has been applied.`,
        minAmount: firstOrderMinVal
      };
    }

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
      discountAmount: parseFloat((Number(discountAmount) || 0).toFixed(2)),
      finalAmount: parseFloat(((Number(amount) || 0) - (Number(discountAmount) || 0)).toFixed(2)),
      reason: '🎉 First-Time Discount Applied!'
    };
  },

  // --- PASSWORD RESETS ---
  async createPasswordResetToken(email, token, expiresAt) {
    const record = {
      email,
      token,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString()
    };

    if (usePostgres()) {
      return await insertRow('password_resets', record);
    }
    if (!localDB.password_resets) localDB.password_resets = [];
    localDB.password_resets.push(record);
    saveLocalDB();
    return record;
  },

  async getPasswordResetToken(token) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM password_resets WHERE token = $1', [token]);
      return res.rows[0] || null;
    }
    return (localDB.password_resets || []).find(r => r.token === token) || null;
  },

  async invalidatePasswordResetToken(token) {
    if (usePostgres()) {
      return await pool.query('UPDATE password_resets SET used = true WHERE token = $1 RETURNING *', [token]);
    }
    if (localDB.password_resets) {
      const index = localDB.password_resets.findIndex(r => r.token === token);
      if (index > -1) {
        localDB.password_resets[index].used = true;
        saveLocalDB();
        return localDB.password_resets[index];
      }
    }
    return null;
  },

  async updateAdminPassword(email, newHashedPassword) {
    if (usePostgres()) {
      const res = await pool.query(
        'UPDATE admins SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING *',
        [newHashedPassword, email]
      );
      return res.rowCount > 0;
    }

    if (localDB.admins) {
      const admin = localDB.admins.find(a => a.email && a.email.toLowerCase() === email.toLowerCase());
      if (admin) {
        admin.password = newHashedPassword;
        saveLocalDB();
        return true;
      }
    }
    return false;
  },

  async adminEmailExists(email) {
    if (usePostgres()) {
      const res = await pool.query('SELECT * FROM admins WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rowCount > 0;
    }
    return (localDB.admins || []).some(a => a.email && a.email.toLowerCase() === email.toLowerCase());
  }
};

module.exports = db;
