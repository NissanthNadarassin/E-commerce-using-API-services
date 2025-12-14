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

  type AllocationItem {
    productId: Int
    quantity: Int
  }

  type Allocation {
    warehouseCity: String
    warehouseCountry: String
    warehouseAddressLine1: String
    warehousePostalCode: String
    destinationLabel: String
    destinationAddress: String
    eta: String
    durationText: String
    durationValue: Int
    items: [AllocationItem]
  }

  type Hub {
    name: String
    city: String
    address: String
    postalCode: String
    country: String
  }

  type Transfer {
    fromWarehouse: String
    fromCity: String
    toHub: String
    durationText: String
    durationValue: Int
    status: String
    items: [AllocationItem]
  }

  type Consolidation {
    isConsolidating: Boolean
    hub: Hub
    transfers: [Transfer]
    hubReadyTime: String
  }

  type TimelineEvent {
    status: String    # Was 'title'
    description: String
    time: String
    isCompleted: Boolean # Was 'done'
  }

  type DeliveryInfo {
    orderId: Int
    status: String
    allocations: [Allocation]
    consolidation: Consolidation
    timeline: [TimelineEvent]
    
    # Keeping these for backward compat if needed, but frontend seems to use allocations largely
    origin: String
    destination: String
    distanceText: String
    durationText: String
    estimatedArrival: String
    windowStart: String
    windowEnd: String
    departureTime: String
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
    order(id: Int!): Order
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
