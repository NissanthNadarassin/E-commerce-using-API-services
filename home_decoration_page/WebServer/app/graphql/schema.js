const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
    GraphQLFloat,
    GraphQLBoolean
} = require('graphql');

const db = require('../models');
const Product = db.products;
const User = db.user;
const Order = db.order;
const OrderItem = db.orderItem;
const Review = db.review;
const Address = db.userAddress;

// --- Types ---

const ProductType = new GraphQLObjectType({
    name: 'Product',
    fields: () => ({
        id: { type: GraphQLInt },
        product_name: { type: GraphQLString },
        description: { type: GraphQLString },
        price: { type: GraphQLFloat },
        category: { type: GraphQLString },
        sku: { type: GraphQLString },
        img: { type: GraphQLString },
        isActive: { type: GraphQLBoolean }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLInt },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        orders: {
            type: new GraphQLList(OrderType),
            resolve(parent, args) {
                return Order.findAll({ where: { userId: parent.id } });
            }
        },
        addresses: {
            type: new GraphQLList(AddressType),
            resolve(parent, args) {
                return Address.findAll({ where: { userId: parent.id } });
            }
        }
    })
});

const AddressType = new GraphQLObjectType({
    name: 'Address',
    fields: () => ({
        id: { type: GraphQLInt },
        label: { type: GraphQLString },
        address_line1: { type: GraphQLString },
        address_line2: { type: GraphQLString },
        city: { type: GraphQLString },
        postal_code: { type: GraphQLString },
        country: { type: GraphQLString },
        phone: { type: GraphQLString },
        is_default_shipping: { type: GraphQLBoolean },
        is_default_billing: { type: GraphQLBoolean }
    })
});

const OrderItemType = new GraphQLObjectType({
    name: 'OrderItem',
    fields: () => ({
        id: { type: GraphQLInt },
        quantity: { type: GraphQLInt },
        price: { type: GraphQLFloat },
        product: {
            type: ProductType,
            resolve(parent) {
                return Product.findByPk(parent.productId);
            }
        }
    })
});

const OrderType = new GraphQLObjectType({
    name: 'Order',
    fields: () => ({
        id: { type: GraphQLInt },
        total_amount: { type: GraphQLFloat },
        status: { type: GraphQLString },
        createdAt: { type: GraphQLString },
        items: {
            type: new GraphQLList(OrderItemType),
            resolve(parent) {
                return OrderItem.findAll({ where: { orderId: parent.id } });
            }
        }
    })
});

// --- Root Query ---

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        // 1. Get All Products
        products: {
            type: new GraphQLList(ProductType),
            resolve(parent, args) {
                return Product.findAll({ where: { isActive: true } });
            }
        },
        // 2. Get Single Product
        product: {
            type: ProductType,
            args: { id: { type: GraphQLInt } },
            resolve(parent, args) {
                return Product.findByPk(args.id);
            }
        },
        // 3. Get Current User Profile (Requires Auth Context)
        me: {
            type: UserType,
            resolve(parent, args, context) {
                if (!context.userId) throw new Error("Unauthorized");
                return User.findByPk(context.userId);
            }
        },
        // 4. Get Recommendations (Simple wrapper for now)
        recommendations: {
            type: new GraphQLList(ProductType),
            resolve(parent, args, context) {
                // Re-using logic would be better, but for now simple fallback
                return Product.findAll({ limit: 5 });
            }
        }
    }
});

// --- Mutations ---

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        // Simple Mutation Example
        addAddress: {
            type: AddressType,
            args: {
                label: { type: GraphQLString },
                address_line1: { type: new GraphQLNonNull(GraphQLString) },
                city: { type: new GraphQLNonNull(GraphQLString) },
                postal_code: { type: new GraphQLNonNull(GraphQLString) },
                country: { type: new GraphQLNonNull(GraphQLString) },
                phone: { type: GraphQLString }
            },
            resolve(parent, args, context) {
                if (!context.userId) throw new Error("Unauthorized");
                return Address.create({
                    userId: context.userId,
                    ...args // Vulnerable to prototype pollution? No, args are strictly typed above.
                });
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});
