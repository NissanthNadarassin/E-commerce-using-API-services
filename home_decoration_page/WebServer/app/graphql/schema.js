const { makeExecutableSchema } = require('@graphql-tools/schema');

const typeDefs = `
  type Product {
    id: Int
    product_name: String
    description: String
    price: Float
    category: String
    sku: String
    img: String
    isActive: Boolean
  }

  type Address {
    id: Int
    label: String
    address_line1: String
    address_line2: String
    city: String
    postal_code: String
    country: String
    phone: String
    is_default_shipping: Boolean
    is_default_billing: Boolean
  }

  type OrderItem {
    id: Int
    quantity: Int
    price: Float
    product: Product
  }

  type TimelineEvent {
    title: String
    time: String
    done: Boolean
  }

  type DeliveryInfo {
    orderId: Int
    status: String
    origin: String
    destination: String
    distanceText: String
    durationText: String
    estimatedArrival: String
    timeline: [TimelineEvent]
  }

  type Order {
    id: Int
    total_amount: Float
    status: String
    createdAt: String
    items: [OrderItem]
    delivery: DeliveryInfo
  }

  type User {
    id: Int
    username: String
    email: String
    phone: String
    orders: [Order]
    addresses: [Address]
  }

  input OrderItemInput {
    productId: Int!
    quantity: Int!
  }

  type Query {
    products: [Product]
    product(id: Int!): Product
    me: User
    recommendations: [Product]
  }

  type Mutation {
    addAddress(
      label: String
      address_line1: String!
      city: String!
      postal_code: String!
      country: String!
      phone: String
    ): Address

    createOrder(
      items: [OrderItemInput]!
      shippingAddressId: Int
    ): Order

    cancelOrder(id: Int!): Order
    returnOrder(id: Int!): Order
  }
`;

module.exports = typeDefs;
