const { Product, User, Address, Order } = require('../../db');
const orderService = require('../../app/services/orderService');

const resolvers = {
    Query: {
        products: async () => {
            return await Product.findAll({ where: { isActive: true } });
        },
        product: async (_, { id }) => {
            return await Product.findByPk(id);
        },
        me: async (_, __, context) => {
            if (!context.userId) throw new Error("Unauthorized");
            return await User.findByPk(context.userId);
        },
        recommendations: async () => {
            return await Product.findAll({ limit: 5 });
        }
    },
    Mutation: {
        addAddress: async (_, args, context) => {
            if (!context.userId) throw new Error("Unauthorized");
            return await Address.create({
                userId: context.userId,
                ...args
            });
        },
        createOrder: async (_, { items, shippingAddressId }, context) => {
            if (!context.userId) throw new Error("Unauthorized");
            return await orderService.createOrder(context.userId, items, shippingAddressId);
        },
        cancelOrder: async (_, { id }, context) => {
            if (!context.userId) throw new Error("Unauthorized");
            return await orderService.cancelOrder(id, context.userId);
        },
        returnOrder: async (_, { id }, context) => {
            if (!context.userId) throw new Error("Unauthorized");
            return await orderService.returnOrder(id, context.userId);
        },
    },
    User: {
        orders: async (parent, args, { loaders }) => {
            return await loaders.ordersByUserId.load(parent.id);
        },
        addresses: async (parent, args, { loaders }) => {
            return await loaders.addressesByUserId.load(parent.id);
        }
    },
    Order: {
        items: async (parent, args, { loaders }) => {
            return await loaders.itemsByOrderId.load(parent.id);
        },
        status: (parent) => {
            // Use the dynamic status calculation
            return orderService.calculateDynamicStatus(parent);
        },
        delivery: async (parent) => {
            // Fetch complex delivery info
            return await orderService.getDeliveryInfo(parent.id);
        }
    },
    OrderItem: {
        product: async (parent, args, { loaders }) => {
            return await loaders.productById.load(parent.productId);
        }
    }
};

module.exports = resolvers;
