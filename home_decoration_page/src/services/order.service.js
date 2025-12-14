import api from "./apiService";

class OrderService {
    createOrder(data) {
        return api.post("/api/orders", data);
    }

    getUserOrders() {
        return api.get("/api/orders");
    }

    getOrderById(id) {
        return api.get("/api/orders/" + id);
    }

    cancelOrder(id) {
        return api.put("/api/orders/" + id + "/cancel");
    }

    async trackDelivery(id) {
        const data = await api.graphQL(`
            query GetOrder($id: Int!) {
                order(id: $id) {
                    id
                    status
                    delivery {
                        orderId
                        status
                        windowStart
                        windowEnd
                        departureTime
                        allocations {
                            warehouseCity
                            warehouseCountry
                            warehouseAddressLine1
                            warehousePostalCode
                            destinationLabel
                            destinationAddress
                            eta
                            durationText
                            durationValue
                            items {
                                productId
                                quantity
                            }
                        }
                        consolidation {
                            isConsolidating
                            hub {
                                city
                                address
                            }
                            transfers {
                                fromCity
                                toHub
                                durationText
                                status
                                items {
                                    productId
                                    quantity
                                }
                            }
                        }
                        timeline {
                            status
                            description
                            time
                            isCompleted
                        }
                    }
                }
            }
        `, { id: parseInt(id) });

        if (data && data.order && data.order.delivery) {
            return { data: data.order.delivery };
        }
        throw new Error("Order not found or delivery info unavailable");
    }
}

export default new OrderService();
