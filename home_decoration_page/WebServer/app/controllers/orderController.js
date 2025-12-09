const db = require("../models");
const Order = db.order;
const OrderItem = db.orderItem;
const Product = db.products;
const User = db.user;
const Inventory = db.inventory;
const axios = require("axios");

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
  // DEMO MODE: Fast calculation (Minutes instead of Hours)
  let prepHours = 0.05; // 3 minutes
  if (totalItems > 5 && totalItems <= 10) prepHours = 0.1; // 6 mins
  if (totalItems > 10) prepHours = 0.2; // 12 mins

  // 2. Prep Start Time (8am rule)
  const prepStartTime = getPrepStartTime(createdAt);

  // 3. Departure Time
  const departureTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

  // 4. Arrival Time (Assume 2 minutes travel default for demo)
  const travelDurationSec = 120;
  const arrivalTime = new Date(departureTime.getTime() + (travelDurationSec * 1000));

  // 5. Completion Time (5 mins after delivery)
  const completionTime = new Date(arrivalTime.getTime() + (5 * 60 * 1000));

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

    if (order.status !== "pending") {
      await transaction.rollback();
      return res.status(400).send({
        message: "Only pending orders can be cancelled."
      });
    }

    // Restore inventory for each item
    for (const item of order.items) {
      const inventory = await Inventory.findOne({
        where: { productId: item.productId },
        transaction
      });

      if (inventory) {
        // Restore stock
        inventory.quantity_available += item.quantity;
        await inventory.save({ transaction });
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

// Helper: Get route data from Google Maps API (or fallback simulation)
const getRouteData = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK") {
        const element = response.data.rows[0].elements[0];
        if (element.status === "OK") {
          return {
            distanceValue: element.distance.value, // in meters
            distanceText: element.distance.text,
            durationValue: element.duration.value, // in seconds
            durationText: element.duration.text
          };
        }
      }
    } catch (error) {
      console.error("Google Maps API Error:", error.message);
      // Fallback to simulation if API fails
    }
  }

  // Fallback Simulation (Realistic Mock)
  // Distance: Random between 10km and 1000km
  const mockDistKm = Math.floor(Math.random() * 990) + 10;
  // Speed: Avg 80km/h
  const mockDurationHours = mockDistKm / 80;
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

  // Logic: Delivery only between 9 AM and 6 PM on Weekdays
  // If arrival is on Sat/Sun, move to Monday 9 AM
  // If arrival is after 6 PM, move to next weekday 9 AM

  const moveFocusToBusinessHours = (date) => {
    // 0 = Sun, 6 = Sat
    const day = date.getDay();
    const hour = date.getHours();

    // 1. Handle Weekend
    if (day === 0) { // Sunday -> Monday 9AM
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      return date;
    }
    if (day === 6) { // Saturday -> Monday 9AM
      date.setDate(date.getDate() + 2);
      date.setHours(9, 0, 0, 0);
      return date;
    }

    // 2. Handle After Hours (Start delivery next day if after 6 PM)
    if (hour >= 18) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      // Re-check weekend recursively (e.g., Friday 8PM -> Saturday -> Monday)
      return moveFocusToBusinessHours(date);
    }

    // 3. Handle Before Hours (Wait until 9 AM)
    if (hour < 9) {
      date.setHours(9, 0, 0, 0);
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

    console.log("Order found. User:", order.user ? order.user.username : "N/A");

    // Get User Address for distance calculation
    let customerAddress = "Paris, France"; // Fallback

    // Logic: Use stored Shipping Address ID if available
    let addressObj = null;

    if (order.shippingAddressId) {
      // Fetch the specific address from the user's list (already included? No, need to find it)
      // Actually 'order.user.addresses' has all addresses.
      if (order.user && order.user.addresses) {
        addressObj = order.user.addresses.find(a => a.id === order.shippingAddressId);
      }
    }

    // Fallback if no specific ID or not found
    if (!addressObj && order.user && order.user.addresses && order.user.addresses.length > 0) {
      addressObj = order.user.addresses.find(a => a.is_default_shipping) || order.user.addresses[0];
    }

    if (addressObj) {
      // Use FULL address for accurate geocoding, filtering out missing parts
      // Added postal_code for better precision (critical for finding specific streets in communes)
      customerAddress = [addressObj.address_line1, addressObj.postal_code, addressObj.city, addressObj.country]
        .filter(part => part && part.trim() !== "")
        .join(", ");
      console.log("Using Address:", customerAddress);
    } else {
      console.log("No user address found, using fallback:", customerAddress);
    }
    // Fetch all warehouses
    const warehouses = await db.warehouse.findAll({
      include: [
        { model: db.inventory, as: "inventory" }
      ]
    });
    console.log("Warehouses found:", warehouses.length);

    // 1. Get Route Data for every warehouse (Distance & Duration)
    console.log("Calculating routes...");
    const warehouseRoutes = await Promise.all(warehouses.map(async (wh) => {
      const destination = `${wh.city}, ${wh.country}`;
      const routeData = await getRouteData(customerAddress, destination);
      return {
        warehouse: wh,
        route: routeData
      };
    }));
    console.log("Routes calculated.");

    // Sort warehouses by duration (fastest delivery first) or distance
    // Let's optimize for Speed (duration)
    warehouseRoutes.sort((a, b) => a.route.durationValue - b.route.durationValue);

    // Prepare response object
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

    // --- PREP TIME LOGIC ---
    let prepHours = 2; // Default
    if (totalQuantity >= 5 && totalQuantity <= 10) prepHours = 4;
    if (totalQuantity > 10) prepHours = 8;

    const createdAt = new Date(order.createdAt);

    // --- STATUS LOGIC ---
    // 1. Determine Prep Start Time (8am rule)
    const prepStartTime = getPrepStartTime(createdAt);

    // 2. Departure Time (Global Helper)
    const departureTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

    // Status Logic
    let currentStatus = "Pending";

    // Determine Status
    // Assume 2 minutes travel default to check Delivered/Completed state *before* we iterate routes
    // (Actual delivery plan response will refine this with real route durations if available)

    // DEMO MODE: Fast calculation
    const travelDurationSec = 120; // 2 minutes
    const arrivalTimeCheck = new Date(departureTime.getTime() + (travelDurationSec * 1000));
    const completionTime = new Date(arrivalTimeCheck.getTime() + (5 * 60 * 1000));

    if (currentTime >= completionTime) currentStatus = "Completed";
    else if (currentTime >= arrivalTimeCheck) currentStatus = "Delivered";
    else if (currentTime >= departureTime) currentStatus = "En Route";
    else if (currentTime >= prepStartTime) currentStatus = "Preparing";

    console.log("--- DEBUG STATUS CALC ---");
    const safeISO = (d) => { try { return d.toISOString(); } catch (e) { return "INVALID DATE"; } };
    console.log("Order CreatedAt RAW:", order.createdAt);
    console.log("Now (CurrentTime):", safeISO(currentTime));
    console.log("CreatedAt:", safeISO(createdAt));
    console.log("PrepStart:", safeISO(prepStartTime));
    console.log("Departure:", safeISO(departureTime));
    console.log("ArrivalCheck:", safeISO(arrivalTimeCheck));
    console.log("Calculated Status:", currentStatus);
    console.log("-----------------------");

    // Note: We check 'Delivered' later after calculating route duration

    // 2 & 3. Allocation Logic
    for (const entry of warehouseRoutes) {
      const wh = entry.warehouse;
      const route = entry.route;

      // Calculate ETA for this specific leg
      const eta = calculateETA(route.durationValue);

      const allocation = {
        warehouseId: wh.id,
        warehouseName: wh.name,
        warehouseCity: wh.city,
        destinationAddress: customerAddress, // Send full address to frontend
        distanceText: route.distanceText,
        durationText: route.durationText,
        eta: eta,
        // Google Maps Embed URL (Directions)
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
          const qtyToTake = Math.min(qtyNeeded, qtyAvailable);

          allocation.items.push({
            productId: productId,
            quantity: qtyToTake
          });

          remainingItems[productId] -= qtyToTake;

          await db.inventory.update(
            { quantity_available: qtyAvailable - qtyToTake },
            { where: { id: inventoryItem.id } }
          );

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
    // Ensure arrivalTime is passed (calculated earlier as arrivalTimeCheck or arrivalTime)
    deliveryPlan.arrivalTime = arrivalTimeCheck;

    // Override status based on time-simulation logic
    // We force the status unless the order is completely cancelled.
    // This ensures that "En Route" resets to "Pending" if the time logic dictates it.
    if (deliveryPlan.status !== "cancelled") {
      deliveryPlan.status = currentStatus;
    }

    res.send(deliveryPlan);

  } catch (error) {
    console.error("Delivery processing error:", error);
    res.status(500).send({ message: error.message });
  }
};
