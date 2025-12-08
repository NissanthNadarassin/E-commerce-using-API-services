const db = require("../models");
const Warehouse = db.warehouse;
const Inventory = db.inventory;

// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      order: [["id", "ASC"]]
    });
    res.status(200).json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get warehouse by ID
exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found." });
    }
    res.status(200).json(warehouse);
  } catch (error) {
    console.error("Error fetching warehouse:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Create new warehouse
exports.createWarehouse = async (req, res) => {
  try {
    const { name, address_line1, address_line2, city, postal_code, country, phone } = req.body;

    // Validate required fields
    if (!name || !address_line1 || !city || !postal_code || !country || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create warehouse
    const warehouse = await Warehouse.create({
      name,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone
    });

    res.status(201).json({
      message: "Warehouse created successfully!",
      warehouse
    });
  } catch (error) {
    console.error("Error creating warehouse:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const warehouseId = req.params.id;
    const { name, address_line1, address_line2, city, postal_code, country, phone } = req.body;

    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    // Update warehouse
    await warehouse.update({
      name,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone
    });

    res.status(200).json({
      message: "Warehouse updated successfully!",
      warehouse
    });
  } catch (error) {
    console.error("Error updating warehouse:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete warehouse
exports.deleteWarehouse = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const warehouseId = req.params.id;

    const warehouse = await Warehouse.findByPk(warehouseId, { transaction });
    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({ message: "Warehouse not found" });
    }

    // Delete all inventory records for this warehouse
    // The CASCADE on foreign key will handle this automatically
    await Inventory.destroy({
      where: { warehouseId },
      transaction
    });

    // Delete warehouse
    await warehouse.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Warehouse and associated inventory deleted successfully!"
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting warehouse:", error.message);
    res.status(500).json({ message: error.message });
  }
};
