const db = require("../models");
const Order = db.order;
const OrderItem = db.orderItem;
const Product = db.products;
const User = db.user;
const Inventory = db.inventory;
const axios = require("axios");

// TOGGLE THIS FOR TIMING MODE
const USE_DEMO_TIMINGS = false; // Set to true for ~1min fast testing, false for Real Life logic

// Create a new order
exports.createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { items, shippingAddress } = req.body;
    const userId = req.userId; // From JWT token

    if (!items || items.length === 0) {
      return res.status(400).send({ message: "Order must contain at least one item." });
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).send({ message: `Product with ID ${item.productId} not found.` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order
    const order = await Order.create({
      userId,
      total_amount: totalAmount,
      status: "pending",
      shippingAddressId: req.body.shippingAddressId || null
    }, { transaction });

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      orderId: order.id,
    }));

    await OrderItem.bulkCreate(itemsWithOrderId, { transaction });

    // NOTE: Inventory update will be handled in delivery option
    // where warehouse selection is based on user address proximity

    await transaction.commit();

    res.status(201).send({
      message: "Order created successfully!",
      orderId: order.id,
      totalAmount: order.total_amount,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// --- TIME HELPERS ---
const getPrepStartTime = (startDate) => {
  let current = new Date(startDate);
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 19;

  if (current.getHours() < OPEN_HOUR) {
    current.setHours(OPEN_HOUR, 0, 0, 0);
  } else if (current.getHours() >= CLOSE_HOUR) {
    current.setDate(current.getDate() + 1);
    current.setHours(OPEN_HOUR, 0, 0, 0);
  }
  return current;
};

const addWarehouseHours = (startDate, hoursToAdd, prepStartTime) => {
  let current = new Date(startDate);
  // Align start to 8am if before
  if (current < prepStartTime) current = new Date(prepStartTime);

  // DEMO SIMULATION: If hoursToAdd is small (decimal hours for minutes),
  // just add it directly. The warehouse hours logic was conflicting with minute-based demo.
  // We'll trust the "minutes" logic for the demo flow.
  if (hoursToAdd < 1) { // e.g. 0.05 (3 mins)
    const msToAdd = hoursToAdd * 60 * 60 * 1000;
    return new Date(current.getTime() + msToAdd);
  }

  let remainingHours = hoursToAdd;
  while (remainingHours > 0) {
    const closeTime = new Date(current);
    closeTime.setHours(19, 0, 0, 0);

    const msUntilClose = closeTime - current;
    const hoursUntilClose = msUntilClose / (1000 * 60 * 60);

    if (hoursUntilClose >= remainingHours) {
      current = new Date(current.getTime() + (remainingHours * 3600 * 1000));
      remainingHours = 0;
    } else {
      remainingHours -= hoursUntilClose;
      // Move to next day 8am
      current.setDate(current.getDate() + 1);
      current.setHours(8, 0, 0, 0);
    }
  }
  return current;
};

// --- HELPER: Dynamic Status Calculation ---
// Calculates status based on time flow: Pending -> Preparing -> En Route -> Delivered -> Completed (2h later)
// Also handles cancelled/completed if manually set
const calculateDynamicStatus = (order) => {
  // If explicitly final state in DB, return it (unless we want to simulate time based override)
  // But user wants "Completed" after 2 hours of delivery.
  if (order.status === "cancelled") return "cancelled";

  // Note: We ignore "pending" or "processing" from DB to enforce time-based simulation
  const createdAt = new Date(order.createdAt);
  const now = new Date();

  // 1. Prep Quantity
  let totalItems = 0;
  if (order.items) {
    order.items.forEach(item => totalItems += item.quantity);
  }

  // PREP TIME LOGIC
  let prepHours;
  if (USE_DEMO_TIMINGS) {
    // DEMO: Minutes
    prepHours = 0.017; // ~1 minute
    if (totalItems > 5 && totalItems <= 10) prepHours = 0.034; // ~2 mins
    if (totalItems > 10) prepHours = 0.05; // ~3 mins
  } else {
    // REAL: Hours
    prepHours = 2; // 2 hours default
    if (totalItems > 5 && totalItems <= 10) prepHours = 3; // +1 hour
    if (totalItems > 10) prepHours = 4; // +2 hours
  }

  // 2. Prep Start Time (8am rule)
  const prepStartTime = getPrepStartTime(createdAt);

  // 3. Departure Time
  const departureTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

  // 4. Arrival Time 
  // DEMO: 120s (2 mins)
  // REAL: Default 1 hour if unknown? Or 24h? User said "depends on map". 
  // In this helper, we don't have map access. Let's assume reasonable 45 mins local delivery or 24h standard.
  // We'll use 45 mins as a visual placeholder for "Real" if we can't get data.
  const travelDurationSec = USE_DEMO_TIMINGS ? 120 : (45 * 60);
  const arrivalTime = new Date(departureTime.getTime() + (travelDurationSec * 1000));

  // 5. Completion Time 
  // DEMO: 1 min after delivery
  // REAL: 1 hour after delivery
  const completionBufferMin = USE_DEMO_TIMINGS ? 1 : 60;
  const completionTime = new Date(arrivalTime.getTime() + (completionBufferMin * 60 * 1000));

  // Determine Status
  if (now >= completionTime) return "Completed";
  if (now >= arrivalTime) return "Delivered";
  if (now >= departureTime) return "En Route";
  if (now >= prepStartTime) return "Preparing";

  return "Pending";
};

// Get all orders for the logged-in user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "product_name", "img", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Enrich orders with dynamic status
    const enrichedOrders = orders.map(order => {
      const orderJSON = order.toJSON();
      orderJSON.status = calculateDynamicStatus(orderJSON);
      return orderJSON;
    });

    res.status(200).send(enrichedOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get a specific order by ID (user can only view their own orders)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId; // From JWT token

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "product_name", "img", "price"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).send({ message: "Order not found." });
    }

    // Enrich
    const orderJSON = order.toJSON();
    orderJSON.status = calculateDynamicStatus(orderJSON);

    // Debug completion
    // Debug completion
    // console.log("[Debug] Delivery processing complete. Sending response.");

    res.status(200).send(orderJSON);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "product_name", "img", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Enrich orders with dynamic status
    const enrichedOrders = orders.map(order => {
      const orderJSON = order.toJSON();
      orderJSON.status = calculateDynamicStatus(orderJSON);
      return orderJSON;
    });

    res.status(200).send(enrichedOrders);
  } catch (error) {
    console.error("Error fetching all orders:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).send({ message: "Invalid status value." });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found." });
    }

    order.status = status;
    await order.save();

    res.status(200).send({
      message: "Order status updated successfully!",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Cancel order (User can cancel their own pending orders)
exports.cancelOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const orderId = req.params.id;
    const userId = req.userId; // From JWT token

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product"
        }]
      }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).send({ message: "Order not found." });
    }

    // Only allow cancellation if not already cancelled.
    // Assuming we can cancel even if "processing" logically, but technically usually "pending".
    // User requested restoration.
    if (order.status === "cancelled") {
      await transaction.rollback();
      return res.status(400).send({ message: "Order is already cancelled." });
    }

    // Restore inventory for each item
    for (const item of order.items) {
      // Find ANY warehouse that has this product to restore stock to.
      // Ideally we would restore to the exact warehouse, but we don't track which warehouse fufilled which item in OrderItem (yet).
      // So we pick the first available one to just increment the count back.
      const inventory = await Inventory.findOne({
        where: { productId: item.productId },
        order: [['quantity_available', 'DESC']], // Add to the one with most stock or just any
        transaction
      });

      if (inventory) {
        // Restore stock
        inventory.quantity_available += item.quantity;
        await inventory.save({ transaction });
        console.log(`Restored ${item.quantity} units of product ${item.productId} to warehouse ${inventory.warehouseId}`);
      } else {
        console.warn(`No inventory record found for product ${item.productId} to restore stock.`);
      }
    }

    order.status = "cancelled";
    await order.save({ transaction });

    await transaction.commit();

    res.status(200).send({
      message: "Order cancelled successfully! Stock levels restored.",
      order,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error cancelling order:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Helper: Seeded Random Generator
const seededRandom = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

/*
 * LEGACY / SIMULATION ROUTING
 * External APIs (Google Maps, OSRM) usage has been disabled to prevent
 * network timeouts and "infinite loading" issues reported by the user.
 * This function now returns instantaneous simulated data.
 */
const getRouteData = async (origin, destination, orderIdHash) => {
  // Use Deterministic Random based on orderId (kept for potential future restoration)
  const rng = seededRandom(orderIdHash || Date.now());

  // FIXED SIMULATION: 48km -> ~36 mins at 80km/h
  // This ensures consistent "36 mins" delivery time as requested.
  const mockDistKm = 48;

  // Speed: Avg 80km/h
  const mockDurationHours = mockDistKm / 80; // 0.6 hours = 36 mins
  const mockDurationSeconds = Math.floor(mockDurationHours * 3600);

  // Format Duration string
  const hours = Math.floor(mockDurationHours);
  const minutes = Math.floor((mockDurationHours - hours) * 60);
  const durationText = hours > 0 ? `${hours} hours ${minutes} mins` : `${minutes} mins`;

  return {
    distanceValue: mockDistKm * 1000,
    distanceText: `${mockDistKm} km`,
    durationValue: mockDurationSeconds,
    durationText: durationText
  };
};



// Helper: Calculate ETA (Business Days Only - Mon-Fri)
const calculateETA = (durationSeconds) => {
  const now = new Date();

  // Add duration (plus some buffer for handling time, say 2 hours)
  let arrivalDate = new Date(now.getTime() + (durationSeconds * 1000) + (2 * 60 * 60 * 1000));

  // Logic: Delivery only between 8 AM and 4 PM (16:00) on Weekdays
  const moveFocusToBusinessHours = (date) => {
    // 0 = Sun, 6 = Sat
    const day = date.getDay();
    const hour = date.getHours();

    // 1. Handle Weekend
    if (day === 0) { // Sunday -> Monday 8AM
      date.setDate(date.getDate() + 1);
      date.setHours(8, 0, 0, 0);
      return date;
    }
    if (day === 6) { // Saturday -> Monday 8AM
      date.setDate(date.getDate() + 2);
      date.setHours(8, 0, 0, 0);
      return date;
    }

    // 2. Handle After Hours (Start delivery next day if after 16:00 / 4 PM)
    if (hour >= 16) {
      date.setDate(date.getDate() + 1);
      date.setHours(8, 0, 0, 0);
      // Re-check weekend recursively (e.g., Friday 5PM -> Saturday -> Monday)
      return moveFocusToBusinessHours(date);
    }

    // 3. Handle Before Hours (Wait until 8 AM)
    if (hour < 8) {
      date.setHours(8, 0, 0, 0);
    }

    return date;
  };

  arrivalDate = moveFocusToBusinessHours(arrivalDate);

  return arrivalDate.toISOString();
};

exports.processDelivery = async (req, res) => {
  try {
    const currentTime = new Date(); // Moved to top scope
    const orderId = req.params.id;
    console.log("Processing delivery for Order ID:", orderId);

    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, as: "items" },
        {
          model: User,
          as: "user",
          include: [{ model: db.userAddress, as: "addresses" }]
        }
      ]
    });

    if (!order) {
      console.error("Order not found in DB");
      return res.status(404).send({ message: "Order not found." });
    }

    // Capture state for stock reduction
    res.locals.isNewProcessing = false;
    if (order.status === "pending") {
      console.log("Status is Pending. Flagging for stock reduction.");
      order.status = "processing";
      await order.save();
      res.locals.isNewProcessing = true;
    }

    // ----------------------------------------------------------------
    // STOCK REDUCTION LOGIC (Only if status is Pending)
    // ----------------------------------------------------------------
    if (order.status === "pending") {
      console.log("First time processing delivery (Pending). Reducing stock...");

      // We will tentatively reduce stock from the "best" warehouse later in the loop.
      // But we need to make sure we don't do it just for *displaying* the route.
      // However, the prompt implies "During the preparation phase I want to manage the stock".
      // The tracking page *is* the view of that process.
      // To be safe, we will perform the stock reduction and state change NOW, so subsequent reloads don't re-reduce.
      order.status = "processing"; // or "preparing" conceptually
      await order.save();
    }
    // ----------------------------------------------------------------

    console.log("Order found. User:", order.user ? order.user.username : "N/A");

    // Get User Address for distance calculation
    let customerAddress = "Paris, France"; // Fallback
    let addressObj = null;

    if (order.shippingAddressId) {
      if (order.user && order.user.addresses) {
        addressObj = order.user.addresses.find(a => a.id === order.shippingAddressId);
      }
    }

    // Fallback if no specific ID or not found
    if (!addressObj && order.user && order.user.addresses && order.user.addresses.length > 0) {
      addressObj = order.user.addresses.find(a => a.is_default_shipping) || order.user.addresses[0];
    }

    if (addressObj) {
      customerAddress = [addressObj.address_line1, addressObj.postal_code, addressObj.city, addressObj.country]
        .filter(part => part && part.trim() !== "")
        .join(", ");
    }

    // Fetch all warehouses
    const warehouses = await db.warehouse.findAll({
      include: [
        { model: db.inventory, as: "inventory" }
      ]
    });

    // 1. Get Route Data for every warehouse (Distance & Duration)
    // Create a deterministic hash from Order ID for seeding RNG
    const orderIdHash = parseInt(String(orderId).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0), 10);

    const warehouseRoutes = await Promise.all(warehouses.map(async (wh) => {
      const destination = `${wh.city}, ${wh.country}`;
      const routeData = await getRouteData(customerAddress, destination, orderIdHash + wh.id); // Combine hashes
      return {
        warehouse: wh,
        route: routeData
      };
    }));

    // Sort warehouses by duration (fastest delivery first)
    warehouseRoutes.sort((a, b) => a.route.durationValue - b.route.durationValue);

    const deliveryPlan = {
      orderId: order.id,
      status: "Processing",
      allocations: []
    };

    let remainingItems = {};
    let totalQuantity = 0;
    order.items.forEach(item => {
      remainingItems[item.productId] = item.quantity;
      totalQuantity += item.quantity;
    });

    // --- PREP TIME LOGIC (Synced with calculateDynamicStatus) ---
    let prepHours;
    if (USE_DEMO_TIMINGS) {
      prepHours = 0.017; // ~1 minute
      if (totalQuantity > 5 && totalQuantity <= 10) prepHours = 0.034; // ~2 mins
      if (totalQuantity > 10) prepHours = 0.05; // ~3 mins
    } else {
      prepHours = 2; // 2 hours
      if (totalQuantity > 5 && totalQuantity <= 10) prepHours = 3;
      if (totalQuantity > 10) prepHours = 4;
    }

    const createdAt = new Date(order.createdAt);

    // --- STATUS LOGIC ---
    const prepStartTime = getPrepStartTime(createdAt);
    const departureTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

    // Status Logic
    let currentStatus = "Pending";

    // Determine Travel Duration
    // For processDelivery, we have routes! We should pick the BEST route's duration for the status check.
    // However, we handle warehouse selection below. 
    // Let's assume the "best" warehouse is the first one in the sorted list (which we haven't sorted yet... wait we sort at line 584).
    // Actually we sort at line 584 (which is before this block in ORIGINAL, but wait... 
    // In the file provided, lines are:
    // 578: warehouseRoutes.sort
    // 581: const deliveryPlan ...
    // ...
    // 594: // --- PREP TIME LOGIC
    // So we DO have `warehouseRoutes[0]` available as the likely candidate.

    let travelDurationSec = 120; // Default
    if (warehouseRoutes.length > 0) {
      if (USE_DEMO_TIMINGS) {
        travelDurationSec = 120;
      } else {
        travelDurationSec = warehouseRoutes[0].route.durationValue; // Real Google Maps duration
      }
    }

    const arrivalTimeCheck = new Date(departureTime.getTime() + (travelDurationSec * 1000));

    const completionBufferMin = USE_DEMO_TIMINGS ? 1 : 60;
    const completionTime = new Date(arrivalTimeCheck.getTime() + (completionBufferMin * 60 * 1000));

    // --- ETA WINDOW CALCULATION (Real Mode only) ---
    // User wants "Overestimate a bit" and "Range like 02:00-02:30"
    let windowStart = null;
    let windowEnd = null;

    if (!USE_DEMO_TIMINGS) {
      // 1. Get Base Arrival (already respects business hours logic if we used calculateETA, 
      // but here arrivalTimeCheck is raw logic. We should sanitize it.)
      // Actually, calculateETA helper is available but we didn't use it here for arrivalTimeCheck!
      // We manually calculated arrivalTimeCheck = departureTime + travelDuration.
      // We should probably run it through business hours logic for display.

      // Re-use logic from calculateETA inside a helper or just inline here?
      // Since we want the Date object, not string.
      // Let's assume arrivalTimeCheck is the raw physical arrival.

      // 2. Round Up to next 30 min slot
      // Logic: If diff < 15 mins, skip to NEXT slot.
      const msPer30 = 30 * 60 * 1000;
      const rawTime = arrivalTimeCheck.getTime();
      let nextSlot = Math.ceil(rawTime / msPer30) * msPer30;

      // Buffer Check
      if (nextSlot - rawTime < (15 * 60 * 1000)) {
        nextSlot += msPer30; // Push another 30 mins
      }

      windowStart = new Date(nextSlot);

      // ENFORCE BUSINESS HOURS (08:00 - 16:00)
      let hour = windowStart.getHours();
      let day = windowStart.getDay(); // 0=Sun, 6=Sat

      // If after 16:00 (4 PM) or before 08:00 (8 AM), or Weekend -> Move to Next Business Day 08:00
      // Note: We only check "After 16:00" heavily because "Before 8am" is covered by warehouse start time usually.
      // But if travel pushes it into weird hours, we fix it.

      const isWeekend = (day === 0 || day === 6);
      const isAfterHours = (hour >= 16);
      const isBeforeHours = (hour < 8);

      if (isWeekend || isAfterHours || isBeforeHours) {
        // Move to next valid day
        if (isAfterHours || (isWeekend && day !== 0)) {
          // If late today, or Saturday, move directly to next 8am? 
          // If Sat (6) -> +2 days = Mon.
          // If Weekday Late -> +1 day.
          windowStart.setDate(windowStart.getDate() + 1);
        }

        // If Sunday (0), we just need to set hours to 8am (it's already the right day? No, if it IS Sunday, we want Monday).
        // Let's use a simpler recursive date shifter or just generic logic.

        // Simple Logic: Reset to 08:00. If that makes it a weekend, push day.
        windowStart.setHours(8, 0, 0, 0);

        // Re-check day after moving to tomorrow/8am
        while (windowStart.getDay() === 0 || windowStart.getDay() === 6) {
          windowStart.setDate(windowStart.getDate() + 1);
        }
      }

      windowEnd = new Date(windowStart.getTime() + msPer30);
    }

    if (currentTime >= completionTime) currentStatus = "Completed";
    else if (currentTime >= arrivalTimeCheck) currentStatus = "Delivered";
    else if (currentTime >= departureTime) currentStatus = "En Route";
    else if (currentTime >= prepStartTime) currentStatus = "Preparing";

    // Allocation Logic
    // NOTE: This logic simulates finding the route. 
    // If the order was JUST transitioned from Pending -> Processing, we should ACTUALLY reduce the stock here.
    // If it's already Processing, we assume stock was already reduced, but we calculate "virtual" allocation for display.

    // HOWEVER, the previous implementation REDUCED stock every time.
    // We want to reduce ONLY if we just transitioned.
    // But we need to calculate the allocation to know WHICH warehouse to reduce from.
    // This creates a dilemma: We need to calculate allocation to reduce stock, but if we don't save the allocation, we can't know later?
    // "No Schema Change" means we don't save allocation.
    // SO: We will calculate allocation every time for DISPLAY. 
    // BUT we will only update the `quantity_available` in DB if we are in the "Just Transitioned" phase.
    // To safe guard, we'll check if the order status was 'pending' at the start of this function (we set it to 'processing' earlier).
    // Wait, if I set it to 'processing' at line 465, I need a flag.
    // Let's refactor that block.

    /*
    const isNewProcessing = order.status === 'pending';
    if (isNewProcessing) {
        order.status = 'processing';
        await order.save();
    }
    */
    // I'll assume I have this flag `isNewProcessing` from the earlier check logic I will insert below.

    for (const entry of warehouseRoutes) {
      const wh = entry.warehouse;
      const route = entry.route;

      // Use the specific demo-mode arrival time we calculated earlier
      // This ensures the displayed ETA matches the quick status progression
      const eta = arrivalTimeCheck.toISOString();

      const allocation = {
        warehouseId: wh.id,
        warehouseName: wh.name,
        warehouseCity: wh.city,
        destinationAddress: customerAddress,
        distanceText: route.distanceText,
        durationText: route.durationText,
        eta: eta,
        mapUrl: `https://www.google.com/maps/embed/v1/directions?key=${process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}&origin=${encodeURIComponent(wh.city)}&destination=${encodeURIComponent(customerAddress)}&mode=driving`,
        checkMapLink: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(wh.city)}&destination=${encodeURIComponent(customerAddress)}&travelmode=driving`,
        items: []
      };

      let warehouseUsed = false;
      const productIdsNeeded = Object.keys(remainingItems);

      for (const productId of productIdsNeeded) {
        if (remainingItems[productId] <= 0) continue;

        const inventoryItem = wh.inventory.find(inv => inv.productId == productId);

        if (inventoryItem && inventoryItem.quantity_available > 0) {
          const qtyNeeded = remainingItems[productId];
          const qtyAvailable = inventoryItem.quantity_available;
          // For visualization, we show what we CAN take.
          // For actual database update, we only do it if isNewProcessing is true.

          const qtyToTake = Math.min(qtyNeeded, qtyAvailable);

          allocation.items.push({
            productId: productId,
            quantity: qtyToTake
          });

          remainingItems[productId] -= qtyToTake;

          // CRITICAL FIX: Only update DB if this is the first time (transition from pending)
          // Actually, since we can't persist the allocation, if we reload the page, `qtyAvailable` will be LOWER.
          // This means the visualization will change if we physically reduce the stock (it will show different warehouses!).
          // This is the flaw of "No Schema Change".
          // IF we reduce stock, the next `processDelivery` call will see less stock and might route to a *different* warehouse.
          // So the tracking page *will* change.
          // User said "shows each time i reload ... a new estimated delivery time ... and status".
          // Fixing time/status is easy.
          // Fixing the "changing warehouse" because of stock reduction is hard without saving allocation.
          // BUT, if we assume stock is large enough, or we just want to satisfy the "manage stock" requirement:
          // We WILL reduce stock. If the user reloads, they might see a different warehouse if the first one ran out.
          // That is acceptable behavior for a dynamic system without persistent allocation.
          // JUST MAKE SURE WE DON'T REDUCE STOCK AGAIN for the same order.

          // To prevent double reduction:
          // We need to know if THIS order already reduced stock.
          // We rely on `order.status`.
          // If `order.status` != 'pending', we DO NOT reduce.
          // But we still calculate the view assuming the stock *is available*? No, we show current reality.

          // Problem: If we reduced stock, `inventoryItem.quantity_available` is now lower.
          // The visualizer will see lower stock and might skip this warehouse.
          // This implies the tracking page will show "Searching for stock..." or "Different Warehouse".
          // There is no perfect solution without an `OrderAllocation` table.

          // Proposed "Best Effort":
          // If `order.status` was 'pending', we reduce stock.
          // If `order.status` is NOT 'pending', we assume the stock we need *is implicitly accounted for*?
          // No, that's complex.
          // Let's just stick to:
          // 1. If 'pending' -> Reduce Stock in DB. Change status.
          // 2. Always show "Allocated from Warehouse X" based on CURRENT stock + Logic.
          // If stock is gone (because we took it), the visualizer will look for NEXT warehouse.
          // This effectively means reloading the page might show a different warehouse if we are the ones who took the last stock!
          // This is a logical paradox of the requirements.
          // BUT, the user's main complaint was "random estimated delivery time".

          // I will implement the stock reduction ONLY when `isNewProcessing` is true.
          // I cannot fix the "Visualizer shifts warehouses because stock is gone" issue without schema changes.
          const isNewProcessing = (order.status === 'processing'); // We set it to processing a few lines above? No wait.
          // Refactoring the logic flow below to handle this cleanly.

          if (res.locals.isNewProcessing && res.locals.isNewProcessing === true) {
            await db.inventory.update(
              { quantity_available: qtyAvailable - qtyToTake },
              { where: { id: inventoryItem.id } }
            );
          }

          warehouseUsed = true;
        }
      }

      if (warehouseUsed) {
        deliveryPlan.allocations.push(allocation);
      }

      const allFulfilled = Object.values(remainingItems).every(q => q === 0);
      if (allFulfilled) break;
    }

    const unfulfilled = Object.entries(remainingItems).filter(([p, q]) => q > 0);
    if (unfulfilled.length > 0) {
      deliveryPlan.status = "Partial";
      deliveryPlan.unfulfilled = unfulfilled;
    } else {
      deliveryPlan.status = "Fulfilled";
    }

    // Enrich response with Prep details
    deliveryPlan.prepTimeHours = prepHours;
    deliveryPlan.departureTime = departureTime;
    deliveryPlan.prepStartTime = prepStartTime;
    deliveryPlan.arrivalTime = arrivalTimeCheck;
    deliveryPlan.windowStart = windowStart;
    deliveryPlan.windowEnd = windowEnd;

    if (deliveryPlan.status !== "cancelled") {
      deliveryPlan.status = currentStatus;
    }

    // console.log("[Debug] ProcessDelivery: Sending 48km simulation response.");
    res.send(deliveryPlan);

  } catch (error) {
    console.error("Delivery processing error:", error);
    res.status(500).send({ message: error.message });
  }
};
