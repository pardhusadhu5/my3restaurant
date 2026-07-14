const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { cloudinary, isCloudinaryConfigured, getMulterStorage } = require('./cloudinaryConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development server
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: getMulterStorage(storage),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, webp, gif) are allowed!'));
  }
});

// Unified image deletion helper for both local files and Cloudinary assets
const deleteOldImage = async (imageUrl) => {
  if (!imageUrl) return;

  // Case 1: Local upload
  if (imageUrl.includes('/uploads/')) {
    try {
      const filename = imageUrl.split('/uploads/')[1];
      if (filename) {
        const oldFilePath = path.join(uploadsDir, filename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted local file: ${filename}`);
        }
      }
    } catch (err) {
      console.error(`Failed to delete local file:`, err.message);
    }
  } 
  // Case 2: Cloudinary upload
  else if (imageUrl.includes('res.cloudinary.com') && isCloudinaryConfigured) {
    try {
      // Extract public_id from Cloudinary URL
      const parts = imageUrl.split('/image/upload/');
      if (parts.length > 1) {
        const pathPart = parts[1]; // v12345/folder/public_id.jpg
        const pathParts = pathPart.split('/');
        // Remove version part if present
        if (pathParts[0].startsWith('v')) {
          pathParts.shift();
        }
        // Join remaining parts and remove extension
        const fullPublicIdWithExt = pathParts.join('/'); // folder/public_id.jpg
        const lastDot = fullPublicIdWithExt.lastIndexOf('.');
        const publicId = lastDot > -1 ? fullPublicIdWithExt.substring(0, lastDot) : fullPublicIdWithExt;
        
        console.log(`Attempting to delete Cloudinary image: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary asset: ${publicId}`);
      }
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset:`, err.message);
    }
  }
};

// --- REALTIME SSE SYSTEM ---
let clients = [];

// SSE Subscription Endpoint
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);
  console.log(`Client ${clientId} connected to Realtime SSE. Total clients: ${clients.length}`);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'ping', time: new Date() })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.length}`);
  });
});

// Broadcast changes to all connected clients
function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date() });
  console.log(`Broadcasting realtime change: [${type}]`);
  clients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (e) {
      console.error(`Error sending SSE to client ${client.id}:`, e.message);
    }
  });
}

// Middleware to parse auth token (simplified)
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }
  // Simplified auth token validation for local mock & supabase mode
  const token = authHeader.split(' ')[1];
  if (token === 'mock-jwt-token-for-mythri-restaurant' || token.length > 20) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
};

// --- API ROUTES ---

// Auth Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const result = await db.authenticateAdmin(username, password);
  if (result.success) {
    res.json({ token: result.token, user: result.user });
  } else {
    res.status(401).json({ error: result.message || 'Invalid credentials' });
  }
});

// Helper: send password reset email
async function sendResetEmail(email, token, expiresAt, req) {
  const origin = (req && req.get('origin')) || (req && `${req.protocol}://${req.get('host')}`) || 'http://localhost:5173';
  const resetLink = `${origin}/#/reset-password?token=${token}`;
  const expiryTimeStr = new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const expiryDateStr = new Date(expiresAt).toLocaleDateString();
  
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1a1a1a; background-color: #070708; color: #f4f4f5; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 1px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #d4af37; margin: 0; font-family: serif;">Mythri Family Restaurant</h2>
        <span style="color: #71717a; font-size: 11px;">Admin Portal Security</span>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.6;">We received a request to reset your admin password. Click the button below to choose a new password. This link is valid for 1 hour until <strong>${expiryTimeStr} on ${expiryDateStr}</strong>.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #d4af37; color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Reset Password</a>
      </div>
      
      <p style="font-size: 12px; color: #71717a; line-height: 1.6; margin-top: 30px; border-top: 1px solid #1a1a1a; padding-top: 15px;">
        <strong>Security note:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged and secure. A password reset link can only be used once.
      </p>
    </div>
  `;

  const emailText = `Mythri Family Restaurant - Admin Password Reset\n\nWe received a request to reset your admin password. Use the link below to choose a new password. This link is valid until ${expiryTimeStr} on ${expiryDateStr}.\n\nReset Password Link: ${resetLink}\n\nSecurity note: If you did not request this, please ignore this email. Your password will remain secure.`;

  // Log to terminal
  console.log(`\n==================================================`);
  console.log(`  PASSWORD RESET REQUEST (LOCAL DEV MODE)`);
  console.log(`  Email: ${email}`);
  console.log(`  Reset Link: ${resetLink}`);
  console.log(`  Expires At: ${expiresAt}`);
  console.log(`==================================================\n`);

  // Write to log file
  const logPath = path.join(__dirname, 'sent-emails.log');
  const logContent = `[${new Date().toISOString()}] To: ${email}\nReset Link: ${resetLink}\nExpires: ${expiresAt}\n\n`;
  fs.appendFileSync(logPath, logContent, 'utf8');

  // Try SMTP transport if env vars are present
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Mythri Restaurant'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Mythri Restaurant - Admin Password Reset',
        text: emailText,
        html: emailHtml
      });
      console.log(`Reset email successfully sent to ${email} via SMTP.`);
    } catch (err) {
      console.error('Failed to send email via SMTP, fell back to local file logging:', err.message);
    }
  }
}

// Forgot Password Route
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    const emailExists = await db.adminEmailExists(email);
    
    // Always return generic success for security, but only send email if registered
    if (emailExists) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry
      
      await db.createPasswordResetToken(email, token, expiresAt);
      await sendResetEmail(email, token, expiresAt, req);
    } else {
      console.log(`Forgot password request for unregistered email: ${email} (Generic success message returned).`);
    }

    res.json({ message: 'If this email is registered, a password reset link has been sent.' });
  } catch (err) {
    console.error('Error in forgot-password:', err);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Validate Reset Token Route
app.get('/api/auth/validate-reset-token', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const resetEntry = await db.getPasswordResetToken(token);
    if (!resetEntry || resetEntry.used || new Date(resetEntry.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }
    res.json({ valid: true, email: resetEntry.email });
  } catch (err) {
    console.error('Error validating token:', err);
    res.status(500).json({ error: 'An error occurred while validating the reset token.' });
  }
});

// Reset Password Route
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Validate token first
    const resetEntry = await db.getPasswordResetToken(token);
    if (!resetEntry || resetEntry.used || new Date(resetEntry.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    const hashedPassword = db.hashPassword(password);

    // Update in database
    const success = await db.updateAdminPassword(resetEntry.email, hashedPassword);
    if (!success) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }

    // Invalidate token
    await db.invalidatePasswordResetToken(token);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Error in reset-password:', err);
    res.status(500).json({ error: 'An error occurred while resetting the password.' });
  }
});

// Website Settings
app.get('/api/website-settings', async (req, res) => {
  const settings = await db.getWebsiteSettings();
  res.json(settings);
});

app.put('/api/website-settings', requireAuth, async (req, res) => {
  const updated = await db.updateWebsiteSettings(req.body);
  broadcast('website_settings', updated);
  res.json(updated);
});

// Restaurant Settings
app.get('/api/restaurant-settings', async (req, res) => {
  const settings = await db.getRestaurantSettings();
  res.json(settings);
});

app.put('/api/restaurant-settings', requireAuth, async (req, res) => {
  const updated = await db.updateRestaurantSettings(req.body);
  broadcast('restaurant_settings', updated);
  res.json(updated);
});

// Contact Information
app.get('/api/contact-information', async (req, res) => {
  const contact = await db.getContactInformation();
  res.json(contact);
});

app.put('/api/contact-information', requireAuth, async (req, res) => {
  const updated = await db.updateContactInformation(req.body);
  broadcast('contact_information', updated);
  res.json(updated);
});

// Hero Section
app.get('/api/hero-section', async (req, res) => {
  const hero = await db.getHeroSection();
  res.json(hero);
});

app.put('/api/hero-section', requireAuth, async (req, res) => {
  const oldHero = await db.getHeroSection();
  const updated = await db.updateHeroSection(req.body);
  
  // Clean up old Today's Special image if replaced
  if (oldHero && oldHero.todays_special_image && oldHero.todays_special_image !== updated.todays_special_image) {
    await deleteOldImage(oldHero.todays_special_image);
  }

  broadcast('hero_section', updated);
  res.json(updated);
});

// QR Code Section
app.get('/api/qr-code', async (req, res) => {
  const qr = await db.getQRCode();
  res.json(qr);
});

app.put('/api/qr-code', requireAuth, async (req, res) => {
  const updated = await db.updateQRCode(req.body);
  broadcast('qr_codes', updated);
  res.json(updated);
});

// Menu Categories
app.get('/api/categories', async (req, res) => {
  const categories = await db.getCategories();
  res.json(categories);
});

app.post('/api/categories', requireAuth, async (req, res) => {
  const { name, display_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const category = await db.addCategory(name, display_order);
  broadcast('menu_categories', { action: 'create', category });
  res.status(201).json(category);
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  const category = await db.updateCategory(req.params.id, req.body);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  broadcast('menu_categories', { action: 'update', category });
  res.json(category);
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  await db.deleteCategory(req.params.id);
  broadcast('menu_categories', { action: 'delete', id: req.params.id });
  res.json({ success: true });
});

// Menu Items
app.get('/api/menu-items', async (req, res) => {
  const items = await db.getMenuItems();
  res.json(items);
});

app.post('/api/menu-items', requireAuth, async (req, res) => {
  const { name, price, category_id } = req.body;
  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Name, price, and category_id are required' });
  }
  const item = await db.addMenuItem(req.body);
  broadcast('menu_items', { action: 'create', item });
  res.status(201).json(item);
});

app.put('/api/menu-items/:id', requireAuth, async (req, res) => {
  const oldItem = await db.getMenuItemById(req.params.id);
  const item = await db.updateMenuItem(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });

  // Clean up old image if replaced
  if (oldItem && oldItem.image_url && oldItem.image_url !== item.image_url) {
    await deleteOldImage(oldItem.image_url);
  }

  broadcast('menu_items', { action: 'update', item });
  res.json(item);
});

app.delete('/api/menu-items/:id', requireAuth, async (req, res) => {
  const oldItem = await db.getMenuItemById(req.params.id);
  await db.deleteMenuItem(req.params.id);

  // Clean up image
  if (oldItem && oldItem.image_url) {
    await deleteOldImage(oldItem.image_url);
  }

  broadcast('menu_items', { action: 'delete', id: req.params.id });
  res.json({ success: true });
});


// Gallery Images
app.get('/api/gallery', async (req, res) => {
  const images = await db.getGalleryImages();
  res.json(images);
});

app.post('/api/gallery', requireAuth, async (req, res) => {
  const { image_url, category, display_order } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url is required' });
  const image = await db.addGalleryImage(image_url, category, display_order);
  broadcast('gallery_images', { action: 'create', image });
  res.status(201).json(image);
});

app.delete('/api/gallery/:id', requireAuth, async (req, res) => {
  await db.deleteGalleryImage(req.params.id);
  broadcast('gallery_images', { action: 'delete', id: req.params.id });
  res.json({ success: true });
});

// Reviews
app.get('/api/reviews', async (req, res) => {
  const reviews = await db.getReviews();
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const { customer_name, review_text, rating } = req.body;
  if (!customer_name || !review_text || !rating) {
    return res.status(400).json({ error: 'customer_name, review_text, and rating are required' });
  }
  const review = await db.addReview(req.body);
  broadcast('reviews', { action: 'create', review });
  res.status(201).json(review);
});

app.put('/api/reviews/:id', requireAuth, async (req, res) => {
  const review = await db.updateReview(req.params.id, req.body);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  broadcast('reviews', { action: 'update', review });
  res.json(review);
});

app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
  await db.deleteReview(req.params.id);
  broadcast('reviews', { action: 'delete', id: req.params.id });
  res.json({ success: true });
});

// --- DISCOUNT ENDPOINTS ---

app.get('/api/discounts', requireAuth, async (req, res) => {
  try {
    const discounts = await db.getDiscounts();
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discounts', requireAuth, async (req, res) => {
  try {
    const { customer_phone, discount_type, discount_value, minimum_order_amount } = req.body;
    if (!customer_phone || !discount_type || discount_value === undefined || minimum_order_amount === undefined) {
      return res.status(400).json({ error: 'customer_phone, discount_type, discount_value, and minimum_order_amount are required' });
    }
    const discount = await db.addDiscount(req.body);
    broadcast('first_order_discounts', { action: 'create', discount });
    res.status(201).json(discount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/discounts/:id', requireAuth, async (req, res) => {
  try {
    const discount = await db.updateDiscount(req.params.id, req.body);
    if (!discount) return res.status(404).json({ error: 'Discount not found' });
    broadcast('first_order_discounts', { action: 'update', discount });
    res.json(discount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/discounts/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteDiscount(req.params.id);
    broadcast('first_order_discounts', { action: 'delete', id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discounts/check', async (req, res) => {
  try {
    const { phone_number, amount } = req.body;
    if (!phone_number || amount === undefined) {
      return res.status(400).json({ error: 'phone_number and amount are required' });
    }
    const eligibility = await db.checkDiscountEligibility(phone_number, parseFloat(amount));
    res.json(eligibility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDER ENDPOINTS ---

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, items, original_amount, final_amount } = req.body;
    if (!customer_name || !customer_phone || !items || original_amount === undefined || final_amount === undefined) {
      return res.status(400).json({ error: 'customer_name, customer_phone, items, original_amount, and final_amount are required' });
    }
    const order = await db.createOrder(req.body);
    broadcast('orders', { action: 'create', order });
    
    // If the order consumed a discount, also broadcast the discount update
    if (order.discount_id) {
      const discounts = await db.getDiscounts();
      const updatedDiscount = discounts.find(d => d.id === order.discount_id);
      if (updatedDiscount) {
        broadcast('first_order_discounts', { action: 'update', discount: updatedDiscount });
      }
    }
    
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await db.updateOrderStatus(req.params.id, req.body);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    broadcast('orders', { action: 'update', order });
    
    // If this status change affected a discount, broadcast that discount change too
    if (order.discount_id) {
      const discounts = await db.getDiscounts();
      const updatedDiscount = discounts.find(d => d.id === order.discount_id);
      if (updatedDiscount) {
        broadcast('first_order_discounts', { action: 'update', discount: updatedDiscount });
      }
    }
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload image file endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select an image file to upload.' });
  }
  
  // Use Cloudinary URL if available, otherwise construct local URL
  const fileUrl = (req.file.path && req.file.path.startsWith('http'))
    ? req.file.path
    : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
  res.status(201).json({
    success: true,
    file_path: fileUrl,
    filename: req.file.filename || req.file.public_id || ''
  });
});

// Server status check
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', mode: db.useSupabase ? 'supabase' : 'mock-fallback' });
});

// Serve static files from the React frontend build
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Anything that doesn't match an API route, send back the index.html file
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Global error handler

app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Mythri Restaurant Server is running on port ${PORT}`);
  console.log(`  Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`==================================================`);
});
