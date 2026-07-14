const pool = require('./dbConfig');
const crypto = require('crypto');

// Password hashing helper
function hashPassword(password) {
  const salt = 'mythri_restaurant_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Seed admin on boot
async function ensureAdminSeeded() {
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
  } catch (err) {
    console.error('Error ensuring admin is seeded:', err.message);
  }
}

// Initialize database schema and seed admin
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'website_settings'
      );
    `;
    const res = await pool.query(checkTableQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      console.log('Database tables not found. Running schema.sql initialization...');
      const schemaPath = path.join(__dirname, '../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('Database schema initialized and seeded successfully in Neon PostgreSQL!');
      } else {
        console.warn('Warning: schema.sql file not found at', schemaPath);
      }
    } else {
      console.log('Database tables verified successfully.');
    }
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
  hashPassword,

  // --- WEBSITE SETTINGS ---
  async getWebsiteSettings() {
    const res = await pool.query('SELECT * FROM website_settings WHERE id = 1');
    return res.rows[0] || { status: 'online', theme: 'dark' };
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
    return await updateRow('website_settings', 1, updates);
  },

  // --- RESTAURANT INFO ---
  async getRestaurantSettings() {
    const res = await pool.query('SELECT * FROM restaurant_settings WHERE id = 1');
    return res.rows[0] || {};
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
    return await updateRow('restaurant_settings', 1, updates);
  },

  // --- CONTACT INFO ---
  async getContactInformation() {
    const res = await pool.query('SELECT * FROM contact_information WHERE id = 1');
    return res.rows[0] || {};
  },

  async updateContactInformation(contact) {
    const updates = { ...contact, updated_at: new Date().toISOString() };
    delete updates.id;
    return await updateRow('contact_information', 1, updates);
  },

  // --- HERO SECTION ---
  async getHeroSection() {
    const res = await pool.query('SELECT * FROM hero_section WHERE id = 1');
    return res.rows[0] || {};
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
    return await updateRow('hero_section', 1, updates);
  },

  // --- QR CODES ---
  async getQRCode() {
    const res = await pool.query('SELECT * FROM qr_codes WHERE id = 1');
    return res.rows[0] || { qr_image_url: null, destination_url: '' };
  },

  async updateQRCode(qr) {
    const updates = { ...qr, updated_at: new Date().toISOString() };
    delete updates.id;
    return await updateRow('qr_codes', 1, updates);
  },

  // --- MENU CATEGORIES ---
  async getCategories() {
    const res = await pool.query('SELECT * FROM menu_categories ORDER BY display_order ASC');
    return res.rows;
  },

  async addCategory(name, displayOrder = 0) {
    const id = 'cat_' + Math.random().toString(36).substr(2, 9);
    const record = {
      id,
      name,
      display_order: parseInt(displayOrder) || 0,
      created_at: new Date().toISOString()
    };
    return await insertRow('menu_categories', record);
  },

  async updateCategory(id, updates) {
    const cleanUpdates = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.display_order !== undefined) cleanUpdates.display_order = parseInt(updates.display_order) || 0;
    return await updateRow('menu_categories', id, cleanUpdates);
  },

  async deleteCategory(id) {
    await pool.query('DELETE FROM menu_categories WHERE id = $1', [id]);
    return true;
  },

  // --- MENU ITEMS ---
  async getMenuItemById(id) {
    const res = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async getMenuItems() {
    const res = await pool.query('SELECT * FROM menu_items ORDER BY display_order ASC');
    return res.rows;
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
    return await insertRow('menu_items', record);
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
    return await updateRow('menu_items', id, cleanUpdates);
  },

  async deleteMenuItem(id) {
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    return true;
  },

  // --- GALLERY IMAGES ---
  async getGalleryImages() {
    const res = await pool.query('SELECT * FROM gallery_images ORDER BY display_order ASC');
    return res.rows;
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
    return await insertRow('gallery_images', record);
  },

  async deleteGalleryImage(id) {
    await pool.query('DELETE FROM gallery_images WHERE id = $1', [id]);
    return true;
  },

  // --- CUSTOMER REVIEWS ---
  async getReviews() {
    const res = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    return res.rows;
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
    return await insertRow('reviews', record);
  },

  async updateReview(id, updates) {
    const cleanUpdates = {};
    if (updates.customer_name !== undefined) cleanUpdates.customer_name = updates.customer_name;
    if (updates.review_text !== undefined) cleanUpdates.review_text = updates.review_text;
    if (updates.rating !== undefined) cleanUpdates.rating = parseInt(updates.rating) || 5;
    if (updates.photo_url !== undefined) cleanUpdates.photo_url = updates.photo_url;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    return await updateRow('reviews', id, cleanUpdates);
  },

  async deleteReview(id) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return true;
  },

  // --- ADMIN AUTHENTICATION ---
  async authenticateAdmin(username, password) {
    const inputHash = hashPassword(password);
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
  },

  // --- CUSTOMERS ---
  async getCustomers() {
    const res = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    return res.rows;
  },

  async getCustomerByPhone(phone) {
    const res = await pool.query('SELECT * FROM customers WHERE phone_number = $1', [phone]);
    return res.rows[0] || null;
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
    return await insertRow('customers', record);
  },

  // --- DISCOUNTS ---
  async getDiscounts() {
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE first_order_discounts SET status = 'Expired' WHERE status = 'Active' AND expiry_date < $1`,
      [now]
    );
    const res = await pool.query('SELECT * FROM first_order_discounts ORDER BY assigned_date DESC');
    return res.rows;
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
    return await insertRow('first_order_discounts', record);
  },

  async updateDiscount(id, updates) {
    const cleanUpdates = {};
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.used_date !== undefined) cleanUpdates.used_date = updates.used_date;
    if (updates.order_id !== undefined) cleanUpdates.order_id = updates.order_id;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
    return await updateRow('first_order_discounts', id, cleanUpdates);
  },

  async deleteDiscount(id) {
    await pool.query('DELETE FROM first_order_discounts WHERE id = $1', [id]);
    return true;
  },

  async getActiveDiscountByPhone(phone) {
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
  },

  async getFirstOrderUseByPhone(phone) {
    const res = await pool.query('SELECT * FROM customer_first_order_uses WHERE phone_number = $1', [phone]);
    return res.rows[0] || null;
  },

  async markFirstOrderUse(phone, orderId) {
    await pool.query(
      `INSERT INTO customer_first_order_uses (phone_number, first_order_discount_used, discount_applied_at, order_id)
       VALUES ($1, true, NOW(), $2)
       ON CONFLICT (phone_number) DO UPDATE
       SET first_order_discount_used = true, discount_applied_at = NOW(), order_id = $2`,
      [phone, orderId]
    );
  },

  async removeFirstOrderUse(phone) {
    await pool.query('DELETE FROM customer_first_order_uses WHERE phone_number = $1', [phone]);
  },

  async getCompletedOrdersByPhone(phone) {
    const res = await pool.query(
      `SELECT * FROM orders WHERE customer_phone = $1 AND order_status = 'Completed'`,
      [phone]
    );
    return res.rows;
  },

  // --- ORDERS ---
  async getOrders() {
    const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.rows;
  },

  async getOrderById(id) {
    const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] || null;
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

    return await insertRow('orders', newOrder);
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
    return await updateRow('orders', id, cleanUpdates);
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
          reason: `Add ₹${(firstOrderMinVal - amount).toFixed(2)} more to unlock your ₹${firstOrderAmt} First Order Discount.`
        };
      }

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

  // --- PASSWORD RESETS ---
  async createPasswordResetToken(email, token, expiresAt) {
    const record = {
      email,
      token,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString()
    };
    return await insertRow('password_resets', record);
  },

  async getPasswordResetToken(token) {
    const res = await pool.query('SELECT * FROM password_resets WHERE token = $1', [token]);
    return res.rows[0] || null;
  },

  async invalidatePasswordResetToken(token) {
    return await pool.query('UPDATE password_resets SET used = true WHERE token = $1 RETURNING *', [token]);
  },

  async updateAdminPassword(email, newHashedPassword) {
    const res = await pool.query(
      'UPDATE admins SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING *',
      [newHashedPassword, email]
    );
    return res.rowCount > 0;
  },

  async adminEmailExists(email) {
    const res = await pool.query('SELECT * FROM admins WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rowCount > 0;
  }
};

module.exports = db;
