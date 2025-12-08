const db = require("../models");
const Order = db.order;
const OrderItem = db.orderItem;
const Product = db.products;
const User = db.user;
const Inventory = db.inventory;

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

    res.status(200).send(orders);
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

    res.status(200).send(order);
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

    res.status(200).send(orders);
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
