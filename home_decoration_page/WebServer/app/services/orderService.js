const db = require("../models");
const Order = db.order;
const OrderItem = db.orderItem;
const Product = db.products;
const User = db.user;
const Inventory = db.inventory;
const Warehouse = db.warehouse;
const axios = require("axios");

// TOGGLE THIS FOR TIMING MODE
const USE_DEMO_TIMINGS = true;

// --- TIME HELPERS ---
const getPrepStartTime = (startDate) => {
    let current = new Date(startDate);

    // DEMO MODE: Start immediately, ignore business hours
    if (USE_DEMO_TIMINGS) {
        return current;
    }

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
    if (!USE_DEMO_TIMINGS && current < prepStartTime) current = new Date(prepStartTime);

    if (USE_DEMO_TIMINGS) {
        const msToAdd = hoursToAdd * 60 * 60 * 1000;
        return new Date(current.getTime() + msToAdd);
    }

    // DEMO SIMULATION: If hoursToAdd is small, just add it directly.
    if (hoursToAdd < 1) {
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

// --- HELPER: Random Generator ---
const seededRandom = (seed) => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;

    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
};

/*
 * ROUTING HELPER
 */
const getRouteData = async (origin, destination, orderIdHash) => {
    if (USE_DEMO_TIMINGS) {
        const mockDistKm = 5;
        return {
            distanceValue: mockDistKm * 1000,
            distanceText: `${mockDistKm} km`,
            durationValue: 30, // 30 seconds FIXED
            durationText: "30 secs"
        };
    }

    const rng = seededRandom(orderIdHash || Date.now());
    try {
        const minDur = 2400; // 40 mins
        const maxDur = 4500; // 75 mins

        const durationSeconds = Math.floor(minDur + (rng() * (maxDur - minDur)));
        const speedKmh = 50 + (rng() * 30);
        const distKm = (durationSeconds / 3600) * speedKmh;

        const h = Math.floor(durationSeconds / 3600);
        const m = Math.floor((durationSeconds % 3600) / 60);
        const durText = h > 0 ? `${h}h ${m}m` : `${m} mins`;

        return {
            distanceValue: Math.floor(distKm * 1000),
            distanceText: `${distKm.toFixed(1)} km`,
            durationValue: durationSeconds,
            durationText: durText
        };

    } catch (error) {
        console.warn("Routing error, fallback:", error);
        return {
            distanceValue: 50000,
            distanceText: "50 km",
            durationValue: 3600,
            durationText: "1 hour"
        };
    }
};

// --- HELPER: Dynamic Status Calculation ---
const calculateDynamicStatus = (order) => {
    if (order.status === "cancelled" || order.status === "returned") return order.status;

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
        prepHours = 0.00833; // 30 seconds (30/3600)
    } else {
        prepHours = 2; // 2 hours default
        if (totalItems > 5 && totalItems <= 10) prepHours = 3;
        if (totalItems > 10) prepHours = 4;
    }

    // 2. Prep Start Time
    const prepStartTime = getPrepStartTime(createdAt);

    // 3. Departure Time
    const departureTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

    // 4. Arrival Time 
    const travelDurationSec = USE_DEMO_TIMINGS ? 30 : (45 * 60);
    const arrivalTime = new Date(departureTime.getTime() + (travelDurationSec * 1000));

    // 5. Completion Time 
    const completionBufferMin = USE_DEMO_TIMINGS ? 0.1 : 60; // 6 seconds after arrival
    const completionTime = new Date(arrivalTime.getTime() + (completionBufferMin * 60 * 1000));

    // Determine Status
    if (now >= completionTime) return "Completed";
    if (now >= arrivalTime) return "Delivered";
    if (now >= departureTime) return "En Route";
    if (now >= prepStartTime) return "Preparing";

    return "Pending";
};


// --- EXPORTED SERVICE METHODS ---

exports.createOrder = async (userId, items, shippingAddressId) => {
    // DEBUG LOG
    console.log(`[OrderService] Creating Order. DemoMode: ${USE_DEMO_TIMINGS}, Time: ${new Date().toISOString()}`);

    const transaction = await db.sequelize.transaction();
    try {
        if (!items || items.length === 0) {
            throw new Error("Order must contain at least one item.");
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction });
            if (!product) {
                await transaction.rollback();
                throw new Error(`Product with ID ${item.productId} not found.`);
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
            });
        }

        const order = await Order.create({
            userId,
            total_amount: totalAmount,
            status: "pending",
            shippingAddressId: shippingAddressId || null
        }, { transaction });

        const itemsWithOrderId = orderItems.map(item => ({
            ...item,
            orderId: order.id,
        }));

        await OrderItem.bulkCreate(itemsWithOrderId, { transaction });
        await transaction.commit();

        return order;
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};

