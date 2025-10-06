// server.js - Complete version with authentication

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Passwords (Change these for production)
const ADMIN_PASSWORD = 'canteenadmin123';
const BILLING_PASSWORD = 'billing456';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Enhanced Menu Data with IDs and Quantities
let menu = {
  beverages: [
    {id: 1, name: "Blue Berry Mocktail", price: 60, available: true, quantity: 50, image: "/images/blue-berry-mocktail.jpg"},
    {id: 2, name: "Black Current Mocktail", price: 65, available: true, quantity: 40, image: "/images/black-current-mocktail.jpg"},
    {id: 3, name: "Mango Mocktail", price: 70, available: true, quantity: 35, image: "/images/mango-mocktail.jpg"},
    {id: 4, name: "Oreo Milkshake", price: 80, available: true, quantity: 30, image: "/images/oreo-milkshake.jpg"},
    {id: 5, name: "Chocolate Milkshake", price: 80, available: true, quantity: 25, image: "/images/chocolate-milkshake.jpg"},
    {id: 6, name: "Fruit Juices", price: 50, available: true, quantity: 60, image: "/images/fruit-juices.jpg"},
    {id: 7, name: "Tea", price: 20, available: true, quantity: 100, image: "/images/tea.jpg"},
  ],
  food: [
    {id: 8, name: "Chicken Noodles", price: 90, available: true, quantity: 20, image: "/images/chicken-noodles.jpg"},
    {id: 9, name: "Chicken Rice", price: 100, available: true, quantity: 25, image: "/images/chicken-rice.jpg"},
    {id: 10, name: "Veg Rice", price: 80, available: true, quantity: 30, image: "/images/veg-rice.jpg"},
    {id: 11, name: "Panner Rice", price: 90, available: true, quantity: 22, image: "/images/panner-rice.jpg"},
    {id: 12, name: "Chicken Biryani", price: 110, available: true, quantity: 18, image: "/images/chicken-biryani.jpg"},
    {id: 13, name: "Chicken Boneless", price: 120, available: true, quantity: 15, image: "/images/chicken-boneless.jpg"},
    {id: 14, name: "Chicken 65", price: 110, available: true, quantity: 20, image: "/images/chicken-65.jpg"},
    {id: 15, name: "Egg Rice", price: 90, available: true, quantity: 25, image: "/images/egg-rice.jpg"},
    {id: 16, name: "Egg Noodles", price: 90, available: true, quantity: 22, image: "/images/egg-noodles.jpg"},
    {id: 17, name: "Parotta", price: 40, available: true, quantity: 40, image: "/images/parotta.jpg"},
  ],
  snacks: [
    {id: 18, name: "Lays", price: 20, available: true, quantity: 50, image: "/images/lays.jpg"},
    {id: 19, name: "Samosa", price: 15, available: true, quantity: 40, image: "/images/samosa.jpg"},
    {id: 20, name: "Egg Puff", price: 25, available: true, quantity: 30, image: "/images/egg-puff.jpg"},
    {id: 21, name: "Veg Puff", price: 25, available: true, quantity: 35, image: "/images/veg-puff.jpg"},
    {id: 22, name: "Panner Puff", price: 30, available: true, quantity: 25, image: "/images/panner-puff.jpg"},
    {id: 23, name: "Hot Chips", price: 25, available: true, quantity: 45, image: "/images/hot-chips.jpg"},
    {id: 24, name: "Cream Bun", price: 15, available: true, quantity: 50, image: "/images/cream-bun.jpg"},
  ],
  desserts: [
    {id: 25, name: "Chocolate Cake", price: 150, available: true, quantity: 10, image: "/images/chocolate-cake.jpg"},
    {id: 26, name: "Red Velvet Cake", price: 160, available: true, quantity: 8, image: "/images/red-velvet-cake.jpg"},
  ],
};

// Store for orders
let orders = [];
let orderCounter = 1;

// ============ AUTHENTICATION ENDPOINTS ============

// Billing authentication
app.post('/auth/billing', (req, res) => {
  const { password } = req.body;
  if (password === BILLING_PASSWORD) {
    res.json({ success: true, message: 'Billing access granted' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid billing password' });
  }
});

// Admin authentication
app.post('/auth/admin', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Admin access granted' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin password' });
  }
});

// ============ PUBLIC ENDPOINTS (Menu Display) ============

// GET /menu: Serve menu data to public (hide quantities)
app.get('/menu', (req, res) => {
  const publicMenu = {};
  Object.keys(menu).forEach(category => {
    publicMenu[category] = menu[category].map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      available: item.available && item.quantity > 0,
      image: item.image
    }));
  });
  res.json(publicMenu);
});

// ============ BILLING ENDPOINTS ============

// GET /billing/menu: Full menu with quantities (for billing UI)
app.get('/billing/menu', (req, res) => {
  res.json(menu);
});

