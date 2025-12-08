const db = require("../models");
const Review = db.review;
const Product = db.products;
const User = db.user;

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId;

    const reviews = await Review.findAll({
      where: { productId },
      include: [{
        model: User,
        as: "user",
        attributes: ["id", "username"]
      }],
      order: [["createdAt", "DESC"]]
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.status(200).send({
      reviews,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Add a review (authenticated users only)
exports.addReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.userId; // From JWT
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).send({ message: "Rating must be between 1 and 5." });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send({ message: "Product not found." });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: { userId, productId }
    });

    if (existingReview) {
      return res.status(400).send({ 
        message: "You have already reviewed this product. Please update your existing review instead." 
      });
    }

    // Create review
    const review = await Review.create({
      userId,
      productId,
      rating,
      comment
    });

    res.status(201).send({
      message: "Review added successfully!",
      review
    });
  } catch (error) {
    console.error("Error adding review:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Update own review
exports.updateOwnReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.userId; // From JWT
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      where: { id: reviewId, userId }
    });

    if (!review) {
      return res.status(404).send({ message: "Review not found or you don't have permission." });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).send({ message: "Rating must be between 1 and 5." });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.status(200).send({
      message: "Review updated successfully!",
      review
    });
  } catch (error) {
    console.error("Error updating review:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Delete own review
exports.deleteOwnReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.userId; // From JWT

    const review = await Review.findOne({
      where: { id: reviewId, userId }
    });

    if (!review) {
      return res.status(404).send({ message: "Review not found or you don't have permission." });
    }

    await review.destroy();

    res.status(200).send({
      message: "Review deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Admin: Update any review
exports.adminUpdateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).send({ message: "Review not found." });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).send({ message: "Rating must be between 1 and 5." });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.status(200).send({
      message: "Review updated successfully!",
      review
    });
  } catch (error) {
    console.error("Error updating review:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Admin: Delete any review
exports.adminDeleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).send({ message: "Review not found." });
    }

    await review.destroy();

    res.status(200).send({
      message: "Review deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get user's own reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.userId; // From JWT

    const reviews = await Review.findAll({
      where: { userId },
      include: [{
        model: Product,
        as: "product",
        attributes: ["id", "product_name", "img"]
      }],
      order: [["createdAt", "DESC"]]
    });

    res.status(200).send(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error.message);
    res.status(500).send({ message: error.message });
  }
};
