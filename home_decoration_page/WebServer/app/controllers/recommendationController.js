const db = require("../models");
const Product = db.products;
const Order = db.order;
const OrderItem = db.orderItem;
const { Op } = require("sequelize");

// --- Helper Functions for "AI" Logic ---

// 1. Calculate Jaccard Similarity for Keywords
// (Intersection over Union of two sets of words)
function calculateKeywordScore(productDescription, userKeywords) {
    if (!productDescription || userKeywords.size === 0) return 0;

    const productWords = new Set(
        productDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    );

    let intersection = 0;
    userKeywords.forEach(kw => {
        if (productWords.has(kw)) intersection++;
    });

    const union = new Set([...productWords, ...userKeywords]).size;
    return union === 0 ? 0 : intersection / union;
}

// 2. Build User Profile from History
async function buildUserProfile(userId) {
    // Fetch completed orders
    const orders = await Order.findAll({
        where: {
            userId: userId,
            status: { [Op.or]: ['completed', 'delivered', 'shipped'] }
        },
        include: [{
            model: OrderItem,
            as: "items",
            include: [{
                model: Product,
                as: "product"
            }]
        }]
    });

    if (orders.length === 0) return null; // Cold start

    const categoryFrequency = {};
    let totalPriceSum = 0;
    let totalItems = 0;
    const keywords = new Set();
    const purchasedProductIds = new Set();

    orders.forEach(order => {
        order.items.forEach(item => {
            const p = item.product;
            if (!p) return;

            purchasedProductIds.add(p.id);

            // Category Frequency
            if (p.category) {
                categoryFrequency[p.category] = (categoryFrequency[p.category] || 0) + item.quantity;
            }

            // Price Stats
            totalPriceSum += parseFloat(item.price) * item.quantity;
            totalItems += item.quantity;

            // Keywords
            if (p.description) {
                const words = p.description.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                words.forEach(w => keywords.add(w));
            }
            if (p.product_name) {
                const words = p.product_name.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                words.forEach(w => keywords.add(w));
            }
        });
    });

    // Determine favorite category
    let favoriteCategory = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryFrequency)) {
        if (count > maxCount) {
            maxCount = count;
            favoriteCategory = cat;
        }
    }

    return {
        favoriteCategory,
        avgPrice: totalItems > 0 ? totalPriceSum / totalItems : 0,
        keywords,
        purchasedProductIds
    };
}

exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.userId; // valid thanks to Auth middleware

        // A. Build Profile
        const userProfile = await buildUserProfile(userId);

        // B. Fetch Candidate Products
        // Get all active products
        const allProducts = await Product.findAll({ where: { isActive: true } });

        // If no history (Cold Start), recommend based on popularity (simulated by price/random here)
        // or just return top rated.
        if (!userProfile) {
            // Fallback: Return top 5 cheapest items (as "Best Sellers" proxy) or random
            const fallback = allProducts.slice(0, 5);
            return res.status(200).send({
                recommendations: fallback,
                reason: "Best Sellers"
            });
        }

        // C. Score Candidates
        const scoredProducts = allProducts
            .filter(p => !userProfile.purchasedProductIds.has(p.id)) // Filter out already bought
            .map(p => {
                let score = 0;

                // 1. Category Match (Weight: 50)
                if (p.category === userProfile.favoriteCategory) {
                    score += 50;
                }

                // 2. Price Affinity (Weight: 30)
                // Score is higher if product price is close to user's average spend
                if (userProfile.avgPrice > 0) {
                    const priceDiffRatio = Math.abs(p.price - userProfile.avgPrice) / userProfile.avgPrice;
                    // distinct curve: if within 20% range -> high score. 
                    if (priceDiffRatio <= 0.2) score += 30;
                    else if (priceDiffRatio <= 0.5) score += 15;
                }

                // 3. Keyword Match (Weight: 20)
                const keywordScore = calculateKeywordScore(p.description + " " + p.product_name, userProfile.keywords);
                score += keywordScore * 20;

                return { product: p, score };
            });

        // D. Sort & Limit
        scoredProducts.sort((a, b) => b.score - a.score);
        const topRecommendations = scoredProducts.slice(0, 5).map(sp => sp.product);

        res.status(200).send({
            recommendations: topRecommendations,
            reason: `Based on your interest in ${userProfile.favoriteCategory || 'Home Decor'}`
        });

    } catch (error) {
        console.error("Recommendation Error:", error);
        res.status(500).send({ message: "Error generating recommendations." });
    }
};
