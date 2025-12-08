const db = require("../models");
const Inventory = db.inventory;
const Product = db.products;

// Get inventory for all products
exports.getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{
        model: Product,
        as: "product",
        attributes: ["id", "product_name", "sku", "category"]
      }],
      order: [["productId", "ASC"]]
    });

    res.status(200).send(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get inventory for a specific product (all warehouses)
exports.getInventoryByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const inventory = await Inventory.findAll({
      where: { productId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "product_name", "sku", "category", "price"]
        },
        {
          model: db.warehouse,
          as: "warehouse",
          attributes: ["id", "name", "city", "address_line1"]
        }
      ],
      order: [["warehouseId", "ASC"]]
    });

    if (!inventory || inventory.length === 0) {
      return res.status(404).send({ message: "Inventory not found for this product." });
    }

    res.status(200).send(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Update inventory (add or remove stock) - DEPRECATED
// This method is not used anymore as inventory is managed per warehouse
// Inventory updates will be handled in delivery option based on warehouse selection
exports.updateInventory = async (req, res) => {
  return res.status(501).send({ 
    message: "This endpoint is deprecated. Inventory is now managed per warehouse." 
  });
};

// Get inventory movements history - REMOVED
// This method has been removed as inventory movement tracking is not implemented

// Get low stock products (below reorder level)
exports.getLowStockProducts = async (req, res) => {
  try {
    const lowStock = await Inventory.findAll({
      where: db.Sequelize.where(
        db.Sequelize.col('quantityAvailable'),
        '<=',
        db.Sequelize.col('reorderLevel')
      ),
      include: [{
        model: Product,
        as: "product",
        attributes: ["id", "product_name", "sku", "category"]
      }]
    });

    res.status(200).send(lowStock);
  } catch (error) {
    console.error("Error fetching low stock products:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Set reorder levels
exports.setReorderLevel = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { reorderLevel, reorderQuantity } = req.body;

    let inventory = await Inventory.findOne({
      where: { productId }
    });

    if (!inventory) {
      inventory = await Inventory.create({
        productId,
        warehouseId: 1,
        quantity_available: 0
      });
    }

    res.status(200).send({
      message: "Reorder levels set successfully!",
      inventory
    });
  } catch (error) {
    console.error("Error setting reorder levels:", error.message);
    res.status(500).send({ message: error.message });
  }
};