exports.cancelOrder = async (orderId, userId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const order = await Order.findOne({
            where: { id: orderId, userId },
            include: [{
                model: OrderItem,
                as: "items"
            }],
            transaction
        });

        if (!order) {
            await transaction.rollback();
            throw new Error("Order not found or access denied.");
        }

        const currentStatus = calculateDynamicStatus(order);
        const allowedCancelStatuses = ["pending", "preparing", "processing", "Pending", "Preparing"];

        // Check both DB status and Dynamic status
        const dbStatusLower = order.status.toLowerCase();
        if (dbStatusLower === "cancelled") {
            await transaction.rollback();
            throw new Error("Order is already cancelled.");
        }

        // We use the dynamic status to prevent cancelling if it's already "En Route" virtually
        // STRICT CHECK: If dynamic status is advanced, BLOCK IT.
        if (!allowedCancelStatuses.includes(currentStatus)) {
            await transaction.rollback();
            throw new Error(`Cannot cancel order with status '${currentStatus}'. It is too late.`);
        }

        // Restore inventory
        for (const item of order.items) {
            const inventory = await Inventory.findOne({
                where: { productId: item.productId },
                order: [['quantity_available', 'DESC']],
                transaction
            });

            if (inventory) {
                inventory.quantity_available += item.quantity;
                await inventory.save({ transaction });
            }
        }

        order.status = "cancelled";
        await order.save({ transaction });
        await transaction.commit();
        return order;

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};

exports.returnOrder = async (orderId, userId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const order = await Order.findOne({
            where: { id: orderId, userId },
            transaction
        });

        if (!order) {
            await transaction.rollback();
            throw new Error("Order not found.");
        }

        const currentStatus = calculateDynamicStatus(order);

        // Allow return only if Delivered or Completed
        if (currentStatus !== "Delivered" && currentStatus !== "Completed") {
            await transaction.rollback();
            throw new Error("Order must be Delivered or Completed to be returned.");
        }

        order.status = "returned";
        await order.save({ transaction });
        await transaction.commit();
        return order;

    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};

// Helper: Calculate ETA (Business Days Only - Mon-Fri)
const calculateETA = (durationSeconds) => {
    const now = new Date();
    let arrivalDate = new Date(now.getTime() + (durationSeconds * 1000) + (2 * 60 * 60 * 1000));

    const moveFocusToBusinessHours = (date) => {
        const day = date.getDay();
        const hour = date.getHours();

        if (day === 0) { // Sunday
            date.setDate(date.getDate() + 1);
            date.setHours(8, 0, 0, 0);
            return date;
        }
        if (day === 6) { // Saturday
            date.setDate(date.getDate() + 2);
            date.setHours(8, 0, 0, 0);
            return date;
        }
        if (hour >= 16) {
            date.setDate(date.getDate() + 1);
            date.setHours(8, 0, 0, 0);
            return moveFocusToBusinessHours(date);
        }
        if (hour < 8) {
            date.setHours(8, 0, 0, 0);
        }
        return date;
    };

    arrivalDate = moveFocusToBusinessHours(arrivalDate);
    return arrivalDate.toISOString();
};

