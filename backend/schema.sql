-- Mythri Restaurant - Database Schema
-- Run this in the Supabase SQL Editor to initialize your database.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. ADMINS & PASSWORD RESETS
CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. WEBSITES SETTINGS
CREATE TABLE IF NOT EXISTS website_settings (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'online', -- 'online', 'maintenance'
    theme TEXT NOT NULL DEFAULT 'dark',
    first_order_discount_enabled BOOLEAN DEFAULT true,
    first_order_min_amount NUMERIC(10, 2) DEFAULT 250.00,
    first_order_discount_amount NUMERIC(10, 2) DEFAULT 100.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RESTAURANT SETTINGS
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'MYTHRI – THE COMPLETE FAMILY RESTAURANT',
    tagline TEXT NOT NULL DEFAULT 'Taste The Freshness In Every Bite',
    description TEXT DEFAULT 'Welcome to Mythri Restaurant, where we serve the finest, fresh family meals. Taste the authenticity in every single bite.',
    opening_hours JSONB DEFAULT '{"weekday": "11:00 AM - 11:00 PM", "weekend": "11:00 AM - 11:30 PM"}'::jsonb,
    delivery_radius TEXT DEFAULT 'Within 5 km',
    location TEXT DEFAULT 'Hyderabad, Telangana',
    address TEXT DEFAULT 'Main Road, Near Metro Station, Hyderabad',
    google_maps_link TEXT DEFAULT 'https://maps.app.goo.gl/81f9WrWjXGkT2Mth8',
    social_media_links JSONB DEFAULT '{"facebook": "#", "instagram": "#", "twitter": "#"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTACT INFORMATION
CREATE TABLE IF NOT EXISTS contact_information (
    id SERIAL PRIMARY KEY,
    primary_phone TEXT NOT NULL DEFAULT '9676576392',
    secondary_phone TEXT NOT NULL DEFAULT '9637657639',
    whatsapp_number TEXT NOT NULL DEFAULT '9676576392',
    email_address TEXT NOT NULL DEFAULT 'contact@mythrirestaurant.com',
    instagram TEXT DEFAULT 'https://instagram.com/mythri_restaurant',
    facebook TEXT DEFAULT 'https://facebook.com/mythri_restaurant',
    google_maps_url TEXT DEFAULT 'https://maps.app.goo.gl/81f9WrWjXGkT2Mth8',
    address TEXT NOT NULL DEFAULT 'Main Road, Near Metro Station, Hyderabad',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HERO SECTION
CREATE TABLE IF NOT EXISTS hero_section (
    id SERIAL PRIMARY KEY,
    heading TEXT NOT NULL DEFAULT 'Mythri Family Restaurant',
    subheading TEXT NOT NULL DEFAULT 'Savor The Authentic Taste',
    description TEXT NOT NULL DEFAULT 'Experience the best multi-cuisine family dining with fresh ingredients, traditional spices, and exceptional service.',
    background_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80',
    cta_buttons JSONB DEFAULT '[{"text": "Order on WhatsApp", "action": "whatsapp", "primary": true}, {"text": "View Menu", "action": "menu", "primary": false}]'::jsonb,
    badges JSONB DEFAULT '["100% Fresh Ingredients", "Best Multi-Cuisine", "Family Dining Room"]'::jsonb,
    todays_special_name TEXT NOT NULL DEFAULT 'Chicken Dum Biryani',
    todays_special_image TEXT DEFAULT 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category_id TEXT REFERENCES menu_categories(id) ON DELETE CASCADE,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'visible', -- 'visible', 'hidden'
    is_popular BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. GALLERY IMAGES
CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Food', -- 'Food', 'Ambience', 'Family Dining'
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CUSTOMER REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    review_text TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'visible', -- 'visible', 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. QR CODES
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    qr_image_url TEXT,
    destination_url TEXT NOT NULL DEFAULT 'https://mythri-restaurant.vercel.app',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA

-- Insert default singletons if not existing
INSERT INTO website_settings (id, status, theme) VALUES (1, 'online', 'dark') ON CONFLICT DO NOTHING;
INSERT INTO restaurant_settings (id, name, tagline) VALUES (1, 'MYTHRI – THE COMPLETE FAMILY RESTAURANT', 'Taste The Freshness In Every Bite') ON CONFLICT DO NOTHING;
INSERT INTO contact_information (id, primary_phone, secondary_phone, whatsapp_number) VALUES (1, '9676576392', '9637657639', '9676576392') ON CONFLICT DO NOTHING;
INSERT INTO hero_section (id, heading, subheading) VALUES (1, 'Mythri Family Restaurant', 'Savor The Authentic Taste') ON CONFLICT DO NOTHING;
INSERT INTO qr_codes (id, destination_url) VALUES (1, 'https://mythri-restaurant.vercel.app') ON CONFLICT DO NOTHING;

-- Seed Menu Categories
INSERT INTO menu_categories (id, name, display_order) VALUES
('c_1', 'Soups', 1),
('c_2', 'Veg Starters', 2),
('c_3', 'Non-Veg Starters', 3),
('c_4', 'Non-Veg Curries', 4),
('c_5', 'Veg Curries', 5),
('c_6', 'Veg Biryanis', 6),
('c_7', 'Non-Veg Biryanis', 7),
('c_8', 'Rotis & Naans', 8),
('c_9', 'Tandoori & Kebabs', 9),
('c_10', 'Mandi & Family Packs', 10),
('c_11', 'Fried Rice', 11),
('c_12', 'Mythri Specials', 12),
('c_13', 'Meals', 13),
('c_14', 'Beverages', 14)
ON CONFLICT (name) DO NOTHING;

-- Seed Menu Items
INSERT INTO menu_items (id, name, price, category_id, description, image_url, is_popular, display_order) VALUES
('m_1', 'Tomato Soup', 100.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Tomato.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 1),
('m_2', 'Veg Corn Soup', 100.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Veg Corn.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 2),
('m_3', 'Veg Manchow Soup', 100.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Veg Manchow.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 3),
('m_4', 'Mushroom Soup', 100.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Mushroom.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 4),
('m_5', 'Veg Hot & Sour Soup', 100.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Veg Hot & Sour.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 5),
('m_6', 'Chicken Corn Soup', 120.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Chicken Corn.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 6),
('m_7', 'Chicken Hot & Sour Soup', 120.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Chicken Hot & Sour.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 7),
('m_8', 'Chicken Manchow Soup', 120.00, 'c_1', 'Warm, comforting soup freshly prepared with slow-simmered broth, garden herbs, and succulent Chicken Manchow.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', false, 8),
('m_9', 'Crispy Corn', 200.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Crispy Corn seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 1),
('m_10', 'Crispy Veg', 180.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Crispy Veg seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 2),
('m_11', 'Dragon Veg', 220.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Dragon Veg seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 3),
('m_12', 'Paneer 65', 240.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Paneer seasoned with house spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 4),
('m_13', 'Chilli Paneer', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Paneer seasoned with house spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 5),
('m_14', 'Paneer Manchuria', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Paneer seasoned with house spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 6),
('m_15', 'Malai Paneer', 300.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Malai Paneer seasoned with house spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 7),
('m_16', 'Malai Kofta', 290.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Malai Kofta seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 8),
('m_17', 'Mushroom Manchuria', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Mushroom seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 9),
('m_18', 'Mushroom 65', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Mushroom seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 10),
('m_19', 'Chilli Mushroom', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Mushroom seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 11),
('m_20', 'Mushroom Fry', 270.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Mushroom Fry seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 12),
('m_21', 'Kaju Fry', 280.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Kaju Fry seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 13),
('m_22', 'Paneer Majestic', 250.00, 'c_2', 'Fresh paneer strips stir-fried in a spicy yogurt sauce with curry leaves and green chillies.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', true, 14),
('m_23', 'Baby Corn Manchuria', 220.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Baby Corn seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 15),
('m_24', 'Pepper Mushroom', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Pepper Mushroom seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 16),
('m_25', 'Baby Corn 65', 240.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Baby Corn seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 17),
('m_26', 'Chilli Baby Corn', 260.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Baby Corn seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 18),
('m_27', 'Double Egg Masala Omelette', 100.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Double Egg Masala Omelette seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 19),
('m_28', 'Single Egg Masala Omelette', 60.00, 'c_2', 'Crispy, hot vegetarian appetizer made of fresh Single Egg Masala Omelette seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 20),
('m_29', 'Chicken Wings Dry', 270.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken Wings Dry seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 1),
('m_30', 'Chicken Wings Wet', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken Wings Wet seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_31', 'Chicken Lollipop Dry', 280.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken Lollipop Dry seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 3),
('m_32', 'Chicken Lollipop Wet', 300.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken Lollipop Wet seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 4),
('m_33', 'Chilli Chicken', 260.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 5),
('m_34', 'Chicken 65', 270.00, 'c_3', 'Classic spicy deep-fried chicken cubes marinated in ginger, garlic, and hot red chilies.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 6),
('m_35', 'Chicken Fry Bone', 280.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken Fry Bone seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 7),
('m_36', 'Kaju Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Kaju Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 8),
('m_37', 'Chicken 555', 280.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken 555 seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 9),
('m_38', 'Dragon Chicken', 280.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Dragon Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 10),
('m_39', 'Red Hot Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Red Hot Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 11),
('m_40', 'Kouju Pitta Roast', 280.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Kouju Pitta Roast seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 12),
('m_41', 'Kouju Pitta 65', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Kouju Pitta seasoned with house spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 13),
('m_42', 'Lemon Chicken', 270.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Lemon Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 14),
('m_43', 'Pepper Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Pepper Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 15),
('m_44', 'RR Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh RR Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 16),
('m_45', 'Apollo Fish', 320.00, 'c_3', 'Spicy deep-fried fish fillets tossed in yogurt, curry leaves, and a special house spice blend.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', true, 17),
('m_46', 'Crispy Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Crispy Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 18),
('m_47', 'Chicken Manchurian', 270.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Chicken n seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 19),
('m_48', 'Chicken Majestic', 290.00, 'c_3', 'Tender chicken cubes tossed in a spicy, aromatic green chili soy sauce with fresh curry leaves.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', true, 20),
('m_49', 'Garlic Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Garlic Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 21),
('m_50', 'Apollo Fried Fish', 300.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Apollo Fried Fish seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 22),
('m_51', 'Apollo Chilli Fish', 320.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Apollo  Fish seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 23),
('m_52', 'Apollo Crispy Fish', 320.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Apollo Crispy Fish seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 24),
('m_53', 'Pepper Prawns', 340.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Pepper Prawns seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 25),
('m_54', 'Crispy Prawns', 370.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Crispy Prawns seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 26),
('m_55', 'Loose Prawns', 350.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Loose Prawns seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 27),
('m_56', 'Chilli Prawns', 340.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Prawns seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 28),
('m_57', 'Golden Prawns', 340.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Golden Prawns seasoned with house spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 29),
('m_58', 'Coriander Chicken', 300.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Coriander Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 30),
('m_59', 'Slice Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Slice Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 31),
('m_60', 'Finger Chicken', 290.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Finger Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 32),
('m_61', 'Malai Chicken', 300.00, 'c_3', 'Crispy, hot vegetarian appetizer made of fresh Malai Chicken seasoned with house spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 33),
('m_62', 'Andhra Chicken Curry', 270.00, 'c_4', 'A delicious vegetarian gravy made with fresh Andhra Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 1),
('m_63', 'Butter Chicken Curry', 280.00, 'c_4', 'Tender boneless chicken tikka cooked in a rich, creamy tomato and butter sauce infused with fenugreek.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_64', 'Mughlai Chicken Curry', 280.00, 'c_4', 'A delicious vegetarian gravy made with fresh Mughlai Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 3),
('m_65', 'Kadai Chicken Curry', 280.00, 'c_4', 'A delicious vegetarian gravy made with fresh Kadai Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 4),
('m_66', 'Chicken Boneless Curry', 270.00, 'c_4', 'A delicious vegetarian gravy made with fresh Chicken Boneless slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 5),
('m_67', 'Punjabi Chicken Curry', 280.00, 'c_4', 'A delicious vegetarian gravy made with fresh Punjabi Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 6),
('m_68', 'Afghani Chicken Curry', 320.00, 'c_4', 'A delicious vegetarian gravy made with fresh Afghani Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 7),
('m_69', 'Kaju Chicken Curry', 280.00, 'c_4', 'A delicious vegetarian gravy made with fresh Kaju Chicken slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 8),
('m_70', 'Kouju Pitta Curry', 290.00, 'c_4', 'A delicious vegetarian gravy made with fresh Kouju Pitta slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 9),
('m_71', 'Chicken Tikka Masala', 320.00, 'c_4', 'A delicious vegetarian gravy made with fresh Chicken Tikka Masala slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 10),
('m_72', 'Natukodi Curry', 340.00, 'c_4', 'A delicious vegetarian gravy made with fresh Natukodi slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 11),
('m_73', 'Prawns Curry', 330.00, 'c_4', 'A delicious vegetarian gravy made with fresh Prawns slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 12),
('m_74', 'Apollo Fish Curry', 290.00, 'c_4', 'Spicy deep-fried fish fillets tossed in yogurt, curry leaves, and a special house spice blend.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 13),
('m_75', 'Kadai Prawns', 340.00, 'c_4', 'A delicious vegetarian gravy made with fresh Kadai Prawns slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 14),
('m_76', 'Maharani Chicken Curry (Boneless)', 280.00, 'c_4', 'A delicious vegetarian gravy made with fresh Maharani Chicken  (Boneless) slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 15),
('m_77', 'Maharaja Chicken Curry (Bone)', 270.00, 'c_4', 'A delicious vegetarian gravy made with fresh Maharaja Chicken  (Bone) slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 16),
('m_78', 'Tomato Curry', 150.00, 'c_5', 'A delicious vegetarian gravy made with fresh Tomato slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 1),
('m_79', 'Kaju Tomato Curry', 250.00, 'c_5', 'A delicious vegetarian gravy made with fresh Kaju Tomato slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 2),
('m_80', 'Mixed Veg Curry', 230.00, 'c_5', 'A delicious vegetarian gravy made with fresh Mixed Veg slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 3),
('m_81', 'Methi Chaman', 250.00, 'c_5', 'A delicious vegetarian gravy made with fresh Methi Chaman slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 4),
('m_82', 'Plain Palak', 220.00, 'c_5', 'A delicious vegetarian gravy made with fresh Plain Palak slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 5),
('m_83', 'Palak Paneer', 250.00, 'c_5', 'A delicious vegetarian gravy made with fresh Palak Paneer slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 6),
('m_84', 'Paneer Butter Masala', 260.00, 'c_5', 'Soft paneer cubes cooked in a sweet, rich, and creamy tomato-butter gravy with traditional herbs.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 7),
('m_85', 'Paneer Korma Curry', 260.00, 'c_5', 'A delicious vegetarian gravy made with fresh Paneer Korma slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 8),
('m_86', 'Kadai Paneer Curry', 260.00, 'c_5', 'A delicious vegetarian gravy made with fresh Kadai Paneer slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 9),
('m_87', 'Kaju Paneer Curry', 270.00, 'c_5', 'A delicious vegetarian gravy made with fresh Kaju Paneer slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 10),
('m_88', 'Kaju Masala Curry', 270.00, 'c_5', 'A delicious vegetarian gravy made with fresh Kaju Masala slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 11),
('m_89', 'Mushroom Curry', 250.00, 'c_5', 'A delicious vegetarian gravy made with fresh Mushroom slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 12),
('m_90', 'Kadai Mushroom', 270.00, 'c_5', 'A delicious vegetarian gravy made with fresh Kadai Mushroom slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 13),
('m_91', 'Egg Curry', 200.00, 'c_5', 'A delicious vegetarian gravy made with fresh Egg slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 14),
('m_92', 'Egg Burji', 200.00, 'c_5', 'A delicious vegetarian gravy made with fresh Egg Burji slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 15),
('m_93', 'Egg Kheema', 150.00, 'c_5', 'A delicious vegetarian gravy made with fresh Egg Kheema slow-simmered in an onion-tomato gravy with roasted spices.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 16),
('m_94', 'Veg Biryani', 250.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Veg.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 1),
('m_95', 'Egg Biryani', 230.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Egg.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 2),
('m_96', 'Paneer Biryani', 260.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Paneer.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 3),
('m_97', 'Kaju Biryani', 260.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Kaju.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 4),
('m_98', 'Mushroom Biryani', 260.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Mushroom.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 5),
('m_99', 'Baby Corn Biryani', 250.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Baby Corn.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 6),
('m_100', 'Paneer Tikka Biryani', 250.00, 'c_6', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Paneer Tikka.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 7),
('m_101', 'Curd Rice', 130.00, 'c_6', 'Soft cooked rice mixed with fresh yogurt, tempered with mustard seeds, curry leaves, and green chilies.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 8),
('m_102', 'Hyderabadi Dum Biryani', 260.00, 'c_7', 'Our signature dish. Slow-cooked marinated chicken layered with premium aromatic basmati rice and dum spices.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', true, 1),
('m_103', 'Chicken Fry Bone Biryani', 280.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Fry Bone.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 2),
('m_104', 'Chicken Fry Boneless Biryani', 300.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Fry Boneless.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 3),
('m_105', 'SP Chicken Biryani', 280.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful SP Chicken.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 4),
('m_106', 'Chicken Wings Biryani Dry', 270.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Wings  Dry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 5),
('m_107', 'Chicken Wings Biryani Semi Gravy', 280.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Wings  Semi Gravy.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 6),
('m_108', 'Chicken Lollipop Biryani Dry', 270.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Lollipop  Dry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 7),
('m_109', 'Chicken Lollipop Biryani Semi Gravy', 280.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Lollipop  Semi Gravy.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 8),
('m_110', 'Prawns Fry Biryani', 340.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Prawns Fry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 9),
('m_111', 'Prawns Curry Biryani', 370.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Prawns Curry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 10),
('m_112', 'Apollo Fish Biryani', 290.00, 'c_7', 'Spicy deep-fried fish fillets tossed in yogurt, curry leaves, and a special house spice blend.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 11),
('m_113', 'Chicken Mughlai Biryani', 300.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Mughlai.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 12),
('m_114', 'Kouju Pitta Biryani', 310.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Kouju Pitta.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 13),
('m_115', 'Chicken Tikka Biryani', 290.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Tikka.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 14),
('m_116', 'Chicken Joint Biryani', 320.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Joint.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 15),
('m_117', 'Mixed Non', 0.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Mixed Non.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 16),
('m_118', 'Chicken Kheema Biryani', 370.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Chicken Kheema.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 17),
('m_119', 'Natukodi Curry Biryani', 370.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Natukodi Curry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 18),
('m_120', 'Mutton Dum Biryani', 420.00, 'c_7', 'Premium tender mutton pieces cooked with rich spices in authentic Hyderabadi style, layered with premium basmati rice.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', true, 19),
('m_121', 'Mutton Curry Biryani', 470.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Mutton Curry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 20),
('m_122', 'Mutton Fry Biryani', 450.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Mutton Fry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 21),
('m_123', 'Pot SP Biryani', 320.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Pot SP.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 22),
('m_124', 'Pot Fry Biryani', 320.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Pot Fry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 23),
('m_125', 'Potlam Biryani', 400.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Potlam.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 24),
('m_126', 'Rambo Biryani', 300.00, 'c_7', 'Aromatic long-grain basmati rice cooked with traditional dum spices and flavorful Rambo.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 25),
('m_127', 'Tandoori Roti', 40.00, 'c_8', 'Warm, traditional flatbread baked in a clay tandoor oven.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 1),
('m_128', 'Butter Roti', 50.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 2),
('m_129', 'Butter Naan', 40.00, 'c_8', 'Soft, fluffy leavened flatbread brushed with premium melted butter, baked hot in a clay tandoor.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', true, 3),
('m_130', 'Garlic Roti', 50.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 4),
('m_131', 'Garlic Naan', 50.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 5),
('m_132', 'Paneer Kulcha', 70.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 6),
('m_133', 'Masala Kulcha', 70.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 7),
('m_134', 'Pudina Naan', 60.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 8),
('m_135', 'Coriander Naan', 60.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 9),
('m_136', 'Plain Kulcha', 50.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 10),
('m_137', 'Butter Kulcha', 60.00, 'c_8', 'Fresh, hot clay-oven baked bread, perfect to pair with our delicious curries.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 11),
('m_138', 'Chicken Tandoori (Half)', 280.00, 'c_9', 'Fresh and authentic Chicken Tandoori (Half) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 1),
('m_139', 'Chicken Tandoori (Full)', 550.00, 'c_9', 'Fresh and authentic Chicken Tandoori (Full) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_140', 'Grill Chicken (Half)', 290.00, 'c_9', 'Fresh and authentic Grill Chicken (Half) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 3),
('m_141', 'Grill Chicken (Full)', 480.00, 'c_9', 'Fresh and authentic Grill Chicken (Full) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 4),
('m_142', 'Tandoori Kebab', 270.00, 'c_9', 'Fresh and authentic Tandoori Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 5),
('m_143', 'Chicken Tikka', 290.00, 'c_9', 'Fresh and authentic Chicken Tikka prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', true, 6),
('m_144', 'Tandoori Tikka', 290.00, 'c_9', 'Fresh and authentic Tandoori Tikka prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 7),
('m_145', 'Hariyali Kebab', 280.00, 'c_9', 'Fresh and authentic Hariyali Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 8),
('m_146', 'Malai Kebab', 280.00, 'c_9', 'Fresh and authentic Malai Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 9),
('m_147', 'Reshmi Kebab', 300.00, 'c_9', 'Fresh and authentic Reshmi Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 10),
('m_148', 'Paneer Tikka', 270.00, 'c_9', 'Fresh and authentic Paneer Tikka prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 11),
('m_149', 'Murgh Mirch Kebab', 320.00, 'c_9', 'Fresh and authentic Murgh Mirch Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 12),
('m_150', 'Mythri Special Kebab', 360.00, 'c_9', 'Fresh and authentic Mythri Special Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', true, 13),
('m_151', 'Prawns Tikka', 360.00, 'c_9', 'Fresh and authentic Prawns Tikka prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 14),
('m_152', 'Andhra Kebab', 300.00, 'c_9', 'Fresh and authentic Andhra Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 15),
('m_153', 'Lemon Kebab', 300.00, 'c_9', 'Fresh and authentic Lemon Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 16),
('m_154', 'Arabian Mandi', 900.00, 'c_10', 'Authentic Arabian Mandi rice cooked in rich meat stock, served with tender chicken, toasted nuts, and raisins.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', true, 1),
('m_155', 'Tandoori Mandi', 850.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Tandoori.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_156', 'Grill Mandi', 850.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Grill.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 3),
('m_157', 'Dum Biryani Family Pack', 620.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Dum Biryani.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 4),
('m_158', 'Fry Biryani Family (Bone)', 640.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Fry Biryani Family (Bone).', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 5),
('m_159', 'Fry Biryani Family (Boneless)', 670.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Fry Biryani Family (Boneless).', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 6),
('m_160', 'SP Biryani Family', 670.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted SP Biryani Family.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 7),
('m_161', 'Wings Biryani Family Dry', 690.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Wings Biryani Family Dry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 8),
('m_162', 'Wings Biryani Family Semi Gravy', 710.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Wings Biryani Family Semi Gravy.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 9),
('m_163', 'Lollipop Biryani Family Dry', 690.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Lollipop Biryani Family Dry.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 10),
('m_164', 'Lollipop Biryani Family Semi Gravy', 710.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Lollipop Biryani Family Semi Gravy.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 11),
('m_165', 'Prawns Fry Biryani Family', 900.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Prawns Fry Biryani Family.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 12),
('m_166', 'Prawns Curry Biryani Family', 970.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Prawns Curry Biryani Family.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 13),
('m_167', 'Mutton Curry Biryani Family', 1150.00, 'c_10', 'Fragrant mandi rice seasoned with middle-eastern spices, served family-style with roasted Mutton Curry Biryani Family.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 14),
('m_168', 'Veg Fried Rice', 220.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Veg.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 1),
('m_169', 'Egg Fried Rice', 220.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Egg.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 2),
('m_170', 'Paneer Fried Rice', 230.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Paneer.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', false, 3),
('m_171', 'Kaju Fried Rice', 250.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Kaju.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 4),
('m_172', 'Mushroom Fried Rice', 250.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Mushroom.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 5),
('m_173', 'Baby Corn Fried Rice', 240.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Baby Corn.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 6),
('m_174', 'Jeera Rice', 170.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Jeera Rice.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 7),
('m_175', 'Chicken Fried Rice', 250.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Chicken.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 8),
('m_176', 'Prawns Fried Rice', 320.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Prawns.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 9),
('m_177', 'Apollo Fish Fried Rice', 320.00, 'c_11', 'Spicy deep-fried fish fillets tossed in yogurt, curry leaves, and a special house spice blend.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', false, 10),
('m_178', 'Mixed Non', 0.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Mixed Non.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 11),
('m_179', 'Schezwan Chicken Fried Rice', 270.00, 'c_11', 'Flavorful, wok-tossed aromatic rice stir-fried with fresh scallions, beans, carrots, and choice of Schezwan Chicken.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 12),
('m_180', 'Mythri Special Kebab', 370.00, 'c_12', 'Fresh and authentic Mythri Special Kebab prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', true, 1),
('m_181', 'Hariyali Kebab (3 pcs)', 380.00, 'c_12', 'Fresh and authentic Hariyali Kebab (3 pcs) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_182', 'Malai Kebab (3 pcs)', 250.00, 'c_12', 'Fresh and authentic Malai Kebab (3 pcs) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 3),
('m_183', 'Chicken Tikka (3 pcs)', 300.00, 'c_12', 'Fresh and authentic Chicken Tikka (3 pcs) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 4),
('m_184', 'Mythri Special Biryani (4 Dum Pieces + 1 Egg)', 250.00, 'c_12', 'Fresh and authentic Mythri Special Biryani (4 Dum Pieces + 1 Egg) prepared with premium ingredients by our master chefs.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', false, 5),
('m_185', 'Veg Meals', 100.00, 'c_13', 'Traditional complete meal platter served with steamed rice, curries, and sides.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', false, 1),
('m_186', 'White Rice & Chicken Curry', 250.00, 'c_13', 'Traditional complete meal platter served with steamed rice, curries, and sides.', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', false, 2),
('m_187', 'White Rice & Mutton Curry', 350.00, 'c_13', 'Traditional complete meal platter served with steamed rice, curries, and sides.', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', false, 3),
('m_188', 'Lassi', 30.00, 'c_14', 'Sweet and creamy traditional yogurt drink, blended with cardamom and served chilled.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80', false, 1),
('m_189', 'Butter Milk', 50.00, 'c_14', 'Cool, refreshing Butter Milk drink, freshly prepared and served chilled to complement your hot meal.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80', false, 2),
('m_190', 'Badam Milk', 30.00, 'c_14', 'Cool, refreshing Badam Milk drink, freshly prepared and served chilled to complement your hot meal.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80', false, 3),
('m_191', 'Lemon Water', 20.00, 'c_14', 'Cool, refreshing Lemon Water drink, freshly prepared and served chilled to complement your hot meal.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80', false, 4)
ON CONFLICT DO NOTHING;


-- Seed Gallery Images
INSERT INTO gallery_images (id, image_url, category, display_order) VALUES
('g1', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 'Food', 1),
('g2', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', 'Food', 2),
('g3', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 'Food', 3),
('g4', 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80', 'Food', 4),
('g5', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', 'Ambience', 1),
('g6', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80', 'Ambience', 2),
('g7', 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=600&q=80', 'Family Dining', 1)
ON CONFLICT DO NOTHING;

-- Seed Customer Reviews
INSERT INTO reviews (id, customer_name, review_text, rating, photo_url) VALUES
('r1', 'Rajesh Kumar', 'The Chicken Dum Biryani here is absolutely sensational! Tastes authentic and full of flavor. Highly recommended for family dining.', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'),
('r2', 'Priya Sharma', 'Amazing starters! Chicken Majestic was so tender and perfectly spiced. The ambiance is lovely for families, and service is quick.', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'),
('r3', 'Karthik S.', 'Best Mandi in the area. Very generous portions and the rice was extremely flavorful. Ordering on WhatsApp is super convenient!', 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80')
ON CONFLICT DO NOTHING;

-- 11. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FIRST ORDER DISCOUNTS
CREATE TABLE IF NOT EXISTS first_order_discounts (
    id TEXT PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL,
    minimum_order_amount NUMERIC(10, 2) DEFAULT 0,
    maximum_discount NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Used', 'Expired'
    notes TEXT,
    expiry_date TIMESTAMPTZ,
    assigned_by_admin TEXT NOT NULL DEFAULT 'admin',
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    used_date TIMESTAMPTZ,
    order_id TEXT
);

-- 13. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items JSONB,
    original_amount NUMERIC(10, 2) NOT NULL,
    discount_id TEXT,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL,
    is_first_order BOOLEAN DEFAULT false,
    first_order_discount_reason TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed'
    order_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Completed', 'Cancelled'
    order_type TEXT,
    delivery_address TEXT,
    delivery_landmark TEXT,
    special_instructions TEXT,
    payment_method TEXT,
    account_holder_name TEXT,
    payer_mobile_number TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CUSTOMER FIRST ORDER DISCOUNTS USES
CREATE TABLE IF NOT EXISTS customer_first_order_uses (
    phone_number TEXT PRIMARY KEY,
    first_order_discount_used BOOLEAN DEFAULT true,
    discount_applied_at TIMESTAMPTZ DEFAULT NOW(),
    order_id TEXT
);

-- Migrations (applied dynamically to existing tables if columns do not exist)
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS first_order_discount_enabled BOOLEAN DEFAULT true;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS first_order_min_amount NUMERIC(10, 2) DEFAULT 250.00;
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS first_order_discount_amount NUMERIC(10, 2) DEFAULT 100.00;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_order_discount_reason TEXT;
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS image_url TEXT;


