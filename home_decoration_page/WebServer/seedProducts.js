const db = require("./app/models");

const products = [
  // Beds
  {
    product_name: "Classic Bed",
    description: "A comfortable and stylish wooden bed for your home.",
    img: "../imgs/product_images/bed1_product.avif",
    price: 200,
    category: "Beds",
    isActive: true,
    sku: "BED-001",
  },
  {
    product_name: "Modern Bed",
    description: "A sleek, modern design bed.",
    img: "../imgs/product_images/bed2_product.avif",
    price: 300,
    category: "Beds",
    isActive: true,
    sku: "BED-002",
  },

  // Furniture
  {
    product_name: "Modern Couch",
    description: "A stylish Couch for your home or workspace.",
    img: "../imgs/product_images/Furniture1_product.avif",
    price: 50,
    category: "Furniture",
    isActive: true,
    sku: "FUR-001",
  },
  {
    product_name: "Wooden Chair",
    description: "A durable wooden chair for your home or office.",
    img: "../imgs/product_images/Furniture2_product.avif",
    price: 150,
    category: "Furniture",
    isActive: true,
    sku: "FUR-002",
  },

  // Decoration
  {
    product_name: "Modern Vase",
    description: "Beautiful Vase to enhance your home decor.",
    img: "../imgs/product_images/Decoration1_product.avif",
    price: 100,
    category: "Decoration",
    isActive: true,
    sku: "DEC-001",
  },
  {
    product_name: "Elegant Vase",
    description: "Elegant vase for flowers and home decoration.",
    img: "../imgs/product_images/Decoration2_product.avif",
    price: 70,
    category: "Decoration",
    isActive: true,
    sku: "DEC-002",
  },

  // Storage
  {
    product_name: "Shelf",
    description: "A multi-purpose shelf for storage and display.",
    img: "../imgs/product_images/Storage1_product.avif",
    price: 40,
    category: "Storage",
    isActive: true,
    sku: "STO-001",
  },
  {
    product_name: "Storage Box",
    description: "A large storage box to organize your belongings.",
    img: "../imgs/product_images/Storage2_product.avif",
    price: 120,
    category: "Storage",
    isActive: true,
    sku: "STO-002",
  },
];

const seedProducts = async () => {
  try {
    // Ensure database connection
    await db.sequelize.authenticate();
    console.log("Connection to the database has been established successfully.");

    // Clear existing products (use DELETE instead of TRUNCATE to avoid FK constraints)
    await db.products.destroy({ where: {} });
    console.log("Existing products cleared from the database.");

    // Add fields required by the current Products schema: sku, isActive
    const productsToInsert = products.map((p, index) => ({
      ...p,
      isActive: true,
      sku: `SKU-${index + 1}`, // simple SKU generation
    }));

    // Seed new products
    await db.products.bulkCreate(productsToInsert);
    console.log("New products have been added to the database!");

    process.exit(0); // Exit the process successfully
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1); // Exit the process with an error
  }
};

seedProducts();