exports.getDeliveryInfo = async (orderId) => {
    const currentTime = new Date();
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

    if (!order) return null;

    // Trigger state update from Pending -> Processing if applicable (Side Effect replication)
    if (order.status === "pending") {
        order.status = "processing";
        await order.save();
    }

    // --- ADDRESS LOGIC ---
    let customerAddress = "Paris, France";
    let addressObj = null;

    if (order.shippingAddressId) {
        if (order.user && order.user.addresses) {
            addressObj = order.user.addresses.find(a => a.id === order.shippingAddressId);
        }
    }
    if (!addressObj && order.user && order.user.addresses && order.user.addresses.length > 0) {
        addressObj = order.user.addresses.find(a => a.is_default_shipping) || order.user.addresses[0];
    }

    let destinationLabel = "Delivery Location";
    if (addressObj) {
        customerAddress = [addressObj.address_line1, addressObj.postal_code, addressObj.city, addressObj.country]
            .filter(part => part && part.trim() !== "")
            .join(", ");

        if (addressObj.label) {
            destinationLabel = addressObj.label;
        }
    }

    // --- WAREHOUSE LOGIC ---
    const warehouses = await Warehouse.findAll({
        include: [{ model: Inventory, as: "inventory" }]
    });

    const orderIdHash = parseInt(String(orderId).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0), 10);

    // 1. Calculate Route from Each Warehouse -> Customer
    const warehouseRoutes = await Promise.all(warehouses.map(async (wh) => {
        const destination = `${wh.city}, ${wh.country}`;
        const routeData = await getRouteData(customerAddress, destination, orderIdHash + wh.id);
        return { warehouse: wh, route: routeData };
    }));

    // Sort by duration (Fastest is Hub Candidate)
    warehouseRoutes.sort((a, b) => a.route.durationValue - b.route.durationValue);

    // Identify HUB (Nearest Warehouse WITH STOCK)
    let hub = null;
    const warehouseHasStock = (wh, orderItems) => {
        return orderItems.some(item => {
            const inv = wh.inventory.find(i => i.productId === item.productId);
            return inv && inv.quantity_available > 0;
        });
    };

    for (const route of warehouseRoutes) {
        if (warehouseHasStock(route.warehouse, order.items)) {
            hub = route;
            break;
        }
    }

    if (!hub) {
        console.warn("No warehouse found with stock for Hub selection. Defaulting to nearest.");
        if (warehouseRoutes.length > 0) {
            hub = warehouseRoutes[0];
        } else {
            console.error("No warehouses available to route from!");
            // Fallback to a mock hub to prevent crash if absolutely necessary, or just return null/throw
            // Returning null will result in "delivery: null" in GraphQL which is handled by frontend throw
            return null;
        }
    }

    // --- ALLOCATION LOGIC ---
    // Note: We are calculating the plan but NOT modifying inventory in this GET request (unlike the legacy controller)
    // to keep it side-effect free for repeated viewing.

    const deliveryPlan = {
        orderId: order.id,
        status: "Processing",
        allocations: [],
        consolidation: {
            isConsolidating: false,
            hub: {
                name: hub.warehouse.name,
                city: hub.warehouse.city,
                address: hub.warehouse.address_line1,
                postalCode: hub.warehouse.postal_code,
                country: hub.warehouse.country
            },
            transfers: [],
            hubReadyTime: null
        },
        timeline: []
    };

    let remainingItems = {};
    let totalQuantity = 0;
    order.items.forEach(item => {
        remainingItems[item.productId] = item.quantity;
        totalQuantity += item.quantity;
    });

    let maxTransferSeconds = 0;

    for (const entry of warehouseRoutes) {
        const wh = entry.warehouse;
        const productIdsNeeded = Object.keys(remainingItems);
        let warehouseUsed = false;
        const allocationItems = [];

        for (const productId of productIdsNeeded) {
            if (remainingItems[productId] <= 0) continue;

            const inventoryItem = wh.inventory.find(inv => inv.productId == productId);

            // For viewing, we assume unlimited stock availability logic or current snapshot
            if (inventoryItem && inventoryItem.quantity_available > 0) {
                const qtyNeeded = remainingItems[productId];
                const qtyAvailable = inventoryItem.quantity_available;
                const qtyToTake = Math.min(qtyNeeded, qtyAvailable);

                allocationItems.push({
                    productId: parseInt(productId),
                    quantity: qtyToTake
                });

                remainingItems[productId] -= qtyToTake;
                warehouseUsed = true;
            }
        }

        if (warehouseUsed) {
            if (wh.id === hub.warehouse.id) {
                // Hub items - implicit
            } else {
                // Transfer needed
                deliveryPlan.consolidation.isConsolidating = true;

                // Transfer Route
                const transferRoute = await getRouteData(`${hub.warehouse.city}, ${hub.warehouse.country}`, `${wh.city}, ${wh.country}`, orderIdHash + wh.id + 999);

                if (transferRoute.durationValue > maxTransferSeconds) {
                    maxTransferSeconds = transferRoute.durationValue;
                }

                deliveryPlan.consolidation.transfers.push({
                    fromWarehouse: wh.name,
                    fromCity: wh.city,
                    toHub: hub.warehouse.city,
                    items: allocationItems,
                    durationText: transferRoute.durationText,
                    durationValue: transferRoute.durationValue,
                    status: "In Transit"
                });
            }
        }

        const allFulfilled = Object.values(remainingItems).every(q => q === 0);
        if (allFulfilled) break;
    }

    // --- TIMING & STATUS LOGIC ---
    let prepHours;
    if (USE_DEMO_TIMINGS) {
        prepHours = 0.0166; // 1 minute
    } else {
        prepHours = 2;
        if (totalQuantity > 5) prepHours = 3;
    }

    const createdAt = new Date(order.createdAt);
    const prepStartTime = getPrepStartTime(createdAt);
    const orderPrepFinishTime = addWarehouseHours(createdAt, prepHours, prepStartTime);

    // Hub Ready Time
    const hubReadyTime = new Date(orderPrepFinishTime.getTime() + (maxTransferSeconds * 1000));
    deliveryPlan.consolidation.hubReadyTime = hubReadyTime.toISOString();

    const finalDepartureTime = hubReadyTime;
    const finalLegDuration = hub.route.durationValue;
    const arrivalTime = new Date(finalDepartureTime.getTime() + (finalLegDuration * 1000));

    const completionBufferMin = USE_DEMO_TIMINGS ? 1 : 60;
    const completionTime = new Date(arrivalTime.getTime() + (completionBufferMin * 60 * 1000));

    // Calculate status 
    let currentStatus = "Pending";
    if (currentTime >= completionTime) currentStatus = "Completed";
    else if (currentTime >= arrivalTime) currentStatus = "Delivered";
    else if (currentTime >= finalDepartureTime) currentStatus = "En Route";
    else if (currentTime >= prepStartTime) currentStatus = "Preparing";

    // Override if cancelled/returned
    if (order.status === "cancelled" || order.status === "returned") {
        currentStatus = order.status;
    }

    deliveryPlan.status = currentStatus;

    // --- TIMELINE GENERATION ---
    const timeline = [];

    // Event 1: Order Placed
    timeline.push({
        status: "Order Placed",
        description: "Order received and confirmed.",
        time: createdAt.toISOString(),
        isCompleted: true
    });

    // Event 2: Pending at Warehouse
    const isPendingDone = (currentTime >= finalDepartureTime);
    timeline.push({
        status: `Pending at ${hub.warehouse.city} Warehouse`,
        description: isPendingDone ? "Package processed and ready for departure." : "Processing order and consolidating items.",
        time: prepStartTime.toISOString(),
        isCompleted: isPendingDone
    });

    // Event 3: En Route
    const isEnRouteDone = (currentTime >= arrivalTime);
    if (currentTime >= finalDepartureTime) {
        timeline.push({
            status: "En Route",
            description: "On the way to " + destinationLabel,
            time: finalDepartureTime.toISOString(),
            isCompleted: isEnRouteDone
        });
    } else {
        timeline.push({
            status: "En Route",
            description: "Scheduled departure",
            time: finalDepartureTime.toISOString(),
            isCompleted: false
        });
    }

    // Event 4: Delivered
    if (currentTime >= arrivalTime) {
        timeline.push({
            status: "Delivered",
            description: "Package delivered to " + destinationLabel,
            time: arrivalTime.toISOString(),
            isCompleted: true
        });
    } else {
        timeline.push({
            status: "Delivered",
            description: "Estimated Arrival",
            time: arrivalTime.toISOString(),
            isCompleted: false
        });
    }

    deliveryPlan.timeline = timeline;

    // Main Allocation for View
    const mainAllocation = {
        warehouseCity: hub.warehouse.city,
        warehouseCountry: hub.warehouse.country,
        warehouseAddressLine1: hub.warehouse.address_line1,
        warehousePostalCode: hub.warehouse.postal_code,
        destinationLabel: destinationLabel,
        destinationAddress: customerAddress,
        eta: arrivalTime.toISOString(),
        durationText: hub.route.durationText,
        durationValue: hub.route.durationValue,
        items: order.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    };
    deliveryPlan.allocations.push(mainAllocation);

    // Compatibility fields
    deliveryPlan.origin = `${hub.warehouse.city}, ${hub.warehouse.country}`;
    deliveryPlan.destination = customerAddress;
    deliveryPlan.distanceText = hub.route.distanceText;
    deliveryPlan.durationText = hub.route.durationText;
    deliveryPlan.estimatedArrival = arrivalTime.toISOString();
    deliveryPlan.windowStart = arrivalTime.toISOString();
    deliveryPlan.windowEnd = new Date(arrivalTime.getTime() + (30 * 60 * 1000)).toISOString();
    deliveryPlan.departureTime = finalDepartureTime.toISOString(); // Used for truck start time

    return deliveryPlan;
};

exports.calculateDynamicStatus = calculateDynamicStatus;
