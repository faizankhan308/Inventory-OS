import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Helper to write database
const saveDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
};

// Helper to read database or seed with mock data
const loadDb = () => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading db, reseeding...", e);
    }
  }

  // Seed Data
  const seedProducts = [
    { id: "p1", name: "Alloy Tech Mechanical Keyboard", sku: "KB-MECH-87", price: 129.99, quantity: 45 },
    { id: "p2", name: "Ergonomic Mesh Office Chair", sku: "CHAIR-ERG-02", price: 349.50, quantity: 4 },
    { id: "p3", name: "UltraWide 34-inch Curved Monitor", sku: "MON-34UW-IPS", price: 599.99, quantity: 12 },
    { id: "p4", name: "Thunderbolt 4 Docking Station", sku: "DOCK-TB4-PRO", price: 189.00, quantity: 3 },
    { id: "p5", name: "Noise Cancelling Studio Earbuds", sku: "EAR-ANC-05", price: 89.95, quantity: 60 }
  ];

  const seedCustomers = [
    { id: "c1", name: "Sarah Jenkins", email: "sarah.j@example.com", phone: "+1 (555) 234-5678" },
    { id: "c2", name: "Marcus Chen", email: "marcus.chen@example.com", phone: "+1 (555) 987-6543" },
    { id: "c3", name: "Elena Rostova", email: "elena.r@example.com", phone: "+1 (555) 456-7890" }
  ];

  const seedOrders = [
    {
      id: "o1",
      customer_id: "c1",
      customer_name: "Sarah Jenkins",
      items: [
        { product_id: "p4", product_name: "Thunderbolt 4 Docking Station", sku: "DOCK-TB4-PRO", quantity: 1, price: 189.00 },
        { product_id: "p1", product_name: "Alloy Tech Mechanical Keyboard", sku: "KB-MECH-87", quantity: 1, price: 129.99 }
      ],
      total_amount: 318.99,
      status: "Completed",
      created_at: "2026-05-28T14:32:00Z"
    }
  ];

  const initialDb = { products: seedProducts, customers: seedCustomers, orders: seedOrders };
  saveDb(initialDb);
  return initialDb;
};

// Initialize DB on server start
let db = loadDb();

// ==========================================
// API ROUTES
// ==========================================

// 1. PRODUCT MANAGEMENT APIs
// GET /api/products
app.get("/api/products", (req, res) => {
  res.json(db.products);
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// POST /api/products (Create)
app.post("/api/products", (req, res) => {
  const { name, sku, price, quantity } = req.body;

  // Validation
  if (!name || !sku || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: "Name, SKU, price, and quantity are required" });
  }

  const numericPrice = parseFloat(price);
  const numericQuantity = parseInt(quantity, 10);

  if (isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: "Price must be a positive number" });
  }

  if (isNaN(numericQuantity) || numericQuantity < 0) {
    return res.status(400).json({ error: "Quantity in stock cannot be negative" });
  }

  // SKU unique check (case insensitive)
  const skuExists = db.products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());
  if (skuExists) {
    return res.status(400).json({ error: "Product with this SKU already exists" });
  }

  const newProduct = {
    id: "p_" + Date.now().toString(36),
    name: name.trim(),
    sku: sku.trim().toUpperCase(),
    price: numericPrice,
    quantity: numericQuantity
  };

  db.products.push(newProduct);
  saveDb(db);

  res.status(201).json(newProduct);
});

// PUT /api/products/:id (Update)
app.put("/api/products/:id", (req, res) => {
  const { name, sku, price, quantity } = req.body;
  const productIndex = db.products.findIndex((p) => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (!name || !sku || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: "Name, SKU, price, and quantity are required" });
  }

  const numericPrice = parseFloat(price);
  const numericQuantity = parseInt(quantity, 10);

  if (isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: "Price must be a positive number" });
  }

  if (isNaN(numericQuantity) || numericQuantity < 0) {
    return res.status(400).json({ error: "Quantity in stock cannot be negative" });
  }

  // SKU unique check (excluding itself)
  const skuExists = db.products.some(
    (p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== req.params.id
  );
  if (skuExists) {
    return res.status(400).json({ error: "Another product with this SKU already exists" });
  }

  db.products[productIndex] = {
    ...db.products[productIndex],
    name: name.trim(),
    sku: sku.trim().toUpperCase(),
    price: numericPrice,
    quantity: numericQuantity
  };

  saveDb(db);
  res.json(db.products[productIndex]);
});

// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
  const productIndex = db.products.findIndex((p) => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.products.splice(productIndex, 1);
  saveDb(db);
  res.json({ success: true, message: "Product deleted successfully" });
});


// 2. CUSTOMER MANAGEMENT APIs
// GET /api/customers
app.get("/api/customers", (req, res) => {
  res.json(db.customers);
});

// GET /api/customers/:id
app.get("/api/customers/:id", (req, res) => {
  const customer = db.customers.find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }
  res.json(customer);
});

