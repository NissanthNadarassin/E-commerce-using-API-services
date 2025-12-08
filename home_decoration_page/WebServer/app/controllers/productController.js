const db = require("../models");
const Product = db.products;
const Review = db.review;
const User = db.user;
const Inventory = db.inventory;
const Op = db.Sequelize.Op;

// Create and Save a new Product
exports.create = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log("Received product data:", JSON.stringify(req.body, null, 2));
    
    // Validate request
    if (!req.body.product_name || !req.body.price) {
      await transaction.rollback();
      return res.status(400).json({ message: "Product name and price are required!" });
    }

    // Create a Product
    const product = {
      product_name: req.body.product_name,
      description: req.body.description,
      img: req.body.img,
      price: req.body.price,
      category: req.body.category,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      sku: req.body.sku,
    };

    // Save Product in the database
    const data = await Product.create(product, { transaction });
    console.log("Product created with ID:", data.id);
    
    // Create inventory records for multiple warehouses
    const distributions = req.body.distributions || [];
    console.log("Distributions to process:", distributions);
    
    if (distributions.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "At least one warehouse distribution is required!" });
    }
    
    // Create inventory record for each warehouse distribution
    for (const dist of distributions) {
      if (dist.quantity > 0) {
        await Inventory.create({
          productId: data.id,
          warehouseId: dist.warehouseId,
          quantity_available: dist.quantity
        }, { transaction });
        console.log(`Added ${dist.quantity} units to warehouse ${dist.warehouseId}`);
      }
    }
    
    console.log("Committing transaction...");
    await transaction.commit();
    console.log("Transaction committed successfully");
    res.status(201).json(data);
  } catch (err) {
    console.error("ERROR in product creation:", err);
    console.error("Error stack:", err.stack);
    await transaction.rollback();
    res.status(500).json({ message: err.message || "Error occurred while creating the Product." });
  }
};

// Retrieve all Products from the database with reviews (optimized)
exports.findAll = async (req, res) => {
  try {
    const title = req.query.title;
    const condition = title ? { product_name: { [Op.like]: `%${title}%` } } : null;

    const products = await Product.findAll({ 
      where: condition,
      include: [
        {
          model: Review,
          as: "reviews",
          attributes: ["rating"], // Only fetch rating, not full review details
          required: false
        },
        {
          model: Inventory,
          as: "inventory",
          attributes: ["quantity_available", "warehouseId"],
          required: false
        }
      ],
      attributes: ["id", "product_name", "description", "img", "price", "category", "isActive", "sku"]
    });

    // Calculate average rating and sum inventory from all warehouses for each product
    const productsWithRatings = products.map(product => {
      const productJson = product.toJSON();
      const reviews = productJson.reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      // Sum quantity from all warehouses
      const inventoryArray = productJson.inventory || [];
      const totalQuantity = inventoryArray.reduce((sum, inv) => sum + (inv.quantity_available || 0), 0);
      
      return {
        ...productJson,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        quantity_available: totalQuantity,
        reviews: undefined, // Remove reviews array from response
        inventory: undefined // Remove inventory object from response
      };
    });

    res.status(200).json(productsWithRatings);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error occurred while retrieving Products." });
  }
};

// Find a single Product with an ID including reviews
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findByPk(id, {
      include: [{
        model: Review,
        as: "reviews",
        attributes: ["id", "rating", "comment", "createdAt"],
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "username"]
        }],
        order: [["createdAt", "DESC"]]
      }]
    });

    if (!product) {
      return res.status(404).json({ message: `Product with ID ${id} not found.` });
    }

    // Calculate average rating
    const productJson = product.toJSON();
    const reviews = productJson.reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const productWithRating = {
      ...productJson,
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length
    };

    res.status(200).json(productWithRating);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error occurred while retrieving the Product." });
  }
};

// Update a Product by the ID in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Product.update(req.body, { where: { id } });

    if (updated === 0) {
      return res.status(404).json({ message: `Product with ID ${id} not found or no changes made.` });
    }

    res.status(200).json({ message: "Product updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error occurred while updating the Product." });
  }
};

// Delete a Product with the specified ID in the request
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Attempting to delete product with ID: ${id}`);
    
    const deleted = await Product.destroy({ where: { id } });
    console.log(`Delete result: ${deleted} rows deleted`);

    if (deleted === 0) {
      return res.status(404).json({ message: `Product with ID ${id} not found.` });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: err.message || "Error occurred while deleting the Product." });
  }
};

// Delete all Products from the database
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: {}, truncate: true });

    if (deleted === 0) {
      return res.status(404).json({ message: "No Products found to delete." });
    }

    res.status(200).json({ message: "All Products deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error occurred while deleting all Products." });
  }
};

// Find Products by title
exports.findByTitle = async (req, res) => {
  try {
    const title = req.params.title;
    const data = await Product.findAll({
      where: { product_name: { [Op.like]: `%${title}%` } },
    });

    if (data.length === 0) {
      return res.status(404).json({ message: `No Products found with title "${title}".` });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error occurred while searching for Products by title." });
  }
};

// Submit a new rating (temporarily disabled - ratings field removed from schema)
// exports.addRating = async (req, res) => {
//   try {
//     const product = await Product.findByPk(req.params.id);
//     if (!product) {
//       return res.status(404).send({ message: "Product not found" });
//     }
//     // Rating functionality needs to be reimplemented with new schema
//     res.status(501).send({ message: "Rating feature not implemented yet" });
//   } catch (err) {
//     res.status(500).send({ message: err.message });
//   }
// };