// POST /billing/order: Process an order and update quantities
app.post('/billing/order', (req, res) => {
  const { items, customerName } = req.body;
  
  let orderTotal = 0;
  let orderItems = [];
  
  // Validate and process each item
  for (let orderItem of items) {
    const { id, quantity } = orderItem;
    let foundItem = null;
    let category = null;
    
    // Find the item in menu
    for (let cat of Object.keys(menu)) {
      const item = menu[cat].find(menuItem => menuItem.id === id);
      if (item) {
        foundItem = item;
        category = cat;
        break;
      }
    }
    
    if (!foundItem) {
      return res.status(400).json({ message: `Item with ID ${id} not found` });
    }
    
    if (foundItem.quantity < quantity) {
      return res.status(400).json({ 
        message: `Not enough stock for ${foundItem.name}. Available: ${foundItem.quantity}` 
      });
    }
    
    // Update quantity and calculate total
    foundItem.quantity -= quantity;
    if (foundItem.quantity === 0) {
      foundItem.available = false;
    }
    
    orderTotal += foundItem.price * quantity;
    orderItems.push({
      id: foundItem.id,
      name: foundItem.name,
      price: foundItem.price,
      quantity: quantity,
      subtotal: foundItem.price * quantity
    });
  }
  
  // Create order record
  const order = {
    orderId: orderCounter++,
    customerName: customerName || 'Unknown',
    items: orderItems,
    total: orderTotal,
    timestamp: new Date().toISOString()
  };
  
  orders.push(order);
  
  res.json({
    message: 'Order processed successfully',
    order: order,
    updatedMenu: menu
  });
});

// GET /billing/orders: Get all orders
app.get('/billing/orders', (req, res) => {
  res.json(orders);
});

// ============ ADMIN ENDPOINTS ============

// POST /admin/update: Update menu (existing functionality)
app.post('/admin/update', (req, res) => {
  if (req.body && req.body.menu) {
    menu = req.body.menu;
    res.json({message: "Menu updated successfully"});
  } else {
    res.status(400).json({message: "Invalid menu update request"});
  }
});

// POST /admin/restock: Restock items
app.post('/admin/restock', (req, res) => {
  const { id, quantity } = req.body;
  
  for (let category of Object.keys(menu)) {
    const item = menu[category].find(menuItem => menuItem.id === id);
    if (item) {
      item.quantity += quantity;
      if (item.quantity > 0) {
        item.available = true;
      }
      return res.json({
        message: `Restocked ${item.name} by ${quantity}`,
        updatedItem: item
      });
    }
  }
  
  res.status(404).json({message: 'Item not found'});
});

// ============ SERVE HTML FILES ============

// Serve menu UI (public access)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve billing UI
app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'billing.html'));
});

// Health check
app.get('/ping', (req, res) => res.send('Server is running!'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Menu UI: http://localhost:${PORT}`);
  console.log(`💳 Billing UI: http://localhost:${PORT}/billing`);
  console.log(`🌐 Network access: http://[YOUR_IP]:${PORT}`);
  console.log(`🔑 Billing Password: ${BILLING_PASSWORD}`);
  console.log(`🔑 Admin Password: ${ADMIN_PASSWORD}`);
});

// User order (simulated payment)
app.post('/user/order', (req, res) => {
  const { name, items } = req.body;
  if (!name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invalid order details" });
  }
  let orderItems = [];
  let orderTotal = 0;
  for (const reqItem of items) {
    let found = null;
    for (let cat of Object.keys(menu)) {
      const item = menu[cat].find(menuItem => menuItem.id === reqItem.id);
      if (item) { found = item; break; }
    }
    if (!found || !found.available || found.quantity < reqItem.quantity)
      return res.status(400).json({ message: `Not enough stock for ${found ? found.name : 'unknown item'}` });

    found.quantity -= reqItem.quantity;
    if (found.quantity === 0) found.available = false;
    orderTotal += found.price * reqItem.quantity;
    orderItems.push({
      name: found.name,
      price: found.price,
      quantity: reqItem.quantity,
      subtotal: found.price * reqItem.quantity
    });
  }
  const orderRecord = { id: orders.length+1, name, items: orderItems, total: orderTotal, timestamp: new Date().toISOString() };
  orders.push(orderRecord);

  return res.json({ message: "Order successful", order: orderRecord, updatedMenu: menu });
});

const fs = require('fs');
const usersFile = './users.json';

// Load users or create empty array
let users = [];
try {
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }
} catch (e) {
  users = [];
}

// Save users to file
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// ================= USER AUTH & ORDERS ==================

// Register user
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Missing username or password' });

  if (users.find(u => u.username === username))
    return res.status(409).json({ message: 'Username already exists' });

  const newUser = {
    id: Date.now(),
    username,
    password,
    orders: [],
  };
  users.push(newUser);
  saveUsers();
  res.json({ message: 'User registered successfully' });
});

// User login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user)
    return res.status(401).json({ message: 'Invalid username or password' });
  res.json({ message: 'Login successful', userId: user.id, username: user.username });
});

// Place order with userId
app.post('/user/order', (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: 'Invalid order' });

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ message: 'User not found' });

  let orderItems = [];
  let orderTotal = 0;

  for (const reqItem of items) {
    let found = null;
    for (const cat of Object.keys(menu)) {
      const item = menu[cat].find(i => i.id === reqItem.id);
      if (item) {
        found = item;
        break;
      }
    }
    if (!found || !found.available || found.quantity < reqItem.quantity)
      return res.status(400).json({ message: `Not enough stock for ${found ? found.name : 'unknown item'}` });

    found.quantity -= reqItem.quantity;
    if (found.quantity === 0) found.available = false;

    orderTotal += found.price * reqItem.quantity;
    orderItems.push({
      name: found.name,
      price: found.price,
      quantity: reqItem.quantity,
      subtotal: found.price * reqItem.quantity
    });
  }

  const orderRecord = {
    id: Date.now(),
    userId,
    items: orderItems,
    total: orderTotal,
    timestamp: new Date().toISOString()
  };

  user.orders.push(orderRecord);
  saveUsers();

  // Optionally notify other clients or reload menu stock here...

  res.json({ message: 'Order placed successfully', order: orderRecord, updatedMenu: menu });
});

// Get user's order history
app.get('/user/orders/:userId', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user.orders);
});