// POST /api/customers
app.post("/api/customers", (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Full name, email address, and phone number are required" });
  }

  // Email unique check (case insensitive)
  const emailExists = db.customers.some((c) => c.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Customer with this email address already exists" });
  }

  const newCustomer = {
    id: "c_" + Date.now().toString(36),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim()
  };

  db.customers.push(newCustomer);
  saveDb(db);

  res.status(201).json(newCustomer);
});

// DELETE /api/customers/:id
app.delete("/api/customers/:id", (req, res) => {
  const customerIndex = db.customers.findIndex((c) => c.id === req.params.id);
  if (customerIndex === -1) {
    return res.status(404).json({ error: "Customer not found" });
  }

  db.customers.splice(customerIndex, 1);
  saveDb(db);
  res.json({ success: true, message: "Customer deleted successfully" });
});


// 3. ORDER MANAGEMENT APIs
// GET /api/orders
app.get("/api/orders", (req, res) => {
  // Map customer names for reference on frontend
  const ordersWithNames = db.orders.map((order) => {
    const customer = db.customers.find((c) => c.id === order.customer_id);
    return {
      ...order,
      customer_name: customer ? customer.name : "Unknown Customer"
    };
  });
  res.json(ordersWithNames);
});

// GET /api/orders/:id
app.get("/api/orders/:id", (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const customer = db.customers.find((c) => c.id === order.customer_id);
  res.json({
    ...order,
    customer_name: customer ? customer.name : "Unknown Customer"
  });
});

// POST /api/orders (Create Order)
app.post("/api/orders", (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Customer reference and order items list are required" });
  }

  // Validate Customer existence
  const customer = db.customers.find((c) => c.id === customer_id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  // Validate and deduct stock
  const validatedItems = [];
  let totalAmount = 0;

  // Clone database products structure temporarily for atomic check
  const productsClone = JSON.parse(JSON.stringify(db.products));

  for (const item of items) {
    const { product_id, quantity } = item;
    if (!product_id || quantity === undefined) {
      return res.status(400).json({ error: "Each order item requires product_id and quantity" });
    }

    const orderedQty = parseInt(quantity, 10);
    if (isNaN(orderedQty) || orderedQty <= 0) {
      return res.status(400).json({ error: "Ordered quantity must be greater than 0" });
    }

    const linkedProduct = productsClone.find((p) => p.id === product_id);
    if (!linkedProduct) {
      return res.status(404).json({ error: `Product ID '${product_id}' not found` });
    }

    if (linkedProduct.quantity < orderedQty) {
      return res.status(400).json({
        error: `Insufficient stock for product '${linkedProduct.name}'. Requested ${orderedQty}, but only ${linkedProduct.quantity} available.`
      });
    }

    // Deduct stock in our transaction clone
    linkedProduct.quantity -= orderedQty;

    const itemTotal = linkedProduct.price * orderedQty;
    totalAmount += itemTotal;

    validatedItems.push({
      product_id: linkedProduct.id,
      product_name: linkedProduct.name,
      sku: linkedProduct.sku,
      quantity: orderedQty,
      price: linkedProduct.price
    });
  }

  // If validation passes, persist stock deductions and the order
  db.products = productsClone;

  const newOrder = {
    id: "o_" + Date.now().toString(36),
    customer_id,
    customer_name: customer.name,
    items: validatedItems,
    total_amount: parseFloat(totalAmount.toFixed(2)),
    status: "Completed",
    created_at: new Date().toISOString()
  };

  db.orders.unshift(newOrder); // Add to the start
  saveDb(db);

  res.status(201).json(newOrder);
});

// DELETE /api/orders/:id (Cancel Order)
app.delete("/api/orders/:id", (req, res) => {
  const orderIndex = db.orders.findIndex((o) => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = db.orders[orderIndex];

  // Restock products as this represents cancelling/deleting an order
  if (order.status !== "Cancelled") {
    for (const item of order.items) {
      const dbProduct = db.products.find((p) => p.id === item.product_id);
      if (dbProduct) {
        dbProduct.quantity += item.quantity;
      }
    }
  }

  db.orders.splice(orderIndex, 1);
  saveDb(db);

  res.json({ success: true, message: "Order deleted and stock refilled successfully" });
});

// Stats API
app.get("/api/dashboard-stats", (req, res) => {
  const totalProducts = db.products.length;
  const totalCustomers = db.customers.length;
  const totalOrders = db.orders.length;
  const lowStockProducts = db.products.filter((p) => p.quantity <= 5);
  const lowStockCount = lowStockProducts.length;

  const totalRevenue = db.orders
    .filter((o) => o.status === "Completed")
    .reduce((sum, o) => sum + o.total_amount, 0);

  res.json({
    totalProducts,
    totalCustomers,
    totalOrders,
    lowStockCount,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    lowStockProducts,
    recentOrders: db.orders.slice(0, 5)
  });
});

// ==========================================
// VITE AND SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
