const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
console.log('Mythri Family Restaurant API Client initialized. API Base URL:', API_BASE);


// Helper to get auth header
const getHeaders = () => {
  const token = localStorage.getItem('mythri_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async login(username, password) {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
    } catch (networkErr) {
      throw new Error('Unable to communicate with the server. Please try again.');
    }

    if (!res) {
      throw new Error('Unable to communicate with the server. Please try again.');
    }

    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        try {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Login failed');
        } catch (jsonErr) {
          throw new Error('Unable to communicate with the server. Please try again.');
        }
      } else {
        throw new Error('Unable to communicate with the server. Please try again.');
      }
    }

    if (isJson) {
      try {
        return await res.json();
      } catch (jsonErr) {
        throw new Error('Unable to communicate with the server. Please try again.');
      }
    } else {
      throw new Error('Unable to communicate with the server. Please try again.');
    }
  },

  // Website Settings
  async getWebsiteSettings() {
    const res = await fetch(`${API_BASE}/website-settings`);
    return res.json();
  },

  async updateWebsiteSettings(settings) {
    const res = await fetch(`${API_BASE}/website-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update website settings');
    return res.json();
  },

  // Restaurant Settings
  async getRestaurantSettings() {
    const res = await fetch(`${API_BASE}/restaurant-settings`);
    return res.json();
  },

  async updateRestaurantSettings(settings) {
    const res = await fetch(`${API_BASE}/restaurant-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update restaurant settings');
    return res.json();
  },

  // Contact Info
  async getContactInformation() {
    const res = await fetch(`${API_BASE}/contact-information`);
    return res.json();
  },

  async updateContactInformation(contact) {
    const res = await fetch(`${API_BASE}/contact-information`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(contact)
    });
    if (!res.ok) throw new Error('Failed to update contact info');
    return res.json();
  },

  // Hero Section
  async getHeroSection() {
    const res = await fetch(`${API_BASE}/hero-section`);
    return res.json();
  },

  async updateHeroSection(hero) {
    const res = await fetch(`${API_BASE}/hero-section`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(hero)
    });
    if (!res.ok) throw new Error('Failed to update hero section');
    return res.json();
  },

  // QR Code
  async getQRCode() {
    const res = await fetch(`${API_BASE}/qr-code`);
    return res.json();
  },

  async updateQRCode(qr) {
    const res = await fetch(`${API_BASE}/qr-code`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(qr)
    });
    if (!res.ok) throw new Error('Failed to update QR menu');
    return res.json();
  },

  // Payment QRs
  async getPaymentQRs() {
    const res = await fetch(`${API_BASE}/payment-qrs`);
    return res.json();
  },

  async createPaymentQR(qr) {
    const res = await fetch(`${API_BASE}/payment-qrs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(qr)
    });
    if (!res.ok) throw new Error('Failed to create payment QR');
    return res.json();
  },

  async updatePaymentQR(id, updates) {
    const res = await fetch(`${API_BASE}/payment-qrs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update payment QR');
    return res.json();
  },

  async deletePaymentQR(id) {
    const res = await fetch(`${API_BASE}/payment-qrs/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete payment QR');
    return res.json();
  },

  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },

  async createCategory(name, display_order) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, display_order: parseInt(display_order) || 0 })
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id, updates) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  // Menu Items
  async getMenuItems() {
    const res = await fetch(`${API_BASE}/menu-items`);
    return res.json();
  },

  async createMenuItem(item) {
    const res = await fetch(`${API_BASE}/menu-items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to create menu item');
    return res.json();
  },

  async updateMenuItem(id, updates) {
    const res = await fetch(`${API_BASE}/menu-items/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update menu item');
    return res.json();
  },

  async deleteMenuItem(id) {
    const res = await fetch(`${API_BASE}/menu-items/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete menu item');
    return res.json();
  },


  // Gallery
  async getGallery() {
    const res = await fetch(`${API_BASE}/gallery`);
    return res.json();
  },

  async addGalleryImage(image_url, category, display_order) {
    const res = await fetch(`${API_BASE}/gallery`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image_url, category, display_order })
    });
    if (!res.ok) throw new Error('Failed to add gallery image');
    return res.json();
  },

  async deleteGalleryImage(id) {
    const res = await fetch(`${API_BASE}/gallery/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete gallery image');
    return res.json();
  },

  // Reviews
  async getReviews() {
    const res = await fetch(`${API_BASE}/reviews`);
    return res.json();
  },

  async addReview(review) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error('Failed to add review');
    return res.json();
  },

  async updateReview(id, updates) {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update review');
    return res.json();
  },

  async deleteReview(id) {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete review');
    return res.json();
  },

  // Upload image file
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('mythri_admin_token');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  // Customer Discounts
  async getDiscounts() {
    const res = await fetch(`${API_BASE}/discounts`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch discounts');
    return res.json();
  },

  async createDiscount(discount) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(discount)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create discount');
    }
    return res.json();
  },

  async updateDiscount(id, updates) {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update discount');
    }
    return res.json();
  },

  async deleteDiscount(id) {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete discount');
    return res.json();
  },

  async checkDiscountEligibility(phone_number, amount) {
    const res = await fetch(`${API_BASE}/discounts/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to check discount eligibility');
    }
    return res.json();
  },

  // Orders
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createOrder(order) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  async updateOrderStatus(id, updates) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  // Subscribe to realtime server updates
  subscribeToRealtime(onUpdate) {
    const eventSource = new EventSource(`${API_BASE}/realtime/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'ping') {
          onUpdate(payload);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Connection error, retrying...', err);
    };

    return () => {
      eventSource.close();
    };
  },

  // Forgot/Reset Password
  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to request password reset');
    }
    return res.json();
  },

  async validateResetToken(token) {
    const res = await fetch(`${API_BASE}/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid reset token');
    }
    return res.json();
  },

  async resetPassword(token, password) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password');
    }
    return res.json();
  }
};
export default api;
