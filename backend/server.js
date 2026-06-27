const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
require('dotenv').config();

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
  storage: storage,
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
  const updated = await db.updateHeroSection(req.body);
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
  const item = await db.updateMenuItem(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  broadcast('menu_items', { action: 'update', item });
  res.json(item);
});

app.delete('/api/menu-items/:id', requireAuth, async (req, res) => {
  await db.deleteMenuItem(req.params.id);
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
  // Construct the local static file URL
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({
    success: true,
    file_path: fileUrl,
    filename: req.file.filename
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
