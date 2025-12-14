const axios = require('axios');

async function testGraphQLOrder() {
    const url = 'http://localhost:5002/graphql';
    const authUrl = 'http://localhost:5002/api/auth';

    // 0. Register/Login
    let token = "";
    const username = "testuser_" + Date.now();
    const email = `test_${Date.now()}@example.com`;

    try {
        console.log("Attempting to register...");
        await axios.post(`${authUrl}/register`, {
            username: username,
            email: email,
            password: "password123",
            roles: ["user"]
        });
        console.log("Registration successful.");
    } catch (e) {
        console.log("Registration failed (maybe exists):", e.response ? e.response.data : e.message);
    }

    try {
        console.log("Attempting to login...");
        const loginRes = await axios.post(`${authUrl}/login`, {
            email: email,
            password: "password123"
        });
        token = loginRes.data.accessToken;
        console.log("Logged in, token received.");
    } catch (e) {
        console.error("Login failed:", e.response ? e.response.data : e.message);
        return;
    }

    const headers = { "x-access-token": token };

    // 1. Create Order
    const createMutation = `
    mutation {
      createOrder(items: [{productId: 1, quantity: 1}]) {
        id
        status
        total_amount
      }
    }
  `;

    let orderId;

    try {
        const res = await axios.post(url, { query: createMutation }, { headers });
        console.log("Create Order Response:", JSON.stringify(res.data, null, 2));
        if (res.data.data && res.data.data.createOrder) {
            orderId = res.data.data.createOrder.id;
        } else {
            console.error("Create Order returned no data. Check if Product ID 1 exists.");
        }
    } catch (error) {
        console.error("Error creating order:", error.message);
        if (error.response) console.error(error.response.data);
    }

    if (!orderId) {
        console.error("Failed to create order, cannot proceed with delivery test.");
        return;
    }

    // 2. Check Delivery Status (Dynamic)
    const deliveryQuery = `
    query {
      me {
        orders {
          id
          status
          delivery {
            status
            estimatedArrival
            origin
            destination
            timeline {
              title
              time
              done
            }
          }
        }
      }
    }
  `;

    try {
        const res = await axios.post(url, { query: deliveryQuery }, { headers });
        // console.log("Delivery Query Response:", JSON.stringify(res.data, null, 2));

        // Check if status is correct
        const myOrders = res.data.data.me.orders;
        const myOrder = myOrders.find(o => o.id === orderId);
        if (myOrder) {
            console.log(`Order ${orderId} Status: ${myOrder.status}`);
            console.log(`Order ${orderId} Delivery Status: ${myOrder.delivery ? myOrder.delivery.status : 'N/A'}`);
            console.log(`Order ${orderId} Estimated Arrival: ${myOrder.delivery ? myOrder.delivery.estimatedArrival : 'N/A'}`);
        } else {
            console.error("Order not found in me.orders");
        }

    } catch (error) {
        console.error("Error delivery query:", error.message);
        if (error.response) console.error(error.response.data);
    }

    // 3. Cancel Order
    const cancelMutation = `
    mutation {
      cancelOrder(id: ${orderId}) {
        id
        status
      }
    }
  `;

    try {
        const res = await axios.post(url, { query: cancelMutation }, { headers });
        console.log("Cancel Order Response:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error("Error cancelling order:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

testGraphQLOrder();
