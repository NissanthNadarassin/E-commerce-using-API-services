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

    trackDelivery(id) {
        return api.get("/api/orders/" + id + "/delivery");
    }
}

export default new OrderService();
