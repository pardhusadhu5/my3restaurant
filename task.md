# Task Checklist - Customer First-Time Discount & Order System

- `[x]` **Database Schema Setup**
  - `[x]` Update `schema.sql` to include `customers`, `first_order_discounts`, and `orders` tables.
- `[x]` **Backend Service Implementation**
  - `[x]` Update `backend/seeds.json` to include empty placeholders for `customers`, `first_order_discounts`, and `orders`.
  - `[x]` Update `backend/db.js` to implement data functions for customers, discounts, and orders.
  - `[x]` Update `backend/server.js` to expose REST endpoints for discounts and orders.
  - `[x]` Delete local `db.json` and restart the backend server to load the new database schema.
- `[x]` **Frontend Integration**
  - `[x]` Update `frontend/src/services/api.js` to add methods for discounts, checkout validation, and orders.
  - `[x]` Update `frontend/src/App.jsx` to load initial orders/discounts state and subscribe to real-time events.
- `[x]` **UI Pages & Components**
  - `[x]` Update `frontend/src/components/MenuPage.jsx` to implement the Shopping Cart, Checkout Modal, phone-number discount calculation, and simulated payment flow.
  - `[x]` Update `frontend/src/components/AdminDashboard.jsx` to implement the "Customer Discounts" tab, "Order History" tab, stats summary counters, and order state togglers.
- `[x]` **Verification & Testing**
  - `[x]` Compile frontend code using `npm run build` to verify there are no compilation errors.
  - `[x]` Verify checkout modal eligibility messages, payment simulation states, and admin metrics updating in real time.
