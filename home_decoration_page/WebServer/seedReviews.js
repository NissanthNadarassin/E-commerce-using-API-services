const db = require("./app/models");
const Review = db.review;
const Product = db.products;
const User = db.user;

const seedReviews = async () => {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log("Connection to the database has been established successfully.");

    // Get some products and users
    const products = await Product.findAll({ limit: 10 });
    const users = await User.findAll({ 
      where: { 
        username: { [db.Sequelize.Op.ne]: 'admin' } 
      },
      limit: 5 
    });

    if (products.length === 0) {
      console.log("No products found. Please add products first.");
      process.exit(0);
    }

    if (users.length === 0) {
      console.log("No users found. Please create users first.");
      process.exit(0);
    }

    console.log(`Found ${products.length} products and ${users.length} users`);

    // Sample reviews data
    const reviewsData = [
      {
        rating: 5,
        comment: "Absolutely love this product! The quality is outstanding and it looks even better in person. Highly recommend!",
      },
      {
        rating: 5,
        comment: "Perfect! Exactly what I was looking for. Fast delivery and great customer service.",
      },
      {
        rating: 4,
        comment: "Very good quality and design. Just a tiny bit smaller than I expected, but still very satisfied with the purchase.",
      },
      {
        rating: 5,
        comment: "Best purchase I've made this year! The craftsmanship is excellent and it fits perfectly in my home.",
      },
      {
        rating: 4,
        comment: "Great product overall. The material feels premium and durable. Would buy again!",
      },
      {
        rating: 5,
        comment: "Exceeded my expectations! Beautiful design and very functional. Worth every penny.",
      },
      {
        rating: 3,
        comment: "It's okay. Does the job but nothing special. The price is a bit high for what you get.",
      },
      {
        rating: 4,
        comment: "Really nice! Easy to assemble and looks great. Just wish it came in more color options.",
      },
      {
        rating: 5,
        comment: "Amazing quality! My friends keep asking where I got it from. Will definitely shop here again.",
      },
      {
        rating: 4,
        comment: "Good value for money. Solid construction and stylish design. Happy with my purchase.",
      },
      {
        rating: 5,
        comment: "This is exactly what I needed! Perfect size, perfect quality. Thank you!",
      },
      {
        rating: 3,
        comment: "Average product. It works fine but I expected better quality based on the description.",
      },
      {
        rating: 4,
        comment: "Very pleased with this purchase. Looks elegant and is very practical. Recommended!",
      },
      {
        rating: 5,
        comment: "Fantastic! The attention to detail is impressive. This really completes my room decor.",
      },
      {
        rating: 4,
        comment: "Nice product. Good quality materials and well-made. Delivery was quick too.",
      },
      {
        rating: 5,
        comment: "Love it! Stylish and functional. My family loves it too. Great addition to our home.",
      },
      {
        rating: 2,
        comment: "Not as described. The color is different from the picture and quality is below average.",
      },
      {
        rating: 4,
        comment: "Pretty good! Matches my furniture perfectly and seems very durable. Happy customer!",
      },
      {
        rating: 5,
        comment: "Brilliant! Can't fault it. Beautiful design, excellent quality, fast shipping. 10/10",
      },
      {
        rating: 3,
        comment: "It's alright. Serves its purpose but nothing to write home about. Could be better.",
      },
    ];

    // Clear existing reviews
    await Review.destroy({ where: {} });
    console.log("Existing reviews cleared from the database.");

    // Create reviews - distribute randomly across products and users
    let reviewCount = 0;
    const usedCombinations = new Set(); // Track user-product combinations
    
    for (const product of products) {
      // Each product gets 2-4 random reviews
      const numReviews = Math.min(Math.floor(Math.random() * 3) + 2, users.length);
      const usersForThisProduct = [...users]; // Clone array
      
      for (let i = 0; i < numReviews && usersForThisProduct.length > 0; i++) {
        // Pick and remove a random user to avoid duplicates for same product
        const userIndex = Math.floor(Math.random() * usersForThisProduct.length);
        const selectedUser = usersForThisProduct.splice(userIndex, 1)[0];
        const randomReview = reviewsData[Math.floor(Math.random() * reviewsData.length)];
        
        const comboKey = `${selectedUser.id}-${product.id}`;
        if (!usedCombinations.has(comboKey)) {
          await Review.create({
            productId: product.id,
            userId: selectedUser.id,
            rating: randomReview.rating,
            comment: randomReview.comment,
          });
          
          usedCombinations.add(comboKey);
          reviewCount++;
        }
      }
    }

    console.log(`${reviewCount} reviews have been added to the database!`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  }
};

seedReviews();
