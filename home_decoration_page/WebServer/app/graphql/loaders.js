const DataLoader = require('dataloader');
const { Product, Order, OrderItem, Address } = require('../../db');

const batchOrdersByUserId = async (userIds) => {
    const orders = await Order.findAll({
        where: {
            userId: userIds
        }
    });
    const ordersMap = {};
    orders.forEach(order => {
        if (!ordersMap[order.userId]) {
            ordersMap[order.userId] = [];
        }
        ordersMap[order.userId].push(order);
    });
    return userIds.map(userId => ordersMap[userId] || []);
};

const batchAddressesByUserId = async (userIds) => {
    const addresses = await Address.findAll({
        where: {
            userId: userIds
        }
    });
    const addressMap = {};
    addresses.forEach(addr => {
        if (!addressMap[addr.userId]) {
            addressMap[addr.userId] = [];
        }
        addressMap[addr.userId].push(addr);
    });
    return userIds.map(userId => addressMap[userId] || []);
};

const batchOrderItemsByOrderId = async (orderIds) => {
    const items = await OrderItem.findAll({
        where: {
            orderId: orderIds
        }
    });
    const itemsMap = {};
    items.forEach(item => {
        if (!itemsMap[item.orderId]) {
            itemsMap[item.orderId] = [];
        }
        itemsMap[item.orderId].push(item);
    });
    return orderIds.map(orderId => itemsMap[orderId] || []);
};

const batchProductsById = async (productIds) => {
    const products = await Product.findAll({
        where: {
            id: productIds
        }
    });
    const productMap = {};
    products.forEach(p => {
        productMap[p.id] = p;
    });
    return productIds.map(id => productMap[id] || null);
};

module.exports = () => ({
    ordersByUserId: new DataLoader(batchOrdersByUserId),
    addressesByUserId: new DataLoader(batchAddressesByUserId),
    itemsByOrderId: new DataLoader(batchOrderItemsByOrderId),
    productById: new DataLoader(batchProductsById),
});
